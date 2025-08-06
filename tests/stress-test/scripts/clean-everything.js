const QueueCleaner = require('./utils/queue-cleaner');
const CompleteDatabaseCleaner = require('./utils/complete-db-cleaner');
const EventIndexer = require('./core/event-indexer');
const { MongoClient } = require('mongodb');

async function completeCleanup() {
  console.log('🚀 Starting complete system cleanup...\n');
  console.log('This will:');
  console.log('  1. Clear all Redis queues');
  console.log('  2. Clean all test data from MongoDB');
  console.log('  3. Reset counters and sequences');
  console.log('  4. Rebuild indexes\n');
  
  if (process.argv.includes('--force')) {
    console.log('--force flag detected, proceeding without confirmation\n');
  } else {
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  let indexer = null;
  
  try {
    console.log('📌 Step 1: Cleaning Redis queues');
    const queueCleaner = new QueueCleaner();
    await queueCleaner.cleanAllQueues();
    await queueCleaner.close();
    
    console.log('\n📌 Step 2: Cleaning MongoDB databases');
    const dbCleaner = new CompleteDatabaseCleaner({
      preserveEssentials: true,
      verbose: true
    });
    await dbCleaner.clean();
    
    console.log('\n📌 Step 3: Resetting sequences');
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    await dbCleaner.resetSequences(client);
    await client.close();
    
    console.log('\n📌 Step 4: Rebuilding indexes');
    indexer = new EventIndexer();
    await indexer.connect();
    
    if (process.argv.includes('--reset-indexes')) {
      console.log('   Dropping all existing indexes first...');
      await indexer.dropAllIndexes();
    }
    
    await indexer.createEventIndexes();
    
    console.log('\n📌 Step 5: Verifying cleanup');
    await verifyCleanup();
    
    console.log('\n✅ Complete cleanup finished successfully!');
    console.log('\n📊 System is now ready for fresh stress testing');
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    if (indexer) {
      await indexer.close();
    }
  }
}

async function verifyCleanup() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  
  const checks = [
    { db: 'schedulingCases', collection: 'cases' },
    { db: 'universal-reporting', collection: 'importedevents' },
    { db: 'universal-reporting', collection: 'proxies' },
    { db: 'billing', collection: 'bills' }
  ];
  
  console.log('\n   Verification results:');
  for (const check of checks) {
    try {
      const count = await client
        .db(check.db)
        .collection(check.collection)
        .countDocuments();
      console.log(`   ✓ ${check.db}.${check.collection}: ${count} documents`);
    } catch (error) {
      console.log(`   ⚪ ${check.db}.${check.collection}: Not found`);
    }
  }
  
  console.log('\n   Queue status:');
  const queueCleaner = new QueueCleaner();
  const queueStats = await queueCleaner.getQueueStats();
  for (const [queueName, stats] of Object.entries(queueStats)) {
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    console.log(`   ✓ ${queueName}: ${total} jobs`);
  }
  await queueCleaner.close();
  
  await client.close();
}

if (require.main === module) {
  completeCleanup()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { completeCleanup };