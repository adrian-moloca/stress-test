// scripts/fix-ur-config-complete.js
const { MongoClient, ObjectId } = require('mongodb');

async function fixURConfigComplete() {
  const client = new MongoClient('mongodb://localhost:27017');
  const tenantId = '66045e2350e8d495ec17bbe9';
  
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    
    const db = client.db('universal-reporting');
    
    // Step 1: Clear everything
    console.log('\n🗑️ Clearing all configurations...');
    await db.collection('jsonconfigs').deleteMany({});
    await db.collection('billingconfigs').deleteMany({});
    await db.collection('dynamicdataconfigs').deleteMany({});
    await db.collection('domains').deleteMany({});
    await db.collection('urdomains').deleteMany({});
    await db.collection('proxies').deleteMany({});
    await db.collection('fieldoperations').deleteMany({});
    
    // Step 2: Create the master configuration
    const configId = new ObjectId();
    const now = new Date();
    
    // The complete domain configuration with merge policies
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
            },
            caseId: {
              expressionKind: 'dotOperator',
              paths: ['_id'],
              source: {
                expressionKind: 'symbolOperator',
                name: 'currentValues'
              }
            },
            status: {
              expressionKind: 'dotOperator',
              paths: ['status'],
              source: {
                expressionKind: 'symbolOperator',
                name: 'currentValues'
              }
            },
            patientName: {
              expressionKind: 'concatArraysOperator',
              separator: ' ',
              arrays: [{
                expressionKind: 'dotOperator',
                paths: ['bookingPatient', 'firstName'],
                source: {
                  expressionKind: 'symbolOperator',
                  name: 'currentValues'
                }
              }, {
                expressionKind: 'dotOperator',
                paths: ['bookingPatient', 'lastName'],
                source: {
                  expressionKind: 'symbolOperator',
                  name: 'currentValues'
                }
              }]
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
              expressionKind: 'selfOperator',
              paths: ['context', 'caseNumber']
            }
          },
          // THIS IS THE KEY PART - merge policy
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
              expressionKind: 'selfOperator',
              paths: ['context', 'status']
            },
            validValues: {
              expressionKind: 'literalArray',
              value: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
              typeHint: { kind: 'array', items: { kind: 'string' } }
            }
          },
          policy: {
            horizontal: 'OVERWRITE',
            vertical: 'PARENT'
          }
        },
        {
          id: 'patientName',
          name: { 
            en: 'Patient Name'
          },
          description: {
            en: 'Full name of the patient'
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
              expressionKind: 'selfOperator',
              paths: ['context', 'patientName']
            }
          },
          policy: {
            horizontal: 'OVERWRITE',
            vertical: 'PARENT'
          }
        },
        {
          id: 'appointmentDate',
          name: { 
            en: 'Appointment Date'
          },
          description: {
            en: 'Scheduled appointment date'
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
              value: true,
              typeHint: { kind: 'boolean' }
            },
            automaticValue: {
              expressionKind: 'dotOperator',
              paths: ['context', 'appointmentDate'],
              source: {
                expressionKind: 'symbolOperator',
                name: 'self'
              }
            }
          },
          policy: {
            horizontal: 'SHY', // Don't overwrite if already has value
            vertical: 'CHILD'
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
    
    // Master configuration document
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
    
    // Insert master config
    await db.collection('jsonconfigs').insertOne(jsonConfigDoc);
    console.log(`✅ Created jsonconfig with _id: ${configId}`);
    
    // Create billingconfig with reference
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
    
    // Create dynamicdataconfig with reference
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
    
    // Create domain documents
    const domainDoc = {
      _id: new ObjectId(),
      ...domainConfig,
      tenantId: tenantId,
      createdAt: now,
      updatedAt: now
    };
    
    await db.collection('domains').insertOne(domainDoc);
    console.log('✅ Created domain');
    
    await db.collection('urdomains').insertOne({...domainDoc, _id: new ObjectId()});
    console.log('✅ Created urdomain');
    
    // Step 3: Create initial field operations for the proxy fields
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
    
    if (fieldOps.length > 0) {
      await db.collection('fieldoperations').insertMany(fieldOps);
      console.log(`✅ Created ${fieldOps.length} field operations`);
    }
    
    // Step 4: Verify the configuration
    console.log('\n🔍 Verification:');
    
    const verifyJsonConfig = await db.collection('jsonconfigs').findOne({ 
      version: 'latest',
      tenantId: tenantId 
    });
    console.log(`   jsonconfig: ${verifyJsonConfig ? '✅' : '❌'}`);
    
    const verifyDynamicData = await db.collection('dynamicdataconfigs').findOne({ 
      version: 'latest',
      tenantId: tenantId 
    });
    console.log(`   dynamicdataconfig: ${verifyDynamicData ? '✅' : '❌'}`);
    
    const verifyDomain = await db.collection('domains').findOne({ 
      domainId: 'schedulingCases',
      tenantId: tenantId 
    });
    console.log(`   domain: ${verifyDomain ? '✅' : '❌'}`);
    
    const verifyFieldOps = await db.collection('fieldoperations').countDocuments({ 
      domainId: 'schedulingCases',
      tenantId: tenantId 
    });
    console.log(`   field operations: ${verifyFieldOps}`);
    
    // Check if any field has merge policy
    if (verifyDomain) {
      const fieldsWithPolicy = verifyDomain.proxyFields.filter(f => f.policy);
      console.log(`   fields with merge policy: ${fieldsWithPolicy.length}/${verifyDomain.proxyFields.length}`);
    }
    
    console.log('\n✅ UR configuration complete with merge policies!');
    
  } finally {
    await client.close();
  }
}

// Also create a test script to verify proxy creation works
async function testProxyCreation() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    
    // Create a test case
    const caseNumber = `TEST_${Date.now()}`;
    const caseDoc = {
      _id: new ObjectId().toString(),
      caseNumber: caseNumber,
      status: 'PENDING',
      bookingPatient: {
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: new Date('1990-01-01'),
        email: 'test@patient.com'
      },
      bookingSection: {
        doctorId: 'user_6EnqFa5TaWCtuy4wD',
        contractId: 'contract_DSg8orNxSST5FKjpz',
        opStandardId: 'op_TdqjJp7oNJiG6oRbF',
        date: new Date('2024-12-01T10:00:00.000Z'),
        duration: 120
      },
      tenantId: '66045e2350e8d495ec17bbe9',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await client.db('schedulingCases').collection('cases').insertOne(caseDoc);
    console.log(`\n✅ Created test case: ${caseNumber}`);
    
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
    
    console.log('⏳ Waiting 10 seconds for UR processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check proxy
    const proxy = await client.db('universal-reporting')
      .collection('proxies')
      .findOne({ contextKey: caseNumber });
    
    if (proxy) {
      console.log('✅ Proxy created successfully!');
      console.log('   Context:', proxy.contextKey);
      console.log('   Domain:', proxy.domainId);
      console.log('   Fields:', Object.keys(proxy.fields || {}).join(', '));
    } else {
      console.log('❌ Proxy not created');
    }
    
  } finally {
    await client.close();
  }
}

// Run both if this script is executed directly
if (require.main === module) {
  fixURConfigComplete()
    .then(() => testProxyCreation())
    .catch(console.error);
}

module.exports = { fixURConfigComplete };