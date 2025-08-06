const { MongoClient } = require('mongodb');

class EventIndexer {
  constructor(mongoUrl) {
    this.mongoUrl = mongoUrl || 'mongodb://localhost:27017';
    this.client = null;
  }

  async connect() {
    this.client = new MongoClient(this.mongoUrl);
    await this.client.connect();
  }

  async createEventIndexes() {
    const db = this.client.db('universal-reporting');
    const collection = db.collection('importedevents');

    try {
      const existingIndexes = await collection.indexes();
      console.log(`   Found ${existingIndexes.length} existing indexes`);

      const desiredIndexes = [
        { key: { processed: 1 }, name: 'processed_1' },
        { key: { source: 1, processed: 1 }, name: 'source_1_processed_1' },
        { key: { sourceDocId: 1 }, name: 'sourceDocId_1' },
        { key: { createdAt: -1 }, name: 'createdAt_-1' },
        { key: { tenantId: 1, processed: 1 }, name: 'tenantId_1_processed_1' }
      ];

      for (const desiredIndex of desiredIndexes) {
        const conflictingIndex = existingIndexes.find(existing => {
          if (existing.name === desiredIndex.name) return false;
          
          const existingKeys = Object.keys(existing.key || {}).sort().join(',');
          const desiredKeys = Object.keys(desiredIndex.key).sort().join(',');
          
          return existingKeys === desiredKeys;
        });

        if (conflictingIndex) {
          console.log(`   ⚠️  Dropping conflicting index: ${conflictingIndex.name}`);
          try {
            await collection.dropIndex(conflictingIndex.name);
          } catch (dropError) {
            console.log(`   ⚠️  Could not drop index ${conflictingIndex.name}: ${dropError.message}`);
          }
        }
      }

      for (const index of desiredIndexes) {
        try {
          const exists = existingIndexes.some(existing => existing.name === index.name);
          
          if (!exists) {
            await collection.createIndex(index.key, { name: index.name });
            console.log(`   ✅ Created index: ${index.name}`);
          } else {
            console.log(`   ✓ Index already exists: ${index.name}`);
          }
        } catch (error) {
          if (error.code === 85) {
            console.log(`   ⚠️  Index conflict for ${index.name}, skipping...`);
          } else {
            throw error;
          }
        }
      }

      console.log('   ✅ Event indexes setup completed');
    } catch (error) {
      console.error('   ❌ Error creating indexes:', error.message);
      throw error;
    }
  }

  async dropAllIndexes() {
    const db = this.client.db('universal-reporting');
    const collection = db.collection('importedevents');

    try {
      const indexes = await collection.indexes();
      
      for (const index of indexes) {
        if (index.name !== '_id_') {
          await collection.dropIndex(index.name);
          console.log(`   Dropped index: ${index.name}`);
        }
      }
    } catch (error) {
      console.error('Error dropping indexes:', error);
    }
  }

  async getEventStats() {
    const db = this.client.db('universal-reporting');
    const collection = db.collection('importedevents');

    const stats = await collection.aggregate([
      {
        $group: {
          _id: {
            source: '$source',
            processed: '$processed'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.source',
          stats: {
            $push: {
              processed: '$_id.processed',
              count: '$count'
            }
          },
          total: { $sum: '$count' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]).toArray();

    return stats;
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

module.exports = EventIndexer;