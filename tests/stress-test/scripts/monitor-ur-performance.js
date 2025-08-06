const { MongoClient } = require('mongodb');

async function monitorPerformance() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const urDb = client.db('universal-reporting');
    
    console.log('📊 UR Performance Monitor - Press Ctrl+C to stop\n');
    
    setInterval(async () => {
      const stats = {
        timestamp: new Date().toISOString(),
        importedEvents: {
          total: await urDb.collection('importedevents').countDocuments(),
          unprocessed: await urDb.collection('importedevents').countDocuments({ processed: false })
        },
        proxies: await urDb.collection('proxies').countDocuments(),
        nodes: {
          total: await urDb.collection('dependencygraphnodes').countDocuments(),
          dirty: await urDb.collection('dependencygraphnodes').countDocuments({ status: 'DIRTY' }),
          evaluated: await urDb.collection('dependencygraphnodes').countDocuments({ status: 'EVALUATED' })
        }
      };
      
      console.clear();
      console.log('📊 UR Performance Monitor\n');
      console.log(`⏰ ${stats.timestamp}`);
      console.log(`\n📨 Events:`);
      console.log(`   Total: ${stats.importedEvents.total}`);
      console.log(`   Unprocessed: ${stats.importedEvents.unprocessed}`);
      console.log(`\n🎯 Proxies: ${stats.proxies}`);
      console.log(`\n🕸️  Dependency Nodes:`);
      console.log(`   Total: ${stats.nodes.total}`);
      console.log(`   Dirty: ${stats.nodes.dirty}`);
      console.log(`   Evaluated: ${stats.nodes.evaluated}`);
      
    }, 2000);
    
  } catch (error) {
    console.error('Monitor error:', error);
  }
}

monitorPerformance();