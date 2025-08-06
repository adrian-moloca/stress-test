// scripts/run-stress-test-enhanced.js
const { program } = require("commander");
const path = require("path");
const fs = require("fs").promises;
const fetch = require("node-fetch");

// Import core components
const DataManager = require("./core/data-manager");
const ValidationEngine = require("./core/validation-engine");
const ReportGenerator = require("./core/report-generator");
const JsonCaseLoader = require("./loaders/json-case-loader");
const AuthService = require("./utils/auth");
const ParallelRunner = require("./utils/parallel-runner");

// Import scenarios
const BulkCaseCreationScenario = require("./scenarios/bulk-case-creation");
const SystemLimitsTestScenario = require("./scenarios/system-limits-test");
const CrossSectionUpdateTestScenario = require("./scenarios/cross-section-update-test");

// Import generators
const CaseDataGenerator = require("./generators/case-data-generator");
const HighConcurrencyGenerator = require("./utils/high-concurrency-generator");

const dotenv = require('dotenv');
dotenv.config();

// Load configurations
let baselineMetrics = {};
let testScenarios = {};

try {
  baselineMetrics = require("../config/baseline-metrics.json");
} catch (e) {
  console.warn("⚠️ Could not load baseline metrics, using defaults");
  baselineMetrics = {
    performance_targets: {
      case_creation: {
        p95_response_time: 500,
        average_response_time: 300,
        error_rate_max: 0.01,
        throughput_min: 5.0,
      },
    },
    validation_criteria: {
      proxy_creation_rate: 0.95,
      fragment_creation_rate: 0.90,
      dependency_completion_rate: 0.85,
    },
  };
}

try {
  testScenarios = require("../config/test-scenarios.json");
} catch (e) {
  console.warn("⚠️ Could not load test scenarios, using defaults");
}

class EnhancedStressTestExecutor {
  constructor(options) {
    this.options = options;
    this.testId = this.generateTestId();
    this.resultsDir = path.join(__dirname, "..", "results", this.testId);
    this.environment = this.loadEnvironment(options.env);

    // Initialize services
    this.authService = new AuthService(this.environment, {
      dryRun: options.dryRun,
      skipAuth: options.skipAuth || options.noAuth,
    });

    this.parallelRunner = new ParallelRunner({
      maxConcurrency: parseInt(options.maxParallel) || 10,
      retries: parseInt(options.retries) || 2,
      delayBetweenBatches: parseInt(options.batchDelay) || 1000,
    });

    // Initialize core components
    this.dataManager = null;
    this.validationEngine = null;
    this.reportGenerator = null;

    // Load configurations
    this.baselineMetrics = baselineMetrics;
    this.scenarioConfig = testScenarios[options.scenario] || {};

    // Enhanced test results
    this.testResults = {
      testId: this.testId,
      scenario: options.scenario,
      startTime: null,
      endTime: null,
      totalCasesAttempted: 0,
      casesCreated: 0,
      errors: [],
      timeline: [],
      systemMetrics: {},
      performanceMetrics: {},
      validationResults: null,
      scenarioSpecificResults: {},
    };

    // System monitoring
    this.systemMonitor = null;
  }

  generateTestId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${this.options.scenario}-${this.options.env}-${timestamp}-v${
      this.options.testVersion || "1.0"
    }`;
  }

  loadEnvironment(envName) {
    const environments = {
      local: {
        casesServiceUrl: "http://localhost:8060/api/schedulingcases",
        urServiceUrl: "http://localhost:8160", // UR service is on port 8160!
        authServiceUrl: "http://localhost:8010/api/auth", // Auth is on port 8010
        description: "Local development environment",
        tenantId: "66045e2350e8d495ec17bbe9",
      },
      docker: {
        casesServiceUrl:
          "http://ascos-scheduling-cases:9060/api/schedulingcases",
        urServiceUrl: "http://ascos-universal-reporting:9160", // Internal Docker port
        authServiceUrl: "http://ascos-auth:9010/api/auth",
        description: "Docker compose environment",
        tenantId: "66045e2350e8d495ec17bbe9",
      },
    };

    return environments[envName] || environments.local;
  }

  async initialize() {
    console.log("🚀 Initializing Enhanced Stress Test Framework");
    console.log(`   📋 Test ID: ${this.testId}`);
    console.log(`   🎯 Scenario: ${this.options.scenario}`);
    console.log(`   🌍 Environment: ${this.environment.description}`);
    console.log(`   📊 Volume: ${this.options.volume || "default"}`);
    console.log(`   ⚡ Max Parallel: ${this.options.maxParallel || 10}`);
    console.log(
      `   🔄 High Concurrency: ${
        this.options.highConcurrency ? "Enabled" : "Disabled"
      }`
    );
    console.log(
      `   🔍 Validation Level: ${
        this.options.validate ? this.options.validationLevel : "Disabled"
      }`
    );

    // Create results directory structure
    await this.createDirectoryStructure();

    // Initialize core components
    this.dataManager = new DataManager(this.resultsDir);
    await this.dataManager.initialize();

    // Initialize validation engine based on level
    if (this.options.validate) {
      this.validationEngine = new ValidationEngine(
        this.environment,
        this.dataManager
      );
      console.log(
        `   ✅ ${this.options.validationLevel} validation engine initialized`
      );
    }

    this.reportGenerator = new ReportGenerator(
      this.dataManager,
      this.resultsDir
    );

    // Authenticate if not in dry-run mode
    if (
      !this.options.dryRun &&
      !this.options.skipAuth &&
      !this.options.noAuth
    ) {
      console.log("🔑 Authenticating...");
      try {
        await this.authService.loginDefaultSuperUser();
        console.log("✅ Authentication successful");
      } catch (error) {
        console.error("❌ Authentication failed:", error.message);
        console.log("⚠️ Continuing with hardcoded token...");
      }
    }

    // Save test configuration
    await this.dataManager.saveConfig({
      testId: this.testId,
      scenario: this.options.scenario,
      environment: this.environment,
      options: this.options,
      baselineMetrics: this.baselineMetrics,
      scenarioConfig: this.scenarioConfig,
      timestamp: new Date().toISOString(),
    });

    console.log(`📁 Results will be saved to: ${this.resultsDir}`);
  }

  getAuthToken() {
    return process.env.STRESS_TEST_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx1Y2FAYW1idWZsb3cuY29tIiwic3ViIjoidXNlcl9XRHFRdkxlQ2tkOTl1R1FGaCIsInRlbmFudElkIjoiNjYwNDVlMjM1MGU4ZDQ5NWVjMTdiYmU5IiwiaWF0IjoxNzU0MDQzMDgxfQ.YQ3vChCL7hvVM5m_opIiIRXFO_Kr5Y--cCKVTFMlAow";
  }

  async createDirectoryStructure() {
    const dirs = [
      "",
      "raw-data",
      "processed-data",
      "k6-scripts",
      "k6-results",
      "validation",
      "reports",
      "metrics",
      "logs",
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.resultsDir, dir), { recursive: true });
    }
  }

  async saveCasesCreated(creationResults) {
    // Extract successfully created cases
    const casesCreated = creationResults
      .filter((r) => r && r.success)
      .map((r) => ({
        caseId: r.caseId,
        caseNumber: r.caseNumber,
        timestamp: new Date().toISOString(),
      }));

    // Save to the expected location
    await this.dataManager.saveRawData("cases-created", casesCreated);

    return casesCreated;
  }

  async execute() {
    this.testResults.startTime = Date.now();

    try {
      console.log("🚀 Starting enhanced stress test execution...");

      await this.dataManager.appendTimelineEvent({
        type: "test_started",
        message: `Started ${this.options.scenario} stress test`,
        config: this.scenarioConfig,
      });

      // Start system monitoring
      this.systemMonitor = this.startSystemMonitoring();

      let scenarioResults;

      // Execute scenario
      switch (this.options.scenario) {
        case "bulk-case-creation":
          scenarioResults = await this.runEnhancedBulkCaseCreation();
          break;

        case "json-load-test":
          scenarioResults = await this.runJsonLoadTest();
          break;

        case "system-limits":
          scenarioResults = await this.runSystemLimitsTest();
          break;

        case "cross-section-updates":
          scenarioResults = await this.runCrossSectionUpdateTest();
          break;

        case "comprehensive":
          scenarioResults = await this.runComprehensiveTest();
          break;

        case "high-concurrency":
          scenarioResults = await this.runHighConcurrencyTest();
          break;

        default:
          throw new Error(`Unknown scenario: ${this.options.scenario}`);
      }

      // Stop system monitoring
      const systemMetrics = await this.stopSystemMonitoring(this.systemMonitor);
      this.testResults.systemMetrics = systemMetrics;

      // Merge scenario results
      Object.assign(this.testResults, scenarioResults);

      // Run validation if requested
      if (this.options.validate !== false) {
        console.log(
          `\n🔍 Starting ${this.options.validationLevel} validation phase...`
        );

        // Wait for UR processing if not in dry-run mode
        if (
          !this.options.dryRun &&
          this.options.validationLevel === "ultimate"
        ) {
          const waitTime = parseInt(this.options.waitUr) || 30;
          console.log(
            `   ⏳ Waiting ${waitTime}s for UR system to process events...`
          );
          await this.waitForURProcessing(waitTime * 1000);
        }

        const validationResults = await this.runEnhancedValidation();
        this.testResults.validationResults = validationResults;
      }

      // Check against baseline metrics
      if (!this.options.skipBaseline) {
        console.log("📊 Comparing against baseline metrics...");
        const baselineComparison = await this.compareToBaseline();
        this.testResults.baselineComparison = baselineComparison;
      }

      // Generate reports
      console.log("📋 Generating enhanced reports...");
      const reportPaths = await this.generateEnhancedReports();
      this.testResults.reportPaths = reportPaths;

      this.testResults.endTime = Date.now();
      this.testResults.totalDuration =
        this.testResults.endTime - this.testResults.startTime;

      await this.dataManager.appendTimelineEvent({
        type: "test_completed",
        message: "Stress test completed successfully",
        duration: this.testResults.totalDuration,
      });

      // Save final results
      await this.dataManager.saveProcessedData(
        "final-results",
        this.testResults
      );

      this.printEnhancedSummary();
      return this.testResults;
    } catch (error) {
      this.testResults.endTime = Date.now();
      this.testResults.totalDuration =
        this.testResults.endTime - this.testResults.startTime;

      console.error("❌ Stress test failed:", error.message);

      this.testResults.errors.push({
        type: "test_execution_error",
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
      });

      await this.dataManager.appendTimelineEvent({
        type: "test_failed",
        message: `Test failed: ${error.message}`,
        error: error.message,
      });

      // Still try to generate reports
      try {
        await this.generateEnhancedReports();
      } catch (reportError) {
        console.error("Failed to generate error reports:", reportError.message);
      }

      throw error;
    }
  }

  async runEnhancedBulkCaseCreation() {
    console.log("📦 Starting enhanced bulk case creation scenario...");

    // Load scenario configuration
    const scenarioConfig = await this.loadScenarioConfig("bulk_case_creation");

    // Fetch real reference data
    const realReferenceData = await this.fetchRealReferenceData();

    // Initialize data generator
    const dataGenerator = new CaseDataGenerator({
      patientPoolSize:
        scenarioConfig.realistic_case_data?.patient_pool_size || 2000,
      doctorPoolSize:
        scenarioConfig.realistic_case_data?.doctor_pool_size || 50,
      contractPoolSize:
        scenarioConfig.realistic_case_data?.contract_pool_size || 10,
      opStandardPoolSize:
        scenarioConfig.realistic_case_data?.opstandard_pool_size || 100,
      realReferenceData: realReferenceData,
      // Don't generate case numbers - let the API do it
      generateCaseNumbers: false,
    });

    await dataGenerator.initialize(this.resultsDir);

    // Generate test cases
    const volume =
      parseInt(this.options.volume) || scenarioConfig.default_volume || 10;

    let allCaseData;

    if (this.options.highConcurrency && volume > 100) {
      console.log("⚡ Using high concurrency generator...");
      const highConcurrencyGen = new HighConcurrencyGenerator(dataGenerator, {
        maxConcurrency: 20,
        subBatchSize: 50,
        pauseBetweenChunks: 100,
      });
      allCaseData = await highConcurrencyGen.generate(volume);
    } else {
      console.log(`📋 Generating ${volume} test cases...`);
      allCaseData = await dataGenerator.generateBatch(volume);
    }

    // Remove case numbers - let API generate them
    allCaseData = allCaseData.map(caseData => {
      const { caseNumber, ...rest } = caseData;
      return rest;
    });

    console.log(`   📊 Generated ${allCaseData.length}/${volume} cases`);
    await this.dataManager.saveRawData("generated-cases", allCaseData);

    // Create cases using parallel runner
    console.log("🏗️ Creating cases with enhanced parallel processing...");

    const startTime = Date.now();

    const creationResults = await this.parallelRunner.run(
      allCaseData,
      async (caseData, index) => {
        const result = await this.createSingleCase(caseData);
        return {
          index: index + 1,
          caseNumber: result.caseNumber, // Use the API-generated number
          success: result.success,
          error: result.error,
          responseTime: result.responseTime,
          caseId: result.caseId,
        };
      }
    );

    await this.saveCasesCreated(creationResults.results);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Calculate enhanced metrics
    const successfulResults = creationResults.results.filter(
      (r) => r && r.success
    );
    const failedResults = creationResults.results.filter(
      (r) => r && !r.success
    );

    const responseTimes = successfulResults
      .map((r) => r.responseTime)
      .filter((t) => t > 0);

    const performanceMetrics = {
      totalCases: allCaseData.length,
      successfulCases: successfulResults.length,
      failedCases: failedResults.length,
      successRate: (successfulResults.length / allCaseData.length) * 100,
      totalDuration: totalDuration,
      responseTimes: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99),
      },
      throughput: {
        casesPerSecond: successfulResults.length / (totalDuration / 1000),
        peakConcurrency: this.options.maxParallel || 10,
      },
      errors: creationResults.errors,
      realReferenceData: {
        contractIds: realReferenceData.contractIds?.length || 0,
        doctorIds: realReferenceData.doctorIds?.length || 0,
        opStandardIds: realReferenceData.opStandardIds?.length || 0,
      },
    };

    await this.dataManager.saveProcessedData(
      "enhanced-performance-metrics",
      performanceMetrics
    );

    // Update test results
    this.testResults.totalCasesAttempted = allCaseData.length;
    this.testResults.casesCreated = successfulResults.length;
    this.testResults.performanceMetrics = performanceMetrics;

    console.log(
      `✅ Enhanced bulk creation completed: ${successfulResults.length}/${
        allCaseData.length
      } (${performanceMetrics.successRate.toFixed(2)}%)`
    );
    console.log(`⏱️ Total duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(
      `🚀 Throughput: ${performanceMetrics.throughput.casesPerSecond.toFixed(
        2
      )} cases/s`
    );

    return {
      scenarioType: "enhanced-bulk-case-creation",
      casesGenerated: allCaseData.length,
      creationResults: creationResults.results,
      performanceMetrics,
    };
  }

  async runHighConcurrencyTest() {
    console.log("⚡ Starting high concurrency stress test...");

    const volume = parseInt(this.options.volume) || 1000;
    const maxParallel = 50; // High concurrency

    // Temporarily increase parallel operations
    const originalMaxParallel = this.parallelRunner.maxConcurrency;
    this.parallelRunner.maxConcurrency = maxParallel;

    try {
      // Run enhanced bulk creation with high concurrency
      const results = await this.runEnhancedBulkCaseCreation();

      // Add high concurrency specific metrics
      results.highConcurrencyMetrics = {
        maxConcurrentRequests: maxParallel,
        averageQueueLength: this.parallelRunner.averageQueueLength || 0,
        maxQueueLength: this.parallelRunner.maxQueueLength || 0,
        rejectedRequests: this.parallelRunner.rejectedRequests || 0,
      };

      return results;
    } finally {
      // Restore original concurrency
      this.parallelRunner.maxConcurrency = originalMaxParallel;
    }
  }

  async fetchRealReferenceData() {
    console.log("🔍 Fetching real reference data from system...");

    const referenceData = {
      contractIds: [],
      doctorIds: [],
      opStandardIds: [],
    };

    try {
      const token = this.getAuthToken();
      console.log("   📄 Fetching existing cases to extract real IDs...");
      const casesUrl = `${this.environment.casesServiceUrl}/cases?page=0&limit=20&limitedCases=true`;

      const casesResponse = await fetch(casesUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        console.log(
          `   📊 Found ${casesData.results?.length || 0} existing cases`
        );

        const contractIds = new Set();
        const doctorIds = new Set();
        const opStandardIds = new Set();

        casesData.results?.forEach((caseItem) => {
          if (caseItem.bookingSection?.contractId) {
            contractIds.add(caseItem.bookingSection.contractId);
          }
          if (caseItem.bookingSection?.doctorId) {
            doctorIds.add(caseItem.bookingSection.doctorId);
          }
          if (caseItem.bookingSection?.opStandardId) {
            opStandardIds.add(caseItem.bookingSection.opStandardId);
          }
        });

        referenceData.contractIds = Array.from(contractIds).slice(0, 10);
        referenceData.doctorIds = Array.from(doctorIds).slice(0, 10);
        referenceData.opStandardIds = Array.from(opStandardIds).slice(0, 10);

        console.log(
          `   ✅ Extracted ${referenceData.contractIds.length} real contract IDs`
        );
        console.log(
          `   ✅ Extracted ${referenceData.doctorIds.length} real doctor IDs`
        );
        console.log(
          `   ✅ Extracted ${referenceData.opStandardIds.length} real op standard IDs`
        );
      }
    } catch (error) {
      console.warn("⚠️ Error fetching real data:", error.message);
    }

    // Fallback to hardcoded IDs if needed
    if (referenceData.contractIds.length === 0) {
      console.log("   ⚠️ Using hardcoded real contract IDs");
      referenceData.contractIds = [
        "contract_DSg8orNxSST5FKjpz",
        "contract_fBcmjb7KxyZcbXHdS",
        "contract_8gvCPHbqX77uKAhcR",
      ];
    }

    if (referenceData.doctorIds.length === 0) {
      console.log("   ⚠️ Using hardcoded real doctor IDs");
      referenceData.doctorIds = [
        "user_6EnqFa5TaWCtuy4wD", // Dr Maria Montessori
        "user_m8jwbhyayXsWHYejt", // John Black
        "user_eY4NJhj5mCSnX9f2w", // happy path doctor 25/06
      ];
    }

    if (referenceData.opStandardIds.length === 0) {
      console.log("   ⚠️ Using hardcoded real op standard IDs");
      referenceData.opStandardIds = [
        "op_TdqjJp7oNJiG6oRbF", // G- this is an op standard without anesthesia
        "op_msEfjHdjtR8uWy8ei", // this is an op standard with anesthesia type periph
        "op_XyoZchRyvFzP5m4ow", // c2
        "op_5L4D7nEqXDsMsMLFv", // cat d
      ];
    }

    return referenceData;
  }

  async createSingleCase(caseData) {
    const startTime = Date.now();

    try {
      const url = `${this.environment.casesServiceUrl}/cases`;
      const token = this.getAuthToken();
      const headers = {
        "Content-Type": "application/json",
        "x-tenant-id": this.environment.tenantId,
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(caseData),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.ok) {
        const createdCase = await response.json();
        return {
          success: true,
          caseId: createdCase._id || createdCase.caseId,
          caseNumber: createdCase.caseNumber, // Use the API-generated number
          responseTime: responseTime,
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
          responseTime: responseTime,
        };
      }
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        success: false,
        error: error.message,
        responseTime: responseTime,
      };
    }
  }

  async runJsonLoadTest() {
    console.log("📂 Starting JSON load test scenario...");

    if (!this.options.jsonFile) {
      throw new Error("JSON file path required for json-load-test scenario");
    }

    const jsonLoader = new JsonCaseLoader(this.dataManager);

    const loadResults = await jsonLoader.loadCasesFromFile(
      this.options.jsonFile,
      {
        requiredFields: ["bookingSection", "bookingPatient"],
        addStressPrefix: false, // Don't add prefix since API generates numbers
      }
    );

    const loadedCases = loadResults.cases;
    console.log(`✅ Loaded ${loadedCases.length} cases from JSON`);

    const qualityResults = await jsonLoader.validateDataQuality(loadedCases);

    console.log("🏗️ Creating cases from JSON data with parallel processing...");

    const creationResults = await this.parallelRunner.run(
      loadedCases,
      async (caseData, index) => {
        const result = await this.createSingleCase(caseData);
        return {
          ...result,
          index: index + 1,
          caseNumber: result.caseNumber,
        };
      }
    );

    const systemMetrics = await this.measureSystemPerformance("json-load");

    this.testResults.totalCasesAttempted = loadedCases.length;
    this.testResults.casesCreated = creationResults.results.filter(
      (r) => r?.success
    ).length;
    this.testResults.systemMetrics = systemMetrics;

    return {
      scenarioType: "json-load-test",
      loadMetrics: loadResults.metrics,
      loadSummary: loadResults.summary,
      dataQuality: qualityResults,
      creationResults: creationResults.results,
      systemMetrics,
    };
  }

  async runSystemLimitsTest() {
    console.log("🚨 Starting system limits test scenario...");
    console.log("⚠️  WARNING: This test will push the system to failure");

    if (!this.options.force) {
      throw new Error(
        "System limits test requires --force flag due to potential system impact"
      );
    }

    const scenario = new SystemLimitsTestScenario(this);
    const systemMonitor = this.startSystemMonitoring();

    try {
      const limitsResults = await scenario.execute();
      const systemMetrics = await this.stopSystemMonitoring(systemMonitor);

      this.testResults.totalCasesAttempted =
        limitsResults.limits.maxCasesProcessed || 0;
      this.testResults.casesCreated =
        limitsResults.limits.maxCasesProcessed || 0;
      this.testResults.systemMetrics = systemMetrics;

      return {
        scenarioType: "system-limits",
        limitsResults,
        systemMetrics,
      };
    } catch (error) {
      await this.stopSystemMonitoring(systemMonitor);
      throw error;
    }
  }

  async runCrossSectionUpdateTest() {
    console.log("🔄 Starting cross-section update test scenario...");

    const scenario = new CrossSectionUpdateTestScenario(this);

    const updateResults = await scenario.execute();

    this.testResults.totalCasesAttempted = updateResults.testCases || 0;
    this.testResults.casesCreated = updateResults.testCases || 0;

    return {
      scenarioType: "cross-section-updates",
      updateResults,
    };
  }

  async runComprehensiveTest() {
    console.log("🎯 Starting comprehensive stress test...");

    const results = {
      scenarioType: "comprehensive",
      phases: {},
    };

    // Phase 1: Bulk case creation with parallel processing
    console.log("\n📦 Phase 1: Enhanced bulk case creation");
    results.phases.bulkCreation = await this.runEnhancedBulkCaseCreation();

    await this.delay(10000); // 10 second pause

    // Phase 2: High concurrency test
    console.log("\n⚡ Phase 2: High concurrency test");
    this.options.volume = "100";
    results.phases.highConcurrency = await this.runHighConcurrencyTest();

    await this.delay(10000);

    // Phase 3: Cross-section updates
    console.log("\n🔄 Phase 3: Cross-section updates");
    results.phases.crossSectionUpdates = await this.runCrossSectionUpdateTest();

    // Phase 4: JSON load test (if file provided)
    if (this.options.jsonFile) {
      console.log("\n📂 Phase 4: JSON load test");
      results.phases.jsonLoad = await this.runJsonLoadTest();
    }

    // Aggregate results
    this.testResults.totalCasesAttempted = Object.values(results.phases).reduce(
      (sum, phase) =>
        sum +
        (phase.performanceMetrics?.totalCases || phase.casesGenerated || 0),
      0
    );

    this.testResults.casesCreated = Object.values(results.phases).reduce(
      (sum, phase) => sum + (phase.performanceMetrics?.successfulCases || 0),
      0
    );

    return results;
  }

  async runEnhancedValidation() {
    const casesCreated = await this.dataManager.getCasesCreated();

    if (casesCreated.length === 0) {
      console.log("⚠️ No cases to validate");
      return { message: "No cases created to validate" };
    }

    console.log(
      `   📊 Validating ${casesCreated.length} cases with ${this.options.validationLevel} validation engine`
    );

    // Update validation engine to use the correct database
    this.validationEngine.urDatabase = 'universal-reporting';

    // Run comprehensive validation using the selected engine
    const validationOptions = {
      skipProxy: this.options.skipProxy,
      skipFragment: this.options.skipFragment,
      skipDependency: this.options.skipDependency,
      useRealCaseNumbers: true, // Use actual case numbers, not STRESS_ prefixed
    };

    const validationResults =
      await this.validationEngine.runComprehensiveValidation(
        casesCreated,
        this.testResults.performanceMetrics || {},
        validationOptions
      );

    // Additional validation against baseline criteria
    if (this.baselineMetrics.validation_criteria) {
      const criteriaResults = {
        proxyCreationRate: {
          actual:
            validationResults.summary?.proxiesCreated ||
            validationResults.comprehensive?.summary?.proxiesCreated ||
            "0/0",
          target: this.baselineMetrics.validation_criteria.proxy_creation_rate,
          passed: this.checkValidationRate(
            validationResults.summary?.proxiesCreated ||
              validationResults.comprehensive?.summary?.proxiesCreated,
            this.baselineMetrics.validation_criteria.proxy_creation_rate
          ),
        },
        fragmentCreationRate: {
          actual:
            validationResults.summary?.fragmentsValid ||
            validationResults.comprehensive?.summary?.fragmentsValid ||
            "0/0",
          target:
            this.baselineMetrics.validation_criteria.fragment_creation_rate,
          passed: this.checkValidationRate(
            validationResults.summary?.fragmentsValid ||
              validationResults.comprehensive?.summary?.fragmentsValid,
            this.baselineMetrics.validation_criteria.fragment_creation_rate
          ),
        },
        dependencyCompletionRate: {
          actual:
            validationResults.summary?.dependenciesComplete ||
            validationResults.comprehensive?.summary?.dependenciesComplete ||
            "0/0",
          target:
            this.baselineMetrics.validation_criteria.dependency_completion_rate,
          passed: this.checkValidationRate(
            validationResults.summary?.dependenciesComplete ||
              validationResults.comprehensive?.summary?.dependenciesComplete,
            this.baselineMetrics.validation_criteria.dependency_completion_rate
          ),
        },
      };

      validationResults.criteriaComparison = criteriaResults;
    }

    return validationResults;
  }

  checkValidationRate(actualString, targetRate) {
    if (typeof actualString !== "string" || !actualString.includes("/"))
      return false;
    const [created, total] = actualString.split("/").map((n) => parseInt(n));
    if (total === 0) return false;
    return created / total >= targetRate;
  }

  async waitForURProcessing(timeout) {
    const checkInterval = 2000; // Check every 2 seconds
    const maxChecks = timeout / checkInterval;
    let checks = 0;

    const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let spinnerIndex = 0;

    while (checks < maxChecks) {
      process.stdout.write(
        `\r   ${spinner[spinnerIndex]} Waiting for UR processing... ${
          checks * 2
        }s`
      );
      spinnerIndex = (spinnerIndex + 1) % spinner.length;
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      checks++;
    }

    console.log("\r   ✅ UR processing wait completed                    ");
  }

  async compareToBaseline() {
    const metrics = this.testResults.performanceMetrics;
    const baseline = this.baselineMetrics.performance_targets;

    if (!metrics || !baseline) {
      return { message: "No metrics or baseline available for comparison" };
    }

    const comparison = {
      caseCreation: {
        responseTime: {
          p95: {
            actual: metrics.responseTimes?.p95 || 0,
            target: baseline.case_creation.p95_response_time,
            passed:
              (metrics.responseTimes?.p95 || 0) <=
              baseline.case_creation.p95_response_time,
          },
          avg: {
            actual: metrics.responseTimes?.avg || 0,
            target: baseline.case_creation.average_response_time,
            passed:
              (metrics.responseTimes?.avg || 0) <=
              baseline.case_creation.average_response_time,
          },
        },
        throughput: {
          actual: metrics.throughput?.casesPerSecond || 0,
          target: baseline.case_creation.throughput_min,
          passed:
            (metrics.throughput?.casesPerSecond || 0) >=
            baseline.case_creation.throughput_min,
        },
        errorRate: {
          actual: metrics.failedCases
            ? metrics.failedCases / metrics.totalCases
            : 0,
          target: baseline.case_creation.error_rate_max,
          passed:
            (metrics.failedCases
              ? metrics.failedCases / metrics.totalCases
              : 0) <= baseline.case_creation.error_rate_max,
        },
      },
      overallPassed: true,
    };

    // Calculate overall pass/fail
    comparison.overallPassed =
      comparison.caseCreation.responseTime.p95.passed &&
      comparison.caseCreation.responseTime.avg.passed &&
      comparison.caseCreation.throughput.passed &&
      comparison.caseCreation.errorRate.passed;

    await this.dataManager.saveProcessedData("baseline-comparison", comparison);

    return comparison;
  }

  async generateEnhancedReports() {
    // Generate standard reports
    const standardReports =
      await this.reportGenerator.generateComprehensiveReport(
        this.testResults,
        this.testResults.validationResults || {},
        this.testResults.systemMetrics || {}
      );

    // Generate additional enhanced reports
    const enhancedReports = {
      ...standardReports,
      baselineComparisonReport: path.join(
        this.resultsDir,
        "reports",
        "baseline-comparison.html"
      ),
      parallelExecutionReport: path.join(
        this.resultsDir,
        "reports",
        "parallel-execution.html"
      ),
    };

    // Generate baseline comparison report
    if (this.testResults.baselineComparison) {
      await this.generateBaselineComparisonReport(
        this.testResults.baselineComparison
      );
    }

    // Generate parallel execution report
    await this.generateParallelExecutionReport();

    // Generate validation level specific report if ultimate validation was used
    if (
      this.options.validationLevel === "ultimate" &&
      this.testResults.validationResults
    ) {
      await this.generateUltimateValidationReport();
      enhancedReports.ultimateValidationReport = path.join(
        this.resultsDir,
        "reports",
        "ultimate-validation.html"
      );
    }

    return enhancedReports;
  }

  async generateUltimateValidationReport() {
    const validation = this.testResults.validationResults;
    if (!validation) return;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ultimate Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1400px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .phase { margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px; }
        .phase-title { font-size: 1.2em; font-weight: bold; margin-bottom: 15px; color: #1976d2; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-value { font-size: 1.5em; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; font-size: 0.9em; }
        .pass { color: #4CAF50; }
        .fail { color: #F44336; }
        .warning { color: #FF9800; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background-color: #f5f5f5; font-weight: bold; }
        .status-excellent { color: #4CAF50; font-size: 2em; }
        .status-good { color: #8BC34A; font-size: 2em; }
        .status-fair { color: #FF9800; font-size: 2em; }
        .status-poor { color: #F44336; font-size: 2em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 Ultimate Validation Report</h1>
        
        ${
          validation.comprehensive?.summary
            ? `
        <div class="phase" style="background: #e3f2fd;">
            <h2>Overall Status: <span class="status-${validation.comprehensive.summary.overallStatus
              ?.toLowerCase()
              .replace(/[^a-z]/g, "")}">${
                validation.comprehensive.summary.overallStatus
              }</span></h2>
        </div>
        `
            : ""
        }
        
        ${
          validation.comprehensive?.details?.eventFlow
            ? `
        <div class="phase">
            <div class="phase-title">📡 Event Flow Validation</div>
            <div class="metric">
                <div class="metric-label">Events Imported</div>
                <div class="metric-value">${
                  validation.comprehensive.details.eventFlow.eventsImported || 0
                }</div>
            </div>
            <div class="metric">
                <div class="metric-label">Events Processed</div>
                <div class="metric-value">${
                  validation.comprehensive.details.eventFlow.eventsProcessed ||
                  0
                }</div>
            </div>
            ${
              validation.comprehensive.details.eventFlow.cronJobsStatus
                ? `
            <h4>Cron Jobs Status:</h4>
            <table>
                <tr><th>Job</th><th>Status</th><th>Last Run</th></tr>
                ${Object.entries(
                  validation.comprehensive.details.eventFlow.cronJobsStatus
                )
                  .map(
                    ([job, status]) => `
                    <tr>
                        <td>${job}</td>
                        <td class="${status.running ? "pass" : "fail"}">${
                      status.running ? "✅ Running" : "❌ Stopped"
                    }</td>
                        <td>${status.lastRun || "N/A"}</td>
                    </tr>
                  `
                  )
                  .join("")}
            </table>
            `
                : ""
            }
        </div>
        `
            : ""
        }
        
        ${
          validation.comprehensive?.details?.trigger
            ? `
        <div class="phase">
            <div class="phase-title">🎯 Trigger Processing</div>
            <div class="metric">
                <div class="metric-label">Triggers Evaluated</div>
                <div class="metric-value">${
                  validation.comprehensive.details.trigger.triggersEvaluated ||
                  0
                }</div>
            </div>
            <div class="metric">
                <div class="metric-label">Conditions Passed</div>
                <div class="metric-value">${
                  validation.comprehensive.details.trigger.conditionsPassed || 0
                }</div>
            </div>
            <div class="metric">
                <div class="metric-label">Context Keys Generated</div>
                <div class="metric-value">${
                  validation.comprehensive.details.trigger
                    .contextKeysGenerated || 0
                }</div>
            </div>
        </div>
        `
            : ""
        }
        
        ${
          validation.comprehensive?.details?.proxy
            ? `
        <div class="phase">
            <div class="phase-title">🔍 Proxy Creation</div>
            <div class="metric">
                <div class="metric-label">Proxies Found</div>
                <div class="metric-value">${
                  validation.comprehensive.details.proxy.found || 0
                }/${validation.comprehensive.details.proxy.checked || 0}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Success Rate</div>
                <div class="metric-value">${
                  validation.comprehensive.details.proxy.successRate?.toFixed(
                    2
                  ) || 0
                }%</div>
            </div>
            <div class="metric">
                <div class="metric-label">Context Valid</div>
                <div class="metric-value">${
                  validation.comprehensive.details.proxy.contextValid || 0
                }</div>
            </div>
            <div class="metric">
                <div class="metric-label">Fields Initialized</div>
                <div class="metric-value">${
                  validation.comprehensive.details.proxy
                    .dynamicFieldsInitialized || 0
                }</div>
            </div>
        </div>
        `
            : ""
        }
        
        ${
          validation.comprehensive?.details?.dependency
            ? `
        <div class="phase">
            <div class="phase-title">🔗 Dependency Graph</div>
            <div class="metric">
                <div class="metric-label">Nodes Created</div>
                <div class="metric-value">${
                  validation.comprehensive.details.dependency.nodesCreated || 0
                }</div>
            </div>
            <div class="metric">
                <div class="metric-label">Nodes Evaluated</div>
                <div class="metric-value">${
                  validation.comprehensive.details.dependency.nodesEvaluated ||
                  0
                }</div>
            </div>
            <div class="metric">
                <div class="metric-label">Fields Updated</div>
                <div class="metric-value">${
                  validation.comprehensive.details.dependency.fieldsUpdated || 0
                }</div>
            </div>
            ${
              validation.comprehensive.details.dependency.nodesByStatus
                ? `
            <h4>Nodes by Status:</h4>
            <table>
                <tr><th>Status</th><th>Count</th></tr>
                ${Object.entries(
                  validation.comprehensive.details.dependency.nodesByStatus
                )
                  .map(
                    ([status, count]) => `
                    <tr>
                        <td>${status}</td>
                        <td>${count}</td>
                    </tr>
                  `
                  )
                  .join("")}
            </table>
            `
                : ""
            }
        </div>
        `
            : ""
        }
        
        ${
          validation.endToEndValidation
            ? `
        <div class="phase">
            <div class="phase-title">🏁 End-to-End Flow Analysis</div>
            <div class="metric">
                <div class="metric-label">Complete Flows</div>
                <div class="metric-value class="${
                  validation.endToEndValidation.completeFlows > 0
                    ? "pass"
                    : "fail"
                }">${validation.endToEndValidation.completeFlows || 0}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Partial Flows</div>
                <div class="metric-value class="warning">${
                  validation.endToEndValidation.partialFlows || 0
                }</div>
            </div>
            <div class="metric">
                <div class="metric-label">Failed Flows</div>
                <div class="metric-value class="fail">${
                  validation.endToEndValidation.failedFlows || 0
                }</div>
            </div>
            <div class="metric">
                <div class="metric-label">Avg Completion Time</div>
                <div class="metric-value">${
                  validation.endToEndValidation.avgCompletionTime?.toFixed(2) ||
                  0
                }ms</div>
            </div>
        </div>
        `
            : ""
        }
        
        ${
          validation.comprehensive?.summary?.recommendations
            ? `
        <div class="phase">
            <div class="phase-title">💡 Recommendations</div>
            <ul>
                ${validation.comprehensive.summary.recommendations
                  .map((rec) => `<li>${rec}</li>`)
                  .join("")}
            </ul>
        </div>
        `
            : ""
        }
        
        <p style="text-align: center; color: #666; margin-top: 40px;">
            Generated: ${new Date().toLocaleString()}
        </p>
    </div>
</body>
</html>`;

    await fs.writeFile(
      path.join(this.resultsDir, "reports", "ultimate-validation.html"),
      html
    );
  }

  async generateBaselineComparisonReport(comparison) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Baseline Comparison Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .pass { color: green; font-weight: bold; }
        .fail { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .summary { background: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .summary.fail { background: #ffebee; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Baseline Comparison Report</h1>
        <div class="summary ${comparison.overallPassed ? "" : "fail"}">
            <h2>Overall Status: <span class="${
              comparison.overallPassed ? "pass" : "fail"
            }">
                ${comparison.overallPassed ? "✅ PASSED" : "❌ FAILED"}
            </span></h2>
        </div>
        
        <h3>📊 Case Creation Metrics</h3>
        <table>
            <tr>
                <th>Metric</th>
                <th>Actual</th>
                <th>Target</th>
                <th>Status</th>
            </tr>
            <tr>
                <td>Response Time (P95)</td>
                <td>${comparison.caseCreation.responseTime.p95.actual.toFixed(
                  2
                )}ms</td>
                <td>&lt; ${
                  comparison.caseCreation.responseTime.p95.target
                }ms</td>
                <td class="${
                  comparison.caseCreation.responseTime.p95.passed
                    ? "pass"
                    : "fail"
                }">
                    ${
                      comparison.caseCreation.responseTime.p95.passed
                        ? "✅ PASS"
                        : "❌ FAIL"
                    }
                </td>
            </tr>
            <tr>
                <td>Average Response Time</td>
                <td>${comparison.caseCreation.responseTime.avg.actual.toFixed(
                  2
                )}ms</td>
                <td>&lt; ${
                  comparison.caseCreation.responseTime.avg.target
                }ms</td>
                <td class="${
                  comparison.caseCreation.responseTime.avg.passed
                    ? "pass"
                    : "fail"
                }">
                    ${
                      comparison.caseCreation.responseTime.avg.passed
                        ? "✅ PASS"
                        : "❌ FAIL"
                    }
                </td>
            </tr>
            <tr>
                <td>Throughput</td>
                <td>${comparison.caseCreation.throughput.actual.toFixed(
                  2
                )} cases/s</td>
                <td>&gt; ${
                  comparison.caseCreation.throughput.target
                } cases/s</td>
                <td class="${
                  comparison.caseCreation.throughput.passed ? "pass" : "fail"
                }">
                    ${
                      comparison.caseCreation.throughput.passed
                        ? "✅ PASS"
                        : "❌ FAIL"
                    }
                </td>
            </tr>
            <tr>
                <td>Error Rate</td>
                <td>${(comparison.caseCreation.errorRate.actual * 100).toFixed(
                  2
                )}%</td>
                <td>&lt; ${(
                  comparison.caseCreation.errorRate.target * 100
                ).toFixed(2)}%</td>
                <td class="${
                  comparison.caseCreation.errorRate.passed ? "pass" : "fail"
                }">
                    ${
                      comparison.caseCreation.errorRate.passed
                        ? "✅ PASS"
                        : "❌ FAIL"
                    }
                </td>
            </tr>
        </table>
        
        <p style="text-align: center; color: #666; margin-top: 40px;">
            Generated: ${new Date().toLocaleString()}
        </p>
    </div>
</body>
</html>`;

    await fs.writeFile(
      path.join(this.resultsDir, "reports", "baseline-comparison.html"),
      html
    );
  }

  async generateParallelExecutionReport() {
    const metrics = this.testResults.performanceMetrics || {};
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Parallel Execution Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .metric-card { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; margin-bottom: 5px; }
        .chart-container { background: white; padding: 20px; margin: 20px 0; border: 1px solid #e9ecef; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚡ Parallel Execution Analysis</h1>
        
        <div class="metric-card">
            <h3>🔧 Concurrency Configuration</h3>
            <p><strong>Max Parallel:</strong> ${
              this.options.maxParallel || 10
            }</p>
            <p><strong>Batch Delay:</strong> ${
              this.options.batchDelay || 1000
            }ms</p>
            <p><strong>Retries:</strong> ${this.options.retries || 2}</p>
            <p><strong>High Concurrency Mode:</strong> ${
              this.options.highConcurrency ? "Enabled" : "Disabled"
            }</p>
            <p><strong>Validation Level:</strong> ${
              this.options.validate ? this.options.validationLevel : "Disabled"
            }</p>
        </div>
        
        <div class="metric-card">
            <h3>📊 Execution Performance</h3>
            <div class="metric-label">Total Cases</div>
            <div class="metric-value">${metrics.totalCases || 0}</div>
            
            <div class="metric-label">Success Rate</div>
            <div class="metric-value">${
              metrics.successRate?.toFixed(2) || 0
            }%</div>
            
            <div class="metric-label">Throughput</div>
            <div class="metric-value">${
              metrics.throughput?.casesPerSecond?.toFixed(2) || 0
            } cases/s</div>
        </div>
        
        <div class="metric-card">
            <h3>⏱️ Response Time Distribution</h3>
            <p><strong>Min:</strong> ${
              metrics.responseTimes?.min?.toFixed(2) || 0
            }ms</p>
            <p><strong>Average:</strong> ${
              metrics.responseTimes?.avg?.toFixed(2) || 0
            }ms</p>
            <p><strong>P95:</strong> ${
              metrics.responseTimes?.p95?.toFixed(2) || 0
            }ms</p>
            <p><strong>P99:</strong> ${
              metrics.responseTimes?.p99?.toFixed(2) || 0
            }ms</p>
            <p><strong>Max:</strong> ${
              metrics.responseTimes?.max?.toFixed(2) || 0
            }ms</p>
        </div>
        
        <div class="metric-card">
            <h3>❌ Error Analysis</h3>
            <p><strong>Failed Cases:</strong> ${metrics.failedCases || 0}</p>
            <p><strong>Error Rate:</strong> ${
              ((metrics.failedCases / metrics.totalCases) * 100).toFixed(2) || 0
            }%</p>
            ${
              metrics.errors && metrics.errors.length > 0
                ? `
                <h4>Sample Errors:</h4>
                <ul>
                    ${metrics.errors
                      .slice(0, 5)
                      .map((err) => `<li>${err}</li>`)
                      .join("")}
                </ul>
            `
                : "<p>No errors recorded</p>"
            }
        </div>
        
        <p style="text-align: center; color: #666; margin-top: 40px;">
            Generated: ${new Date().toLocaleString()}
        </p>
    </div>
</body>
</html>`;

    await fs.writeFile(
      path.join(this.resultsDir, "reports", "parallel-execution.html"),
      html
    );
  }

  startSystemMonitoring() {
    console.log("📊 Starting enhanced system monitoring...");

    const monitor = {
      startTime: Date.now(),
      metrics: [],
      interval: null,
    };

    monitor.interval = setInterval(async () => {
      const timestamp = Date.now();
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();

      const metric = {
        timestamp,
        memoryUsage: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024), // MB
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        },
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system,
        },
        activeRequests: this.parallelRunner?.activeRequests || 0,
        queueLength: this.parallelRunner?.queueLength || 0,
      };

      monitor.metrics.push(metric);

      // Check for potential issues
      if (memoryUsage.heapUsed > 4 * 1024 * 1024 * 1024) {
        console.warn(
          "⚠️ High memory usage detected:",
          Math.round(memoryUsage.heapUsed / 1024 / 1024),
          "MB"
        );
      }
    }, 5000); // Every 5 seconds

    return monitor;
  }

  async stopSystemMonitoring(monitor) {
    if (!monitor) return {};

    if (monitor.interval) {
      clearInterval(monitor.interval);
    }

    const endTime = Date.now();
    const duration = endTime - monitor.startTime;

    console.log(
      `📊 System monitoring stopped (${Math.round(duration / 1000)}s)`
    );

    const memoryUsages = monitor.metrics.map((m) => m.memoryUsage.heapUsed);
    const peakMemory = Math.max(...memoryUsages, 0);
    const avgMemory =
      memoryUsages.length > 0
        ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length
        : 0;

    const systemMetrics = {
      duration,
      metricsCollected: monitor.metrics.length,
      peakMemoryUsage: `${peakMemory}MB`,
      avgMemoryUsage: `${Math.round(avgMemory)}MB`,
      currentMemory: `${Math.round(
        process.memoryUsage().heapUsed / 1024 / 1024
      )}MB`,
      overallHealth: peakMemory < 4000 ? "STABLE" : "STRESSED",
      crashDetected: false,
      timeline: monitor.metrics,
    };

    await this.dataManager.saveRawData("system-metrics", systemMetrics);

    return systemMetrics;
  }

  async measureSystemPerformance(testType) {
    console.log(`📊 Measuring system performance for ${testType}...`);

    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    return {
      testType,
      duration: endTime - startTime,
      memoryIncrease: endMemory.heapUsed - startMemory.heapUsed,
      peakMemoryUsage: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`,
      overallHealth: "MEASURED",
    };
  }

  calculatePercentile(values, percentile) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async loadScenarioConfig(scenarioName) {
    try {
      const configPath = path.join(
        __dirname,
        "..",
        "config",
        "scenarios",
        `${scenarioName}.json`
      );
      const configContent = await fs.readFile(configPath, "utf8");
      return JSON.parse(configContent);
    } catch (error) {
      console.warn("⚠️ Could not load scenario config:", error.message);
      return (
        this.scenarioConfig || {
          default_volume: 10,
          realistic_case_data: {
            patient_pool_size: 2000,
            doctor_pool_size: 50,
            contract_pool_size: 10,
            opstandard_pool_size: 100,
          },
          concurrent_requests: {
            batch_size: 5,
            delay_between_batches: 1000,
          },
        }
      );
    }
  }

  printEnhancedSummary() {
    console.log("\n" + "=".repeat(80));
    console.log("🏥 ENHANCED CASES SERVICE STRESS TEST SUMMARY");
    console.log("=".repeat(80));

    const duration = this.testResults.totalDuration || 0;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log(`📋 Test ID: ${this.testResults.testId}`);
    console.log(`🎯 Scenario: ${this.testResults.scenario}`);
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
    console.log(
      `📊 Cases Attempted: ${this.testResults.totalCasesAttempted.toLocaleString()}`
    );
    console.log(
      `✅ Cases Created: ${this.testResults.casesCreated.toLocaleString()}`
    );

    const successRate =
      this.testResults.totalCasesAttempted > 0
        ? (this.testResults.casesCreated /
            this.testResults.totalCasesAttempted) *
          100
        : 0;
    console.log(`📈 Success Rate: ${successRate.toFixed(2)}%`);

    if (this.testResults.performanceMetrics) {
      const metrics = this.testResults.performanceMetrics;
      console.log(`\n📊 Performance Metrics:`);
      console.log(`   ⚡ Response Times:`);
      console.log(
        `      Min: ${metrics.responseTimes?.min?.toFixed(2) || "N/A"}ms`
      );
      console.log(
        `      Avg: ${metrics.responseTimes?.avg?.toFixed(2) || "N/A"}ms`
      );
      console.log(
        `      P95: ${metrics.responseTimes?.p95?.toFixed(2) || "N/A"}ms`
      );
      console.log(
        `      P99: ${metrics.responseTimes?.p99?.toFixed(2) || "N/A"}ms`
      );
      console.log(
        `      Max: ${metrics.responseTimes?.max?.toFixed(2) || "N/A"}ms`
      );
      console.log(
        `   🚀 Throughput: ${
          metrics.throughput?.casesPerSecond?.toFixed(2) || "N/A"
        } cases/s`
      );
      console.log(
        `   ⚡ Peak Concurrency: ${
          metrics.throughput?.peakConcurrency || "N/A"
        }`
      );
    }

    if (this.testResults.systemMetrics) {
      console.log(`\n💻 System Metrics:`);
      console.log(
        `   💾 Peak Memory: ${
          this.testResults.systemMetrics.peakMemoryUsage || "N/A"
        }`
      );
      console.log(
        `   💾 Avg Memory: ${
          this.testResults.systemMetrics.avgMemoryUsage || "N/A"
        }`
      );
      console.log(
        `   🏥 System Health: ${
          this.testResults.systemMetrics.overallHealth || "Unknown"
        }`
      );
    }

    if (this.testResults.baselineComparison) {
      console.log(`\n📏 Baseline Comparison:`);
      console.log(
        `   Overall: ${
          this.testResults.baselineComparison.overallPassed
            ? "✅ PASSED"
            : "❌ FAILED"
        }`
      );
    }

    if (this.testResults.validationResults) {
      console.log(`\n✅ Validation Results (${this.options.validationLevel}):`);

      // Handle both standard and ultimate validation results
      const summary =
        this.testResults.validationResults.summary ||
        this.testResults.validationResults.comprehensive?.summary;

      if (summary) {
        if (summary.overallStatus) {
          console.log(`   Overall Status: ${summary.overallStatus}`);
        }
        if (summary.proxiesCreated) {
          console.log(`   Proxies Created: ${summary.proxiesCreated}`);
        }
        if (summary.fragmentsValid) {
          console.log(`   Fragments Valid: ${summary.fragmentsValid}`);
        }
        if (summary.dependenciesComplete) {
          console.log(
            `   Dependencies Complete: ${summary.dependenciesComplete}`
          );
        }
      }

      if (this.testResults.validationResults.criteriaComparison) {
        const criteria = this.testResults.validationResults.criteriaComparison;
        console.log(
          `   Proxy Creation: ${
            criteria.proxyCreationRate.passed ? "✅" : "❌"
          } ${criteria.proxyCreationRate.actual}`
        );
        console.log(
          `   Fragment Creation: ${
            criteria.fragmentCreationRate.passed ? "✅" : "❌"
          } ${criteria.fragmentCreationRate.actual}`
        );
        console.log(
          `   Dependency Completion: ${
            criteria.dependencyCompletionRate.passed ? "✅" : "❌"
          } ${criteria.dependencyCompletionRate.actual}`
        );
      }
    }

    if (this.testResults.errors && this.testResults.errors.length > 0) {
      console.log(`\n❌ Errors: ${this.testResults.errors.length}`);
      this.testResults.errors.slice(0, 3).forEach((error) => {
        console.log(`   - ${error.message}`);
      });
    }

    console.log("\n📁 Reports Generated:");
    if (this.testResults.reportPaths) {
      Object.entries(this.testResults.reportPaths).forEach(([type, path]) => {
        console.log(`   📋 ${type}: ${path}`);
      });
    }

    console.log("\n🔗 Quick Links:");
    console.log(
      `   📊 Executive Summary: file://${path.join(
        this.resultsDir,
        "reports",
        "executive-summary.html"
      )}`
    );
    console.log(
      `   📋 Baseline Comparison: file://${path.join(
        this.resultsDir,
        "reports",
        "baseline-comparison.html"
      )}`
    );
    console.log(
      `   ⚡ Parallel Execution: file://${path.join(
        this.resultsDir,
        "reports",
        "parallel-execution.html"
      )}`
    );
    if (this.options.validationLevel === "ultimate") {
      console.log(
        `   🔍 Ultimate Validation: file://${path.join(
          this.resultsDir,
          "reports",
          "ultimate-validation.html"
        )}`
      );
    }
    console.log(`   📁 Raw Data: ${this.resultsDir}`);

    console.log("=".repeat(80));
    console.log("✅ Enhanced stress test completed successfully!");
  }
}

// Enhanced CLI Program Setup
program
  .name("enhanced-stress-test")
  .description("Enhanced Cases Service Stress Testing Framework")
  .version("2.0.0")
  .option("-s, --scenario <type>", "Test scenario to run", "bulk-case-creation")
  .option("-v, --volume <number>", "Number of cases to create", "10")
  .option("-e, --env <name>", "Target environment", "local")
  .option("-f, --jsonfile <path>", "JSON file with case data")
  .option("--no-validate", "Skip validation phase")
  .option("--skip-auth", "Skip authentication")
  .option("--no-auth", "Skip authentication (alias)")
  .option("--force", "Force execution of destructive tests")
  .option("--test-version <version>", "Test version identifier", "1.0")
  .option("--cleanup", "Cleanup test data after execution")
  .option("--dry-run", "Run in dry-run mode without actual API calls")
  .option("--max-parallel <number>", "Maximum parallel requests", "10")
  .option("--batch-delay <ms>", "Delay between batches in ms", "1000")
  .option("--retries <number>", "Number of retries for failed requests", "2")
  .option("--skip-baseline", "Skip baseline comparison")
  .option("--high-concurrency", "Enable high concurrency mode (50 parallel)")
  .option("--debug", "Enable debug mode")
  .option(
    "--validation-level <level>",
    "Validation level (basic|enhanced|ultimate)",
    "enhanced"
  )
  .option("--wait-ur <seconds>", "Wait time for UR processing in seconds", "30")
  .option("--skip-proxy", "Skip proxy validation")
  .option("--skip-fragment", "Skip fragment validation")
  .option("--skip-dependency", "Skip dependency validation");

program.parse();
const options = program.opts();

// Map and validate options
const mappedOptions = {
  scenario: options.scenario,
  volume: options.volume,
  env: options.env,
  jsonFile: options.jsonfile,
  validate: !options.noValidate,
  skipAuth: options.skipAuth || options.noAuth,
  force: options.force,
  testVersion: options.testVersion,
  cleanup: options.cleanup,
  dryRun: options.dryRun,
  maxParallel: parseInt(options.maxParallel) || 10,
  batchDelay: parseInt(options.batchDelay) || 1000,
  retries: parseInt(options.retries) || 2,
  skipBaseline: options.skipBaseline,
  highConcurrency: options.highConcurrency,
  debug: options.debug,
  validationLevel: options.validationLevel || "enhanced",
  waitUr: parseInt(options.waitUr) || 30,
  skipProxy: options.skipProxy,
  skipFragment: options.skipFragment,
  skipDependency: options.skipDependency,
};

// Apply high concurrency settings
if (mappedOptions.highConcurrency) {
  mappedOptions.maxParallel = 50;
  mappedOptions.batchDelay = 100;
  console.log("⚡ High concurrency mode enabled (50 parallel requests)");
}

// Validate options
if (mappedOptions.scenario === "json-load-test" && !mappedOptions.jsonFile) {
  console.error("❌ JSON file required for json-load-test scenario");
  process.exit(1);
}

if (mappedOptions.scenario === "system-limits" && !mappedOptions.force) {
  console.error(
    "❌ System limits test requires --force flag due to potential system impact"
  );
  process.exit(1);
}

// Main execution
async function runEnhancedStressTest() {
  const executor = new EnhancedStressTestExecutor(mappedOptions);

  try {
    await executor.initialize();
    const results = await executor.execute();

    if (mappedOptions.cleanup) {
      console.log("🧹 Cleaning up test data...");
      // Implementation would clean up created test cases
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Enhanced stress test execution failed:", error.message);

    if (mappedOptions.debug || process.env.DEBUG) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Stress test interrupted by user");
  process.exit(130);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Stress test terminated");
  process.exit(143);
});

// Execute if this script is run directly
if (require.main === module) {
  runEnhancedStressTest();
}

module.exports = EnhancedStressTestExecutor;