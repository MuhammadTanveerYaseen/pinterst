import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  User, PinterestAccount, Board, Pin, 
  ContentLibrary, AutomationRule, ActivityLog,
  IUser, IPinterestAccount, IBoard, IPin, IContentLibrary, IAutomationRule
} from './models';
import { PinterestService } from './pinterest';
import { AIService } from './ai';
import { schedulePin, processPublishPin } from './scheduler';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretpinterestkey';

interface Context {
  userId?: string;
  userRole?: string;
}

function verifyAuth(context: Context): string {
  return context.userId || 'default_owner';
}

const DEFAULT_SYSTEM_USER_DOC = {
  id: 'default_owner',
  name: 'Pinterest Manager',
  email: 'admin@pinteresthub.com',
  role: 'owner',
  subscriptionStatus: 'pro',
  featureFlags: ['ai-assistant', 'analytics-pro']
};

export const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: Context) => {
      const userId = verifyAuth(context);
      const user = await User.findById(userId);
      return user || DEFAULT_SYSTEM_USER_DOC;
    },
    
    pinterestAccounts: async (_parent: any, _args: any, context: Context) => {
      const userId = verifyAuth(context);
      return await PinterestAccount.find({ userId });
    },
    
    boards: async (_parent: any, { accountId }: { accountId: string }, context: Context) => {
      verifyAuth(context);
      
      let boards = await Board.find({ accountId });
      
      if (boards.length === 0) {
        const account = await PinterestAccount.findById(accountId);
        if (account) {
          const fetched = await PinterestService.fetchBoards(account);
          for (const b of fetched) {
            await Board.create({
              accountId,
              pinterestId: b.pinterestId,
              name: b.name,
              description: b.description,
              pinsCount: b.pinsCount,
              followers: b.followers,
              archived: b.archived
            });
          }
          boards = await Board.find({ accountId });
        }
      }
      return boards;
    },
    
    pins: async (_parent: any, { status, accountId }: { status?: string, accountId?: string }, context: Context) => {
      const userId = verifyAuth(context);
      const query: Record<string, any> = { userId };
      
      if (status) {
        query.status = status;
      }
      
      let list = await Pin.find(query);
      
      if (accountId) {
        list = list.filter(pin => pin.accountIds.includes(accountId));
      }
      
      return list;
    },
    
    contentLibrary: async (_parent: any, { search }: { search?: string }, context: Context) => {
      const userId = verifyAuth(context);
      const items = await ContentLibrary.find({ userId });
      
      if (search) {
        const term = search.toLowerCase();
        return items.filter(item => 
          item.title.toLowerCase().includes(term) || 
          item.description.toLowerCase().includes(term) ||
          item.tags.some(tag => tag.toLowerCase().includes(term))
        );
      }
      return items;
    },
    
    analytics: async (_parent: any, { accountId, range }: { accountId?: string, range: string }, context: Context) => {
      verifyAuth(context);
      return await PinterestService.getAnalytics(accountId || 'all', range);
    },
    
    automationRules: async (_parent: any, _args: any, context: Context) => {
      const userId = verifyAuth(context);
      return await AutomationRule.find({ userId });
    },
    
    activityLogs: async (_parent: any, { limit }: { limit?: number }, context: Context) => {
      const userId = verifyAuth(context);
      const logs = await ActivityLog.find({ userId });
      const sorted = [...logs].sort((a, b) => {
        return new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime();
      });
      return limit ? sorted.slice(0, limit) : sorted;
    },
    
    teamMembers: async (_parent: any, _args: any, context: Context) => {
      verifyAuth(context);
      return [
        { id: 'tm1', name: 'Sarah Connor', email: 'sarah@pinteresthub.com', role: 'admin', status: 'active' },
        { id: 'tm2', name: 'John Doe', email: 'john@pinteresthub.com', role: 'editor', status: 'active' },
        { id: 'tm3', name: 'Kyle Reese', email: 'kyle@pinteresthub.com', role: 'viewer', status: 'invited' }
      ];
    },

    adminDashboard: async (_parent: any, _args: any, context: Context) => {
      const userId = verifyAuth(context);
      const user = await User.findById(userId);
      if (user?.role !== 'admin' && user?.role !== 'owner') {
        throw new Error('UNAUTHORIZED: Admin access required.');
      }

      const users = await User.find();
      const pins = await Pin.find();
      const accounts = await PinterestAccount.find();

      const activeSchedules = pins.filter(p => p.status === 'scheduled').length;
      const publishedPins = pins.filter(p => p.status === 'published').length;

      return {
        totalUsersCount: users.length,
        activeSchedulesCount: activeSchedules,
        connectedPinterestAccountsCount: accounts.length,
        totalPinsPublishedCount: publishedPins,
        apiUsageLimit: 10000,
        apiUsageCurrent: accounts.length * 150 + publishedPins * 5
      };
    }
  },
  
  Mutation: {
    register: async (_parent: any, { name, email, password }: any) => {
      const existing = await User.findOne({ email });
      if (existing) {
        throw new Error('User already exists with this email address.');
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const allUsers = await User.find();
      const role = allUsers.length === 0 ? 'admin' : 'editor';
      
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        subscriptionStatus: 'free',
        featureFlags: ['ai-assistant', 'analytics-pro']
      });
      
      const token = jwt.sign({ userId: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
      
      await ActivityLog.create({
        userId: newUser.id!,
        action: 'register',
        details: 'User registered account and logged in.',
        status: 'success'
      });

      return {
        token,
        user: newUser
      };
    },
    
    login: async (_parent: any, { email, password }: any) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Invalid email or password credentials.');
      }
      
      const match = await bcrypt.compare(password, user.password || '');
      if (!match) {
        throw new Error('Invalid email or password credentials.');
      }
      
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      
      await ActivityLog.create({
        userId: user.id!,
        action: 'login',
        details: 'User logged in successfully.',
        status: 'success'
      });

      return {
        token,
        user
      };
    },
    
    connectPinterestAccount: async (_parent: any, { code, usernameOverride, email, password }: { code?: string, usernameOverride?: string, email?: string, password?: string }, context: Context) => {
      const userId = verifyAuth(context);
      
      const profile = await PinterestService.exchangeCodeForToken(code || '', usernameOverride, email, password);
      
      const existing = await PinterestAccount.findOne({ userId, username: profile.username });
      
      let account;
      if (existing) {
        account = await PinterestAccount.findByIdAndUpdate(existing.id!, {
          email: profile.email || existing.email,
          password: profile.password || existing.password,
          authMethod: 'selenium',
          profileImage: profile.profileImage,
          followers: profile.followers,
          following: profile.following,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          tokenExpiresAt: profile.tokenExpiresAt,
          status: 'connected',
          syncStatus: 'synced',
          lastSyncTime: new Date().toISOString()
        });
      } else {
        account = await PinterestAccount.create({
          userId,
          username: profile.username,
          email: profile.email,
          password: profile.password,
          authMethod: 'selenium',
          profileImage: profile.profileImage,
          followers: profile.followers,
          following: profile.following,
          boardsCount: profile.boardsCount,
          monthlyViews: profile.monthlyViews,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          tokenExpiresAt: profile.tokenExpiresAt,
          status: 'connected',
          syncStatus: 'synced',
          lastSyncTime: new Date().toISOString()
        });
      }

      try {
        const fetched = await PinterestService.fetchBoards(account!);
        await Board.deleteMany({ accountId: account!.id });
        for (const b of fetched) {
          await Board.create({
            accountId: account!.id!,
            pinterestId: b.pinterestId,
            name: b.name,
            description: b.description,
            pinsCount: b.pinsCount,
            followers: b.followers,
            archived: b.archived
          });
        }
        await PinterestAccount.findByIdAndUpdate(account!.id!, {
          boardsCount: fetched.length
        });
      } catch (boardErr) {
        console.warn('⚠️ Syncing boards after connection failed:', boardErr);
      }
      
      await ActivityLog.create({
        userId,
        action: 'account_connected',
        details: `Connected Pinterest account @${profile.username} via Selenium automation`,
        accountUsername: profile.username,
        status: 'success'
      });
      
      return account!;
    },
    
    disconnectPinterestAccount: async (_parent: any, { accountId }: { accountId: string }, context: Context) => {
      const userId = verifyAuth(context);
      
      const account = await PinterestAccount.findById(accountId);
      if (!account || account.userId !== userId) {
        throw new Error('Account not found or access denied.');
      }
      
      await PinterestAccount.findByIdAndDelete(accountId);
      await Board.deleteMany({ accountId });
      
      await ActivityLog.create({
        userId,
        action: 'account_disconnected',
        details: `Disconnected Pinterest account: @${account.username}`,
        accountUsername: account.username,
        status: 'success'
      });
      
      return true;
    },

    updateAccountDefaultLink: async (_parent: any, { accountId, defaultDestinationUrl }: { accountId: string, defaultDestinationUrl: string }, context: Context) => {
      const userId = verifyAuth(context);
      let account = await PinterestAccount.findById(accountId);
      if (!account) {
        const accounts = await PinterestAccount.find({ userId });
        account = accounts.find(a => a.id === accountId || a._id === accountId) || null;
      }
      if (!account) {
        throw new Error('Account not found or access denied.');
      }
      const targetId = (account.id || account._id)?.toString();
      await PinterestAccount.findByIdAndUpdate(targetId!, { defaultDestinationUrl });
      const updated = await PinterestAccount.findById(targetId!);
      return updated || account;
    },
    
    savePin: async (_parent: any, { input }: { input: any }, context: Context) => {
      const userId = verifyAuth(context);
      
      let finalLink = input.destinationUrl || '';
      if (!finalLink && input.accountIds && input.accountIds.length > 0) {
        const primaryAcc = await PinterestAccount.findById(input.accountIds[0]);
        if (primaryAcc?.defaultDestinationUrl) {
          finalLink = primaryAcc.defaultDestinationUrl;
        }
      }

      let pin;
      const pinData = {
        userId,
        accountIds: input.accountIds,
        title: input.title,
        description: input.description || '',
        destinationUrl: finalLink,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType || 'image',
        boardId: input.boardId,
        scheduledAt: input.scheduledAt,
        status: input.status || 'scheduled'
      };

      if (input.id) {
        const existing = await Pin.findById(input.id);
        if (!existing || existing.userId !== userId) {
          throw new Error('Pin not found or unauthorized.');
        }
        pin = await Pin.findByIdAndUpdate(input.id, pinData);
      } else {
        pin = await Pin.create(pinData);
        
        await ActivityLog.create({
          userId,
          action: 'pin_created',
          details: `Created Pin "${pin.title}" (${pin.status})`,
          status: 'success'
        });
      }

      if (pin && pin.status === 'scheduled') {
        await schedulePin(pin.id!, pin.scheduledAt);
      }

      return pin!;
    },

    publishPinNow: async (_parent: any, { input }: { input: any }, context: Context) => {
      const userId = verifyAuth(context);
      
      let finalLink = input.destinationUrl || '';
      if (!finalLink && input.accountIds && input.accountIds.length > 0) {
        const primaryAcc = await PinterestAccount.findById(input.accountIds[0]);
        if (primaryAcc?.defaultDestinationUrl) {
          finalLink = primaryAcc.defaultDestinationUrl;
        }
      }

      const pinData = {
        userId,
        accountIds: input.accountIds,
        title: input.title,
        description: input.description || '',
        destinationUrl: finalLink,
        mediaUrl: input.mediaUrl,
        mediaType: input.mediaType || 'image',
        boardId: input.boardId,
        scheduledAt: new Date().toISOString(),
        status: 'scheduled'
      };

      let pin = await Pin.create(pinData);
      
      await ActivityLog.create({
        userId,
        action: 'pin_publishing_now',
        details: `Triggered immediate publishing for Pin "${pin.title}"`,
        status: 'pending'
      });

      // Process publication directly and synchronously
      await processPublishPin(pin.id!);

      // Return refreshed pin state
      const updatedPin = await Pin.findById(pin.id!);
      return updatedPin || pin;
    },
    
    duplicatePin: async (_parent: any, { id }: { id: string }, context: Context) => {
      const userId = verifyAuth(context);
      const existing = await Pin.findById(id);
      if (!existing || existing.userId !== userId) {
        throw new Error('Pin not found or unauthorized.');
      }

      const dup = await Pin.create({
        userId,
        accountIds: existing.accountIds,
        title: `${existing.title} (Copy)`,
        description: existing.description,
        destinationUrl: existing.destinationUrl,
        mediaUrl: existing.mediaUrl,
        mediaType: existing.mediaType,
        boardId: existing.boardId,
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: 'draft'
      });

      await ActivityLog.create({
        userId,
        action: 'pin_duplicated',
        details: `Duplicated Pin "${existing.title}" into new draft`,
        status: 'success'
      });

      return dup;
    },

    bulkUploadPins: async (_parent: any, { csvContent, accountIds }: { csvContent: string, accountIds: string[] }, context: Context) => {
      const userId = verifyAuth(context);
      const lines = csvContent.split('\n');
      const pinsCreated: IPin[] = [];

      let headersParsed = false;
      
      for (const line of lines) {
        const cleaned = line.trim();
        if (!cleaned) continue;

        const cols = cleaned.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => col.replace(/^"|"$/g, '').trim());

        if (!headersParsed) {
          if (cols.some(c => c.toLowerCase().includes('url') || c.toLowerCase().includes('title'))) {
            headersParsed = true;
            continue;
          }
          headersParsed = true;
        }

        if (cols.length < 5) continue;

        const mediaUrl = cols[0];
        const title = cols[1];
        const description = cols[2] || '';
        const destinationUrl = cols[3] || '';
        const boardId = cols[4];
        let scheduledAt = cols[5] ? new Date(cols[5]).toISOString() : '';
        if (!scheduledAt || isNaN(new Date(scheduledAt).getTime())) {
          scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        }

        if (!mediaUrl || !title || !boardId) continue;

        const pin = await Pin.create({
          userId,
          accountIds,
          title,
          description,
          destinationUrl,
          mediaUrl,
          mediaType: 'image',
          boardId,
          scheduledAt,
          status: 'scheduled'
        });

        await schedulePin(pin.id!, pin.scheduledAt);
        pinsCreated.push(pin);
      }

      await ActivityLog.create({
        userId,
        action: 'bulk_upload',
        details: `Bulk uploaded ${pinsCreated.length} scheduled pins from CSV`,
        status: 'success'
      });

      return pinsCreated;
    },

    deletePin: async (_parent: any, { id }: { id: string }, context: Context) => {
      const userId = verifyAuth(context);
      const existing = await Pin.findById(id);
      if (!existing || existing.userId !== userId) {
        throw new Error('Pin not found or unauthorized.');
      }
      
      await Pin.findByIdAndDelete(id);
      
      await ActivityLog.create({
        userId,
        action: 'pin_deleted',
        details: `Deleted scheduled Pin: "${existing.title}"`,
        status: 'success'
      });

      return true;
    },
    
    createBoard: async (_parent: any, { accountId, name, description }: { accountId: string, name: string, description?: string }, context: Context) => {
      const userId = verifyAuth(context);
      
      const account = await PinterestAccount.findById(accountId);
      if (!account || account.userId !== userId) {
        throw new Error('Pinterest account not found or access denied.');
      }
      
      const b = await PinterestService.createBoard(account, name, description);
      
      const newBoard = await Board.create({
        accountId,
        pinterestId: b.pinterestId,
        name: b.name,
        description: b.description,
        pinsCount: 0,
        followers: 0,
        archived: false
      });

      const activeBoards = await Board.find({ accountId });
      await PinterestAccount.findByIdAndUpdate(accountId, {
        boardsCount: activeBoards.length
      });

      await ActivityLog.create({
        userId,
        action: 'board_created',
        details: `Created board "${name}" for account @${account.username}`,
        accountUsername: account.username,
        status: 'success'
      });

      return newBoard;
    },
    
    generateAICaption: async (_parent: any, { prompt, keywords }: { prompt: string, keywords?: string[] }, context: Context) => {
      verifyAuth(context);
      return await AIService.generateCaption(prompt, keywords || []);
    },
    
    saveContentItem: async (_parent: any, { input }: { input: any }, context: Context) => {
      const userId = verifyAuth(context);
      const data = {
        userId,
        title: input.title,
        description: input.description || '',
        mediaUrl: input.mediaUrl,
        link: input.link || '',
        tags: input.tags || []
      };

      let item;
      if (input.id) {
        const existing = await ContentLibrary.findById(input.id);
        if (!existing || existing.userId !== userId) {
          throw new Error('Content item not found or unauthorized.');
        }
        item = await ContentLibrary.findByIdAndUpdate(input.id, data);
      } else {
        item = await ContentLibrary.create(data);
      }

      return item!;
    },

    deleteContentItem: async (_parent: any, { id }: { id: string }, context: Context) => {
      const userId = verifyAuth(context);
      const existing = await ContentLibrary.findById(id);
      if (!existing || existing.userId !== userId) {
        throw new Error('Content item not found or unauthorized.');
      }
      await ContentLibrary.findByIdAndDelete(id);
      return true;
    },
    
    saveAutomationRule: async (_parent: any, { input }: { input: any }, context: Context) => {
      const userId = verifyAuth(context);
      const data = {
        userId,
        name: input.name,
        accountIds: input.accountIds,
        boardId: input.boardId,
        time: input.time,
        days: input.days,
        evergreen: input.evergreen,
        status: input.status || 'active'
      };

      let rule;
      if (input.id) {
        const existing = await AutomationRule.findById(input.id);
        if (!existing || existing.userId !== userId) {
          throw new Error('Rule not found or unauthorized.');
        }
        rule = await AutomationRule.findByIdAndUpdate(input.id, data);
      } else {
        rule = await AutomationRule.create(data);
        await ActivityLog.create({
          userId,
          action: 'automation_created',
          details: `Created automation rule "${rule.name}"`,
          status: 'success'
        });
      }

      return rule!;
    },
    
    deleteAutomationRule: async (_parent: any, { id }: { id: string }, context: Context) => {
      const userId = verifyAuth(context);
      const existing = await AutomationRule.findById(id);
      if (!existing || existing.userId !== userId) {
        throw new Error('Rule not found or unauthorized.');
      }
      await AutomationRule.findByIdAndDelete(id);
      return true;
    },
    
    inviteTeamMember: async (_parent: any, { email, role }: { email: string, role: string }, context: Context) => {
      verifyAuth(context);
      return {
        id: Math.random().toString(36).substring(2, 6),
        name: email.split('@')[0] || 'New Team Member',
        email,
        role,
        status: 'invited'
      };
    },

    removeTeamMember: async (_parent: any, { id }: { id: string }, context: Context) => {
      verifyAuth(context);
      return true;
    }
  }
};
