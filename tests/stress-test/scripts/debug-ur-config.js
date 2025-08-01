// scripts/debug-ur-expressions.js
const { MongoClient, ObjectId } = require('mongodb');

async function debugURExpressions() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    
    // Create a minimal test case
    const caseNumber = `DEBUG_${Date.now()}`;
    const caseDoc = {
      _id: new ObjectId().toString(),
      caseNumber: caseNumber,
      status: 'PENDING',
      bookingPatient: {
        firstName: 'Debug',
        lastName: 'Test'
      },
      tenantId: '66045e2350e8d495ec17bbe9',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert case
    await client.db('schedulingCases').collection('cases').insertOne(caseDoc);
    console.log(`✅ Created debug case: ${caseNumber}`);
    
    // Create event with detailed logging
    const event = {
      source: 'cases-created',
      sourceDocId: caseDoc._id,
      tenantId: caseDoc.tenantId,
      processed: false,
      previousValues: {},
      currentValues: caseDoc,
      createdAt: new Date()
    };
    
    await client.db('universal-reporting').collection('importedevents').insertOne(event);
    console.log('✅ Created event');
    console.log('\n📊 Event structure:');
    console.log(JSON.stringify(event, null, 2));
    
    // Check what the trigger expects
    const domain = await client.db('universal-reporting')
      .collection('domains')
      .findOne({ domainId: 'schedulingCases' });
    
    if (domain && domain.trigger) {
      console.log('\n🔍 Trigger configuration:');
      console.log('ContextKey:', JSON.stringify(domain.trigger.contextKey, null, 2));
      console.log('EmitExpression:', JSON.stringify(domain.trigger.emitExpression, null, 2));
    }
    
  } finally {
    await client.close();
  }
}

debugURExpressions();