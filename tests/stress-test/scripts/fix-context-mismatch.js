const { MongoClient } = require('mongodb');

async function fixContextMismatch() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    
    console.log('🔧 Fixing context mismatch in domain configuration\n');
    
    const domain = await db.collection('domains').findOne({
      domainId: 'schedulingCases'
    });
    
    if (!domain) {
      console.log('❌ Domain not found!');
      return;
    }
    
    console.log('Current trigger context: ' + domain.trigger?.contextKey?.source?.name);
    
    const updatedFields = domain.proxyFields.map(field => {
      if (field.definition?.automaticValue?.source?.name === 'context') {
        field.definition.automaticValue.source.name = 'currentValues';
      }
      return field;
    });
    
    await db.collection('domains').updateOne(
      { domainId: 'schedulingCases' },
      { 
        $set: { 
          'proxyFields': updatedFields,
          'updatedAt': new Date()
        } 
      }
    );
    
    console.log('✅ Updated proxy fields to use currentValues');
    
    const fieldOps = await db.collection('fieldoperations').find({
      domainId: 'schedulingCases',
      processed: false
    }).toArray();
    
    console.log(`\n🔧 Found ${fieldOps.length} unprocessed field operations`);
    
    for (const op of fieldOps) {
      const proxyField = domain.proxyFields.find(f => f.id === op.field?.id);
      
      if (proxyField && !op.field.definition) {
        await db.collection('fieldoperations').updateOne(
          { _id: op._id },
          { 
            $set: { 
              'field': proxyField,
              'updatedAt': new Date()
            } 
          }
        );
        console.log(`   ✅ Fixed field operation for ${op.field.id}`);
      }
    }
    
    console.log('\n✅ Context mismatch fixed!');
    
  } finally {
    await client.close();
  }
}

fixContextMismatch().catch(console.error);