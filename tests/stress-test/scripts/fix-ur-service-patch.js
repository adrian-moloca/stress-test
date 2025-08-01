// scripts/fix-ur-service-patch.js
const { MongoClient } = require("mongodb");

async function patchURService() {
  console.log(
    "🔧 The issue is in the getTargetConfig method - it's not filtering by tenantId!"
  );
  console.log(
    "\nTo fix this, you need to update the json-config.service.ts file."
  );
  console.log("\nHere's the corrected getTargetConfig method:\n");

  const fixedCode = `
  getTargetConfig = async (version:string, type: tURConfigKeys) => {
    try {
      const store = global.als.getStore()
      const tenantId = store?.tenantId
      
      if (!tenantId)
        throw Error('TenantId is missing in getTargetConfig')
      
      let config
      if (version === VERSIONS_NAMES.LATEST)
        config = await this.jsonConfigModel.findOne({ tenantId }, { _id: 1 }).sort({ _id: -1 })
      else
        config = await this.jsonConfigModel.findOne({ version, tenantId }, { _id: 1 })

      if (config == null)
        throw Error(\`No general config matches version \${version}\`)

      let correctModel
      switch (type) {
        case URConfigs.BILLING_CONFIG:
          correctModel = this.billingConfigModel
          break

        case URConfigs.DYNAMIC_DATA:
          correctModel = this.dynamicDataConfigModel
          break

        default:
          throw Error(\`Config \${type} is not supported\`)
      }

      const dynamicDataConfig = await correctModel.findOne({ 
        versionRef: config.id,
        tenantId 
      })

      if (dynamicDataConfig == null)
        throw Error(\`No dynamicData config matches version \${version}\`)

      return dynamicDataConfig.data
    } catch (e) {
      return await this.loggingService.throwErrorAndLog(e)
    }
  }`;

  console.log(fixedCode);

  console.log("\n📝 Steps to apply the fix:");
  console.log(
    "1. Edit backend/universal-reporting/src/services/json-config.service.ts"
  );
  console.log("2. Replace the getTargetConfig method with the version above");
  console.log("3. Save the file");
  console.log("4. The service should auto-reload (or restart it manually)");
  console.log("5. Test again with the stress test");
}

// Alternative: Add tenantId to existing data
async function addTenantIdToConfigs() {
  const client = new MongoClient("mongodb://localhost:27017");
  const tenantId = "66045e2350e8d495ec17bbe9";

  try {
    await client.connect();
    console.log(
      "\n🔧 Alternative quick fix: Ensuring all configs have tenantId..."
    );

    const db = client.db("universal-reporting");

    // Update jsonconfigs
    const result1 = await db
      .collection("jsonconfigs")
      .updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: tenantId } }
      );
    console.log(`Updated ${result1.modifiedCount} jsonconfigs`);

    // Update billingconfigs
    const result2 = await db
      .collection("billingconfigs")
      .updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: tenantId } }
      );
    console.log(`Updated ${result2.modifiedCount} billingconfigs`);

    // Update dynamicdataconfigs
    const result3 = await db
      .collection("dynamicdataconfigs")
      .updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId: tenantId } }
      );
    console.log(`Updated ${result3.modifiedCount} dynamicdataconfigs`);

    console.log("\n✅ Database updated. Try the stress test again.");
  } finally {
    await client.close();
  }
}

// Run both approaches
patchURService()
  .then(() => addTenantIdToConfigs())
  .catch(console.error);
