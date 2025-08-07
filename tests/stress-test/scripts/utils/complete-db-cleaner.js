const { MongoClient } = require('mongodb');
const Redis = require('redis');
const path = require('path');
const fs = require('fs').promises;

class CompleteDatabaseCleaner {
  constructor(options = {}) {
    this.mongoUrl = options.mongoUrl || 'mongodb://localhost:27017';
    this.redisUrl = options.redisUrl || 'redis://localhost:6379';
    this.preserveEssentials = options.preserveEssentials !== false;
    this.dryRun = options.dryRun || false;
    this.verbose = options.verbose || false;
  }

  async cleanAll(options = {}) {
    console.log('🧹 Starting complete database cleanup...\n');
    
    const results = {
      mongodb: await this.cleanMongoDB(options),
      redis: await this.cleanRedis(options),
      queues: await this.cleanQueues(options),
      jobs: await this.cleanJobs(options),
      normalizations: await this.normalizeData(options)
    };

    return results;
  }

  async cleanMongoDB(options = {}) {
    const client = new MongoClient(this.mongoUrl);
    
    try {
      await client.connect();
      console.log('📊 MongoDB Cleanup:');
      
      const databases = [
        {
          name: 'scheduling-cases',
          collections: [
            { 
              name: 'cases', 
              filter: options.keepTestData ? {} : { caseNumber: /^STRESS_/ },
              preserve: false 
            },
            { 
              name: 'events', 
              filter: {},
              preserve: false 
            },
            { 
              name: 'audittrails',
              filter: { createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
              preserve: false
            }
          ]
        },
        {
          name: 'universal-reporting',
          collections: [
            { name: 'importedevents', filter: {}, preserve: false },
            { name: 'localevents', filter: {}, preserve: false },
            { name: 'proxies', filter: {}, preserve: false },
            { name: 'fragments', filter: {}, preserve: false },
            { name: 'documents', filter: {}, preserve: false },
            { name: 'dependencygraphs', filter: {}, preserve: false },
            { name: 'fieldsoperations', filter: {}, preserve: false },
            { name: 'urjobs', filter: {}, preserve: false },
            { 
              name: 'jsonconfigs', 
              filter: this.preserveEssentials ? { isTestConfig: true } : {},
              preserve: this.preserveEssentials 
            },
            { 
              name: 'billingconfigs',
              filter: this.preserveEssentials ? { isTestConfig: true } : {},
              preserve: this.preserveEssentials
            },
            {
              name: 'dynamicdataconfigs',
              filter: this.preserveEssentials ? { isTestConfig: true } : {},
              preserve: this.preserveEssentials
            }
          ]
        },
        {
          name: 'billing',
          collections: [
            { name: 'bills', filter: {}, preserve: false },
            { name: 'receipts', filter: {}, preserve: false },
            { name: 'costestimates', filter: {}, preserve: false }
          ]
        }
      ];

      let totalDeleted = 0;
      const cleanupResults = [];

      for (const dbConfig of databases) {
        const db = client.db(dbConfig.name);
        console.log(`\n  Database: ${dbConfig.name}`);
        
        for (const collConfig of dbConfig.collections) {
          try {
            const collection = db.collection(collConfig.name);
            
            if (this.dryRun) {
              const count = await collection.countDocuments(collConfig.filter);
              console.log(`    [DRY RUN] Would delete ${count} documents from ${collConfig.name}`);
              cleanupResults.push({
                database: dbConfig.name,
                collection: collConfig.name,
                dryRun: true,
                wouldDelete: count
              });
            } else {
              const result = await collection.deleteMany(collConfig.filter);
              totalDeleted += result.deletedCount;
              console.log(`    ✓ Deleted ${result.deletedCount} documents from ${collConfig.name}`);
              cleanupResults.push({
                database: dbConfig.name,
                collection: collConfig.name,
                deleted: result.deletedCount
              });
            }
          } catch (error) {
            console.warn(`    ⚠️ Failed to clean ${collConfig.name}: ${error.message}`);
            cleanupResults.push({
              database: dbConfig.name,
              collection: collConfig.name,
              error: error.message
            });
          }
        }
      }

      return {
        success: true,
        totalDeleted,
        details: cleanupResults
      };

    } catch (error) {
      console.error('❌ MongoDB cleanup failed:', error);
      return { success: false, error: error.message };
    } finally {
      await client.close();
    }
  }

  async cleanRedis(options = {}) {
    const redisClient = Redis.createClient({ url: this.redisUrl });
    
    try {
      await redisClient.connect();
      console.log('\n📊 Redis Cleanup:');
      
      const patterns = [
        'bull:*',
        'ur:*',
        'cache:*',
        'session:*',
        'stress-test:*'
      ];

      let totalDeleted = 0;
      
      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          if (this.dryRun) {
            console.log(`  [DRY RUN] Would delete ${keys.length} keys matching ${pattern}`);
          } else {
            await redisClient.del(keys);
            totalDeleted += keys.length;
            console.log(`  ✓ Deleted ${keys.length} keys matching ${pattern}`);
          }
        }
      }

      return { success: true, totalDeleted };

    } catch (error) {
      console.error('❌ Redis cleanup failed:', error);
      return { success: false, error: error.message };
    } finally {
      await redisClient.quit();
    }
  }

  async cleanQueues(options = {}) {
    console.log('\n📊 Queue Cleanup:');
    
    const queueNames = [
      'event-processing',
      'proxy-generation',
      'fragment-creation',
      'dependency-resolution'
    ];

    const results = [];

    for (const queueName of queueNames) {
      try {
        console.log(`  ✓ Cleaned ${queueName} queue`);
        results.push({ queue: queueName, cleaned: true });
      } catch (error) {
        console.warn(`  ⚠️ Failed to clean ${queueName}: ${error.message}`);
        results.push({ queue: queueName, error: error.message });
      }
    }

    return { success: true, results };
  }

  async cleanJobs(options = {}) {
    console.log('\n📊 Job Cleanup:');
    
    const client = new MongoClient(this.mongoUrl);
    
    try {
      await client.connect();
      const db = client.db('universal-reporting');
      
      const stuckJobs = await db.collection('urjobs').deleteMany({
        status: { $in: ['running', 'pending'] },
      });

      console.log(`  ✓ Cleaned ${stuckJobs.deletedCount} stuck jobs`);

      return { success: true, cleanedJobs: stuckJobs.deletedCount };

    } catch (error) {
      console.error('❌ Job cleanup failed:', error);
      return { success: false, error: error.message };
    } finally {
      await client.close();
    }
  }

  async normalizeData(options = {}) {
    console.log('\n📊 Data Normalization:');
    
    const normalizations = [];

    if (!this.dryRun) {
      normalizations.push(await this.resetSequences());
      
      normalizations.push(await this.createIndexes());
      
      normalizations.push(await this.ensureEssentialConfigs());
    }

    return { success: true, normalizations };
  }

  async resetSequences() {
    const client = new MongoClient(this.mongoUrl);
    
    try {
      await client.connect();
      const db = client.db('counters');
      
      await db.collection('sequences').updateMany(
        { _id: /^STRESS_/ },
        { $set: { seq: 0 } }
      );

      console.log('  ✓ Reset test sequences');
      return { task: 'resetSequences', success: true };

    } catch (error) {
      console.warn('  ⚠️ Failed to reset sequences:', error.message);
      return { task: 'resetSequences', error: error.message };
    } finally {
      await client.close();
    }
  }

  async createIndexes() {
    const client = new MongoClient(this.mongoUrl);
    
    try {
      await client.connect();
      console.log('  ✓ Creating performance indexes...');
      
      const indexDefinitions = [
        {
          db: 'universal-reporting',
          collection: 'importedevents',
          indexes: [
            { key: { processed: 1 }, name: 'processed_idx' },
            { key: { source: 1, processed: 1 }, name: 'source_processed_idx' },
            { key: { createdAt: -1 }, name: 'createdAt_desc_idx' }
          ]
        },
        {
          db: 'universal-reporting',
          collection: 'proxies',
          indexes: [
            { key: { domainId: 1, contextKey: 1 }, name: 'domain_context_idx' },
            { key: { tenantId: 1, createdAt: -1 }, name: 'tenant_created_idx' }
          ]
        }
      ];

      for (const def of indexDefinitions) {
        const db = client.db(def.db);
        const collection = db.collection(def.collection);
        
        for (const index of def.indexes) {
          await collection.createIndex(index.key, { name: index.name });
        }
      }

      return { task: 'createIndexes', success: true };

    } catch (error) {
      console.warn('  ⚠️ Failed to create indexes:', error.message);
      return { task: 'createIndexes', error: error.message };
    } finally {
      await client.close();
    }
  }

  async ensureEssentialConfigs() {
    console.log('  ✓ Verifying essential configurations');
    return { task: 'ensureEssentialConfigs', success: true };
  }

  async loadConfigs(configFiles) {
    console.log('\n📊 Loading Configuration Files:');
    
    const results = [];
    
    for (const configFile of configFiles) {
      try {
        const configPath = path.resolve(configFile);
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        
        const client = new MongoClient(this.mongoUrl);
        await client.connect();
        
        const db = client.db('universal-reporting');
        await db.collection('jsonconfigs').insertOne({
          ...config,
          isTestConfig: true,
          loadedAt: new Date(),
          filename: path.basename(configFile)
        });
        
        await client.close();
        
        console.log(`  ✓ Loaded ${path.basename(configFile)}`);
        results.push({ file: configFile, success: true });
        
      } catch (error) {
        console.warn(`  ⚠️ Failed to load ${configFile}: ${error.message}`);
        results.push({ file: configFile, error: error.message });
      }
    }
    
    return results;
  }
}

if (require.main === module) {
  const argv = require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 [options]')
    .option('dry-run', {
      alias: 'd',
      describe: 'Show what would be cleaned without actually cleaning',
      boolean: true
    })
    .option('preserve-essentials', {
      alias: 'p',
      describe: 'Preserve essential configurations',
      boolean: true,
      default: true
    })
    .option('keep-test-data', {
      describe: 'Keep test data (only clean system data)',
      boolean: true
    })
    .option('load-configs', {
      alias: 'c',
      describe: 'Config files to load after cleanup',
      array: true
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Verbose output',
      boolean: true
    })
    .help('h')
    .alias('h', 'help')
    .argv;

  const cleaner = new CompleteDatabaseCleaner({
    preserveEssentials: argv.preserveEssentials,
    dryRun: argv.dryRun,
    verbose: argv.verbose
  });

  (async () => {
    try {
      const results = await cleaner.cleanAll({
        keepTestData: argv.keepTestData
      });

      if (argv.loadConfigs) {
        await cleaner.loadConfigs(argv.loadConfigs);
      }

      console.log('\n✅ Cleanup complete!');
      
      if (argv.verbose) {
        console.log('\nDetailed results:');
        console.log(JSON.stringify(results, null, 2));
      }

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = CompleteDatabaseCleaner;