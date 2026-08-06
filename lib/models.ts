import mongoose, { Schema } from 'mongoose';
import { getIsUsingMongoDB, localDb } from './db';

// --- TS Interfaces ---

export interface IUser {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: string; // 'owner' | 'admin' | 'editor' | 'viewer'
  subscriptionStatus: string; // 'free' | 'pro' | 'enterprise'
  featureFlags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IPinterestAccount {
  id?: string;
  _id?: string;
  userId: string;
  username: string;
  email?: string;
  password?: string;
  cookiesJson?: string;
  authMethod?: string; // 'selenium' | 'api'
  profileImage: string;
  followers: number;
  following: number;
  boardsCount: number;
  monthlyViews: number;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  status: string; // 'connected' | 'expired' | 'error'
  syncStatus: string; // 'synced' | 'syncing' | 'failed'
  lastSyncTime?: string;
  lastPostTime?: string;
  defaultDestinationUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IBoard {
  id?: string;
  _id?: string;
  accountId: string;
  pinterestId: string;
  name: string;
  description: string;
  pinsCount: number;
  followers: number;
  archived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPin {
  id?: string;
  _id?: string;
  userId: string;
  accountIds: string[];
  title: string;
  description: string;
  destinationUrl: string;
  mediaUrl: string;
  mediaType: string; // 'image' | 'video'
  boardId: string;
  scheduledAt: string;
  status: string; // 'draft' | 'scheduled' | 'published' | 'failed'
  error?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IContentLibrary {
  id?: string;
  _id?: string;
  userId: string;
  title: string;
  description: string;
  mediaUrl: string;
  link: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface IAutomationRule {
  id?: string;
  _id?: string;
  userId: string;
  name: string;
  accountIds: string[];
  boardId: string;
  time: string; // e.g. '09:00'
  days: string[]; // e.g. ['monday', 'wednesday']
  evergreen: boolean;
  status: string; // 'active' | 'inactive'
  createdAt?: string;
  updatedAt?: string;
}

export interface IActivityLog {
  id?: string;
  _id?: string;
  userId: string;
  action: string; // e.g., 'login', 'pin_created', 'account_connected'
  details: string;
  accountUsername?: string;
  timestamp?: string;
  status: string; // 'success' | 'failed'
}

// --- Mongoose Schemas (Used when isUsingMongoDB is true) ---

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'owner' },
  subscriptionStatus: { type: String, default: 'free' },
  featureFlags: { type: [String], default: [] }
}, { timestamps: true });

const PinterestAccountSchema = new Schema<IPinterestAccount>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String },
  password: { type: String },
  cookiesJson: { type: String },
  authMethod: { type: String, default: 'selenium' },
  profileImage: { type: String, default: '' },
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  boardsCount: { type: Number, default: 0 },
  monthlyViews: { type: Number, default: 0 },
  accessToken: { type: String, default: 'selenium_session_token' },
  refreshToken: { type: String, default: '' },
  tokenExpiresAt: { type: String, default: () => new Date(Date.now() + 365*24*60*60*1000).toISOString() },
  status: { type: String, default: 'connected' },
  syncStatus: { type: String, default: 'synced' },
  lastSyncTime: { type: String },
  lastPostTime: { type: String },
  defaultDestinationUrl: { type: String, default: '' }
}, { timestamps: true });

const BoardSchema = new Schema<IBoard>({
  accountId: { type: String, required: true },
  pinterestId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  pinsCount: { type: Number, default: 0 },
  followers: { type: Number, default: 0 },
  archived: { type: Boolean, default: false }
}, { timestamps: true });

const PinSchema = new Schema<IPin>({
  userId: { type: String, required: true },
  accountIds: { type: [String], required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  destinationUrl: { type: String, default: '' },
  mediaUrl: { type: String, required: true },
  mediaType: { type: String, default: 'image' },
  boardId: { type: String, required: true },
  scheduledAt: { type: String, required: true },
  status: { type: String, default: 'scheduled' },
  error: { type: String }
}, { timestamps: true });

const ContentLibrarySchema = new Schema<IContentLibrary>({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  mediaUrl: { type: String, default: '' },
  link: { type: String, default: '' },
  tags: { type: [String], default: [] }
}, { timestamps: true });

const AutomationRuleSchema = new Schema<IAutomationRule>({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  accountIds: { type: [String], required: true },
  boardId: { type: String, required: true },
  time: { type: String, required: true },
  days: { type: [String], default: [] },
  evergreen: { type: Boolean, default: false },
  status: { type: String, default: 'active' }
}, { timestamps: true });

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  accountUsername: { type: String },
  timestamp: { type: String, default: () => new Date().toISOString() },
  status: { type: String, default: 'success' }
});

// Mongoose Models
const UserMongo = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
const PinterestAccountMongo = mongoose.models.PinterestAccount || mongoose.model<IPinterestAccount>('PinterestAccount', PinterestAccountSchema);
const BoardMongo = mongoose.models.Board || mongoose.model<IBoard>('Board', BoardSchema);
const PinMongo = mongoose.models.Pin || mongoose.model<IPin>('Pin', PinSchema);
const ContentLibraryMongo = mongoose.models.ContentLibrary || mongoose.model<IContentLibrary>('ContentLibrary', ContentLibrarySchema);
const AutomationRuleMongo = mongoose.models.AutomationRule || mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);
const ActivityLogMongo = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

// --- Storage Agnostic Repository Base Wrapper ---

class Repository<T extends { _id?: string; id?: string }> {
  constructor(private collectionName: string, private mongoModel: any) {}

  private mapDoc(doc: any): T {
    if (!doc) return doc;
    const item = doc.toObject ? doc.toObject() : doc;
    item.id = item._id ? item._id.toString() : item.id;
    return item as T;
  }

  async find(query: Record<string, any> = {}): Promise<T[]> {
    if (getIsUsingMongoDB()) {
      const docs = await this.mongoModel.find(query);
      return docs.map((d: any) => this.mapDoc(d));
    } else {
      return localDb.find(this.collectionName, query) as unknown as T[];
    }
  }

  async findOne(query: Record<string, any>): Promise<T | null> {
    if (getIsUsingMongoDB()) {
      const doc = await this.mongoModel.findOne(query);
      return doc ? this.mapDoc(doc) : null;
    } else {
      const doc = localDb.findOne(this.collectionName, query);
      return doc ? (doc as unknown as T) : null;
    }
  }

  async findById(id: string): Promise<T | null> {
    if (getIsUsingMongoDB()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await this.mongoModel.findById(id);
      return doc ? this.mapDoc(doc) : null;
    } else {
      const doc = localDb.findById(this.collectionName, id);
      return doc ? (doc as unknown as T) : null;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    if (getIsUsingMongoDB()) {
      const doc = await this.mongoModel.create(data);
      return this.mapDoc(doc);
    } else {
      return localDb.create(this.collectionName, data) as unknown as T;
    }
  }

  async findByIdAndUpdate(id: string, data: Partial<T>): Promise<T | null> {
    if (getIsUsingMongoDB()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const doc = await this.mongoModel.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' });
      return doc ? this.mapDoc(doc) : null;
    } else {
      const doc = localDb.findByIdAndUpdate(this.collectionName, id, data);
      return doc ? (doc as unknown as T) : null;
    }
  }

  async findByIdAndDelete(id: string): Promise<boolean> {
    if (getIsUsingMongoDB()) {
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const res = await this.mongoModel.findByIdAndDelete(id);
      return !!res;
    } else {
      return localDb.findByIdAndDelete(this.collectionName, id);
    }
  }

  async deleteMany(query: Record<string, any>): Promise<number> {
    if (getIsUsingMongoDB()) {
      const res = await this.mongoModel.deleteMany(query);
      return res.deletedCount || 0;
    } else {
      return localDb.deleteMany(this.collectionName, query);
    }
  }
}

// Export repository instances
export const User = new Repository<IUser>('users', UserMongo);
export const PinterestAccount = new Repository<IPinterestAccount>('accounts', PinterestAccountMongo);
export const Board = new Repository<IBoard>('boards', BoardMongo);
export const Pin = new Repository<IPin>('pins', PinMongo);
export const ContentLibrary = new Repository<IContentLibrary>('contentLibrary', ContentLibraryMongo);
export const AutomationRule = new Repository<IAutomationRule>('automationRules', AutomationRuleMongo);
export const ActivityLog = new Repository<IActivityLog>('activityLogs', ActivityLogMongo);
