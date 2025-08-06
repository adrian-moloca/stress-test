const { MongoClient } = require('mongodb');

async function monitorSystemHealth() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    
    console.log('🏥 UR System Health Monitor (Ctrl+C to stop)\n');
    
    setInterval(async () => {
      const db = client.db('universal-reporting');
      
      const stats = await Promise.all([
        db.collection('importedevents').countDocuments(),
        db.collection('importedevents').countDocuments({ processed: false }),
        
        db.collection('proxies').countDocuments(),
        db.collection('proxies').countDocuments({
          dynamicFields: { $exists: true, $ne: {} }
        }),
        
        db.collection('dependencygraphnodes').countDocuments(),
        db.collection('dependencygraphnodes').countDocuments({ status: 'DIRTY' }),
        
        db.collection('fieldoperations').countDocuments({ processed: false })
      ]);
      
      const [
        totalEvents, unprocessedEvents,
        totalProxies, proxiesWithFields,
        totalNodes, dirtyNodes,
        unprocessedOps
      ] = stats;
      
      const eventProcessingRate = ((totalEvents - unprocessedEvents) / totalEvents * 100).toFixed(1);
      const proxyCompletionRate = (proxiesWithFields / totalProxies * 100).toFixed(1);
      
      console.clear();
      console.log('🏥 UR System Health Monitor\n');
      
      console.log('📨 Events:');
      console.log(`   Total: ${totalEvents}`);
      console.log(`   Processed: ${totalEvents - unprocessedEvents} (${eventProcessingRate}%)`);
      console.log(`   Queue: ${unprocessedEvents}`);
      
      console.log('\n🎯 Proxies:');
      console.log(`   Total: ${totalProxies}`);
      console.log(`   With Fields: ${proxiesWithFields} (${proxyCompletionRate}%)`);
      console.log(`   Empty: ${totalProxies - proxiesWithFields}`);
      
      console.log('\n🕸️ Dependency Nodes:');
      console.log(`   Total: ${totalNodes}`);
      console.log(`   Dirty: ${dirtyNodes}`);
      console.log(`   Evaluated: ${totalNodes - dirtyNodes}`);
      
      console.log('\n🔧 Field Operations:');
      console.log(`   Unprocessed: ${unprocessedOps}`);
      
      const healthScore = (
        (eventProcessingRate * 0.3) +
        (proxyCompletionRate * 0.5) +
        ((totalNodes > 0 ? 20 : 0))
      ).toFixed(0);
      
      console.log('\n💚 System Health Score: ' + healthScore + '%');
      
      if (healthScore < 50) {
        console.log('   ⚠️  System needs attention!');
      } else if (healthScore < 80) {
        console.log('   🟡 System is partially healthy');
      } else {
        console.log('   ✅ System is healthy!');
      }
      
    }, 3000);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

monitorSystemHealth().catch(console.error);