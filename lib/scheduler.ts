import { Pin, PinterestAccount, ActivityLog } from './models';
import { PinterestService } from './pinterest';

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
 * Start the background polling queue
 */
export function initScheduler() {
  if (global.pinSchedulerTimer) {
    return;
  }

  console.log('🔄 Starting Next.js background scheduler loop (checking every 10s)...');
  
  global.pinSchedulerTimer = setInterval(async () => {
    try {
      const now = new Date();
      
      // Auto-recover stuck pins older than 5 minutes
      const publishingPins = await Pin.find({ status: 'publishing' });
      for (const st of publishingPins) {
        const stuckId = (st.id || st._id)?.toString();
        const updatedTime = new Date(st.updatedAt || st.createdAt || 0);
        if (stuckId && now.getTime() - updatedTime.getTime() > 5 * 60 * 1000) {
          console.warn(`🔄 Auto-recovering stuck publishing pin ${stuckId} back to scheduled state.`);
          await Pin.findByIdAndUpdate(stuckId, { status: 'scheduled' });
        }
      }

      const scheduledPins = await Pin.find({ status: 'scheduled' });
      
      const duePins = scheduledPins.filter(pin => {
        return new Date(pin.scheduledAt) <= now;
      });

      if (duePins.length > 0) {
        console.log(`🔔 Found ${duePins.length} due pins in queue. Processing crash-proof batch execution...`);
        for (const pin of duePins) {
          const targetId = (pin.id || pin._id)?.toString();
          if (targetId) {
            // Isolate execution so one failure never stops remaining queue items
            try {
              await processPublishPin(targetId);
            } catch (pErr) {
              console.error(`❌ Queue batch error on pin ${targetId}:`, pErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Error in background scheduler polling:', err);
    }
  }, 10000); // 10 seconds
}

/**
 * Add pin to schedule
 */
export async function schedulePin(pinId: string, scheduledAt: string) {
  // Database-driven scheduling will be automatically picked up by the polling loop
  console.log(`📅 Pin ${pinId} saved to database. Scheduled to publish around: ${scheduledAt}`);
}
