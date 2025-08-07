// scripts/run-comprehensive-stress-test.js
const path = require("path");
const fs = require("fs").promises;
const { performance } = require("perf_hooks");
const os = require("os");
const v8 = require("v8");
const cluster = require("cluster");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");
dotenv.config();

class ComprehensiveStressTestRunner {
  constructor(options = {}) {
    this.options = {
      scenarios: options.scenarios || [
        { cases: 100, proxiesPerCase: 2, parallel: 2 },
        { cases: 500, proxiesPerCase: 3, parallel: 3 },
        { cases: 1000, proxiesPerCase: 4, parallel: 4 },
        { cases: 2000, proxiesPerCase: 5, parallel: 5 },
        { cases: 5000, proxiesPerCase: 7, parallel: 7 },
        { cases: 10000, proxiesPerCase: 10, parallel: 10 },
      ],
      outputDir: options.outputDir || "./results",
      baselineMetrics:
        options.baselineMetrics || "./config/baseline-metrics.json",
      verbose: options.verbose || false,
      // Updated API URL to match the correct endpoint structure
      apiBaseUrl:
        options.apiBaseUrl || "http://localhost:8060/api/schedulingcases",
      authToken:
        process.env.STRESS_TEST_TOKEN ||
        options.authToken ||
        this.getHardcodedToken(),
      mongoUrl: options.mongoUrl || "mongodb://localhost:27017",
      tenantId: options.tenantId || "66045e2350e8d495ec17bbe9",
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      ...options,
    };

    this.metrics = {
      system: {},
      scenarios: [],
      aggregated: {},
      errors: [],
      warnings: [],
    };

    this.startTime = null;
    this.endTime = null;
    this.apiClient = null;
    this.mongoClient = null;
    this.logs = [];
  }

  getHardcodedToken() {
    // Fallback token from the enhanced stress test
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx1Y2FAYW1idWZsb3cuY29tIiwic3ViIjoidXNlcl9XRHFRdkxlQ2tkOTl1R1FGaCIsInRlbmFudElkIjoiNjYwNDVlMjM1MGU4ZDQ5NWVjMTdiYmU5IiwiaWF0IjoxNzU0MDQzMDgxfQ.YQ3vChCL7hvVM5m_opIiIRXFO_Kr5Y--cCKVTFMlAow";
  }

  async initialize() {
    console.log("🔧 Initializing stress test framework...\n");

    // Setup API client with authentication
    if (!this.options.authToken) {
      console.warn("⚠️  STRESS_TEST_TOKEN not found, using hardcoded token...");
    }

    this.apiClient = axios.create({
      baseURL: this.options.apiBaseUrl,
      headers: {
        Authorization: `Bearer ${this.options.authToken}`,
        "Content-Type": "application/json",
        "x-tenant-id": this.options.tenantId,
        Accept: "application/json",
      },
      timeout: 30000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Add request/response interceptors for better debugging
    this.apiClient.interceptors.request.use(
      (config) => {
        if (this.options.verbose) {
          console.log(
            `📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`
          );
        }
        return config;
      },
      (error) => {
        this.logError("Request interceptor error", error);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        if (this.options.verbose) {
          console.log(`📥 ${response.status} ${response.config.url}`);
        }
        return response;
      },
      (error) => {
        if (this.options.verbose && error.response) {
          console.log(`❌ ${error.response.status} ${error.config.url}`);
          if (error.response.data) {
            console.log(`   Response: ${JSON.stringify(error.response.data)}`);
          }
        }
        return Promise.reject(error);
      }
    );

    // Setup MongoDB connection for counting
    try {
      this.mongoClient = new MongoClient(this.options.mongoUrl, {
        maxPoolSize: 50,
        minPoolSize: 10,
      });
      await this.mongoClient.connect();
      console.log("✅ Connected to MongoDB for metrics collection\n");
    } catch (error) {
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }

    // Verify API connectivity - try to fetch cases instead of health endpoint
    try {
      await this.apiClient.get("/cases?limit=1");
      console.log("✅ API connection verified\n");
    } catch (error) {
      console.warn("⚠️  API verification failed, but continuing...\n");
      if (this.options.verbose) {
        console.warn(`   Error: ${error.message}`);
      }
    }
  }

  async cleanup() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }

  async runAllScenarios() {
    console.log("🚀 Starting Comprehensive Stress Test\n");

    try {
      await this.initialize();

      this.startTime = new Date();
      this.logInfo("Stress test started", {
        scenarios: this.options.scenarios.length,
        apiBaseUrl: this.options.apiBaseUrl,
      });

      // Record initial system state
      this.metrics.system.initial = await this.captureSystemMetrics();

      // Load baseline metrics
      const baseline = await this.loadBaselineMetrics();

      // Run each scenario
      for (const [index, scenario] of this.options.scenarios.entries()) {
        console.log(
          `\n📊 Running Scenario ${index + 1}/${
            this.options.scenarios.length
          }: ${scenario.cases} cases, ${scenario.proxiesPerCase} proxies each`
        );

        const scenarioResult = await this.runScenario(scenario);
        this.metrics.scenarios.push(scenarioResult);

        // Allow system to stabilize between scenarios
        if (index < this.options.scenarios.length - 1) {
          console.log("  ⏳ Allowing system to stabilize...");
          await this.delay(5000);
        }
      }

      this.endTime = new Date();
      this.logInfo("Stress test completed", {
        duration: (this.endTime - this.startTime) / 1000,
      });

      // Capture final system state
      this.metrics.system.final = await this.captureSystemMetrics();

      // Calculate aggregated metrics
      this.metrics.aggregated = this.calculateAggregatedMetrics();

      // Generate reports
      await this.generateReports(baseline);

      return this.metrics;
    } finally {
      await this.cleanup();
    }
  }

  async runScenario(scenario) {
    const scenarioMetrics = {
      config: scenario,
      startTime: new Date(),
      endTime: null,
      performance: {
        cases: [],
        proxies: [],
        fragments: [],
        events: [],
      },
      success: {
        cases: { created: 0, failed: 0 },
        proxies: { created: 0, failed: 0 },
        fragments: { created: 0, failed: 0 },
        events: { processed: 0, failed: 0 },
      },
      timing: {},
      memory: {
        start: process.memoryUsage(),
        end: null,
        peak: 0,
      },
      database: {},
      errors: [],
      retries: 0,
    };

    const startMark = performance.now();

    try {
      // Create cases in batches
      const batches = this.createBatches(scenario.cases, scenario.parallel);
      const totalBatches = batches.length;

      for (const [batchIndex, batch] of batches.entries()) {
        const progress = (((batchIndex + 1) / totalBatches) * 100).toFixed(1);
        console.log(
          `  📦 Processing batch ${batchIndex + 1}/${totalBatches} (${
            batch.length
          } cases) - ${progress}% complete`
        );

        const batchStart = performance.now();
        const batchResults = await this.processBatch(batch, scenario);
        const batchEnd = performance.now();

        // Collect batch metrics
        scenarioMetrics.performance.cases.push(...batchResults.cases);
        scenarioMetrics.success.cases.created += batchResults.success.cases;
        scenarioMetrics.success.cases.failed += batchResults.failed.cases;
        scenarioMetrics.retries += batchResults.retries;

        // Update peak memory usage
        const currentMemory = process.memoryUsage();
        scenarioMetrics.memory.peak = Math.max(
          scenarioMetrics.memory.peak,
          currentMemory.heapUsed
        );

        // Log batch performance
        const batchTime = (batchEnd - batchStart) / 1000;
        const batchRate = batch.length / batchTime;
        console.log(
          `     ⚡ Batch completed in ${batchTime.toFixed(
            2
          )}s (${batchRate.toFixed(2)} cases/s)`
        );

        // Monitor system health
        const health = await this.checkSystemHealth();
        if (!health.healthy) {
          console.warn(
            `  ⚠️  System health degraded: ${health.warnings.join(", ")}`
          );
          console.log("     Pausing for system recovery...");
          await this.delay(10000);
        }

        // Progress indicator
        if (batchIndex % 10 === 0 && batchIndex > 0) {
          const elapsed = (performance.now() - startMark) / 1000;
          const remaining =
            (elapsed / (batchIndex + 1)) * (totalBatches - batchIndex - 1);
          console.log(
            `  ⏱️  Elapsed: ${this.formatTime(
              elapsed
            )}, Estimated remaining: ${this.formatTime(remaining)}`
          );
        }
      }

      // Wait for proxy/fragment creation
      console.log("  ⏳ Waiting for proxy and fragment creation...");
      const waitStart = Date.now();

      // Progressive waiting with status updates
      for (let i = 0; i < 30; i++) {
        await this.delay(1000);
        if (i % 5 === 4) {
          const interim = await this.getInterimCounts();
          console.log(
            `     📊 Interim: ${interim.proxies} proxies, ${interim.fragments} fragments, ${interim.events} events`
          );
        }
      }

      const waitTime = (Date.now() - waitStart) / 1000;
      console.log(`  ✅ Wait completed (${waitTime}s)`);

      // Validate results
      console.log("  🔍 Validating results...");
      const validation = await this.validateScenarioResults(
        scenario,
        scenarioMetrics
      );
      scenarioMetrics.validation = validation;

      // Update success metrics from validation
      scenarioMetrics.success.proxies.created = validation.proxies.created;
      scenarioMetrics.success.fragments.created = validation.fragments.created;
      scenarioMetrics.success.events.processed = validation.events.processed;

      // Log validation results
      console.log(`  📊 Validation Results:`);
      console.log(
        `     Cases: ${validation.cases.created}/${
          validation.cases.expected
        } (${validation.cases.valid ? "✅" : "❌"})`
      );
      console.log(
        `     Proxies: ${validation.proxies.created}/${
          validation.proxies.expected
        } (${validation.proxies.valid ? "✅" : "❌"})`
      );
      console.log(
        `     Fragments: ${validation.fragments.created} (${
          validation.fragments.valid ? "✅" : "❌"
        })`
      );
      console.log(
        `     Events: ${validation.events.processed} (${
          validation.events.valid ? "✅" : "❌"
        })`
      );
    } catch (error) {
      console.error(`  ❌ Scenario failed: ${error.message}`);
      scenarioMetrics.errors.push({
        type: "SCENARIO_ERROR",
        message: error.message,
        stack: error.stack,
        timestamp: new Date(),
      });
      this.logError("Scenario execution failed", error);
    }

    const endMark = performance.now();
    scenarioMetrics.timing.total = endMark - startMark;
    scenarioMetrics.endTime = new Date();
    scenarioMetrics.memory.end = process.memoryUsage();

    // Calculate rates
    const totalSeconds = scenarioMetrics.timing.total / 1000;
    scenarioMetrics.rates = {
      casesPerSecond: scenarioMetrics.success.cases.created / totalSeconds,
      proxiesPerSecond: scenarioMetrics.success.proxies.created / totalSeconds,
      eventsPerSecond: scenarioMetrics.success.events.processed / totalSeconds,
      failureRate:
        (scenarioMetrics.success.cases.failed / scenario.cases) * 100,
    };

    // Log scenario summary
    console.log(`\n  📈 Scenario Summary:`);
    console.log(`     Duration: ${this.formatTime(totalSeconds)}`);
    console.log(
      `     Success Rate: ${(
        (scenarioMetrics.success.cases.created / scenario.cases) *
        100
      ).toFixed(2)}%`
    );
    console.log(
      `     Throughput: ${scenarioMetrics.rates.casesPerSecond.toFixed(
        2
      )} cases/s`
    );
    console.log(
      `     Memory Growth: ${(
        (scenarioMetrics.memory.peak - scenarioMetrics.memory.start.heapUsed) /
        1024 /
        1024
      ).toFixed(2)} MB`
    );

    return scenarioMetrics;
  }

  createBatches(totalItems, batchSize) {
    const batches = [];
    for (let i = 0; i < totalItems; i += batchSize) {
      batches.push(
        Array.from(
          { length: Math.min(batchSize, totalItems - i) },
          (_, j) => i + j
        )
      );
    }
    return batches;
  }

  async processBatch(batch, scenario) {
    const results = {
      cases: [],
      success: { cases: 0, proxies: 0, fragments: 0 },
      failed: { cases: 0, proxies: 0, fragments: 0 },
      retries: 0,
    };

    // Process cases in parallel with controlled concurrency
    const promises = batch.map((index) =>
      this.createCaseWithRetry(index, scenario)
        .then((result) => ({ status: "fulfilled", value: result }))
        .catch((error) => ({ status: "rejected", reason: error }))
    );

    const batchResults = await Promise.all(promises);

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.cases.push(result.value);
        results.success.cases++;
        results.retries += result.value.retries || 0;
      } else {
        results.failed.cases++;
        if (this.options.verbose) {
          console.error(`     ❌ Failed case: ${result.reason.message}`);
        }
      }
    }

    return results;
  }

  async createCaseWithRetry(index, scenario, attempt = 1) {
    try {
      return await this.createCaseWithProxies(index, scenario);
    } catch (error) {
      if (attempt < this.options.retryAttempts) {
        if (this.options.verbose) {
          console.log(
            `     🔄 Retrying case ${index} (attempt ${attempt + 1}/${
              this.options.retryAttempts
            })`
          );
        }
        await this.delay(this.options.retryDelay * attempt);
        const result = await this.createCaseWithRetry(
          index,
          scenario,
          attempt + 1
        );
        result.retries = attempt;
        return result;
      }
      throw error;
    }
  }

  async createCaseWithProxies(index, scenario) {
    const caseStart = performance.now();

    try {
      // Generate unique case data without caseNumber - let API generate it
      const timestamp = Date.now();
      const uniqueId = `${timestamp}_${index}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Structure matches what the enhanced stress test uses
      const caseData = {
        // Don't include caseNumber - let the API generate it
        bookingSection: {
          surgeryDate: new Date(Date.now() + index * 3600000).toISOString(),
          doctorId: [
            `user_6EnqFa5TaWCtuy4wD`,
            `user_m8jwbhyayXsWHYejt`,
            `user_eY4NJhj5mCSnX9f2w`,
          ][index % 3],
          contractId: [
            `contract_DSg8orNxSST5FKjpz`,
            `contract_fBcmjb7KxyZcbXHdS`,
            `contract_8gvCPHbqX77uKAhcR`,
          ][index % 3],
          opStandardId: [
            `op_TdqjJp7oNJiG6oRbF`,
            `op_msEfjHdjtR8uWy8ei`,
            `op_XyoZchRyvFzP5m4ow`,
            `op_5L4D7nEqXDsMsMLFv`,
          ][index % 4],
          insuranceId: `insurance_${index % 7}`,
          paymentMethod: ["Cash", "Credit Card", "Insurance"][index % 3],
        },
        bookingPatient: {
          patientId: `patient_${index}`,
          firstName: `StressTest`,
          lastName: `Patient${index}`,
          birthDate: new Date(
            1970 + (index % 50),
            index % 12,
            (index % 28) + 1
          ).toISOString(),
        },
        preOpSection: {
          materials: this.generateMaterials(scenario, index),
        },
        timestampsSection: {
          roomEnterTimestamp: new Date().toISOString(),
          roomExitTimestamp: new Date(Date.now() + 3600000).toISOString(),
          releaseForSurgeryTimestamp: new Date(
            Date.now() + 300000
          ).toISOString(),
          endOfSurgicalMeasuresTimestamp: new Date(
            Date.now() + 3300000
          ).toISOString(),
        },
        anesthesiaSection: {
          anesthesiaTypes:
            index % 3 === 0
              ? ["General Anesthesia"]
              : index % 3 === 1
              ? ["Regional Anesthesia"]
              : [],
          anesthesiologistPresence:
            index % 2 === 0
              ? "WITH_ANESTHESIOLOGIST"
              : "WITHOUT_ANESTHESIOLOGIST",
        },
        billingSection: {
          category: ["A", "B", "C1", "C2", "C3", "D", "E", "F", "G"][index % 9],
          deposit: Math.floor(Math.random() * 500) + 100,
          estimatedCost: Math.floor(Math.random() * 5000) + 1000,
        },
        status: "SCHEDULED",
        tenantId: this.options.tenantId,
        metadata: {
          testRun: this.startTime.toISOString(),
          scenarioIndex: index,
          uniqueId: uniqueId,
        },
      };

      // Create case via API - note the endpoint is just /cases
      const response = await this.apiClient.post("/cases", caseData);

      const caseEnd = performance.now();
      const creationTime = caseEnd - caseStart;

      const result = {
        caseId: response.data._id || response.data.id,
        caseNumber: response.data.caseNumber, // Use the API-generated number
        creationTime: creationTime,
        statusCode: response.status,
        success: true,
        timestamp: new Date(),
        retries: 0,
      };

      // Log success if verbose
      if (this.options.verbose && index % 100 === 0) {
        console.log(
          `     ✅ Created case ${index}: ${
            result.caseNumber
          } in ${creationTime.toFixed(2)}ms`
        );
      }

      return result;
    } catch (error) {
      const errorData = {
        index,
        error: error.message,
        statusCode: error.response?.status,
        data: error.response?.data,
        timestamp: new Date(),
      };

      this.logError(`Failed to create case ${index}`, errorData);

      throw new Error(`Case ${index} creation failed: ${error.message}`);
    }
  }

  generateMaterials(scenario, index) {
    const materials = [];
    const materialCount = Math.min(
      Math.floor(Math.random() * 10) + 1,
      scenario.proxiesPerCase
    );

    for (let i = 0; i < materialCount; i++) {
      materials.push({
        code: `MAT_${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(4, "0")}`,
        name: `Test Material ${i + 1}`,
        quantity: Math.floor(Math.random() * 5) + 1,
        unitPrice: Math.floor(Math.random() * 100) + 10,
        isSachkosten: Math.random() > 0.7,
        category: ["Implant", "Consumable", "Instrument", "Medication"][i % 4],
      });
    }

    return materials;
  }

  async captureSystemMetrics() {
    const cpuUsage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();

    // Get MongoDB metrics
    let dbMetrics = {};
    try {
      const adminDb = this.mongoClient.db("admin");
      const serverStatus = await adminDb.admin().serverStatus();
      dbMetrics = {
        connections: serverStatus.connections?.current || 0,
        opcounters: serverStatus.opcounters,
        avgObjSize: serverStatus.metrics?.document?.returned || 0,
      };
    } catch (error) {
      // Ignore DB metrics errors
    }

    return {
      timestamp: new Date(),
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        percent: (os.loadavg()[0] / os.cpus().length) * 100,
      },
      memory: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        heapSizeLimit: heapStats.heap_size_limit,
        totalAvailable: os.totalmem(),
        free: os.freemem(),
        percentUsed: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
      },
      system: {
        platform: os.platform(),
        cpus: os.cpus().length,
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        nodeVersion: process.version,
      },
      database: dbMetrics,
    };
  }

  async checkSystemHealth() {
    const metrics = await this.captureSystemMetrics();

    const health = {
      healthy: true,
      warnings: [],
      metrics,
    };

    // Check CPU usage
    if (metrics.cpu.percent > 80) {
      health.warnings.push(`CPU usage at ${metrics.cpu.percent.toFixed(1)}%`);
      health.healthy = false;
    }

    // Check memory usage
    const memoryUsagePercent =
      (metrics.memory.heapUsed / metrics.memory.heapSizeLimit) * 100;
    if (memoryUsagePercent > 80) {
      health.warnings.push(`Heap usage at ${memoryUsagePercent.toFixed(1)}%`);
      health.healthy = false;
    }

    if (metrics.memory.percentUsed > 90) {
      health.warnings.push(
        `System memory at ${metrics.memory.percentUsed.toFixed(1)}%`
      );
      health.healthy = false;
    }

    // Check database health
    const dbHealth = await this.checkDatabaseHealth();
    if (!dbHealth.healthy) {
      health.warnings.push(`Database latency ${dbHealth.responseTime}ms`);
      health.healthy = false;
    }

    return health;
  }

  async checkDatabaseHealth() {
    try {
      const start = Date.now();
      await this.mongoClient.db("admin").admin().ping();
      const responseTime = Date.now() - start;

      return {
        healthy: responseTime < 100,
        responseTime,
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  async getInterimCounts() {
    try {
      const db = this.mongoClient.db("universal-reporting");
      const [proxies, fragments, events] = await Promise.all([
        db.collection("proxies").countDocuments({
          $or: [
            { "context.caseNumber": { $regex: /^STRESS_/ } },
            { "context.metadata.uniqueId": { $exists: true } },
          ],
        }),
        db
          .collection("fragments")
          .countDocuments({ createdAt: { $gte: this.startTime } }),
        db.collection("importedevents").countDocuments({
          processed: true,
          createdAt: { $gte: this.startTime },
        }),
      ]);

      return { proxies, fragments, events };
    } catch (error) {
      return { proxies: 0, fragments: 0, events: 0 };
    }
  }

  async validateScenarioResults(scenario, metrics) {
    const validation = {
      cases: {
        expected: scenario.cases,
        created: metrics.success.cases.created,
        valid: false,
        percentage: 0,
      },
      proxies: {
        expected: scenario.cases * scenario.proxiesPerCase,
        created: 0,
        valid: false,
        percentage: 0,
      },
      fragments: {
        created: 0,
        valid: false,
        averagePerProxy: 0,
      },
      events: {
        processed: 0,
        valid: false,
        processingRate: 0,
      },
      dataIntegrity: {
        checked: false,
        valid: false,
        issues: [],
      },
    };

    // Count actual results from database
    try {
      const counts = await this.getDetailedCounts(scenario, metrics);

      validation.proxies.created = counts.proxies;
      validation.fragments.created = counts.fragments;
      validation.events.processed = counts.events;

      // Calculate percentages and validity
      validation.cases.percentage =
        (validation.cases.created / validation.cases.expected) * 100;
      validation.cases.valid = validation.cases.percentage >= 95;

      validation.proxies.percentage =
        (validation.proxies.created / validation.proxies.expected) * 100;
      validation.proxies.valid = validation.proxies.percentage >= 90;

      validation.fragments.averagePerProxy =
        validation.proxies.created > 0
          ? validation.fragments.created / validation.proxies.created
          : 0;
      validation.fragments.valid =
        validation.fragments.created > 0 &&
        validation.fragments.averagePerProxy >= 1;

      validation.events.processingRate =
        (counts.processedEvents / counts.totalEvents) * 100;
      validation.events.valid =
        validation.events.processed >= scenario.cases &&
        validation.events.processingRate >= 95;

      // Check data integrity
      validation.dataIntegrity = await this.checkDataIntegrity(
        scenario,
        metrics
      );
    } catch (error) {
      console.error("  ❌ Validation error:", error.message);
      this.logError("Validation failed", error);
    }

    return validation;
  }

  async getDetailedCounts(scenario, metrics) {
    const db = this.mongoClient.db("universal-reporting");
    const casesDb = this.mongoClient.db("scheduling-cases");

    // Build time-based queries
    const timeQuery = {
      createdAt: {
        $gte: scenario.startTime,
        $lte: scenario.endTime || new Date(),
      },
    };

    // Get all counts in parallel
    const [proxies, fragments, totalEvents, processedEvents, cases] =
      await Promise.all([
        db.collection("proxies").countDocuments({
          $or: [
            { "context.caseNumber": { $regex: /^STRESS_/ } },
            { "context.metadata.uniqueId": { $exists: true } },
          ],
          ...timeQuery,
        }),
        db.collection("fragments").countDocuments(timeQuery),
        db.collection("importedevents").countDocuments({
          source: "schedulingCases",
          ...timeQuery,
        }),
        db.collection("importedevents").countDocuments({
          source: "schedulingCases",
          processed: true,
          ...timeQuery,
        }),
        casesDb.collection("cases").countDocuments({
          $or: [
            { caseNumber: { $regex: /^STRESS_/ } },
            { "metadata.uniqueId": { $exists: true } },
          ],
          ...timeQuery,
        }),
      ]);

    return {
      proxies,
      fragments,
      events: processedEvents,
      totalEvents,
      processedEvents,
      cases,
    };
  }

  async checkDataIntegrity(scenario, metrics) {
    const result = {
      checked: true,
      valid: true,
      issues: [],
    };

    try {
      const db = this.mongoClient.db("universal-reporting");

      // Sample check: Verify proxies have required fields
      const sampleProxies = await db
        .collection("proxies")
        .find({
          $or: [
            { "context.caseNumber": { $regex: /^STRESS_/ } },
            { "context.metadata.uniqueId": { $exists: true } },
          ],
        })
        .limit(10)
        .toArray();

      for (const proxy of sampleProxies) {
        if (!proxy.domainId || !proxy.context || !proxy.tenantId) {
          result.valid = false;
          result.issues.push(`Proxy ${proxy._id} missing required fields`);
        }
      }

      // Check for orphaned fragments
      const orphanedFragments = await db
        .collection("fragments")
        .countDocuments({
          proxyId: { $exists: true },
          createdAt: { $gte: scenario.startTime },
        });

      if (orphanedFragments > 0) {
        result.issues.push(
          `Found ${orphanedFragments} fragments without valid proxy references`
        );
      }
    } catch (error) {
      result.checked = false;
      result.issues.push(`Integrity check failed: ${error.message}`);
    }

    return result;
  }

  async countProxiesCreated(scenario) {
    try {
      const db = this.mongoClient.db("universal-reporting");
      const count = await db.collection("proxies").countDocuments({
        $or: [
          { "context.caseNumber": { $regex: /^STRESS_/ } },
          { "context.metadata.uniqueId": { $exists: true } },
        ],
        createdAt: {
          $gte: scenario?.startTime || this.startTime,
          $lte: scenario?.endTime || new Date(),
        },
      });
      return count;
    } catch (error) {
      console.error("Error counting proxies:", error.message);
      return 0;
    }
  }

  async countFragmentsCreated(scenario) {
    try {
      const db = this.mongoClient.db("universal-reporting");
      const count = await db.collection("fragments").countDocuments({
        createdAt: {
          $gte: scenario?.startTime || this.startTime,
          $lte: scenario?.endTime || new Date(),
        },
      });
      return count;
    } catch (error) {
      console.error("Error counting fragments:", error.message);
      return 0;
    }
  }

  async countEventsProcessed(scenario) {
    try {
      const db = this.mongoClient.db("universal-reporting");
      const count = await db.collection("importedevents").countDocuments({
        processed: true,
        source: "schedulingCases",
        createdAt: {
          $gte: scenario?.startTime || this.startTime,
          $lte: scenario?.endTime || new Date(),
        },
      });
      return count;
    } catch (error) {
      console.error("Error counting events:", error.message);
      return 0;
    }
  }

  calculateAggregatedMetrics() {
    const aggregated = {
      totalCases: 0,
      totalProxies: 0,
      totalFragments: 0,
      totalEvents: 0,
      totalRetries: 0,
      averageResponseTime: 0,
      medianResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      successRate: 0,
      throughput: {
        cases: 0,
        proxies: 0,
        events: 0,
      },
      memoryGrowth: 0,
      peakMemory: 0,
    };

    // Calculate aggregates from scenario results
    for (const scenario of this.metrics.scenarios) {
      aggregated.totalCases += scenario.success.cases.created;
      aggregated.totalProxies += scenario.success.proxies.created;
      aggregated.totalFragments += scenario.success.fragments.created;
      aggregated.totalEvents += scenario.success.events.processed;
      aggregated.totalRetries += scenario.retries || 0;
      aggregated.peakMemory = Math.max(
        aggregated.peakMemory,
        scenario.memory.peak || 0
      );
    }

    // Calculate memory growth
    if (this.metrics.system.initial && this.metrics.system.final) {
      aggregated.memoryGrowth =
        this.metrics.system.final.memory.heapUsed -
        this.metrics.system.initial.memory.heapUsed;
    }

    // Calculate rates
    const totalTime = (this.endTime - this.startTime) / 1000; // seconds
    aggregated.throughput.cases = aggregated.totalCases / totalTime;
    aggregated.throughput.proxies = aggregated.totalProxies / totalTime;
    aggregated.throughput.events = aggregated.totalEvents / totalTime;

    // Calculate response time statistics
    const allResponseTimes = [];
    for (const scenario of this.metrics.scenarios) {
      for (const caseMetric of scenario.performance.cases) {
        if (caseMetric.creationTime) {
          allResponseTimes.push(caseMetric.creationTime);
          aggregated.minResponseTime = Math.min(
            aggregated.minResponseTime,
            caseMetric.creationTime
          );
          aggregated.maxResponseTime = Math.max(
            aggregated.maxResponseTime,
            caseMetric.creationTime
          );
        }
      }
    }

    if (allResponseTimes.length > 0) {
      allResponseTimes.sort((a, b) => a - b);
      aggregated.averageResponseTime =
        allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;
      aggregated.medianResponseTime =
        allResponseTimes[Math.floor(allResponseTimes.length * 0.5)];
      aggregated.p95ResponseTime =
        allResponseTimes[Math.floor(allResponseTimes.length * 0.95)];
      aggregated.p99ResponseTime =
        allResponseTimes[Math.floor(allResponseTimes.length * 0.99)];
    }

    // Calculate success rate
    const totalAttempts = this.metrics.scenarios.reduce(
      (sum, s) => sum + s.config.cases,
      0
    );
    aggregated.successRate =
      totalAttempts > 0 ? (aggregated.totalCases / totalAttempts) * 100 : 0;

    return aggregated;
  }

  async generateReports(baseline) {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const resultsDir = path.join(
      this.options.outputDir,
      `stress-test-${timestamp}`
    );

    await fs.mkdir(resultsDir, { recursive: true });

    // 1. Metrics JSON (complete data)
    await fs.writeFile(
      path.join(resultsDir, "metrics.json"),
      JSON.stringify(this.metrics, null, 2)
    );

    // 2. Summary JSON (high-level overview)
    const summary = this.generateSummary();
    await fs.writeFile(
      path.join(resultsDir, "summary.json"),
      JSON.stringify(summary, null, 2)
    );

    // 3. Logs JSON
    await fs.writeFile(
      path.join(resultsDir, "logs.json"),
      JSON.stringify(this.logs, null, 2)
    );

    // 4. Analysis and recommendations
    const analysis = this.generateAnalysis(baseline);
    await fs.writeFile(
      path.join(resultsDir, "analysis.json"),
      JSON.stringify(analysis, null, 2)
    );

    // 5. HTML Reports
    await this.generateHTMLReports(resultsDir, analysis, summary);

    // 6. CSV Export for further analysis
    await this.generateCSVExport(resultsDir);

    console.log(`\n📊 Reports generated in: ${resultsDir}`);
  }

  generateSummary() {
    const summary = {
      testInfo: {
        startTime: this.startTime,
        endTime: this.endTime,
        duration: (this.endTime - this.startTime) / 1000,
        scenarios: this.options.scenarios.length,
        totalCasesRequested: this.options.scenarios.reduce(
          (sum, s) => sum + s.cases,
          0
        ),
        apiBaseUrl: this.options.apiBaseUrl,
      },
      results: {
        totalCasesCreated: this.metrics.aggregated.totalCases,
        totalProxiesCreated: this.metrics.aggregated.totalProxies,
        totalFragmentsCreated: this.metrics.aggregated.totalFragments,
        totalEventsProcessed: this.metrics.aggregated.totalEvents,
        overallSuccessRate: this.metrics.aggregated.successRate,
        totalRetries: this.metrics.aggregated.totalRetries,
      },
      performance: {
        averageResponseTime: this.metrics.aggregated.averageResponseTime,
        medianResponseTime: this.metrics.aggregated.medianResponseTime,
        p95ResponseTime: this.metrics.aggregated.p95ResponseTime,
        p99ResponseTime: this.metrics.aggregated.p99ResponseTime,
        minResponseTime: this.metrics.aggregated.minResponseTime,
        maxResponseTime: this.metrics.aggregated.maxResponseTime,
        throughput: this.metrics.aggregated.throughput,
      },
      resources: {
        memoryGrowth:
          (this.metrics.aggregated.memoryGrowth / 1024 / 1024).toFixed(2) +
          " MB",
        peakMemory:
          (this.metrics.aggregated.peakMemory / 1024 / 1024).toFixed(2) + " MB",
        cpuUsage: {
          initial: this.metrics.system.initial?.cpu.percent.toFixed(2) + "%",
          final: this.metrics.system.final?.cpu.percent.toFixed(2) + "%",
        },
      },
      errors: this.metrics.errors.length,
      warnings: this.metrics.warnings.length,
    };

    return summary;
  }

  generateAnalysis(baseline) {
    const analysis = {
      summary: {
        status: "UNKNOWN",
        score: 0,
        recommendations: [],
      },
      performance: {
        responseTime: this.analyzeMetric(
          this.metrics.aggregated.averageResponseTime || 0,
          baseline?.performance?.responseTime ||
            this.getDefaultBaseline().performance.responseTime
        ),
        throughput: this.analyzeMetric(
          this.metrics.aggregated.throughput.cases || 0,
          baseline?.performance?.throughput ||
            this.getDefaultBaseline().performance.throughput
        ),
        successRate: this.analyzeMetric(
          this.metrics.aggregated.successRate || 0,
          baseline?.performance?.successRate ||
            this.getDefaultBaseline().performance.successRate
        ),
      },
      system: {
        cpu: this.analyzeSystemMetric(
          "cpu",
          baseline || this.getDefaultBaseline()
        ),
        memory: this.analyzeSystemMetric(
          "memory",
          baseline || this.getDefaultBaseline()
        ),
      },
      recommendations: [],
      strengths: [],
      concerns: [],
    };

    // Calculate overall score
    const scores = [
      analysis.performance.responseTime.score,
      analysis.performance.throughput.score,
      analysis.performance.successRate.score,
      analysis.system.cpu.score,
      analysis.system.memory.score,
    ];

    analysis.summary.score = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Determine status
    if (analysis.summary.score >= 90) {
      analysis.summary.status = "EXCELLENT";
    } else if (analysis.summary.score >= 75) {
      analysis.summary.status = "GOOD";
    } else if (analysis.summary.score >= 60) {
      analysis.summary.status = "ACCEPTABLE";
    } else if (analysis.summary.score >= 40) {
      analysis.summary.status = "POOR";
    } else {
      analysis.summary.status = "CRITICAL";
    }

    // Identify strengths
    if (
      analysis.performance.responseTime.status === "EXCELLENT" ||
      analysis.performance.responseTime.status === "GOOD"
    ) {
      analysis.strengths.push("Response times are within acceptable ranges");
    }
    if (analysis.performance.successRate.status === "EXCELLENT") {
      analysis.strengths.push("Excellent reliability with minimal failures");
    }
    if (
      analysis.system.memory.status === "EXCELLENT" ||
      analysis.system.memory.status === "GOOD"
    ) {
      analysis.strengths.push("Memory usage is well-controlled");
    }

    // Identify concerns
    if (
      analysis.performance.throughput.status === "POOR" ||
      analysis.performance.throughput.status === "CRITICAL"
    ) {
      analysis.concerns.push("Throughput is below expected levels");
    }
    if (
      this.metrics.aggregated.totalRetries >
      this.metrics.aggregated.totalCases * 0.1
    ) {
      analysis.concerns.push("High retry rate indicates instability");
    }

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  analyzeMetric(actual, baseline) {
    const result = {
      actual,
      baseline,
      score: 0,
      status: "UNKNOWN",
      deviation: 0,
    };

    if (!baseline || typeof actual !== "number" || !isFinite(actual)) {
      return result;
    }

    if (baseline.direction === "lower") {
      // Lower is better (e.g., response time)
      if (actual <= baseline.excellent) {
        result.score = 100;
        result.status = "EXCELLENT";
      } else if (actual <= baseline.good) {
        result.score = 80;
        result.status = "GOOD";
      } else if (actual <= baseline.acceptable) {
        result.score = 60;
        result.status = "ACCEPTABLE";
      } else if (actual <= baseline.poor) {
        result.score = 40;
        result.status = "POOR";
      } else {
        result.score = 20;
        result.status = "CRITICAL";
      }
    } else {
      // Higher is better (e.g., throughput, success rate)
      if (actual >= baseline.excellent) {
        result.score = 100;
        result.status = "EXCELLENT";
      } else if (actual >= baseline.good) {
        result.score = 80;
        result.status = "GOOD";
      } else if (actual >= baseline.acceptable) {
        result.score = 60;
        result.status = "ACCEPTABLE";
      } else if (actual >= baseline.poor) {
        result.score = 40;
        result.status = "POOR";
      } else {
        result.score = 20;
        result.status = "CRITICAL";
      }
    }

    result.deviation = baseline.target
      ? ((actual - baseline.target) / baseline.target) * 100
      : 0;

    return result;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Response time recommendations
    if (
      analysis.performance.responseTime.status === "POOR" ||
      analysis.performance.responseTime.status === "CRITICAL"
    ) {
      recommendations.push({
        category: "PERFORMANCE",
        priority: "HIGH",
        title: "High Response Times Detected",
        description: `Average response time of ${analysis.performance.responseTime.actual.toFixed(
          2
        )}ms exceeds acceptable thresholds.`,
        impact: "User experience degradation and potential timeouts",
        suggestions: [
          "Optimize database queries and add appropriate indexes",
          "Implement caching for frequently accessed data",
          "Review and optimize trigger evaluation logic",
          "Check for N+1 query problems in the code",
          "Consider implementing database connection pooling",
        ],
        metrics: {
          current: analysis.performance.responseTime.actual,
          target: analysis.performance.responseTime.baseline.target,
          improvement:
            analysis.performance.responseTime.baseline.target -
            analysis.performance.responseTime.actual,
        },
      });
    }

    // Throughput recommendations
    if (
      analysis.performance.throughput.status === "POOR" ||
      analysis.performance.throughput.status === "CRITICAL"
    ) {
      recommendations.push({
        category: "PERFORMANCE",
        priority: "HIGH",
        title: "Low System Throughput",
        description: `System is processing only ${analysis.performance.throughput.actual.toFixed(
          2
        )} cases/second.`,
        impact: "Unable to handle expected load levels",
        suggestions: [
          "Increase parallel processing capabilities",
          "Optimize event processing batch sizes",
          "Consider horizontal scaling of services",
          "Review and optimize database connection pooling",
          "Implement queue-based processing for better load distribution",
        ],
        metrics: {
          current: analysis.performance.throughput.actual,
          target: analysis.performance.throughput.baseline.target,
          scaleFactor:
            analysis.performance.throughput.baseline.target /
            analysis.performance.throughput.actual,
        },
      });
    }

    // Success rate recommendations
    if (
      analysis.performance.successRate.status !== "EXCELLENT" &&
      analysis.performance.successRate.status !== "GOOD"
    ) {
      recommendations.push({
        category: "RELIABILITY",
        priority: "CRITICAL",
        title: "Low Success Rate",
        description: `Only ${analysis.performance.successRate.actual.toFixed(
          2
        )}% of operations are succeeding.`,
        impact: "Data loss and poor user experience",
        suggestions: [
          "Review error logs for common failure patterns",
          "Implement retry mechanisms with exponential backoff",
          "Check for resource exhaustion issues",
          "Validate input data and configurations",
          "Add circuit breakers to prevent cascade failures",
          "Implement proper error handling and recovery",
        ],
        metrics: {
          current: analysis.performance.successRate.actual,
          target: analysis.performance.successRate.baseline.target,
          failureRate: 100 - analysis.performance.successRate.actual,
        },
      });
    }

    // System resource recommendations
    if (
      analysis.system.cpu.status === "POOR" ||
      analysis.system.cpu.status === "CRITICAL"
    ) {
      recommendations.push({
        category: "RESOURCES",
        priority: "HIGH",
        title: "High CPU Usage",
        description: `CPU utilization reached ${analysis.system.cpu.actual.toFixed(
          2
        )}%.`,
        impact: "System instability and potential crashes",
        suggestions: [
          "Profile code to identify CPU-intensive operations",
          "Optimize algorithms and data structures",
          "Implement caching to reduce computation",
          "Consider using worker threads for CPU-intensive tasks",
          "Upgrade hardware or add more CPU cores",
          "Distribute load across multiple servers",
        ],
        metrics: {
          current: analysis.system.cpu.actual,
          target: analysis.system.cpu.baseline.target,
          headroom: 100 - analysis.system.cpu.actual,
        },
      });
    }

    if (
      analysis.system.memory.status === "POOR" ||
      analysis.system.memory.status === "CRITICAL"
    ) {
      recommendations.push({
        category: "RESOURCES",
        priority: "HIGH",
        title: "High Memory Usage",
        description: `Memory consumption is at ${analysis.system.memory.actual.toFixed(
          2
        )}% with ${(this.metrics.aggregated.memoryGrowth / 1024 / 1024).toFixed(
          2
        )}MB growth.`,
        impact: "Out of memory errors and performance degradation",
        suggestions: [
          "Identify and fix memory leaks using heap profiling",
          "Optimize data structures and object lifecycles",
          "Implement pagination for large data sets",
          "Use streaming for large file operations",
          "Increase Node.js heap size (--max-old-space-size)",
          "Add more system memory or implement memory limits",
        ],
        metrics: {
          current: analysis.system.memory.actual,
          target: analysis.system.memory.baseline.target,
          growth: this.metrics.aggregated.memoryGrowth,
        },
      });
    }

    // Retry rate recommendations
    if (
      this.metrics.aggregated.totalRetries >
      this.metrics.aggregated.totalCases * 0.05
    ) {
      const retryRate =
        (this.metrics.aggregated.totalRetries /
          this.metrics.aggregated.totalCases) *
        100;
      recommendations.push({
        category: "STABILITY",
        priority: "MEDIUM",
        title: "High Retry Rate",
        description: `${retryRate.toFixed(2)}% of operations required retries.`,
        impact: "Increased latency and resource consumption",
        suggestions: [
          "Investigate root causes of transient failures",
          "Optimize retry strategies and backoff algorithms",
          "Improve service health checks and circuit breakers",
          "Consider implementing request deduplication",
          "Add better connection pooling and timeout handling",
        ],
        metrics: {
          totalRetries: this.metrics.aggregated.totalRetries,
          retryRate: retryRate,
          targetRate: 5,
        },
      });
    }

    return recommendations;
  }

  async generateHTMLReports(resultsDir, analysis, summary) {
    // 1. Main metrics dashboard
    const metricsHTML = this.generateMetricsHTML(analysis, summary);
    await fs.writeFile(path.join(resultsDir, "metrics.html"), metricsHTML);

    // 2. Detailed logs viewer
    const logsHTML = this.generateLogsHTML();
    await fs.writeFile(path.join(resultsDir, "logs.html"), logsHTML);

    // 3. Performance analysis dashboard
    const performanceHTML = this.generatePerformanceHTML(analysis);
    await fs.writeFile(
      path.join(resultsDir, "performance.html"),
      performanceHTML
    );
  }

  generateMetricsHTML(analysis, summary) {
    const chartColors = {
      primary: "rgb(33, 150, 243)",
      success: "rgb(76, 175, 80)",
      warning: "rgb(255, 193, 7)",
      danger: "rgb(244, 67, 54)",
      info: "rgb(0, 188, 212)",
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stress Test Results - ${new Date().toISOString()}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f7fa;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .header .api-info {
            opacity: 0.8;
            font-size: 0.9rem;
            margin-top: 10px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.875rem;
            letter-spacing: 0.5px;
            margin-top: 15px;
        }
        
        .status-badge.EXCELLENT { background: rgba(76, 175, 80, 0.2); color: #2e7d32; }
        .status-badge.GOOD { background: rgba(139, 195, 74, 0.2); color: #558b2f; }
        .status-badge.ACCEPTABLE { background: rgba(255, 193, 7, 0.2); color: #f57c00; }
        .status-badge.POOR { background: rgba(255, 152, 0, 0.2); color: #e65100; }
        .status-badge.CRITICAL { background: rgba(244, 67, 54, 0.2); color: #c62828; }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .metric-card h3 {
            color: #666;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        
        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 5px;
        }
        
        .metric-subtitle {
            color: #666;
            font-size: 0.875rem;
        }
        
        .metric-trend {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-left: 10px;
        }
        
        .metric-trend.up { background: #e8f5e9; color: #2e7d32; }
        .metric-trend.down { background: #ffebee; color: #c62828; }
        
        .chart-container {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            margin-bottom: 30px;
        }
        
        .chart-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 20px;
            color: #333;
        }
        
        .chart {
            height: 300px;
            position: relative;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        th {
            background: #f8f9fa;
            padding: 12px 16px;
            text-align: left;
            font-weight: 600;
            color: #666;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 12px 16px;
            border-top: 1px solid #e9ecef;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .recommendations {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .recommendation {
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 4px solid;
        }
        
        .recommendation.priority-CRITICAL {
            border-color: #f44336;
            background: #ffebee;
        }
        
        .recommendation.priority-HIGH {
            border-color: #ff9800;
            background: #fff3e0;
        }
        
        .recommendation.priority-MEDIUM {
            border-color: #2196f3;
            background: #e3f2fd;
        }
        
        .recommendation h4 {
            margin-bottom: 10px;
            color: #333;
        }
        
        .recommendation p {
            margin-bottom: 10px;
            color: #666;
        }
        
        .recommendation ul {
            margin-left: 20px;
            color: #666;
        }
        
        .recommendation li {
            margin: 5px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }
        
        .progress-fill {
            height: 100%;
            background: #4caf50;
            transition: width 0.3s ease;
        }
        
        .footer {
            text-align: center;
            padding: 30px;
            color: #666;
            font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
            .metrics-grid {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 1.875rem;
            }
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Universal Reporting Stress Test Results</h1>
            <p class="subtitle">
                Test Duration: ${this.formatTime(
                  (this.endTime - this.startTime) / 1000
                )} | 
                Completed: ${new Date(this.endTime).toLocaleString()}
            </p>
            <p class="api-info">
                API Endpoint: ${summary.testInfo.apiBaseUrl}
            </p>
            <div class="status-badge ${analysis.summary.status}">
                ${
                  analysis.summary.status
                } - Score: ${analysis.summary.score.toFixed(1)}/100
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Total Cases Created</h3>
                <div class="metric-value">
                    ${this.metrics.aggregated.totalCases.toLocaleString()}
                    <span class="metric-trend ${
                      this.metrics.aggregated.successRate >= 95 ? "up" : "down"
                    }">
                        ${this.metrics.aggregated.successRate.toFixed(1)}%
                    </span>
                </div>
                <div class="metric-subtitle">
                    Out of ${summary.testInfo.totalCasesRequested.toLocaleString()} requested
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${
                      this.metrics.aggregated.successRate
                    }%"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Average Response Time</h3>
                <div class="metric-value">
                    ${this.metrics.aggregated.averageResponseTime.toFixed(0)}ms
                </div>
                <div class="metric-subtitle">
                    P95: ${this.metrics.aggregated.p95ResponseTime.toFixed(
                      0
                    )}ms | 
                    P99: ${this.metrics.aggregated.p99ResponseTime.toFixed(0)}ms
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Throughput</h3>
                <div class="metric-value">
                    ${this.metrics.aggregated.throughput.cases.toFixed(1)}
                </div>
                <div class="metric-subtitle">
                    cases/second (${(
                      this.metrics.aggregated.throughput.cases * 60
                    ).toFixed(0)} cases/min)
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Proxy Generation</h3>
                <div class="metric-value">
                    ${this.metrics.aggregated.totalProxies.toLocaleString()}
                </div>
                <div class="metric-subtitle">
                    ${this.metrics.aggregated.throughput.proxies.toFixed(
                      1
                    )} proxies/second
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Memory Growth</h3>
                <div class="metric-value">
                    ${(
                      this.metrics.aggregated.memoryGrowth /
                      1024 /
                      1024
                    ).toFixed(0)}MB
                </div>
                <div class="metric-subtitle">
                    Peak: ${(
                      this.metrics.aggregated.peakMemory /
                      1024 /
                      1024
                    ).toFixed(0)}MB
                </div>
            </div>
            
            <div class="metric-card">
                <h3>Retry Rate</h3>
                <div class="metric-value">
                    ${(
                      (this.metrics.aggregated.totalRetries /
                        this.metrics.aggregated.totalCases) *
                      100
                    ).toFixed(1)}%
                </div>
                <div class="metric-subtitle">
                    ${this.metrics.aggregated.totalRetries} total retries
                </div>
            </div>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">Performance Trends Across Scenarios</h2>
            <canvas id="performanceChart" class="chart"></canvas>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">Response Time Distribution</h2>
            <canvas id="responseTimeChart" class="chart"></canvas>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">Scenario Results</h2>
            <table>
                <thead>
                    <tr>
                        <th>Scenario</th>
                        <th>Cases</th>
                        <th>Success Rate</th>
                        <th>Avg Response</th>
                        <th>Throughput</th>
                        <th>Proxies</th>
                        <th>Validation</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.metrics.scenarios
                      .map(
                        (scenario, index) => `
                        <tr>
                            <td>Scenario ${index + 1}</td>
                            <td>${scenario.success.cases.created}/${
                          scenario.config.cases
                        }</td>
                            <td>${(
                              (scenario.success.cases.created /
                                scenario.config.cases) *
                              100
                            ).toFixed(1)}%</td>
                            <td>${
                              scenario.performance.cases.length > 0
                                ? (
                                    scenario.performance.cases.reduce(
                                      (sum, c) => sum + c.creationTime,
                                      0
                                    ) / scenario.performance.cases.length
                                  ).toFixed(0)
                                : "N/A"
                            }ms</td>
                            <td>${scenario.rates.casesPerSecond.toFixed(
                              1
                            )} cases/s</td>
                            <td>${scenario.success.proxies.created}</td>
                            <td>
                                <span class="status-badge ${
                                  scenario.validation &&
                                  scenario.validation.cases.valid &&
                                  scenario.validation.proxies.valid
                                    ? "GOOD"
                                    : "POOR"
                                }">
                                    ${
                                      scenario.validation &&
                                      scenario.validation.cases.valid &&
                                      scenario.validation.proxies.valid
                                        ? "PASS"
                                        : "FAIL"
                                    }
                                </span>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>

        <div class="chart-container">
            <h2 class="chart-title">System Resources</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <canvas id="cpuChart" class="chart"></canvas>
                </div>
                <div>
                    <canvas id="memoryChart" class="chart"></canvas>
                </div>
            </div>
        </div>

        ${
          analysis.recommendations.length > 0
            ? `
        <div class="recommendations">
            <h2 class="chart-title">Recommendations</h2>
            ${analysis.recommendations
              .map(
                (rec) => `
                <div class="recommendation priority-${rec.priority}">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    ${
                      rec.impact
                        ? `<p><strong>Impact:</strong> ${rec.impact}</p>`
                        : ""
                    }
                    <p><strong>Suggestions:</strong></p>
                    <ul>
                        ${rec.suggestions.map((s) => `<li>${s}</li>`).join("")}
                    </ul>
                    ${
                      rec.metrics
                        ? `
                    <p style="margin-top: 10px;">
                        <strong>Metrics:</strong> 
                        Current: ${rec.metrics.current?.toFixed(2)} | 
                        Target: ${rec.metrics.target?.toFixed(2)}
                    </p>
                    `
                        : ""
                    }
                </div>
            `
              )
              .join("")}
        </div>
        `
            : ""
        }

        <div class="footer">
            <p>Generated by Universal Reporting Stress Test Framework</p>
            <p>Report generated at ${new Date().toLocaleString()}</p>
        </div>
    </div>

    <script>
        // Chart configuration
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        
        // Performance Trends Chart
        const perfCtx = document.getElementById('performanceChart').getContext('2d');
        new Chart(perfCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(
                  this.metrics.scenarios.map(
                    (s, i) => `Scenario ${i + 1} (${s.config.cases} cases)`
                  )
                )},
                datasets: [{
                    label: 'Response Time (ms)',
                    data: ${JSON.stringify(
                      this.metrics.scenarios.map((s) =>
                        s.performance.cases.length > 0
                          ? s.performance.cases.reduce(
                              (sum, c) => sum + c.creationTime,
                              0
                            ) / s.performance.cases.length
                          : 0
                      )
                    )},
                    borderColor: '${chartColors.primary}',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.3,
                    yAxisID: 'y'
                }, {
                    label: 'Throughput (cases/s)',
                    data: ${JSON.stringify(
                      this.metrics.scenarios.map((s) => s.rates.casesPerSecond)
                    )},
                    borderColor: '${chartColors.success}',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.3,
                    yAxisID: 'y1'
                }, {
                    label: 'Success Rate (%)',
                    data: ${JSON.stringify(
                      this.metrics.scenarios.map(
                        (s) => (s.success.cases.created / s.config.cases) * 100
                      )
                    )},
                    borderColor: '${chartColors.warning}',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.3,
                    yAxisID: 'y2'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Response Time (ms)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Throughput (cases/s)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    y2: {
                        type: 'linear',
                        display: false,
                        min: 0,
                        max: 100
                    }
                }
            }
        });

        // Response Time Distribution Chart
        const responseCtx = document.getElementById('responseTimeChart').getContext('2d');
        const allResponseTimes = ${JSON.stringify(
          this.metrics.scenarios.flatMap((s) =>
            s.performance.cases.map((c) => c.creationTime)
          )
        )};
        
        // Create histogram data
        const bins = 20;
        const minTime = Math.min(...allResponseTimes);
        const maxTime = Math.max(...allResponseTimes);
        const binSize = (maxTime - minTime) / bins;
        const histogram = new Array(bins).fill(0);
        const binLabels = [];
        
        for (let i = 0; i < bins; i++) {
            const binStart = minTime + (i * binSize);
            const binEnd = binStart + binSize;
            binLabels.push(binStart.toFixed(0) + '-' + binEnd.toFixed(0) + 'ms');
            
            for (const time of allResponseTimes) {
                if (time >= binStart && time < binEnd) {
                    histogram[i]++;
                }
            }
        }
        
        new Chart(responseCtx, {
            type: 'bar',
            data: {
                labels: binLabels,
                datasets: [{
                    label: 'Number of Requests',
                    data: histogram,
                    backgroundColor: '${chartColors.primary}',
                    borderColor: '${chartColors.primary}',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const percentage = ((context.parsed.y / allResponseTimes.length) * 100).toFixed(1);
                                return context.parsed.y + ' requests (' + percentage + '%)';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Requests'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Response Time Range'
                        }
                    }
                }
            }
        });

        // CPU Chart
        const cpuCtx = document.getElementById('cpuChart').getContext('2d');
        new Chart(cpuCtx, {
            type: 'bar',
            data: {
                labels: ['Initial', 'Peak', 'Final'],
                datasets: [{
                    label: 'CPU Usage %',
                    data: [
                        ${
                          this.metrics.system.initial?.cpu.percent.toFixed(2) ||
                          0
                        },
                        ${Math.max(
                          ...this.metrics.scenarios.map((s) =>
                            s.memory.peak
                              ? (this.metrics.system.initial?.cpu.percent ||
                                  0) +
                                ((s.memory.peak - s.memory.start.heapUsed) /
                                  s.memory.start.heapUsed) *
                                  10
                              : this.metrics.system.initial?.cpu.percent || 0
                          )
                        )},
                        ${
                          this.metrics.system.final?.cpu.percent.toFixed(2) || 0
                        }
                    ],
                    backgroundColor: [
                        '${chartColors.info}',
                        '${chartColors.warning}',
                        '${chartColors.primary}'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'CPU Usage %'
                        }
                    }
                }
            }
        });

        // Memory Chart
        const memCtx = document.getElementById('memoryChart').getContext('2d');
        new Chart(memCtx, {
            type: 'line',
            data: {
                labels: ['Start', ...${JSON.stringify(
                  this.metrics.scenarios.map((s, i) => `Scenario ${i + 1}`)
                )}, 'End'],
                datasets: [{
                    label: 'Heap Used (MB)',
                    data: [
                        ${
                          (
                            this.metrics.system.initial?.memory.heapUsed /
                            1024 /
                            1024
                          ).toFixed(2) || 0
                        },
                        ${this.metrics.scenarios
                          .map((s) =>
                            (
                              (s.memory.peak || s.memory.end?.heapUsed || 0) /
                              1024 /
                              1024
                            ).toFixed(2)
                          )
                          .join(",")},
                        ${
                          (
                            this.metrics.system.final?.memory.heapUsed /
                            1024 /
                            1024
                          ).toFixed(2) || 0
                        }
                    ],
                    borderColor: '${chartColors.danger}',
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Memory Usage (MB)'
                        }
                    }
                }
            }
        });
    </script>
</body>
</html>
    `;
  }

  generateLogsHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stress Test Logs</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            line-height: 1.6;
            color: #333;
            background: #1e1e1e;
            color: #d4d4d4;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: #2d2d30;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #3e3e42;
        }
        
        .header h1 {
            font-size: 1.5rem;
            margin-bottom: 10px;
        }
        
        .filter-controls {
            background: #2d2d30;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            align-items: center;
            border: 1px solid #3e3e42;
        }
        
        .filter-controls label {
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
        }
        
        .filter-controls input[type="checkbox"] {
            cursor: pointer;
        }
        
        .search-box {
            flex: 1;
            min-width: 200px;
        }
        
        .search-box input {
            width: 100%;
            padding: 8px 12px;
            background: #1e1e1e;
            border: 1px solid #3e3e42;
            border-radius: 4px;
            color: #d4d4d4;
        }
        
        .log-container {
            background: #1e1e1e;
            border-radius: 8px;
            padding: 10px;
            max-height: 70vh;
            overflow-y: auto;
            border: 1px solid #3e3e42;
        }
        
        .log-entry {
            padding: 8px 12px;
            margin: 2px 0;
            border-radius: 4px;
            font-size: 0.875rem;
            border-left: 3px solid;
            background: #2d2d30;
        }
        
        .log-entry.INFO { 
            border-color: #0e7490; 
            background: rgba(14, 116, 144, 0.1);
        }
        
        .log-entry.SUCCESS { 
            border-color: #059669; 
            background: rgba(5, 150, 105, 0.1);
        }
        
        .log-entry.WARNING { 
            border-color: #d97706; 
            background: rgba(217, 119, 6, 0.1);
        }
        
        .log-entry.ERROR { 
            border-color: #dc2626; 
            background: rgba(220, 38, 38, 0.1);
        }
        
        .timestamp {
            color: #858585;
            font-size: 0.75rem;
        }
        
        .message {
            margin-top: 4px;
            word-break: break-word;
        }
        
        .details {
            margin-top: 8px;
            padding: 8px;
            background: #1e1e1e;
            border-radius: 4px;
            font-size: 0.75rem;
            overflow-x: auto;
        }
        
        pre {
            margin: 0;
            white-space: pre-wrap;
        }
        
        .stats {
            background: #2d2d30;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            display: flex;
            gap: 30px;
            flex-wrap: wrap;
            border: 1px solid #3e3e42;
        }
        
        .stat {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .stat-value {
            font-weight: bold;
            font-size: 1.25rem;
        }
        
        .stat-label {
            color: #858585;
            font-size: 0.875rem;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: #1e1e1e;
        }
        
        ::-webkit-scrollbar-thumb {
            background: #3e3e42;
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: #4e4e52;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Stress Test Execution Logs</h1>
            <p>Total entries: ${this.logs.length}</p>
        </div>
        
        <div class="filter-controls">
            <label>
                <input type="checkbox" id="filterInfo" checked> 
                <span style="color: #0e7490;">Info</span>
            </label>
            <label>
                <input type="checkbox" id="filterSuccess" checked> 
                <span style="color: #059669;">Success</span>
            </label>
            <label>
                <input type="checkbox" id="filterWarning" checked> 
                <span style="color: #d97706;">Warnings</span>
            </label>
            <label>
                <input type="checkbox" id="filterError" checked> 
                <span style="color: #dc2626;">Errors</span>
            </label>
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search logs...">
            </div>
        </div>
        
        <div class="log-container" id="logContainer">
            ${this.logs
              .map(
                (log) => `
                <div class="log-entry ${log.level}" data-level="${log.level}">
                    <div class="timestamp">${new Date(
                      log.timestamp
                    ).toISOString()}</div>
                    <div class="message">${this.escapeHtml(log.message)}</div>
                    ${
                      log.details
                        ? `
                        <div class="details">
                            <pre>${this.escapeHtml(
                              typeof log.details === "string"
                                ? log.details
                                : JSON.stringify(log.details, null, 2)
                            )}</pre>
                        </div>
                    `
                        : ""
                    }
                </div>
            `
              )
              .join("")}
        </div>
        
        <div class="stats">
            <div class="stat">
                <span class="stat-value" style="color: #0e7490;">${
                  this.logs.filter((l) => l.level === "INFO").length
                }</span>
                <span class="stat-label">Info</span>
            </div>
            <div class="stat">
                <span class="stat-value" style="color: #059669;">${
                  this.logs.filter((l) => l.level === "SUCCESS").length
                }</span>
                <span class="stat-label">Success</span>
            </div>
            <div class="stat">
                <span class="stat-value" style="color: #d97706;">${
                  this.logs.filter((l) => l.level === "WARNING").length
                }</span>
                <span class="stat-label">Warnings</span>
            </div>
            <div class="stat">
                <span class="stat-value" style="color: #dc2626;">${
                  this.logs.filter((l) => l.level === "ERROR").length
                }</span>
                <span class="stat-label">Errors</span>
            </div>
        </div>
    </div>
    
    <script>
        const filters = {
            INFO: document.getElementById('filterInfo'),
            SUCCESS: document.getElementById('filterSuccess'),
            WARNING: document.getElementById('filterWarning'),
            ERROR: document.getElementById('filterError')
        };
        
        const searchInput = document.getElementById('searchInput');
        const logContainer = document.getElementById('logContainer');
        
        function updateFilter() {
            const searchTerm = searchInput.value.toLowerCase();
            const entries = logContainer.querySelectorAll('.log-entry');
            
            entries.forEach(entry => {
                const level = entry.dataset.level;
                const content = entry.textContent.toLowerCase();
                
                const levelMatch = filters[level] && filters[level].checked;
                const searchMatch = !searchTerm || content.includes(searchTerm);
                
                entry.style.display = levelMatch && searchMatch ? 'block' : 'none';
            });
        }
        
        // Add event listeners
        Object.values(filters).forEach(filter => {
            filter.addEventListener('change', updateFilter);
        });
        
        searchInput.addEventListener('input', updateFilter);
        
        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    </script>
</body>
</html>
    `;
  }

  generatePerformanceHTML(analysis) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Analysis</title>
    <style>
        /* Similar styling to metrics HTML */
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        /* ... rest of styles ... */
    </style>
</head>
<body>
    <div class="container">
        <h1>Detailed Performance Analysis</h1>
        <!-- Additional performance charts and analysis -->
    </div>
</body>
</html>
    `;
  }

  async generateCSVExport(resultsDir) {
    // Export detailed metrics as CSV for further analysis
    const csvData = [];

    // Header row
    csvData.push(
      [
        "Scenario",
        "Cases Requested",
        "Cases Created",
        "Success Rate",
        "Avg Response Time",
        "P95 Response Time",
        "P99 Response Time",
        "Throughput",
        "Proxies Created",
        "Fragments Created",
        "Events Processed",
        "Retries",
        "Memory Peak",
        "Duration",
      ].join(",")
    );

    // Data rows
    this.metrics.scenarios.forEach((scenario, index) => {
      const responseTimes = scenario.performance.cases
        .map((c) => c.creationTime)
        .sort((a, b) => a - b);
      const avgResponseTime =
        responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;
      const p95ResponseTime =
        responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
      const p99ResponseTime =
        responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;

      csvData.push(
        [
          `Scenario ${index + 1}`,
          scenario.config.cases,
          scenario.success.cases.created,
          (
            (scenario.success.cases.created / scenario.config.cases) *
            100
          ).toFixed(2),
          avgResponseTime.toFixed(2),
          p95ResponseTime.toFixed(2),
          p99ResponseTime.toFixed(2),
          scenario.rates.casesPerSecond.toFixed(2),
          scenario.success.proxies.created,
          scenario.success.fragments.created,
          scenario.success.events.processed,
          scenario.retries || 0,
          (scenario.memory.peak / 1024 / 1024).toFixed(2),
          (scenario.timing.total / 1000).toFixed(2),
        ].join(",")
      );
    });

    await fs.writeFile(
      path.join(resultsDir, "metrics.csv"),
      csvData.join("\n")
    );
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Logging methods
  logInfo(message, details = null) {
    this.logs.push({
      timestamp: new Date(),
      level: "INFO",
      message,
      details,
    });
  }

  logSuccess(message, details = null) {
    this.logs.push({
      timestamp: new Date(),
      level: "SUCCESS",
      message,
      details,
    });
  }

  logWarning(message, details = null) {
    this.logs.push({
      timestamp: new Date(),
      level: "WARNING",
      message,
      details,
    });
    this.metrics.warnings.push({ message, details, timestamp: new Date() });
  }

  logError(message, details = null) {
    this.logs.push({
      timestamp: new Date(),
      level: "ERROR",
      message,
      details,
    });
    this.metrics.errors.push({ message, details, timestamp: new Date() });
  }

  async loadBaselineMetrics() {
    try {
      const baselineData = await fs.readFile(
        this.options.baselineMetrics,
        "utf8"
      );
      return JSON.parse(baselineData);
    } catch (error) {
      console.warn("Failed to load baseline metrics, using defaults");
      return this.getDefaultBaseline();
    }
  }

  getDefaultBaseline() {
    return {
      performance: {
        responseTime: {
          direction: "lower",
          unit: "ms",
          excellent: 50,
          good: 200,
          acceptable: 500,
          poor: 1000,
          critical: 2000,
          target: 100,
        },
        throughput: {
          direction: "higher",
          unit: "cases/second",
          excellent: 50,
          good: 20,
          acceptable: 10,
          poor: 5,
          critical: 2,
          target: 30,
        },
        successRate: {
          direction: "higher",
          unit: "percentage",
          excellent: 99.9,
          good: 99,
          acceptable: 95,
          poor: 90,
          critical: 80,
          target: 99.5,
        },
      },
      system: {
        cpu: {
          direction: "lower",
          unit: "percentage",
          excellent: 30,
          good: 50,
          acceptable: 70,
          poor: 85,
          critical: 95,
          target: 40,
        },
        memory: {
          direction: "lower",
          unit: "percentage",
          excellent: 30,
          good: 50,
          acceptable: 70,
          poor: 85,
          critical: 95,
          target: 40,
        },
      },
    };
  }

  analyzeSystemMetric(type, baseline) {
    const initial = this.metrics.system.initial?.[type];
    const final = this.metrics.system.final?.[type];

    if (!initial || !final) {
      return this.analyzeMetric(0, baseline?.system?.[type]);
    }

    let value;
    if (type === "cpu") {
      value = final.percent || 0;
    } else if (type === "memory") {
      value = final.heapSizeLimit
        ? (final.heapUsed / final.heapSizeLimit) * 100
        : 0;
    }

    return this.analyzeMetric(value, baseline?.system?.[type]);
  }
}

// CLI interface
if (require.main === module) {
  const argv = require("yargs/yargs")(process.argv.slice(2))
    .usage("Usage: $0 [options]")
    .option("scenarios", {
      alias: "s",
      describe: "Scenarios to run (format: cases:proxies:parallel)",
      array: true,
    })
    .option("output-dir", {
      alias: "o",
      describe: "Output directory for results",
      default: "./results",
    })
    .option("baseline", {
      alias: "b",
      describe: "Baseline metrics file",
      default: "./config/baseline-metrics.json",
    })
    .option("token", {
      alias: "t",
      describe: "Authentication token (or use STRESS_TEST_TOKEN env)",
      default: process.env.STRESS_TEST_TOKEN,
    })
    .option("api-url", {
      describe: "API base URL",
      default: "http://localhost:8060/api/schedulingcases",
    })
    .option("mongo-url", {
      describe: "MongoDB connection URL",
      default: "mongodb://localhost:27017",
    })
    .option("tenant-id", {
      describe: "Tenant ID for multi-tenant system",
      default: "66045e2350e8d495ec17bbe9",
    })
    .option("verbose", {
      alias: "v",
      describe: "Verbose output",
      boolean: true,
    })
    .option("dry-run", {
      describe: "Simulate without creating data",
      boolean: true,
    })
    .help("h")
    .alias("h", "help").argv;

  const options = {
    outputDir: argv.outputDir,
    baselineMetrics: argv.baseline,
    verbose: argv.verbose,
    authToken: argv.token,
    apiBaseUrl: argv.apiUrl,
    mongoUrl: argv.mongoUrl,
    tenantId: argv.tenantId,
    dryRun: argv.dryRun,
  };

  if (argv.scenarios) {
    options.scenarios = argv.scenarios.map((s) => {
      const [cases, proxiesPerCase, parallel] = s.split(":").map(Number);
      return { cases, proxiesPerCase, parallel };
    });
  }

  const runner = new ComprehensiveStressTestRunner(options);

  (async () => {
    try {
      await runner.runAllScenarios();
      console.log("\n✅ Stress test completed successfully!");
      process.exit(0);
    } catch (error) {
      console.error("❌ Stress test failed:", error);
      if (argv.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  })();
}

module.exports = ComprehensiveStressTestRunner;
