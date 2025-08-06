const { MongoClient } = require('mongodb');

async function checkDomainConfig() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    
    console.log('🔍 Checking UR Domain Configuration\n');
    
    const domains = await db.collection('domains').find({}).toArray();
    console.log(`📋 Found ${domains.length} domains:`);
    
    domains.forEach(domain => {
      console.log(`\n🎯 Domain: ${domain.domainId}`);
      console.log(`   Name: ${domain.domainName}`);
      console.log(`   Proxy Fields: ${domain.proxyFields?.length || 0}`);
      
      if (domain.proxyFields && domain.proxyFields.length > 0) {
        console.log('   Fields:');
        domain.proxyFields.forEach(field => {
          console.log(`     - ${field.id}: ${field.name?.en || 'unnamed'}`);
        });
      }
    });
    
    const fieldOps = await db.collection('fieldoperations').find({
      processed: false
    }).limit(10).toArray();
    
    console.log(`\n🔧 Unprocessed Field Operations: ${fieldOps.length}`);
    
    const triggers = await db.collection('triggers').find({}).toArray();
    console.log(`\n⚡ Triggers: ${triggers.length}`);
    
    const sampleProxy = await db.collection('proxies').findOne({
      createdAt: { $gte: new Date(Date.now() - 3600000) }
    });
    
    if (sampleProxy) {
      console.log('\n📦 Sample Recent Proxy:');
      console.log(`   ID: ${sampleProxy._id}`);
      console.log(`   Domain: ${sampleProxy.domainId}`);
      console.log(`   Context Key: ${sampleProxy.contextKey}`);
      console.log(`   Dynamic Fields: ${Object.keys(sampleProxy.dynamicFields || {}).join(', ')}`);
      console.log(`   Fragments: ${Object.keys(sampleProxy.fragments || {}).join(', ') || 'none'}`);
    }
    
  } finally {
    await client.close();
  }
}

checkDomainConfig().catch(console.error);