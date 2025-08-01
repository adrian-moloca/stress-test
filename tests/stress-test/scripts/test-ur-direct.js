// scripts/test-ur-direct.js
const { MongoClient } = require('mongodb');

async function testURDirect() {
  const client = new MongoClient('mongodb://localhost:27017');
  const tenantId = '66045e2350e8d495ec17bbe9';
  
  try {
    await client.connect();
    
    // Create a test case and process it manually
    const caseNumber = `DIRECT_TEST_${Date.now()}`;
    const caseId = `case_direct_${Date.now()}`;
    
    // 1. Create case
    const caseDoc = {
      _id: caseId,
      caseNumber: caseNumber,
      status: 'PENDING',
      tenantId: tenantId,
      createdAt: new Date()
    };
    
    await client.db('schedulingCases').collection('cases').insertOne(caseDoc);
    console.log(`✅ Created case: ${caseNumber}`);
    
    // 2. Create event
    const eventDoc = {
      source: 'cases-created',
      sourceDocId: caseId,
      tenantId: tenantId,
      processed: false,
      currentValues: caseDoc,
      previousValues: {},
      createdAt: new Date()
    };
    
    await client.db('universal-reporting').collection('importedevents').insertOne(eventDoc);
    console.log('✅ Created event');
    
    // 3. Manually create proxy (simulating what UR should do)
    const proxyDoc = {
      _id: new ObjectId(),
      domainId: 'schedulingCases',
      contextKey: caseNumber,
      tenantId: tenantId,
      context: {
        caseNumber: caseNumber,
        caseId: caseId,
        status: 'PENDING'
      },
      fields: {
        caseNumber: {
          value: caseNumber,
          metadata: {
            automaticValue: caseNumber,
            source: 'AUTOMATIC'
          }
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await client.db('universal-reporting').collection('proxies').insertOne(proxyDoc);
    console.log('✅ Created proxy manually');
    
    // 4. Try to fetch it via the API
    const fetch = require('node-fetch');
    const url = `http://localhost:8160/api/ur/proxies/schedulingCases/${caseNumber}`;
    console.log(`\n🔍 Testing API: ${url}`);
    
    const response = await fetch(url);
    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log('   Error:', error);
    } else {
      console.log('   ✅ API working!');
    }
    
  } finally {
    await client.close();
  }
}

testURDirect();