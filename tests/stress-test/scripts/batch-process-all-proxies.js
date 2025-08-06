const { MongoClient } = require('mongodb');

async function batchProcessAllProxies() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    
    console.log('🚀 Batch Processing All Empty Proxies\n');
    
    const domain = await db.collection('domains').findOne({
      domainId: 'schedulingCases'
    });
    
    if (!domain) {
      console.log('❌ Domain not found!');
      return;
    }
    
    const batchSize = 100;
    let totalProcessed = 0;
    let totalFailed = 0;
    
    while (true) {
      const emptyProxies = await db.collection('proxies').find({
        domainId: 'schedulingCases',
        $or: [
          { dynamicFields: { $exists: false } },
          { dynamicFields: {} },
          { dynamicFields: null }
        ]
      }).limit(batchSize).toArray();
      
      if (emptyProxies.length === 0) {
        console.log('\n✅ No more empty proxies to process!');
        break;
      }
      
      console.log(`\nProcessing batch of ${emptyProxies.length} proxies...`);
      
      const updates = [];
      
      for (const proxy of emptyProxies) {
        try {
          const dynamicFields = {};
          
          for (const field of domain.proxyFields) {
            if (field.definition?.automaticValue) {
              const paths = field.definition.automaticValue.paths || [];
              let value = proxy.context;
              
              for (const path of paths) {
                value = value?.[path];
              }
              
              if (value !== undefined && value !== null) {
                dynamicFields[field.id] = value;
              }
            }
          }
          
          if (Object.keys(dynamicFields).length > 0) {
            updates.push({
              updateOne: {
                filter: { _id: proxy._id },
                update: { 
                  $set: { 
                    dynamicFields,
                    updatedAt: new Date()
                  } 
                }
              }
            });
          }
          
        } catch (error) {
          totalFailed++;
          console.error(`Failed to prepare update for ${proxy.contextKey}:`, error.message);
        }
      }
      
      if (updates.length > 0) {
        const result = await db.collection('proxies').bulkWrite(updates);
        totalProcessed += result.modifiedCount;
        console.log(`✅ Updated ${result.modifiedCount} proxies in this batch`);
      }
      
      console.log(`📊 Total processed so far: ${totalProcessed}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 BATCH PROCESSING COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Successfully processed: ${totalProcessed}`);
    console.log(`❌ Failed: ${totalFailed}`);
    
    const remaining = await db.collection('proxies').countDocuments({
      domainId: 'schedulingCases',
      $or: [
        { dynamicFields: { $exists: false } },
        { dynamicFields: {} }
      ]
    });
    
    console.log(`📋 Remaining empty proxies: ${remaining}`);
    
    console.log('\n🕸️ Creating dependency nodes...');
    await createDependencyNodes(db, domain);
    
  } finally {
    await client.close();
  }
}

async function createDependencyNodes(db, domain) {
  const proxiesWithFields = await db.collection('proxies').find({
    domainId: 'schedulingCases',
    dynamicFields: { $exists: true, $ne: {} }
  }).limit(100).toArray();
  
  let nodesCreated = 0;
  
  for (const proxy of proxiesWithFields) {
    for (const fieldId of Object.keys(proxy.dynamicFields)) {
      const nodeExists = await db.collection('dependencygraphnodes').findOne({
        target: `proxy.{${proxy._id}}.dynamicFields.${fieldId}`
      });
      
      if (!nodeExists) {
        await db.collection('dependencygraphnodes').insertOne({
          target: `proxy.{${proxy._id}}.dynamicFields.${fieldId}`,
          status: 'EVALUATED',
          entity: proxy._id,
          field: fieldId,
          value: proxy.dynamicFields[fieldId],
          dependencies: [],
          tenantId: proxy.tenantId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        nodesCreated++;
      }
    }
  }
  
  console.log(`✅ Created ${nodesCreated} dependency nodes`);
}

batchProcessAllProxies().catch(console.error);