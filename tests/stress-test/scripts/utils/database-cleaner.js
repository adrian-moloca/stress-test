const { MongoClient } = require('mongodb');

class DatabaseCleaner {
  constructor(options = {}) {
    this.mongoUrl = options.mongoUrl || 'mongodb://localhost:27017';
    this.testPrefix = options.testPrefix || 'STRESS_';
    this.dryRun = options.dryRun || false;
  }

  async clean() {
    const client = new MongoClient(this.mongoUrl);
    
    try {
      await client.connect();
      console.log('🧹 Starting database cleanup...');

      const cleanupOperations = [
        {
          db: 'schedulingCases',
          collections: [
            { name: 'cases', filter: { caseNumber: new RegExp(`^${this.testPrefix}`) } },
            { name: 'caselastupdates', filter: { caseNumber: new RegExp(`^${this.testPrefix}`) } }
          ]
        },
        {
          db: 'patientAnagraphics',
          collections: [
            { name: 'patients', filter: { 
              $or: [
                { name: new RegExp(`^${this.testPrefix}`) },
                { 'createdAt': { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
              ]
            }}
          ]
        },
        {
          db: 'universal-reporting',
          collections: [
            { name: 'importedevents', filter: { source: 'cases-created', processed: false } },
            { name: 'proxies', filter: { 'context.caseNumber': new RegExp(`^${this.testPrefix}`) } },
            { name: 'fragments', filter: { 'proxy.caseNumber': new RegExp(`^${this.testPrefix}`) } },
            { name: 'documents', filter: { 'proxy.caseNumber': new RegExp(`^${this.testPrefix}`) } }
          ]
        },
        {
          db: 'billing',
          collections: [
            { name: 'bills', filter: { caseNumber: new RegExp(`^${this.testPrefix}`) } }
          ]
        },
        {
          db: 'logs',
          collections: [
            { 
              name: 'logs', 
              filter: { 
                component: { $in: ['SCHEDULING_CASES', 'UNIVERSAL_REPORTING', 'BILLING'] },
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
              } 
            }
          ]
        }
      ];

      let totalDeleted = 0;

      for (const dbOp of cleanupOperations) {
        const db = client.db(dbOp.db);
        
        for (const collOp of dbOp.collections) {
          try {
            const collection = db.collection(collOp.name);
            
            if (this.dryRun) {
              const count = await collection.countDocuments(collOp.filter);
              console.log(`   [DRY RUN] Would delete ${count} documents from ${dbOp.db}.${collOp.name}`);
            } else {
              const result = await collection.deleteMany(collOp.filter);
              totalDeleted += result.deletedCount;
              console.log(`   ✓ Deleted ${result.deletedCount} documents from ${dbOp.db}.${collOp.name}`);
            }
          } catch (error) {
            console.warn(`   ⚠️ Failed to clean ${dbOp.db}.${collOp.name}: ${error.message}`);
          }
        }
      }

      console.log(`\n✅ Cleanup complete. Total documents deleted: ${totalDeleted}`);
      return { success: true, documentsDeleted: totalDeleted };

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return { success: false, error: error.message };
    } finally {
      await client.close();
    }
  }

  async normalizeDatabase() {
    console.log('🔧 Normalizing database...');
    
    // Reset sequences, counters, etc.
    // Implementation depends on your specific needs
  }
}

module.exports = DatabaseCleaner;