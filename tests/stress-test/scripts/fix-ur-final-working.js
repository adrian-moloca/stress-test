// scripts/fix-ur-final-working.js
const { MongoClient, ObjectId } = require('mongodb');

async function fixURFinalWorking() {
  const client = new MongoClient('mongodb://localhost:27017');
  const tenantId = '66045e2350e8d495ec17bbe9';
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('universal-reporting');
    
    // Clear everything
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
    
    // Domain configuration with correct expression syntax
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
        // Always true condition
        condition: {
          expressionKind: 'literalBoolean',
          value: true,
          typeHint: { kind: 'boolean' }
        },
        // Emit the entire event data
        emitExpression: {
          expressionKind: 'symbolOperator',
          name: 'currentValues'
        },
        // THIS IS THE FIX - correct dotOperator syntax with source
        contextKey: {
          expressionKind: 'dotOperator',
          source: {
            expressionKind: 'symbolOperator',
            name: 'currentValues'
          },
          paths: ['caseNumber']
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
            // Fixed automaticValue expression
            automaticValue: {
              expressionKind: 'dotOperator',
              source: {
                expressionKind: 'symbolOperator',
                name: 'context'
              },
              paths: ['caseNumber']
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
              source: {
                expressionKind: 'symbolOperator',
                name: 'context'
              },
              paths: ['status']
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
              source: {
                expressionKind: 'symbolOperator',
                name: 'context'
              },
              paths: ['bookingPatient', 'firstName']
            }
          },
          policy: {
            horizontal: 'OVERWRITE',
            vertical: 'PARENT'
          }
        },
        {
          id: 'createdAt',
          name: { 
            en: 'Created Date'
          },
          description: {
            en: 'When the case was created'
          },
          definition: {
            type: { kind: 'date' },
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
              source: {
                expressionKind: 'symbolOperator',
                name: 'context'
              },
              paths: ['createdAt']
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
    
    // Create all configs
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
    
    // Dynamic data config
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
    
    console.log('\n✅ Configuration complete with correct expression syntax!');
    
    // Verify the trigger expression
    const verifyDomain = await db.collection('domains').findOne({ domainId: 'schedulingCases' });
    if (verifyDomain) {
      console.log('\n🔍 Trigger verification:');
      console.log('ContextKey has source:', !!verifyDomain.trigger.contextKey.source);
      console.log('ContextKey paths:', verifyDomain.trigger.contextKey.paths);
    }
    
  } finally {
    await client.close();
  }
}

// Also create a minimal test to verify it works
async function testMinimalCase() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    
    // Create a minimal case
    const caseNumber = `MIN_${Date.now()}`;
    const caseDoc = {
      _id: new ObjectId().toString(),
      caseNumber: caseNumber,
      status: 'PENDING',
      bookingPatient: {
        firstName: 'Test',
        lastName: 'User'
      },
      tenantId: '66045e2350e8d495ec17bbe9',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await client.db('schedulingCases').collection('cases').insertOne(caseDoc);
    console.log(`\n✅ Created minimal test case: ${caseNumber}`);
    
    // Create event
    await client.db('universal-reporting').collection('importedevents').insertOne({
      source: 'cases-created',
      sourceDocId: caseDoc._id,
      tenantId: caseDoc.tenantId,
      processed: false,
      previousValues: {},
      currentValues: caseDoc,
      createdAt: new Date()
    });
    
    console.log('✅ Created event');
    console.log('\n⏳ Monitor the UR logs for processing...');
    
  } finally {
    await client.close();
  }
}

// Run the fix
fixURFinalWorking()
  .then(() => {
    console.log('\n🔧 Next steps:');
    console.log('1. Restart the UR service');
    console.log('2. Run: node scripts/fix-ur-final-working.js test');
    console.log('3. Check the logs');
  })
  .then(() => {
    if (process.argv[2] === 'test') {
      return testMinimalCase();
    }
  })
  .catch(console.error);