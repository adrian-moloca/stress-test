const { MongoClient, ObjectId } = require('mongodb');

async function setupTestConfigs() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    console.log('🔧 Setting up test configurations...\n');
    
    const urDb = client.db('universal-reporting');
    
    const tenantId = new ObjectId('66045e2350e8d495ec17bbe9');
    
    const existingConfig = await urDb.collection('jsonconfigs').findOne({ tenantId });
    
    if (existingConfig) {
      console.log('✅ Configuration already exists for tenant');
      return;
    }
    
    const testConfig = {
      _id: new ObjectId(),
      tenantId: tenantId,
      name: 'Test Billing Configuration',
      version: '1.0.0',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      domains: [{
        domainId: 'schedulingCases',
        domainName: {
          en: 'Scheduling Cases'
        },
        trigger: {
          name: {
            en: 'Case Creation Trigger'
          },
          eventType: 'cases-created',
          condition: {
            expressionKind: 'literalBoolean',
            value: true
          }
        },
        proxyFields: [
          {
            id: 'caseNumber',
            label: { en: 'Case Number' },
            type: 'string',
            required: true,
            value: {
              expressionKind: 'dotOperator',
              source: { expressionKind: 'symbolOperator', name: 'context' },
              paths: ['caseNumber']
            }
          },
          {
            id: 'category',
            label: { en: 'Category' },
            type: 'enum',
            required: true,
            options: ['A', 'B', 'C1', 'C2', 'C3', 'D', 'E', 'F', 'G'],
            value: {
              expressionKind: 'literalString',
              value: 'A'
            }
          }
        ],
        invoiceTypes: []
      }]
    };
    
    await urDb.collection('jsonconfigs').insertOne(testConfig);
    console.log('✅ Created test billing configuration');
    
    const casesDb = client.db('scheduling-cases');
    const collections = await casesDb.listCollections({ name: 'cases' }).toArray();
    
    if (collections.length === 0) {
      await casesDb.createCollection('cases');
      console.log('✅ Created cases collection');
    }
    
  } catch (error) {
    console.error('❌ Failed to setup test configs:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  setupTestConfigs();
}

module.exports = setupTestConfigs;