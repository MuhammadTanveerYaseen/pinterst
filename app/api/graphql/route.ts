import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { ApolloServer } from '@apollo/server';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { typeDefs } from '../../../lib/schema';
import { resolvers } from '../../../lib/resolvers';
import { connectDB } from '../../../lib/db';
import { initScheduler } from '../../../lib/scheduler';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretpinterestkey';

interface MyContext {
  userId?: string;
  userRole?: string;
}

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});

// We wrap the next.js route handler
const handler = startServerAndCreateNextHandler<NextRequest, MyContext>(server, {
  context: async (req) => {
    // Ensure DB connection is active
    await connectDB();

    // Ensure scheduler loop is running
    initScheduler();

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) return { userId: 'default_owner', userRole: 'owner' };

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
      return {
        userId: decoded.userId || 'default_owner',
        userRole: decoded.role || 'owner'
      };
    } catch (error) {
      return { userId: 'default_owner', userRole: 'owner' };
    }
  },
});

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}
export const dynamic = 'force-dynamic';
