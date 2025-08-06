const Bull = require('bull');
const Redis = require('ioredis');

class QueueCleaner {
  constructor(options = {}) {
    this.redisConfig = {
      host: options.redisHost || 'localhost',
      port: options.redisPort || 6379,
      password: options.redisPassword,
      db: options.redisDb || 0
    };
    
    this.queueNames = [
      'ur-trigger-events',
      'ur-dependencies',
      'ur-fields-lifecycle',
      'ur-proxy-updates',
      'billing-normalizer',
      'billing-processor'
    ];
    
    this.redis = new Redis(this.redisConfig);
  }

  async cleanAllQueues() {
    console.log('🧹 Cleaning all Redis queues...\n');
    
    for (const queueName of this.queueNames) {
      await this.cleanQueue(queueName);
    }
    
    await this.cleanRedisPatterns();
    
    console.log('\n✅ All queues cleaned successfully');
  }

  async cleanQueue(queueName) {
    try {
      const queue = new Bull(queueName, {
        redis: this.redisConfig
      });

      const jobCounts = await queue.getJobCounts();
      const totalJobs = Object.values(jobCounts).reduce((sum, count) => sum + count, 0);
      
      if (totalJobs === 0) {
        console.log(`   ✓ ${queueName}: Already empty`);
        await queue.close();
        return;
      }

      console.log(`   🔄 ${queueName}: Found ${totalJobs} jobs`);
      console.log(`      - Waiting: ${jobCounts.waiting}`);
      console.log(`      - Active: ${jobCounts.active}`);
      console.log(`      - Completed: ${jobCounts.completed}`);
      console.log(`      - Failed: ${jobCounts.failed}`);
      console.log(`      - Delayed: ${jobCounts.delayed}`);

      await queue.empty();
      
      const completed = await queue.getCompleted();
      for (const job of completed) {
        await job.remove();
      }
      
      const failed = await queue.getFailed();
      for (const job of failed) {
        await job.remove();
      }
      
      const active = await queue.getActive();
      for (const job of active) {
        await job.remove();
      }
      
      const delayed = await queue.getDelayed();
      for (const job of delayed) {
        await job.remove();
      }

      await queue.close();
      console.log(`   ✅ ${queueName}: Cleaned`);
      
    } catch (error) {
      console.error(`   ❌ ${queueName}: Error - ${error.message}`);
    }
  }

  async cleanRedisPatterns() {
    console.log('\n🔄 Cleaning Redis key patterns...');
    
    const patterns = [
      'bull:*',
      'redlock:*',
      'ur-locks:*',
      'cache:*'
    ];
    
    for (const pattern of patterns) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        console.log(`   Deleting ${keys.length} keys matching ${pattern}`);
        for (const key of keys) {
          await this.redis.del(key);
        }
      }
    }
  }

  async getQueueStats() {
    const stats = {};
    
    for (const queueName of this.queueNames) {
      const queue = new Bull(queueName, {
        redis: this.redisConfig
      });
      
      stats[queueName] = await queue.getJobCounts();
      await queue.close();
    }
    
    return stats;
  }

  async close() {
    await this.redis.quit();
  }
}

if (require.main === module) {
  const cleaner = new QueueCleaner();
  
  cleaner.cleanAllQueues()
    .then(() => cleaner.close())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Failed to clean queues:', error);
      process.exit(1);
    });
}

module.exports = QueueCleaner;