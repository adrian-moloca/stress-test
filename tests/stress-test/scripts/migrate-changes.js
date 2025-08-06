const { MongoClient } = require('mongodb');

async function addDefaultPolicyToNodes() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    
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
    
    console.log(`Updated ${result.modifiedCount} documents with default policy`);
  } finally {
    await client.close();
  }
}

addDefaultPolicyToNodes().catch(console.error);