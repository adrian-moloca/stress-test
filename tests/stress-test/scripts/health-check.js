// scripts/health-check.js
const { MongoClient } = require('mongodb');
const Bull = require('bull');

async function healthCheck() {
  console.log('🏥 System Health Check\n');
  
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    
    console.log('📊 Database Status:');
    const urDb = client.db('universal-reporting');
    
    const counts = {
      events: await urDb.collection('importedevents').countDocuments(),
      unprocessedEvents: await urDb.collection('importedevents').countDocuments({ processed: false }),
      proxies: await urDb.collection('proxies').countDocuments(),
      configs: await urDb.collection('billingconfigs').countDocuments()
    };
    
    console.log(`   Events: ${counts.events} (${counts.unprocessedEvents} unprocessed)`);
    console.log(`   Proxies: ${counts.proxies}`);
    console.log(`   Configs: ${counts.configs}`);
    
    console.log('\n📬 Queue Status:');
    const queueNames = ['ur-trigger-events', 'ur-dependencies'];
    
    for (const queueName of queueNames) {
      const queue = new Bull(queueName, 'redis://localhost:6379');
      const jobCounts = await queue.getJobCounts();
      const total = Object.values(jobCounts).reduce((sum, count) => sum + count, 0);
      console.log(`   ${queueName}: ${total} jobs`);
      await queue.close();
    }
    
    console.log('\n🔍 Common Issues Check:');
    
    const orphanedProxies = await urDb.collection('proxies').countDocuments({
      'context.caseNumber': { $exists: false }
    });
    console.log(`   Orphaned proxies: ${orphanedProxies}`);
    
    const oldUnprocessedEvents = await urDb.collection('importedevents').countDocuments({
      processed: false,
      createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // Older than 5 minutes
    });
    console.log(`   Stuck events (>5min): ${oldUnprocessedEvents}`);
    
    console.log('\n✅ Health check complete');
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  healthCheck();
}

module.exports = { healthCheck };