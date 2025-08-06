const { MongoClient } = require('mongodb');

async function traceEventFlow() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    
    console.log('🔄 Tracing Event Processing Flow\n');
    
    const casesDb = client.db('schedulingCases');
    const urDb = client.db('universal-reporting');
    
    const testCase = await casesDb.collection('cases').findOne(
      { caseNumber: /^(STRESS_|LOAD_)/ },
      { sort: { createdAt: -1 } }
    );
    
    if (!testCase) {
      console.log('❌ No test cases found');
      return;
    }
    
    console.log(`📋 Tracing Case: ${testCase.caseNumber}`);
    console.log(`   Created: ${testCase.createdAt}`);
    
    const event = await urDb.collection('importedevents').findOne({
      sourceDocId: testCase._id
    });
    
    if (event) {
      console.log(`\n📨 Event Status:`);
      console.log(`   Created: ${event.createdAt}`);
      console.log(`   Processed: ${event.processed}`);
      console.log(`   ProcessedAt: ${event.processedAt || 'not processed'}`);
      console.log(`   Source: ${event.source}`);
    } else {
      console.log('\n❌ No event found for this case!');
    }
    
    const proxy = await urDb.collection('proxies').findOne({
      contextKey: testCase.caseNumber
    });
    
    if (proxy) {
      console.log(`\n🎯 Proxy Status:`);
      console.log(`   ID: ${proxy._id}`);
      console.log(`   Created: ${proxy.createdAt}`);
      console.log(`   Dynamic Fields: ${JSON.stringify(proxy.dynamicFields)}`);
      console.log(`   Context: ${JSON.stringify(proxy.context)}`);
    } else {
      console.log('\n❌ No proxy found for this case!');
    }
    
    const nodes = await urDb.collection('dependencygraphnodes').find({
      target: new RegExp(`proxy.*${proxy?._id}`)
    }).toArray();
    
    console.log(`\n🕸️ Dependency Nodes: ${nodes.length}`);
    nodes.forEach(node => {
      console.log(`   - ${node.target}: ${node.status}`);
    });
    
    const domain = await urDb.collection('domains').findOne({
      domainId: 'schedulingCases'
    });
    
    console.log(`\n🔧 Domain Configuration:`);
    console.log(`   Trigger Event: ${domain?.trigger?.eventType}`);
    console.log(`   Context Key Expression: ${JSON.stringify(domain?.trigger?.contextKey)}`);
    
  } finally {
    await client.close();
  }
}

traceEventFlow().catch(console.error);