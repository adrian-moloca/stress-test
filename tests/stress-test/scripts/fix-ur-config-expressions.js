// scripts/fix-ur-config-expressions.js
const { MongoClient, ObjectId } = require('mongodb');

async function fixURConfigExpressions() {
  const client = new MongoClient('mongodb://localhost:27017');
  const tenantId = '66045e2350e8d495ec17bbe9';
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('universal-reporting');
    
    // Clear everything first
    console.log('\n🗑️ Clearing all configurations...');
    await db.collection('jsonconfigs').deleteMany({});
    await db.collection('billingconfigs').deleteMany({});
    await db.collection('dynamicdataconfigs').deleteMany({});
    await db.collection('domains').deleteMany({});
    await db.collection('urdomains').deleteMany({});
    await db.collection('proxies').deleteMany({});
    await db.collection('fieldoperations').deleteMany({});
    
    const configId = new ObjectId();
    const now = new Date();
    
    // Simplified domain configuration with correct expressions
    const domainConfig = {
      domainId: 'schedulingCases',
      domainName: { 
        en: 'Scheduling Cases'
      },
      domainDescription: { 
        en: 'Domain for scheduling case proxies'
      },
      trigger: {
        name: { 
          en: 'Case Creation Trigger'
        },
        description: {
          en: 'Triggers when a new case is created'
        },
        eventType: 'cases-created',
        // Simple always-true condition
        condition: {
          expressionKind: 'literalBoolean',
          value: true,
          typeHint: { kind: 'boolean' }
        },
        // Simplified emit expression - just emit the case data
        emitExpression: {
          expressionKind: 'symbolOperator',
          name: 'currentValues'
        },
        // Simple context key - just the case number directly
        contextKey: {
          expressionKind: 'dotOperator',
          paths: ['currentValues', 'caseNumber']
        }
      },
      proxyFields: [
        {
          id: 'caseNumber',
          name: { 
            en: 'Case Number'
          },
          description: {
            en: 'The unique case number'
          },
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
              expressionKind: 'dotOperator',
              paths: ['context', 'caseNumber']
            }
          },
          policy: {
            horizontal: 'OVERWRITE',
            vertical: 'PARENT'
          }
        },
        {
          id: 'status',
          name: { 
            en: 'Case Status'
          },
          description: {
            en: 'Current status of the case'
          },
          definition: {
            type: { kind: 'string' },
            readable: {
              expressionKind: 'literalBoolean',
              value: true,
              typeHint: { kind: 'boolean' }
            },
            writable: {
              expressionKind: 'literalBoolean',
              value: true,
              typeHint: { kind: 'boolean' }
            },
            automaticValue: {
              expressionKind: 'dotOperator',
              paths: ['context', 'status']
            }
          },
          policy: {
            horizontal: 'OVERWRITE',
            vertical: 'PARENT'
          }
        },
        {
          id: 'patientFirstName',
          name: { 
            en: 'Patient First Name'
          },
          description: {
            en: 'First name of the patient'
          },
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
              expressionKind: 'dotOperator',
              paths: ['context', 'bookingPatient', 'firstName']
            }
          },
          policy: {
            horizontal: 'OVERWRITE',
            vertical: 'PARENT'
          }
        },
        {
          id: 'patientLastName',
          name: { 
            en: 'Patient Last Name'
          },
          description: {
            en: 'Last name of the patient'
          },
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
              expressionKind: 'dotOperator',
              paths: ['context', 'bookingPatient', 'lastName']
            }
          },
          policy: {
            horizontal: 'OVERWRITE',
            vertical: 'PARENT'
          }
        }
      ],
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
    
    // Master configuration
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
    console.log(`✅ Created jsonconfig with _id: ${configId}`);
    
    // Billing config
    const billingConfigDoc = {
      _id: new ObjectId(),
      versionRef: configId,
      version: 'latest',
      tenantId: tenantId,
      data: {
        domains: [domainConfig]
      },
      createdAt: now,
      updatedAt: now
    };
    
    await db.collection('billingconfigs').insertOne(billingConfigDoc);
    console.log('✅ Created billingconfig');
    
    // Dynamic data config
    const dynamicDataConfigDoc = {
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
    };
    
    await db.collection('dynamicdataconfigs').insertOne(dynamicDataConfigDoc);
    console.log('✅ Created dynamicdataconfig');
    
    // Domain docs
    const domainDoc = {
      _id: new ObjectId(),
      ...domainConfig,
      tenantId: tenantId,
      createdAt: now,
      updatedAt: now
    };
    
    await db.collection('domains').insertOne(domainDoc);
    await db.collection('urdomains').insertOne({...domainDoc, _id: new ObjectId()});
    console.log('✅ Created domain documents');
    
    // Field operations
    const fieldOps = domainConfig.proxyFields.map(field => ({
      _id: new ObjectId(),
      type: 'CREATE',
      field: {
        ...field,
        domainId: 'schedulingCases'
      },
      domainId: 'schedulingCases',
      tenantId: tenantId,
      blocking: false,
      processed: false,
      createdAt: now,
      updatedAt: now
    }));
    
    await db.collection('fieldoperations').insertMany(fieldOps);
    console.log(`✅ Created ${fieldOps.length} field operations`);
    
    console.log('\n✅ Configuration fixed with simplified expressions!');
    
  } finally {
    await client.close();
  }
}

// Alternative approach - use a working example from your system
async function checkWorkingTriggers() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    
    // Check if there are any working triggers we can copy
    const existingDomains = await db.collection('domains').find({}).toArray();
    
    if (existingDomains.length > 0) {
      console.log('\n📋 Existing domain configurations:');
      existingDomains.forEach(domain => {
        console.log(`\nDomain: ${domain.domainId}`);
        if (domain.trigger) {
          console.log('Trigger contextKey:', JSON.stringify(domain.trigger.contextKey, null, 2));
          console.log('Trigger emitExpression:', JSON.stringify(domain.trigger.emitExpression, null, 2));
        }
      });
    }
    
  } finally {
    await client.close();
  }
}

// Run the fix
fixURConfigExpressions()
  .then(() => checkWorkingTriggers())
  .then(() => {
    console.log('\n🔧 Next steps:');
    console.log('1. Restart the UR service');
    console.log('2. Create a test case');
    console.log('3. Check the logs for processing');
  })
  .catch(console.error);