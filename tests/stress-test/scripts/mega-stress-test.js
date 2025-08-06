const { MongoClient, ObjectId } = require("mongodb");
const os = require("os");

class MegaStressTest {
  constructor(options = {}) {
    this.targetCases = options.cases || 10000;
    this.batchSize = options.batchSize || 100;
    this.mongoUrl = options.mongoUrl || "mongodb://localhost:27017";
    this.testId = `MEGA_${Date.now()}`;
    this.metrics = {
      testId: this.testId,
      startTime: null,
      endTime: null,
      phases: [],
      systemInfo: {
        cpus: os.cpus().length,
        totalMemory: (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB",
        platform: os.platform(),
      },
    };
  }

  async run() {
    console.log("🚀 MEGA STRESS TEST - 10,000+ CASES");
    console.log("=" * 50);
    console.log(`Test ID: ${this.testId}`);
    console.log(`Target: ${this.targetCases.toLocaleString()} cases`);
    console.log(`Batch Size: ${this.batchSize}`);
    console.log(
      `System: ${this.metrics.systemInfo.cpus} CPUs, ${this.metrics.systemInfo.totalMemory} RAM`
    );
    console.log("=" * 50 + "\n");

    this.metrics.startTime = new Date();

    try {
      await this.capturePhase("baseline");

      await this.createCases();

      await this.monitorProcessing();

      await this.finalAnalysis();

      await this.generateReport();
    } catch (error) {
      console.error("❌ Test failed:", error);
      this.metrics.error = error.message;
    } finally {
      this.metrics.endTime = new Date();
    }
  }

  async createCases() {
    console.log("📝 PHASE 2: Creating Cases\n");

    const client = new MongoClient(this.mongoUrl);
    const startTime = Date.now();

    try {
      await client.connect();
      const casesDb = client.db("schedulingCases");
      const urDb = client.db("universal-reporting");

      let created = 0;
      const batchMetrics = [];

      const progressBar = new ProgressBar(this.targetCases);

      for (let i = 0; i < this.targetCases; i += this.batchSize) {
        const batchStart = Date.now();
        const currentBatch = Math.min(this.batchSize, this.targetCases - i);

        const cases = [];
        for (let j = 0; j < currentBatch; j++) {
          cases.push({
            _id: new ObjectId().toString(),
            caseNumber: `${this.testId}_${i + j}`,
            status: "PENDING",
            bookingPatient: {
              firstName: `Stress${i + j}`,
              lastName: "Test",
              dateOfBirth: new Date(1990, 0, 1),
            },
            bookingSection: {
              surgeryDate: new Date(Date.now() + 86400000 * (i % 30)),
              surgeryType: ["REGULAR", "EMERGENCY", "ELECTIVE"][i % 3],
            },
            surgerySection: {
              procedures: [`Procedure ${i % 10}`],
            },
            tenantId: "66045e2350e8d495ec17bbe9",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        await casesDb.collection("cases").insertMany(cases);

        const events = cases.map((c) => ({
          source: "cases-created",
          sourceDocId: c._id,
          tenantId: c.tenantId,
          processed: false,
          previousValues: {},
          currentValues: c,
          createdAt: new Date(),
        }));

        await urDb.collection("importedevents").insertMany(events);

        created += currentBatch;

        const batchTime = Date.now() - batchStart;
        batchMetrics.push({
          batchNumber: Math.floor(i / this.batchSize) + 1,
          size: currentBatch,
          duration: batchTime,
          throughput: (currentBatch / (batchTime / 1000)).toFixed(2),
        });

        progressBar.update(created);

        if (i % 1000 === 0 && i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      progressBar.complete();

      const totalTime = (Date.now() - startTime) / 1000;

      this.metrics.phases.push({
        phase: "case_creation",
        duration: totalTime,
        casesCreated: created,
        eventsCreated: created,
        throughput: (created / totalTime).toFixed(2) + " cases/sec",
        batchMetrics: batchMetrics.slice(-10),
      });

      console.log(
        `\n✅ Created ${created.toLocaleString()} cases in ${totalTime.toFixed(
          1
        )}s`
      );
      console.log(
        `   Throughput: ${(created / totalTime).toFixed(2)} cases/sec`
      );
    } finally {
      await client.close();
    }
  }

  async monitorProcessing() {
    console.log("\n⏳ PHASE 3: Monitoring Processing\n");

    const monitorDuration = 300000;
    const checkInterval = 10000;
    const checks = monitorDuration / checkInterval;

    const client = new MongoClient(this.mongoUrl);

    try {
      await client.connect();
      const urDb = client.db("universal-reporting");

      const monitoringData = [];
      const startMetrics = await this.getSystemMetrics(urDb);

      console.log("Monitoring system for 5 minutes...");
      console.log(
        "Initial queue: " +
          startMetrics.unprocessedEvents.toLocaleString() +
          " events\n"
      );

      for (let i = 0; i < checks; i++) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));

        const metrics = await this.getSystemMetrics(urDb);
        const processed = startMetrics.totalEvents - metrics.unprocessedEvents;
        const rate = (processed / ((i + 1) * 10)).toFixed(2);

        monitoringData.push({
          timestamp: new Date(),
          checkpoint: i + 1,
          ...metrics,
          processingRate: rate + " events/sec",
        });

        process.stdout.write("\r" + " ".repeat(80) + "\r");
        process.stdout.write(
          `Check ${i + 1}/${checks} | ` +
            `Queue: ${metrics.unprocessedEvents.toLocaleString()} | ` +
            `Proxies: ${metrics.totalProxies.toLocaleString()} | ` +
            `Rate: ${rate} events/sec`
        );
      }

      console.log("\n");

      this.metrics.phases.push({
        phase: "processing_monitor",
        duration: monitorDuration / 1000,
        checkpoints: monitoringData.length,
        summary: {
          eventsProcessed:
            startMetrics.totalEvents -
            monitoringData[monitoringData.length - 1].unprocessedEvents,
          proxiesCreated:
            monitoringData[monitoringData.length - 1].totalProxies -
            startMetrics.totalProxies,
          avgProcessingRate:
            monitoringData[monitoringData.length - 1].processingRate,
        },
        samples: monitoringData.filter((_, i) => i % 3 === 0),
      });
    } finally {
      await client.close();
    }
  }

  async getSystemMetrics(db) {
    const [
      totalEvents,
      unprocessedEvents,
      totalProxies,
      proxiesWithFields,
      totalNodes,
    ] = await Promise.all([
      db.collection("importedevents").countDocuments(),
      db.collection("importedevents").countDocuments({ processed: false }),
      db.collection("proxies").countDocuments(),
      db
        .collection("proxies")
        .countDocuments({ dynamicFields: { $exists: true, $ne: {} } }),
      db.collection("dependencygraphnodes").countDocuments(),
    ]);

    return {
      totalEvents,
      unprocessedEvents,
      processedEvents: totalEvents - unprocessedEvents,
      totalProxies,
      proxiesWithFields,
      emptyProxies: totalProxies - proxiesWithFields,
      totalNodes,
    };
  }

  async capturePhase(phaseName) {
    const client = new MongoClient(this.mongoUrl);

    try {
      await client.connect();
      const metrics = await this.getSystemMetrics(
        client.db("universal-reporting")
      );

      this.metrics.phases.push({
        phase: phaseName,
        timestamp: new Date(),
        metrics,
      });
    } finally {
      await client.close();
    }
  }

  async finalAnalysis() {
    console.log("📊 PHASE 4: Final Analysis\n");

    const client = new MongoClient(this.mongoUrl);

    try {
      await client.connect();
      const urDb = client.db("universal-reporting");

      const finalMetrics = await this.getSystemMetrics(urDb);

      const testCases = await client
        .db("schedulingCases")
        .collection("cases")
        .countDocuments({ caseNumber: new RegExp(`^${this.testId}_`) });

      const testProxies = await urDb
        .collection("proxies")
        .countDocuments({ contextKey: new RegExp(`^${this.testId}_`) });

      const caseToProxyRate = ((testProxies / testCases) * 100).toFixed(1);

      const processingDist = await urDb
        .collection("importedevents")
        .aggregate([
          {
            $match: {
              "currentValues.caseNumber": new RegExp(`^${this.testId}_`),
              processed: true,
            },
          },
          {
            $project: {
              processingTime: { $subtract: ["$processedAt", "$createdAt"] },
            },
          },
          {
            $group: {
              _id: null,
              avg: { $avg: "$processingTime" },
              min: { $min: "$processingTime" },
              max: { $max: "$processingTime" },
              p50: { $percentile: { input: "$processingTime", p: [0.5] } },
              p95: { $percentile: { input: "$processingTime", p: [0.95] } },
              p99: { $percentile: { input: "$processingTime", p: [0.99] } },
            },
          },
        ])
        .toArray();

      this.metrics.finalAnalysis = {
        testCases: {
          created: testCases,
          proxiesCreated: testProxies,
          successRate: caseToProxyRate + "%",
        },
        systemState: finalMetrics,
        processingStats: processingDist[0] || {},
        duration:
          ((new Date() - this.metrics.startTime) / 1000 / 60).toFixed(2) +
          " minutes",
      };
    } finally {
      await client.close();
    }
  }

  async generateReport() {
    console.log("\n" + "=" * 60);
    console.log("📊 MEGA STRESS TEST REPORT");
    console.log("=" * 60);

    const baseline = this.metrics.phases.find(
      (p) => p.phase === "baseline"
    ).metrics;
    const final = this.metrics.finalAnalysis.systemState;

    console.log(`\n🎯 Test Summary:`);
    console.log(`   Test ID: ${this.testId}`);
    console.log(`   Duration: ${this.metrics.finalAnalysis.duration}`);
    console.log(
      `   Cases Created: ${this.metrics.finalAnalysis.testCases.created.toLocaleString()}`
    );
    console.log(
      `   Proxies Created: ${this.metrics.finalAnalysis.testCases.proxiesCreated.toLocaleString()}`
    );
    console.log(
      `   Success Rate: ${this.metrics.finalAnalysis.testCases.successRate}`
    );

    console.log(`\n📈 System Impact:`);
    console.log(
      `   Events Added: ${(
        final.totalEvents - baseline.totalEvents
      ).toLocaleString()}`
    );
    console.log(
      `   Events Processed: ${(
        final.processedEvents - baseline.processedEvents
      ).toLocaleString()}`
    );
    console.log(
      `   Queue Growth: ${(
        final.unprocessedEvents - baseline.unprocessedEvents
      ).toLocaleString()}`
    );
    console.log(
      `   Proxies Added: ${(
        final.totalProxies - baseline.totalProxies
      ).toLocaleString()}`
    );
    console.log(
      `   Nodes Added: ${(
        final.totalNodes - baseline.totalNodes
      ).toLocaleString()}`
    );

    const creation = this.metrics.phases.find(
      (p) => p.phase === "case_creation"
    );
    console.log(`\n⚡ Performance:`);
    console.log(`   Creation Throughput: ${creation.throughput}`);
    console.log(
      `   Avg Processing Time: ${(
        this.metrics.finalAnalysis.processingStats.avg / 1000
      ).toFixed(2)}s`
    );
    console.log(
      `   P95 Processing Time: ${(
        this.metrics.finalAnalysis.processingStats.p95?.[0] / 1000 || 0
      ).toFixed(2)}s`
    );

    const filename = `mega-stress-test-${this.testId}.json`;
    await require("fs").promises.writeFile(
      filename,
      JSON.stringify(this.metrics, null, 2)
    );

    console.log(`\n💾 Detailed report saved to: ${filename}`);
    console.log("=" * 60);

    if (final.unprocessedEvents > 5000) {
      console.log("\n⚠️  WARNING: High queue backlog detected!");
      console.log(
        "   Consider increasing processing capacity or cron frequency."
      );
    }

    if (this.metrics.finalAnalysis.testCases.successRate < 95) {
      console.log("\n⚠️  WARNING: Low proxy creation success rate!");
      console.log("   Check for duplicate key errors or processing failures.");
    }
  }
}

class ProgressBar {
  constructor(total) {
    this.total = total;
    this.current = 0;
    this.barLength = 40;
    this.startTime = Date.now();
  }

  update(current) {
    this.current = current;
    const percent = (current / this.total) * 100;
    const filled = Math.round((this.barLength * current) / this.total);
    const bar = "█".repeat(filled) + "░".repeat(this.barLength - filled);

    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = current / elapsed;
    const eta = (this.total - current) / rate;

    process.stdout.write("\r" + " ".repeat(80) + "\r");
    process.stdout.write(
      `Progress: [${bar}] ${percent.toFixed(1)}% | ` +
        `${current.toLocaleString()}/${this.total.toLocaleString()} | ` +
        `${rate.toFixed(0)}/sec | ` +
        `ETA: ${eta.toFixed(0)}s`
    );
  }

  complete() {
    this.update(this.total);
    console.log("\n");
  }
}

const test = new MegaStressTest({
  cases: parseInt(process.argv[2]) || 10000,
  batchSize: parseInt(process.argv[3]) || 100,
});

test.run().catch(console.error);
