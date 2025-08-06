const { MongoClient } = require('mongodb');

async function addIndexes() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    
    console.log('🔧 Adding critical indexes...\n');
    
    console.log('📨 ImportedEvents indexes:');
    await db.collection('importedevents').createIndex(
      { processed: 1, createdAt: -1 },
      { name: 'processed_createdAt' }
    );
    console.log('   ✅ processed_createdAt');
    
    await db.collection('importedevents').createIndex(
      { source: 1, processed: 1 },
      { name: 'source_processed' }
    );
    console.log('   ✅ source_processed');
    
    console.log('\n🎯 Proxies indexes:');
    await db.collection('proxies').createIndex(
      { domainId: 1, contextKey: 1 },
      { name: 'domainId_contextKey' }
    );
    console.log('   ✅ domainId_contextKey');
    
    await db.collection('proxies').createIndex(
      { tenantId: 1, createdAt: -1 },
      { name: 'tenantId_createdAt' }
    );
    console.log('   ✅ tenantId_createdAt');
    
    console.log('\n🕸️ DependencyGraphNodes indexes:');
    await db.collection('dependencygraphnodes').createIndex(
      { status: 1, entity: 1 },
      { name: 'status_entity' }
    );
    console.log('   ✅ status_entity');
    
    await db.collection('dependencygraphnodes').createIndex(
      { target: 1 },
      { name: 'target' }
    );
    console.log('   ✅ target');
    
    console.log('\n✅ All indexes created successfully!');
    
  } finally {
    await client.close();
  }
}

addIndexes().catch(console.error);