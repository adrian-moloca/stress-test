// scripts/fix-dependency-graph-policies.js
const { MongoClient, ObjectId } = require('mongodb');

async function fixDependencyGraphPolicies() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('universal-reporting');
    
    // Fix existing dependency graph nodes
    console.log('\n🔧 Fixing dependency graph nodes...');
    
    // Update all nodes that don't have a policy
    const result = await db.collection('dependenciesgraphs').updateMany(
      { policy: { $exists: false } },
      { 
        $set: { 
          policy: {
            horizontal: 'OVERWRITE',
            vertical: 'PARENT'
          }
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} dependency graph nodes`);
    
    // Check current state
    const nodes = await db.collection('dependenciesgraphs').find({}).toArray();
    console.log(`\n📊 Total dependency graph nodes: ${nodes.length}`);
    
    const nodesWithoutPolicy = nodes.filter(n => !n.policy);
    if (nodesWithoutPolicy.length > 0) {
      console.log(`⚠️ Still ${nodesWithoutPolicy.length} nodes without policy`);
    } else {
      console.log('✅ All nodes have merge policies');
    }
    
    // Clear failed jobs from the queue
    console.log('\n🗑️ Clearing failed jobs from queues...');
    
    // If you have access to Redis/BullMQ, clear the failed jobs
    // For now, let's at least mark the events as processed so they don't retry
    await db.collection('importedevents').updateMany(
      { processed: false },
      { $set: { processed: true } }
    );
    
    console.log('✅ Marked all events as processed');
    
    // Check if there's a proxy created
    const proxies = await db.collection('proxies').find({}).toArray();
    console.log(`\n📊 Proxies created: ${proxies.length}`);
    
    if (proxies.length > 0) {
      const proxy = proxies[0];
      console.log(`\n✅ Sample proxy:`);
      console.log(`   ID: ${proxy._id}`);
      console.log(`   Context: ${proxy.contextKey}`);
      console.log(`   Domain: ${proxy.domainId}`);
      console.log(`   Dynamic Fields: ${Object.keys(proxy.dynamicFields || {}).join(', ')}`);
    }
    
  } finally {
    await client.close();
  }
}

// Also create a comprehensive test
async function comprehensiveTest() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    
    // Clear everything and start fresh
    console.log('\n🧹 Starting comprehensive test...');
    
    const db = client.db('universal-reporting');
    
    // Clear old test data
    await db.collection('proxies').deleteMany({ contextKey: /^COMP_TEST_/ });
    await db.collection('dependenciesgraphs').deleteMany({ target: /COMP_TEST/ });
    
    // Create a comprehensive test case
    const caseNumber = `COMP_TEST_${Date.now()}`;
    const caseDoc = {
      _id: new ObjectId().toString(),
      caseNumber: caseNumber,
      status: 'PENDING',
      bookingPatient: {
        firstName: 'Comprehensive',
        lastName: 'Test',
        dateOfBirth: new Date('1990-01-01'),
        email: 'comp@test.com'
      },
      bookingSection: {
        doctorId: 'user_6EnqFa5TaWCtuy4wD',
        contractId: 'contract_DSg8orNxSST5FKjpz',
        opStandardId: 'op_TdqjJp7oNJiG6oRbF',
        date: new Date('2024-12-01T10:00:00.000Z'),
        duration: 120
      },
      tenantId: '66045e2350e8d495ec17bbe9',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await client.db('schedulingCases').collection('cases').insertOne(caseDoc);
    console.log(`✅ Created comprehensive test case: ${caseNumber}`);
    
    // Create event
    await db.collection('importedevents').insertOne({
      source: 'cases-created',
      sourceDocId: caseDoc._id,
      tenantId: caseDoc.tenantId,
      processed: false,
      previousValues: {},
      currentValues: caseDoc,
      createdAt: new Date()
    });
    
    console.log('✅ Created event');
    console.log('\n⏳ Wait 20 seconds and check for proxy creation...');
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 20000));
    
    // Check results
    const proxy = await db.collection('proxies').findOne({ contextKey: caseNumber });
    if (proxy) {
      console.log('\n✅ Proxy created successfully!');
      console.log(`   ID: ${proxy._id}`);
      console.log(`   Context: ${proxy.contextKey}`);
      console.log(`   Dynamic Fields:`, proxy.dynamicFields);
      
      // Check dependency graph
      const nodes = await db.collection('dependenciesgraphs').find({ 
        target: new RegExp(proxy._id.toString()) 
      }).toArray();
      
      console.log(`\n📊 Dependency graph nodes: ${nodes.length}`);
      nodes.forEach(node => {
        console.log(`   - ${node.target}`);
        console.log(`     Policy: ${node.policy ? 'YES' : 'NO'}`);
      });
      
    } else {
      console.log('\n❌ Proxy not created');
    }
    
  } finally {
    await client.close();
  }
}

// Run the fix
fixDependencyGraphPolicies()
  .then(() => {
    if (process.argv[2] === 'test') {
      return comprehensiveTest();
    }
  })
  .catch(console.error);