// scripts/fix-ur-clean-start.js
const { MongoClient, ObjectId } = require("mongodb");
const fetch = require("node-fetch");

async function cleanAndSetupUR() {
  const client = new MongoClient("mongodb://localhost:27017");
  const tenantId = "66045e2350e8d495ec17bbe9";

  try {
    await client.connect();
    console.log("🔗 Connected to MongoDB");

    const db = client.db("universal-reporting");

    // Complete cleanup
    console.log("\n🧹 Complete cleanup of UR system...");
    await db.collection("jsonconfigs").deleteMany({});
    await db.collection("billingconfigs").deleteMany({});
    await db.collection("dynamicdataconfigs").deleteMany({});
    await db.collection("domains").deleteMany({});
    await db.collection("urdomains").deleteMany({});
    await db.collection("fieldoperations").deleteMany({});
    await db.collection("proxies").deleteMany({});
    await db.collection("dependenciesgraphs").deleteMany({});
    await db.collection("importedevents").deleteMany({});
    await db.collection("urjobs").deleteMany({});

    console.log("✅ Cleaned all UR collections");

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

    console.log("\n✅ Clean UR configuration complete!");
  } finally {
    await client.close();
  }
}

// Create a fresh test case
async function createFreshTestCase() {
  const client = new MongoClient("mongodb://localhost:27017");

  try {
    await client.connect();

    const caseNumber = `CLEAN_${Date.now()}`;
    const caseDoc = {
      _id: new ObjectId().toString(),
      caseNumber: caseNumber,
      status: "PENDING",
      bookingPatient: {
        firstName: "Clean",
        lastName: "Test",
      },
      tenantId: "66045e2350e8d495ec17bbe9",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await client.db("schedulingCases").collection("cases").insertOne(caseDoc);
    console.log(`\n✅ Created fresh test case: ${caseNumber}`);

    // Create event
    await client
      .db("universal-reporting")
      .collection("importedevents")
      .insertOne({
        source: "cases-created",
        sourceDocId: caseDoc._id,
        tenantId: caseDoc.tenantId,
        processed: false,
        previousValues: {},
        currentValues: caseDoc,
        createdAt: new Date(),
      });

    console.log("✅ Created event");

    return caseNumber;
  } finally {
    await client.close();
  }
}

// Test with authentication
async function testAuthenticatedProxyRetrieval(caseNumber) {
  const token =
    process.env.AUTH_TOKEN ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx1Y2FAYW1idWZsb3cuY29tIiwic3ViIjoidXNlcl9XRHFRdkxlQ2tkOTl1R1FGaCIsInRlbmFudElkIjoiNjYwNDVlMjM1MGU4ZDQ5NWVjMTdiYmU5IiwiaWF0IjoxNzU0MDQzMDgxfQ.YQ3vChCL7hvVM5m_opIiIRXFO_Kr5Y--cCKVTFMlAow";
  console.log("\n🔍 Testing authenticated proxy retrieval...");

  const url = `http://localhost:8160/api/ur/proxies/schedulingCases/${caseNumber}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const proxy = await response.json();
      console.log(`\n✅ Proxy retrieved successfully!`);
      console.log(`   ID: ${proxy._id}`);
      console.log(`   Context: ${proxy.contextKey}`);
      console.log(`   Domain: ${proxy.domainId}`);
      console.log(`   Fields:`, proxy.dynamicFields);
      return true;
    } else {
      const error = await response.text();
      console.log(`❌ Failed to retrieve proxy: ${response.status}`);
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Error retrieving proxy:`, err.message);
    return false;
  }
}

// Run the complete fix
cleanAndSetupUR()
  .then(() => {
    console.log(
      "\n⏳ Waiting 10 seconds for UR service to process field operations..."
    );
    return new Promise((resolve) => setTimeout(resolve, 10000));
  })
  .then(() => createFreshTestCase())
  .then((caseNumber) => {
    console.log("\n⏳ Waiting 10 seconds for event processing...");
    return new Promise((resolve) =>
      setTimeout(() => resolve(caseNumber), 10000)
    );
  })
  .then((caseNumber) => testAuthenticatedProxyRetrieval(caseNumber))
  .then((success) => {
    if (success) {
      console.log("\n🎉 UR system is working correctly!");
      console.log("\n🚀 Ready to run stress tests:");
      console.log("node scripts/run-stress-test.js \\");
      console.log("  --scenario bulk-case-creation \\");
      console.log("  --volume 100 \\");
      console.log("  --high-concurrency \\");
      console.log("  --validation-level ultimate");
    } else {
      console.log("\n⚠️ UR system still has issues. Check the logs.");
    }
  })
  .catch(console.error);
