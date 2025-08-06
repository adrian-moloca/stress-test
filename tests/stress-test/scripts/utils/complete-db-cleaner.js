const { MongoClient } = require('mongodb');

class CompleteDatabaseCleaner {
  constructor(options = {}) {
    this.mongoUrl = options.mongoUrl || 'mongodb://localhost:27017';
    this.preserveEssentials = options.preserveEssentials !== false;
    this.verbose = options.verbose || false;
  }

  async clean() {
    const client = new MongoClient(this.mongoUrl);
    
    try {
      await client.connect();
      console.log('🗄️  Starting complete database cleanup...\n');

      const cleanupPlan = this.getCleanupPlan();
      
      let totalDeleted = 0;
      let totalPreserved = 0;

      for (const dbConfig of cleanupPlan) {
        console.log(`📁 Database: ${dbConfig.name}`);
        const db = client.db(dbConfig.name);
        
        for (const collection of dbConfig.collections) {
          const result = await this.cleanCollection(
            db, 
            collection.name, 
            collection.filter,
            collection.preserve
          );
          
          totalDeleted += result.deleted;
          totalPreserved += result.preserved;
        }
        console.log('');
      }

      console.log(`✅ Cleanup complete!`);
      console.log(`   📊 Total deleted: ${totalDeleted} documents`);
      console.log(`   💾 Total preserved: ${totalPreserved} documents`);
      
      return { 
        success: true, 
        deleted: totalDeleted, 
        preserved: totalPreserved 
      };

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return { success: false, error: error.message };
    } finally {
      await client.close();
    }
  }

  getCleanupPlan() {
    return [
      {
        name: 'schedulingCases',
        collections: [
          {
            name: 'cases',
            filter: {},
            preserve: false
          },
          {
            name: 'caselastupdates',
            filter: {},
            preserve: false
          },
          {
            name: 'casebackups',
            filter: {},
            preserve: false
          }
        ]
      },
      {
        name: 'patientAnagraphics',
        collections: [
          {
            name: 'patients',
            filter: {},
            preserve: false
          }
        ]
      },
      {
        name: 'universal-reporting',
        collections: [
          {
            name: 'importedevents',
            filter: {},
            preserve: false
          },
          {
            name: 'proxies',
            filter: {},
            preserve: false
          },
          {
            name: 'fragments',
            filter: {},
            preserve: false
          },
          {
            name: 'documents',
            filter: {},
            preserve: false
          },
          {
            name: 'dependencygraphs',
            filter: {},
            preserve: false
          },
          {
            name: 'fieldsoperations',
            filter: {},
            preserve: false
          },
          {
            name: 'jsonconfigs',
            filter: {},
            preserve: this.preserveEssentials
          },
          {
            name: 'billingconfigs',
            filter: {},
            preserve: this.preserveEssentials
          },
          {
            name: 'dynamicdataconfigs',
            filter: {},
            preserve: this.preserveEssentials
          }
        ]
      },
      {
        name: 'billing',
        collections: [
          {
            name: 'bills',
            filter: {},
            preserve: false
          },
          {
            name: 'billingqueues',
            filter: {},
            preserve: false
          },
          {
            name: 'receipts',
            filter: {},
            preserve: false
          },
          {
            name: 'costestimates',
            filter: {},
            preserve: false
          }
        ]
      },
      {
        name: 'logs',
        collections: [
          {
            name: 'logs',
            filter: {},
            preserve: false
          },
          {
            name: 'audittrails',
            filter: {
              createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            },
            preserve: false
          }
        ]
      },
      {
        name: 'system',
        collections: [
          {
            name: 'systemconfigurations',
            filter: {},
            preserve: true
          },
          {
            name: 'tenants',
            filter: {},
            preserve: true
          },
          {
            name: 'capabilities',
            filter: {},
            preserve: true
          }
        ]
      },
      {
        name: 'auth',
        collections: [
          {
            name: 'users',
            filter: {},
            preserve: true
          },
          {
            name: 'roles',
            filter: {},
            preserve: true
          },
          {
            name: 'sessions',
            filter: {},
            preserve: false
          }
        ]
      },
      {
        name: 'contracts',
        collections: [
          {
            name: 'contracts',
            filter: {},
            preserve: true
          },
          {
            name: 'contractversions',
            filter: {},
            preserve: true
          }
        ]
      },
      {
        name: 'anagraphics',
        collections: [
          {
            name: 'doctors',
            filter: {},
            preserve: true
          },
          {
            name: 'opstandards',
            filter: {},
            preserve: true
          },
          {
            name: 'materialsdatabase',
            filter: {},
            preserve: true
          },
          {
            name: 'publicinsurances',
            filter: {},
            preserve: true
          },
          {
            name: 'privateinsurances',
            filter: {},
            preserve: true
          },
          {
            name: 'bginsurances',
            filter: {},
            preserve: true
          }
        ]
      }
    ];
  }

  async cleanCollection(db, collectionName, filter = {}, preserve = false) {
    try {
      const collection = db.collection(collectionName);
      
      // Check if collection exists
      const collections = await db.listCollections({ name: collectionName }).toArray();
      if (collections.length === 0) {
        if (this.verbose) {
          console.log(`   ⚪ ${collectionName}: Collection doesn't exist`);
        }
        return { deleted: 0, preserved: 0 };
      }

      if (preserve) {
        const count = await collection.countDocuments();
        console.log(`   💾 ${collectionName}: Preserved ${count} documents`);
        return { deleted: 0, preserved: count };
      }

      const countBefore = await collection.countDocuments();
      const result = await collection.deleteMany(filter);
      
      console.log(`   🗑️  ${collectionName}: Deleted ${result.deletedCount}/${countBefore} documents`);
      
      return { 
        deleted: result.deletedCount, 
        preserved: countBefore - result.deletedCount 
      };
      
    } catch (error) {
      console.error(`   ❌ ${collectionName}: Error - ${error.message}`);
      return { deleted: 0, preserved: 0 };
    }
  }

  async resetSequences(client) {
    console.log('\n🔢 Resetting sequences and counters...');
    
    const counters = client.db('system').collection('counters');
    
    const counterResets = [
      { _id: 'caseNumber', seq: 1000 },
      { _id: 'patientNumber', seq: 5000 },
      { _id: 'billNumber', seq: 0 },
      { _id: 'receiptNumber', seq: 0 }
    ];

    for (const counter of counterResets) {
      await counters.updateOne(
        { _id: counter._id },
        { $set: { seq: counter.seq } },
        { upsert: true }
      );
      console.log(`   ✓ Reset ${counter._id} to ${counter.seq}`);
    }
  }
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const options = {
    preserveEssentials: !argv.includes('--no-preserve'),
    verbose: argv.includes('--verbose')
  };

  const cleaner = new CompleteDatabaseCleaner(options);
  
  cleaner.clean()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = CompleteDatabaseCleaner;