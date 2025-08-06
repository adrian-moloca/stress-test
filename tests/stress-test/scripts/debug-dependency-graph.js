const { MongoClient } = require('mongodb');

async function debugDependencyGraph() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    
    console.log('🕸️ Debugging Dependency Graph System\n');
    
    const collections = await db.listCollections().toArray();
    const hasDepGraph = collections.some(c => c.name === 'dependencygraphnodes');
    
    console.log(`📊 Dependency Graph Collection Exists: ${hasDepGraph}`);
    
    if (!hasDepGraph) {
      console.log('   ⚠️  Creating collection...');
      await db.createCollection('dependencygraphnodes');
    }
    
    const nodeCount = await db.collection('dependencygraphnodes').countDocuments();
    console.log(`   Total Nodes: ${nodeCount}`);
    
    const fieldOps = await db.collection('fieldoperations').find({
      type: 'CREATE'
    }).limit(5).toArray();
    
    console.log(`\n🔧 Field Operations (should create nodes):`);
    fieldOps.forEach(op => {
      console.log(`   - ${op.field?.id || 'unknown'}: ${op.processed ? 'processed' : 'pending'}`);
    });
    
    const domain = await db.collection('domains').findOne({ domainId: 'schedulingCases' });
    
    if (domain && domain.proxyFields) {
      console.log(`\n📋 Domain Proxy Fields Configuration:`);
      console.log(`   Total Fields: ${domain.proxyFields.length}`);
      
      const fieldsWithExpressions = domain.proxyFields.filter(f => 
        f.definition?.automaticValue || f.definition?.condition
      );
      
      console.log(`   Fields with Expressions: ${fieldsWithExpressions.length}`);
      
      if (fieldsWithExpressions.length === 0) {
        console.log('   ⚠️  No fields have automatic values or conditions!');
        console.log('   This explains why no dependency nodes are created.');
      }
    }
    
    const recentProxy = await db.collection('proxies').findOne({
      createdAt: { $gte: new Date(Date.now() - 3600000) }
    });
    
    if (recentProxy) {
      console.log(`\n🔍 Recent Proxy Analysis:`);
      console.log(`   ID: ${recentProxy._id}`);
      console.log(`   Dynamic Fields: ${Object.keys(recentProxy.dynamicFields || {}).length}`);
      
      const expectedNodes = Object.keys(recentProxy.dynamicFields || {}).length;
      console.log(`   Expected Nodes: ${expectedNodes} (one per field)`);
    }
    
  } finally {
    await client.close();
  }
}

debugDependencyGraph().catch(console.error);