const { MongoClient } = require('mongodb');

async function fixIndexes() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    const collection = db.collection('importedevents');
    
    console.log('🔧 Fixing indexes...');
    
    const indexes = await collection.indexes();
    console.log(`Found ${indexes.length} indexes`);
    
    for (const index of indexes) {
      if (index.name !== '_id_') {
        console.log(`Dropping: ${index.name}`);
        try {
          await collection.dropIndex(index.name);
        } catch (error) {
          console.log(`Could not drop ${index.name}: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Indexes cleared');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  fixIndexes();
}

module.exports = { fixIndexes };