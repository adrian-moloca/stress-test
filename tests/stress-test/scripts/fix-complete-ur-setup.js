// scripts/fix-complete-ur-setup.js
const { MongoClient, ObjectId } = require("mongodb");

async function fixCompleteURSetup() {
  const client = new MongoClient("mongodb://localhost:27017");
  const tenantId = "66045e2350e8d495ec17bbe9";

  try {
    await client.connect();
    console.log("🔗 Connected to MongoDB");

    const db = client.db("universal-reporting");

    // Clear everything
    console.log("\n🗑️ Clearing all configurations...");
    await db.collection("jsonconfigs").deleteMany({});
    await db.collection("billingconfigs").deleteMany({});
    await db.collection("dynamicdataconfigs").deleteMany({});
    await db.collection("domains").deleteMany({});
    await db.collection("urdomains").deleteMany({});
    await db.collection("fieldoperations").deleteMany({});

    const configId = new ObjectId();
    const now = new Date();

    // Domain configuration
    const domainConfig = {
      domainId: "schedulingCases",
      domainName: {
        en: "Scheduling Cases",
      },
      domainDescription: {
        en: "Domain for scheduling case proxies",
      },
      trigger: {
        name: {
          en: "Case Creation Trigger",
        },
        description: {
          en: "Triggers when a new case is created",
        },
        eventType: "cases-created",
        condition: {
          expressionKind: "literalBoolean",
          value: true,
          typeHint: { kind: "boolean" },
        },
        emitExpression: {
          expressionKind: "symbolOperator",
          name: "currentValues",
        },
        contextKey: {
          expressionKind: "dotOperator",
          source: {
            expressionKind: "symbolOperator",
            name: "currentValues",
          },
          paths: ["caseNumber"],
        },
      },
      proxyFields: [
        {
          id: "caseNumber",
          name: {
            en: "Case Number",
          },
          description: {
            en: "The unique case number",
          },
          definition: {
            type: { kind: "string" },
            readable: {
              expressionKind: "literalBoolean",
              value: true,
              typeHint: { kind: "boolean" },
            },
            writable: {
              expressionKind: "literalBoolean",
              value: false,
              typeHint: { kind: "boolean" },
            },
            automaticValue: {
              expressionKind: "dotOperator",
              source: {
                expressionKind: "symbolOperator",
                name: "context",
              },
              paths: ["caseNumber"],
            },
          },
          policy: {
            horizontal: "OVERWRITE",
            vertical: "PARENT",
          },
        },
        {
          id: "status",
          name: {
            en: "Case Status",
          },
          description: {
            en: "Current status of the case",
          },
          definition: {
            type: { kind: "string" },
            readable: {
              expressionKind: "literalBoolean",
              value: true,
              typeHint: { kind: "boolean" },
            },
            writable: {
              expressionKind: "literalBoolean",
              value: true,
              typeHint: { kind: "boolean" },
            },
            automaticValue: {
              expressionKind: "dotOperator",
              source: {
                expressionKind: "symbolOperator",
                name: "context",
              },
              paths: ["status"],
            },
          },
          policy: {
            horizontal: "OVERWRITE",
            vertical: "PARENT",
          },
        },
        {
          id: "patientFirstName",
          name: {
            en: "Patient First Name",
          },
          description: {
            en: "First name of the patient",
          },
          definition: {
            type: { kind: "string" },
            readable: {
              expressionKind: "literalBoolean",
              value: true,
              typeHint: { kind: "boolean" },
            },
            writable: {
              expressionKind: "literalBoolean",
              value: false,
              typeHint: { kind: "boolean" },
            },
            automaticValue: {
              expressionKind: "dotOperator",
              source: {
                expressionKind: "symbolOperator",
                name: "context",
              },
              paths: ["bookingPatient", "firstName"],
            },
          },
          policy: {
            horizontal: "OVERWRITE",
            vertical: "PARENT",
          },
        },
        {
          id: "createdAt",
          name: {
            en: "Created Date",
          },
          description: {
            en: "When the case was created",
          },
          definition: {
            type: { kind: "date" },
            readable: {
              expressionKind: "literalBoolean",
              value: true,
              typeHint: { kind: "boolean" },
            },
            writable: {
              expressionKind: "literalBoolean",
              value: false,
              typeHint: { kind: "boolean" },
            },
            automaticValue: {
              expressionKind: "dotOperator",
              source: {
                expressionKind: "symbolOperator",
                name: "context",
              },
              paths: ["createdAt"],
            },
          },
          policy: {
            horizontal: "OVERWRITE",
            vertical: "PARENT",
          },
        },
      ],
      canAccessProxies: {
        expressionKind: "literalBoolean",
        value: true,
        typeHint: { kind: "boolean" },
      },
      canAccessProxyDetails: {
        expressionKind: "literalBoolean",
        value: true,
        typeHint: { kind: "boolean" },
      },
      canEditProxy: {
        expressionKind: "literalBoolean",
        value: true,
        typeHint: { kind: "boolean" },
      },
    };

    // Complete dynamicData structure
    const dynamicData = {
      anagraphics: {
        fields: [],
      },
      users: {
        fields: [],
      },
      contracts: {
        fields: [],
      },
    };

    // Master configuration
    const jsonConfigDoc = {
      _id: configId,
      version: "latest",
      tenantId: tenantId,
      data: {
        version: "latest",
        billingConfig: {
          domains: [domainConfig],
        },
        dynamicData: dynamicData,
      },
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("jsonconfigs").insertOne(jsonConfigDoc);
    console.log(`✅ Created jsonconfig with _id: ${configId}`);

    // Billing config
    await db.collection("billingconfigs").insertOne({
      _id: new ObjectId(),
      versionRef: configId,
      version: "latest",
      tenantId: tenantId,
      data: {
        domains: [domainConfig],
      },
      createdAt: now,
      updatedAt: now,
    });
    console.log("✅ Created billingconfig");

    // Dynamic data config
    await db.collection("dynamicdataconfigs").insertOne({
      _id: new ObjectId(),
      versionRef: configId,
      version: "latest",
      tenantId: tenantId,
      data: dynamicData,
      createdAt: now,
      updatedAt: now,
    });
    console.log("✅ Created dynamicdataconfig");

    // Domain docs
    const domainDoc = {
      _id: new ObjectId(),
      ...domainConfig,
      tenantId: tenantId,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("domains").insertOne(domainDoc);
    await db
      .collection("urdomains")
      .insertOne({ ...domainDoc, _id: new ObjectId() });
    console.log("✅ Created domain documents");

    // Field operations
    const fieldOps = domainConfig.proxyFields.map((field) => ({
      _id: new ObjectId(),
      type: "CREATE",
      field: {
        ...field,
        domainId: "schedulingCases",
      },
      domainId: "schedulingCases",
      tenantId: tenantId,
      blocking: false,
      processed: false,
      createdAt: now,
      updatedAt: now,
    }));

    await db.collection("fieldoperations").insertMany(fieldOps);
    console.log(`✅ Created ${fieldOps.length} field operations`);

    // Verify configuration
    console.log("\n🔍 Verifying configuration...");
    const dynamicDataConfig = await db
      .collection("dynamicdataconfigs")
      .findOne({
        tenantId,
        version: "latest",
      });
    console.log("✅ DynamicDataConfig exists:", !!dynamicDataConfig);
    console.log(
      "✅ Has data.anagraphics:",
      !!dynamicDataConfig?.data?.anagraphics
    );
    console.log("✅ Has data.users:", !!dynamicDataConfig?.data?.users);
    console.log("✅ Has data.contracts:", !!dynamicDataConfig?.data?.contracts);

    console.log("\n✅ Complete UR configuration done!");
  } finally {
    await client.close();
  }
}

// Test the proxy API
async function testProxyRetrieval() {
  const fetch = require("node-fetch");

  // Test with one of the created proxies
  const testCases = ["511", "512", "513", "514", "515"];

  console.log("\n🔍 Testing proxy retrieval...");

  for (const caseNumber of testCases) {
    const url = `http://localhost:8160/api/ur/proxies/schedulingCases/${caseNumber}`;

    try {
      const response = await fetch(url);

      if (response.ok) {
        const proxy = await response.json();
        console.log(`\n✅ Proxy ${caseNumber} retrieved successfully!`);
        console.log(`   ID: ${proxy._id}`);
        console.log(`   Context: ${proxy.contextKey}`);
        console.log(`   Fields:`, Object.keys(proxy.dynamicFields || {}));
        return proxy; // Return first successful proxy
      } else {
        const error = await response.text();
        console.log(
          `❌ Failed to retrieve proxy ${caseNumber}: ${response.status}`
        );
      }
    } catch (err) {
      console.log(`❌ Error retrieving proxy ${caseNumber}:`, err.message);
    }
  }

  return null;
}

// Run the fix and test
fixCompleteURSetup()
  .then(() => {
    console.log("\n⏳ Waiting 5 seconds for services to sync...");
    return new Promise((resolve) => setTimeout(resolve, 5000));
  })
  .then(() => testProxyRetrieval())
  .then((proxy) => {
    if (proxy) {
      console.log("\n🎉 UR system is working correctly!");
      console.log("\n🚀 Ready to run stress tests:");
      console.log("node scripts/run-stress-test.js \\");
      console.log("  --scenario bulk-case-creation \\");
      console.log("  --volume 100 \\");
      console.log("  --high-concurrency \\");
      console.log("  --validation-level ultimate");
    } else {
      console.log("\n⚠️ Could not retrieve proxies. Check UR service logs.");
    }
  })
  .catch(console.error);
