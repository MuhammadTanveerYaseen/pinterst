import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import dns from 'dns';

// Ensure public DNS resolvers are configured ONLY on Windows local dev (where local ISP DNS may fail SRV queries).
// DO NOT call on Vercel or Linux serverless containers as AWS Lambda blocks custom DNS resolvers on port 53.
if (process.platform === 'win32' && !process.env.VERCEL) {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
  } catch (dnsErr) {
    // Ignore DNS setServers error if not permitted
  }
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pinterest-hub';
const JSON_DB_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const JSON_DB_PATH = path.join(JSON_DB_DIR, 'db.json');

export let isUsingMongoDB = false;
export function getIsUsingMongoDB() {
  return isUsingMongoDB;
}

// Local JSON Database state
let localDbState: Record<string, any[]> = {
  users: [],
  accounts: [],
  boards: [],
  pins: [],
  contentLibrary: [],
  automationRules: [],
  activityLogs: [],
  teamMembers: []
};

// Load JSON database from disk
function loadLocalDb() {
  try {
    if (!fs.existsSync(JSON_DB_DIR)) {
      fs.mkdirSync(JSON_DB_DIR, { recursive: true });
    }
    if (fs.existsSync(JSON_DB_PATH)) {
      const data = fs.readFileSync(JSON_DB_PATH, 'utf8');
      localDbState = { ...localDbState, ...JSON.parse(data) };
      console.log('📦 Local JSON database loaded successfully from:', JSON_DB_PATH);
    } else {
      saveLocalDb();
      console.log('📦 Local JSON database initialized at:', JSON_DB_PATH);
    }
  } catch (err) {
    console.error('⚠️ Failed to load local JSON database, starting fresh:', err);
  }
}

// Save JSON database to disk
export function saveLocalDb() {
  try {
    if (!fs.existsSync(JSON_DB_DIR)) {
      fs.mkdirSync(JSON_DB_DIR, { recursive: true });
    }
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(localDbState, null, 2), 'utf8');
  } catch (err) {
    console.error('⚠️ Failed to save local JSON database to disk:', err);
  }
}

let hasAttemptedConnection = false;

export async function connectDB() {
  // Prevent reconnecting if already connected
  if (isUsingMongoDB || (mongoose.connection && mongoose.connection.readyState === 1)) {
    isUsingMongoDB = true;
    return;
  }
  
  if (hasAttemptedConnection) {
    return;
  }
  
  hasAttemptedConnection = true;
  
  // Set DNS servers ONLY on Windows local machine if needed
  if (process.platform === 'win32' && !process.env.VERCEL) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    } catch (dnsErr) {
      // Ignore DNS setServers error if not permitted
    }
  }

  const mongodbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pinterest-hub';
  const maskedUri = mongodbUri.replace(/:([^:@]+)@/, ':****@');

  try {
    console.log('🔌 Connecting to MongoDB at:', maskedUri);
    await mongoose.connect(mongodbUri, {
      serverSelectionTimeoutMS: 10000, 
    });
    isUsingMongoDB = true;
    console.log('🚀 Connected to MongoDB Atlas successfully!');
  } catch (error: any) {
    // If SRV lookup failed on Windows, try explicitly setting Google DNS and retrying
    if (process.platform === 'win32' && !process.env.VERCEL && (error?.message?.includes('querySrv') || error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND')) {
      try {
        console.log('🔄 Retrying MongoDB Atlas connection with Google DNS (8.8.8.8)...');
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        await mongoose.connect(mongodbUri, {
          serverSelectionTimeoutMS: 10000,
        });
        isUsingMongoDB = true;
        console.log('🚀 Connected to MongoDB Atlas successfully on retry!');
        return;
      } catch (retryErr: any) {
        console.log('⚠️ MongoDB retry failed:', retryErr?.message || retryErr);
      }
    }

    console.log('⚠️ MongoDB connection failed:', error?.message || error, '. Falling back to local JSON database.');
    isUsingMongoDB = false;
    hasAttemptedConnection = false; // Allow retrying on subsequent requests
    loadLocalDb();
  }
}

// Helper to interact with the local JSON database (in-memory with file persistence)
export const localDb = {
  getCollection: (name: string) => {
    if (!localDbState[name]) {
      localDbState[name] = [];
    }
    return localDbState[name];
  },
  
  find: (collectionName: string, query?: Record<string, any>) => {
    const list = localDb.getCollection(collectionName);
    if (!query) return list;
    return list.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findOne: (collectionName: string, query: Record<string, any>) => {
    const list = localDb.getCollection(collectionName);
    return list.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findById: (collectionName: string, id: string) => {
    const list = localDb.getCollection(collectionName);
    return list.find(item => item.id === id || item._id === id);
  },

  create: (collectionName: string, data: Record<string, any>) => {
    const list = localDb.getCollection(collectionName);
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11),
      id: Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    list.push(newDoc);
    saveLocalDb();
    return newDoc;
  },

  findByIdAndUpdate: (collectionName: string, id: string, data: Record<string, any>) => {
    const list = localDb.getCollection(collectionName);
    const index = list.findIndex(item => item.id === id || item._id === id);
    if (index === -1) return null;
    list[index] = {
      ...list[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    saveLocalDb();
    return list[index];
  },

  findByIdAndDelete: (collectionName: string, id: string) => {
    const list = localDb.getCollection(collectionName);
    const index = list.findIndex(item => item.id === id || item._id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    saveLocalDb();
    return true;
  },

  deleteMany: (collectionName: string, query: Record<string, any>) => {
    const list = localDb.getCollection(collectionName);
    const initialLength = list.length;
    const remaining = list.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return true;
      }
      return false;
    });
    localDbState[collectionName] = remaining;
    saveLocalDb();
    return initialLength - remaining.length;
  }
};
