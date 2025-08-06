const { MongoClient } = require('mongodb');

async function monitorMegaTest() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    
    console.log('📊 MEGA TEST MONITOR - Live System Stats\n');
    
    let lastEventCount = 0;
    let lastProxyCount = 0;
    
    setInterval(async () => {
      const urDb = client.db('universal-reporting');
      const casesDb = client.db('schedulingCases');
      
      const [
        totalEvents,
        unprocessedEvents,
        totalProxies,
        proxiesWithFields,
        totalNodes,
        megaTestCases,
        megaTestProxies
      ] = await Promise.all([
        urDb.collection('importedevents').countDocuments(),
        urDb.collection('importedevents').countDocuments({ processed: false }),
        urDb.collection('proxies').countDocuments(),
        urDb.collection('proxies').countDocuments({ dynamicFields: { $exists: true, $ne: {} } }),
        urDb.collection('dependencygraphnodes').countDocuments(),
        casesDb.collection('cases').countDocuments({ caseNumber: /^MEGA_/ }),
        urDb.collection('proxies').countDocuments({ contextKey: /^MEGA_/ })
      ]);
      
      const processedEvents = totalEvents - unprocessedEvents;
      const eventDelta = processedEvents - lastEventCount;
      const proxyDelta = totalProxies - lastProxyCount;
      
      const usage = process.cpuUsage();
      const mem = process.memoryUsage();
      
      console.clear();
      console.log('📊 MEGA TEST MONITOR - ' + new Date().toLocaleTimeString());
      console.log('=' * 60);
      
      console.log('\n🎯 Test Progress:');
      console.log(`   Mega Test Cases: ${megaTestCases.toLocaleString()}`);
      console.log(`   Mega Test Proxies: ${megaTestProxies.toLocaleString()}`);
      console.log(`   Success Rate: ${megaTestCases > 0 ? ((megaTestProxies / megaTestCases) * 100).toFixed(1) : 0}%`);
      
      console.log('\n📈 System Metrics:');
      console.log(`   Total Events: ${totalEvents.toLocaleString()}`);
      console.log(`   Processing Queue: ${unprocessedEvents.toLocaleString()}`);
      console.log(`   Processing Rate: ${eventDelta}/sec`);
      
      console.log('\n🎯 Proxies:');
      console.log(`   Total: ${totalProxies.toLocaleString()}`);
      console.log(`   With Fields: ${proxiesWithFields.toLocaleString()} (${((proxiesWithFields/totalProxies)*100).toFixed(1)}%)`);
      console.log(`   Creation Rate: ${proxyDelta}/sec`);
      
      console.log('\n🕸️ Dependency Nodes: ' + totalNodes.toLocaleString());
      
      console.log('\n💻 System Resources:');
      console.log(`   CPU: ${((usage.user + usage.system) / 1000000).toFixed(1)}s`);
      console.log(`   Memory: ${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`);
      
      if (unprocessedEvents > 5000) {
        console.log('\n⚠️  HIGH QUEUE BACKLOG!');
      }
      
      if (eventDelta === 0 && unprocessedEvents > 0) {
        console.log('\n⚠️  PROCESSING STALLED!');
      }
      
      lastEventCount = processedEvents;
      lastProxyCount = totalProxies;
      
    }, 1000);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

monitorMegaTest().catch(console.error);