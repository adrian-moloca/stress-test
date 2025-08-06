const { MongoClient } = require('mongodb');

async function cleanAndRetry() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    
    console.log('🧹 Cleaning up for retry\n');
    
    const deleteResult = await db.collection('proxies').deleteMany({
      $or: [
        { dynamicFields: { $exists: false } },
        { dynamicFields: {} },
        { dynamicFields: null }
      ]
    });
    
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} empty proxies`);
    
    const resetResult = await db.collection('importedevents').updateMany(
      { 
        source: 'cases-created',
        processed: true 
      },
      { 
        $set: { 
          processed: false,
          processedAt: null 
        } 
      }
    );
    
    console.log(`🔄 Reset ${resetResult.modifiedCount} events to unprocessed`);
    
    console.log('\n🔧 Check Redis queue for failed jobs');
    console.log('   Run: redis-cli');
    console.log('   Then: DEL bull:ur-dependencies-queue:failed');
    console.log('   And: DEL bull:ur-triggers-queue:failed');
    
    console.log('\n✅ Ready for retry!');
    console.log('\n📋 Next steps:');
    console.log('1. Clear Redis failed jobs (commands above)');
    console.log('2. Restart UR service');
    console.log('3. Monitor with: node scripts/watch-proxy-creation.js');
    
  } finally {
    await client.close();
  }
}

cleanAndRetry().catch(console.error);