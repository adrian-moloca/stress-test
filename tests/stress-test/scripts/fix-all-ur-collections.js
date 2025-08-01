// scripts/fix-ur-all-collections.js
const { MongoClient, ObjectId } = require('mongodb');

async function fixURAllCollections() {
  const client = new MongoClient('mongodb://localhost:27017');
  const tenantId = '66045e2350e8d495ec17bbe9';
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('universal-reporting');
    
    // Clear everything
    console.log('\n🗑️ Clearing all UR collections...');
    const collections = [
      'jsonconfigs', 'billingconfigs', 'dynamicdataconfigs',
      'domains', 'urdomains', 'domainspermissions'
    ];
    
    for (const col of collections) {
      const result = await db.collection(col).deleteMany({});
      console.log(`  - ${col}: deleted ${result.deletedCount}`);
    }
    
    const configId = new ObjectId();
    const now = new Date();
    
    // Domain configuration
    const domainConfig = {
      domainId: 'schedulingCases',
      domainName: { en: 'Scheduling Cases' },
      domainDescription: { en: 'Domain for scheduling case proxies' },
      trigger: {
        name: { en: 'Case Creation Trigger' },
        description: { en: 'Triggers when a new case is created' },
        eventType: 'cases-created',
        condition: {
          expressionKind: 'literalBoolean',
          value: true,
          typeHint: { kind: 'boolean' }
        },
        emitExpression: {
          expressionKind: 'objectOfExpressions',
          value: {
            caseNumber: {
              expressionKind: 'dotOperator',
              paths: ['caseNumber'],
              source: {
                expressionKind: 'symbolOperator',
                name: 'currentValues'
              }
            }
          }
        },
        contextKey: {
          expressionKind: 'dotOperator',
          paths: ['caseNumber'],
          source: {
            expressionKind: 'symbolOperator',
            name: 'currentValues'
          }
        }
      },
      proxyFields: [{
        id: 'caseNumber',
        name: { en: 'Case Number' },
        description: { en: 'The unique case number' },
        definition: {
          type: { kind: 'string' },
          readable: {
            expressionKind: 'literalBoolean',
            value: true,
            typeHint: { kind: 'boolean' }
          },
          writable: {
            expressionKind: 'literalBoolean',
            value: false,
            typeHint: { kind: 'boolean' }
          },
          automaticValue: {
            expressionKind: 'selfOperator',
            paths: ['context', 'caseNumber']
          },
          mergePolicies: {
            horizontal: 'OVERWRITE',
            vertical: 'CHILD'
          }
        },
        version: '1.0'
      }],
      canAccessProxies: {
        expressionKind: 'literalBoolean',
        value: true,
        typeHint: { kind: 'boolean' }
      },
      canAccessProxyDetails: {
        expressionKind: 'literalBoolean',
        value: true,
        typeHint: { kind: 'boolean' }
      },
      canEditProxy: {
        expressionKind: 'literalBoolean',
        value: true,
        typeHint: { kind: 'boolean' }
      }
    };
    
    // 1. Create jsonconfig
    const jsonConfigDoc = {
      _id: configId,
      version: 'latest',
      tenantId: tenantId,
      data: {
        version: 'latest',
        billingConfig: {
          domains: [domainConfig]
        },
        dynamicData: {
          anagraphics: {},
          users: {},
          contracts: {}
        }
      },
      createdAt: now,
      updatedAt: now
    };
    
    await db.collection('jsonconfigs').insertOne(jsonConfigDoc);
    console.log('\n✅ Created jsonconfig');
    
    // 2. Create billingconfig
    await db.collection('billingconfigs').insertOne({
      _id: new ObjectId(),
      versionRef: configId,
      version: 'latest',
      tenantId: tenantId,
      data: {
        domains: [domainConfig]
      },
      createdAt: now,
      updatedAt: now
    });
    console.log('✅ Created billingconfig');
    
    // 3. Create dynamicdataconfig
    await db.collection('dynamicdataconfigs').insertOne({
      _id: new ObjectId(),
      versionRef: configId,
      version: 'latest',
      tenantId: tenantId,
      data: {
        anagraphics: {},
        users: {},
        contracts: {}
      },
      createdAt: now,
      updatedAt: now
    });
    console.log('✅ Created dynamicdataconfig');
    
    // 4. Create domain
    const domainDoc = {
      _id: new ObjectId(),
      ...domainConfig,
      tenantId: tenantId,
      createdAt: now,
      updatedAt: now
    };
    
    await db.collection('domains').insertOne(domainDoc);
    console.log('✅ Created domain');
    
    // 5. Create domain permissions (this might be what's missing!)
    await db.collection('domainspermissions').insertOne({
      _id: new ObjectId(),
      domainId: 'schedulingCases',
      tenantId: tenantId,
      permissions: {
        canAccessProxies: true,
        canAccessProxyDetails: true,
        canEditProxy: true
      },
      createdAt: now,
      updatedAt: now
    });
    console.log('✅ Created domain permissions');
    
    // Clear Redis cache if exists
    console.log('\n🧹 Clearing potential caches...');
    try {
      const Redis = require('ioredis');
      const redis = new Redis({ host: 'localhost', port: 6380 });
      await redis.flushall();
      await redis.quit();
      console.log('✅ Redis cache cleared');
    } catch (e) {
      console.log('⚠️  Could not clear Redis cache');
    }
    
    console.log('\n✅ All collections fixed!');
    
  } finally {
    await client.close();
  }
}

fixURAllCollections();