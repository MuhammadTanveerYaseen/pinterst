import { Pin, PinterestAccount, ActivityLog, AutomationRule, ContentLibrary } from './models';
import { PinterestService } from './pinterest';
import { connectDB } from './db';

declare global {
  var pinSchedulerTimer: NodeJS.Timeout | undefined;
}

/**
 * Publishes a single due Pin to its designated Pinterest accounts
 */
export async function processPublishPin(pinId: string) {
  console.log(`⏱️ [Scheduler] Processing publication for Pin: ${pinId}`);
  const pin = await Pin.findById(pinId);
  if (!pin) {
    console.log(`⚠️ Pin ${pinId} not found in database.`);
    return;
  }

  if (pin.status !== 'scheduled') {
    console.log(`⚠️ Pin ${pinId} is not scheduled (current status: ${pin.status}). Skipping.`);
    return;
  }

  // Lock pin status during active publication task to avoid duplicate browser tasks
  await Pin.findByIdAndUpdate(pinId, { status: 'publishing' });

  try {
    const successAccounts: string[] = [];
    const failedAccounts: string[] = [];
    let lastUrl = '';

    for (const accId of pin.accountIds) {
      const account = await PinterestAccount.findById(accId);
      if (!account) {
        failedAccounts.push(`Account ${accId} not found`);
        continue;
      }

      try {
        const result = await PinterestService.publishPin(account, {
          title: pin.title,
          description: pin.description,
          destinationUrl: pin.destinationUrl,
          mediaUrl: pin.mediaUrl,
          boardId: pin.boardId
        });

        successAccounts.push(account.username);
        if (result.url) {
          lastUrl = result.url;
        }

        // Record successful post action log
        await ActivityLog.create({
          userId: pin.userId,
          action: 'pin_published',
          details: `Successfully published Pin "${pin.title}" to board ${pin.boardId}`,
          accountUsername: account.username,
          status: 'success'
        });

        // Update last post time on Pinterest account
        await PinterestAccount.findByIdAndUpdate(accId, {
          lastPostTime: new Date().toISOString()
        });
      } catch (err: any) {
        console.error(`❌ Failed to publish to account ${account.username}:`, err);
        failedAccounts.push(`${account.username}: ${err.message || err}`);
        
        await ActivityLog.create({
          userId: pin.userId,
          action: 'pin_failed',
          details: `Failed to publish Pin "${pin.title}": ${err.message || err}`,
          accountUsername: account.username,
          status: 'failed'
        });
      }
    }

    if (successAccounts.length > 0) {
      await Pin.findByIdAndUpdate(pinId, {
        status: 'published',
        destinationUrl: lastUrl || pin.destinationUrl,
        error: failedAccounts.length > 0 ? `Partial success. Failures: ${failedAccounts.join(', ')}` : undefined
      });
      console.log(`✅ Pin ${pinId} published successfully!`);
    } else {
      await Pin.findByIdAndUpdate(pinId, {
        status: 'failed',
        error: `All accounts failed: ${failedAccounts.join(', ')}`
      });
      console.log(`❌ Pin ${pinId} publication failed on all target accounts.`);
    }
  } catch (error: any) {
    console.error(`❌ Unexpected error processing Pin ${pinId}:`, error);
    await Pin.findByIdAndUpdate(pinId, {
      status: 'failed',
      error: error.message || String(error)
    });
  }
}

/**
 * Main execution runner (works on both local dev and serverless Vercel Cron routes)
 */
export async function runSchedulerCheck(): Promise<{ processedCount: number; rulesExecuted: number }> {
  await connectDB();
  const now = new Date();
  let processedCount = 0;
  let rulesExecuted = 0;

  try {
    // 1. Auto-recover stuck pins older than 5 minutes
    const publishingPins = await Pin.find({ status: 'publishing' });
    for (const st of publishingPins) {
      const stuckId = (st.id || st._id)?.toString();
      const updatedTime = new Date(st.updatedAt || st.createdAt || 0);
      if (stuckId && now.getTime() - updatedTime.getTime() > 5 * 60 * 1000) {
        console.warn(`🔄 Auto-recovering stuck publishing pin ${stuckId} back to scheduled state.`);
        await Pin.findByIdAndUpdate(stuckId, { status: 'scheduled' });
      }
    }

    // 2. Find all due scheduled pins
    const scheduledPins = await Pin.find({ status: 'scheduled' });
    const duePins = scheduledPins.filter(pin => new Date(pin.scheduledAt) <= now);

    if (duePins.length > 0) {
      console.log(`🔔 Found ${duePins.length} due pins in queue. Processing...`);
      for (const pin of duePins) {
        const targetId = (pin.id || pin._id)?.toString();
        if (targetId) {
          try {
            await processPublishPin(targetId);
            processedCount++;
          } catch (pErr) {
            console.error(`❌ Queue batch error on pin ${targetId}:`, pErr);
          }
        }
      }
    }

    // 3. Process Active Automation Rules
    const activeRules = await AutomationRule.find({ status: 'active' });
    const currentDayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    for (const rule of activeRules) {
      const ruleDays = (rule.days || []).map((d: string) => d.toLowerCase());
      if (ruleDays.includes(currentDayName) || rule.evergreen) {
        const ruleId = (rule.id || rule._id)?.toString();
        
        // Find content library items to publish
        const contentItems = await ContentLibrary.find({ userId: rule.userId });
        if (contentItems.length > 0) {
          const itemToPublish = contentItems[Math.floor(Math.random() * contentItems.length)];
          const newPin = await Pin.create({
            userId: rule.userId,
            accountIds: rule.accountIds,
            title: itemToPublish.title || rule.name,
            description: itemToPublish.description || 'Auto-generated automation pin',
            destinationUrl: itemToPublish.link || 'https://pinterest.com',
            mediaUrl: itemToPublish.mediaUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
            mediaType: 'image',
            boardId: rule.boardId,
            scheduledAt: new Date().toISOString(),
            status: 'scheduled'
          });

          const pinId = (newPin.id || newPin._id)?.toString();
          if (pinId) {
            await processPublishPin(pinId);
            rulesExecuted++;
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Error in runSchedulerCheck execution:', err);
  }

  return { processedCount, rulesExecuted };
}

/**
 * Start the background polling queue for local development
 */
export function initScheduler() {
  if (global.pinSchedulerTimer) {
    return;
  }

  console.log('🔄 Starting Next.js background scheduler loop (checking every 10s)...');
  
  global.pinSchedulerTimer = setInterval(async () => {
    try {
      await runSchedulerCheck();
    } catch (err) {
      console.error('❌ Error in background scheduler polling:', err);
    }
  }, 10000);
}

/**
 * Add pin to schedule
 */
export async function schedulePin(pinId: string, scheduledAt: string) {
  console.log(`📅 Pin ${pinId} saved to database. Scheduled to publish around: ${scheduledAt}`);
}
