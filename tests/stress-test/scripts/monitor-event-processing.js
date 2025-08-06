const { MongoClient } = require('mongodb');

async function monitorEventProcessing() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    
    console.log('👁️ Monitoring Event Processing (Ctrl+C to stop)\n');
    
    let lastEventCount = 0;
    let lastProxyCount = 0;
    
    setInterval(async () => {
      const urDb = client.db('universal-reporting');
      
      const stats = await Promise.all([
        urDb.collection('importedevents').countDocuments({ processed: false }),
        urDb.collection('importedevents').countDocuments({ processed: true }),
        urDb.collection('proxies').countDocuments(),
        urDb.collection('dependencygraphnodes').countDocuments(),
        urDb.collection('importedevents').findOne(
          { processed: true },
          { sort: { processedAt: -1 } }
        )
      ]);
      
      const [unprocessed, processed, proxies, nodes, lastEvent] = stats;
      
      const eventDelta = processed - lastEventCount;
      const proxyDelta = proxies - lastProxyCount;
      
      console.clear();
      console.log('👁️ UR Event Processing Monitor\n');
      console.log(`📨 Events:`);
      console.log(`   Processed: ${processed} (+${eventDelta})`);
      console.log(`   Unprocessed: ${unprocessed}`);
      console.log(`   Processing Rate: ${(eventDelta / 2).toFixed(1)}/sec`);
      
      console.log(`\n🎯 Proxies: ${proxies} (+${proxyDelta})`);
      console.log(`🕸️ Dependency Nodes: ${nodes}`);
      
      if (lastEvent && lastEvent.processedAt) {
        const age = Math.round((Date.now() - new Date(lastEvent.processedAt)) / 1000);
        console.log(`\n⏰ Last Event Processed: ${age}s ago`);
      }
      
      lastEventCount = processed;
      lastProxyCount = proxies;
      
    }, 2000);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

monitorEventProcessing().catch(console.error);