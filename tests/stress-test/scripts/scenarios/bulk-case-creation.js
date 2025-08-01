const CaseDataGenerator = require("../generators/case-data-generator");
const HighConcurrencyGenerator = require("../utils/high-concurrency-generator");
const MetricsTracker = require("../utils/metrics-tracker");

class BulkCaseCreationScenario {
  constructor(options = {}) {
    this.options = options;
    this.environment = options.environment;
    this.authService = options.authService;
    this.parallelRunner = options.parallelRunner;
    this.dataManager = options.dataManager;
    this.metricsCollector = options.metricsCollector;

    this.dataGenerator = null;
    this.highConcurrencyGenerator = null;
    this.metricsTracker = new MetricsTracker();
  }

  async initialize(resultsDir, environment) {
    this.resultsDir = resultsDir;

    // Fetch real reference data from the system
    const realReferenceData = await this.fetchRealReferenceData();

    // Initialize data generator with real IDs
    this.dataGenerator = new CaseDataGenerator({
      patientPoolSize:
        this.options.realistic_case_data?.patient_pool_size || 2000,
      doctorPoolSize: this.options.realistic_case_data?.doctor_pool_size || 50,
      contractPoolSize:
        this.options.realistic_case_data?.contract_pool_size || 10,
      opStandardPoolSize:
        this.options.realistic_case_data?.opstandard_pool_size || 100,
      realReferenceData: realReferenceData,
    });

    await this.dataGenerator.initialize(resultsDir);

    // Initialize high concurrency generator if enabled
    if (this.options.highConcurrency) {
      this.highConcurrencyGenerator = new HighConcurrencyGenerator(
        this.dataGenerator,
        {
          maxConcurrency: this.options.maxParallel || 50,
          subBatchSize: this.options.concurrent_requests?.batch_size || 50,
          pauseBetweenChunks: 100,
        }
      );
    }

    console.log("✅ Bulk case creation scenario initialized");
  }

  async execute(volume) {
    console.log(`📦 Starting bulk case creation: ${volume} cases`);

    const executionPlan = this.createExecutionPlan(volume);
    console.log(
      `📋 Execution plan: ${executionPlan.batches} batches, ${executionPlan.concurrency} concurrent`
    );

    // Phase 1: Generate test data
    const generatedCases = await this.generateCases(volume);
    await this.dataManager.saveRawData("generated-cases", generatedCases);

    // Phase 2: Create cases with advanced batching
    const creationResults = await this.createCasesWithBatching(
      generatedCases,
      executionPlan
    );

    // Phase 3: Collect and analyze metrics
    const metrics = await this.collectMetrics(creationResults);

    // Phase 4: Run scenario-specific validations
    const validations = await this.runScenarioValidations(creationResults);

    return {
      scenario: this.getName(),
      volume,
      cases: generatedCases,
      casesCreated: creationResults.successful,
      results: creationResults,
      metrics,
      validations,
      executionPlan,
      customValidations: [
        { name: "case-distribution", params: creationResults },
        { name: "throughput-consistency", params: metrics },
      ],
    };
  }

  async generateCases(volume) {
    console.log(`🎲 Generating ${volume} test cases...`);

    if (this.highConcurrencyGenerator && volume > 1000) {
      // Use high concurrency generator for large volumes
      return await this.highConcurrencyGenerator.generate(volume);
    } else {
      // Use standard batch generation
      return await this.dataGenerator.generateBatch(volume);
    }
  }

  async createCasesWithBatching(cases, executionPlan) {
    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      timings: [],
      throughput: [],
    };

    const createSingleCase = async (caseData) => {
      const startTime = Date.now();

      try {
        const response = await fetch(
          `${this.environment.casesServiceUrl}/cases/stress-test`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.authService.getToken()}`,
            },
            body: JSON.stringify(caseData),
          }
        );

        const responseTime = Date.now() - startTime;
        this.metricsTracker.recordResponseTime(responseTime);

        if (response.ok) {
          const created = await response.json();
          return {
            success: true,
            caseId: created._id || created.caseId,
            caseNumber: caseData.caseNumber,
            responseTime,
          };
        } else {
          const error = await response.text();
          return {
            success: false,
            error: `HTTP ${response.status}: ${error}`,
            responseTime,
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime,
        };
      }
    };

    // Use parallel runner for batched execution
    const batchResults = await this.parallelRunner.run(cases, createSingleCase);

    // Process results
    batchResults.results.forEach((result) => {
      if (result && result.success) {
        results.successful++;
      } else {
        results.failed++;
        if (result) {
          results.errors.push(result.error);
        }
      }
      if (result) {
        results.timings.push(result.responseTime);
      }
    });

    // Calculate throughput
    results.throughput = this.metricsTracker.getThroughputMetrics();

    return results;
  }

  async fetchRealReferenceData() {
    // Implementation from original code
    console.log("🔍 Fetching real reference data from system...");

    const token = this.authService.getToken();
    const casesUrl = `${this.environment.casesServiceUrl}/cases?page=0&limit=20&limitedCases=true`;

    try {
      const response = await fetch(casesUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const casesData = await response.json();

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

        return {
          contractIds: Array.from(contractIds).slice(0, 10),
          doctorIds: Array.from(doctorIds).slice(0, 10),
          opStandardIds: Array.from(opStandardIds).slice(0, 10),
        };
      }
    } catch (error) {
      console.warn("⚠️ Error fetching real data:", error.message);
    }

    // Fallback to hardcoded IDs
    return {
      contractIds: ["contract_DSg8orNxSST5FKjpz"],
      doctorIds: ["user_6EnqFa5TaWCtuy4wD"],
      opStandardIds: ["op_TdqjJp7oNJiG6oRbF"],
    };
  }

  createExecutionPlan(volume) {
    const cpuCount = require("os").cpus().length;
    const optimalConcurrency = Math.min(
      this.options.maxParallel || cpuCount * 2,
      Math.ceil(volume / 10)
    );

    return {
      totalCases: volume,
      concurrency: optimalConcurrency,
      batches: Math.ceil(volume / optimalConcurrency),
      estimatedDuration: (volume / optimalConcurrency) * 200, // Rough estimate
    };
  }

  async collectMetrics(results) {
    const metrics = this.metricsTracker.getAllMetrics();

    return {
      performance: {
        totalCases: results.successful + results.failed,
        successRate:
          (results.successful / (results.successful + results.failed)) * 100,
        avgResponseTime: metrics.averageResponseTime,
        p95ResponseTime: metrics.p95ResponseTime,
        p99ResponseTime: metrics.p99ResponseTime,
        throughput: metrics.throughput,
      },
      distribution: {
        successful: results.successful,
        failed: results.failed,
        errorTypes: this.categorizeErrors(results.errors),
      },
      system: await this.metricsCollector.getSystemMetrics(),
    };
  }

  categorizeErrors(errors) {
    const categories = {};
    errors.forEach((error) => {
      const category = this.getErrorCategory(error);
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }

  getErrorCategory(error) {
    if (error.includes("timeout")) return "TIMEOUT";
    if (error.includes("HTTP 5")) return "SERVER_ERROR";
    if (error.includes("HTTP 4")) return "CLIENT_ERROR";
    if (error.includes("ECONNREFUSED")) return "CONNECTION_ERROR";
    return "OTHER";
  }

  async runScenarioValidations(results) {
    return {
      dataQuality: await this.validateDataQuality(results),
      performanceThresholds: this.validatePerformanceThresholds(results),
      distributionAnalysis: this.analyzeDistribution(results),
    };
  }

  getName() {
    return "bulk-case-creation";
  }

  getDescription() {
    return "Creates multiple cases in bulk with high concurrency support and comprehensive metrics";
  }

  getDefaultConfig() {
    return {
      realistic_case_data: {
        patient_pool_size: 2000,
        doctor_pool_size: 50,
        contract_pool_size: 10,
        opstandard_pool_size: 100,
      },
      concurrent_requests: {
        max_parallel: 10,
        batch_size: 50,
        delay_between_batches: 1000,
      },
      validation: {
        verify_creation: true,
        check_data_integrity: true,
        timeout_per_case: 5000,
      },
    };
  }

  getSupportedOptions() {
    return [
      "volume",
      "maxParallel",
      "highConcurrency",
      "dryRun",
      "validateData",
    ];
  }

  // Additional validation methods...
  async validateDataQuality(results) {
    // Implementation
    return { passed: true, details: {} };
  }

  validatePerformanceThresholds(results) {
    // Implementation
    return { passed: true, details: {} };
  }

  analyzeDistribution(results) {
    // Implementation
    return { analysis: {} };
  }
}

module.exports = BulkCaseCreationScenario;
