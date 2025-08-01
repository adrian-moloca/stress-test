// scripts/scenarios/json-load-test.js
const JsonCaseLoader = require("../loaders/json-case-loader");

class JsonLoadTestScenario {
  constructor(options = {}) {
    this.options = options;
    this.dataManager = null;
    this.jsonLoader = null;
  }

  async initialize(resultsDir, environment, dataManager) {
    this.resultsDir = resultsDir;
    this.environment = environment;
    this.dataManager = dataManager;
    this.jsonLoader = new JsonCaseLoader(dataManager, this.options);

    console.log("✅ JSON load test scenario initialized");
  }

  async execute(jsonFilePath) {
    if (!jsonFilePath) {
      throw new Error("JSON file path is required for json-load-test scenario");
    }

    console.log(`📂 Loading cases from: ${jsonFilePath}`);

    const loadResults = await this.jsonLoader.loadCasesFromFile(jsonFilePath, {
      requiredFields: this.options.requiredFields || [
        "caseNumber",
        "bookingSection",
        "bookingPatient",
      ],
      addStressPrefix: this.options.addStressPrefix !== false,
      dryRun: this.options.dryRun,
      resultsDir: this.resultsDir,
    });

    const loadedCases = loadResults.cases;
    console.log(`✅ Loaded ${loadedCases.length} cases from JSON`);

    // Validate data quality
    const qualityResults = await this.validateDataQuality(loadedCases);

    return {
      cases: loadedCases,
      scenario: this.getName(),
      loadMetrics: loadResults.metrics,
      loadSummary: loadResults.summary,
      dataQuality: qualityResults,
      volume: loadedCases.length,
      timestamp: Date.now(),
    };
  }

  async validateDataQuality(cases) {
    const validation = {
      totalCases: cases.length,
      validCases: 0,
      invalidCases: 0,
      missingFields: {},
      dataTypes: {},
      errors: [],
    };

    for (let i = 0; i < cases.length; i++) {
      const caseData = cases[i];
      const errors = [];

      // Check required fields
      if (!caseData.caseNumber) errors.push("Missing caseNumber");
      if (!caseData.bookingSection) errors.push("Missing bookingSection");
      if (!caseData.bookingPatient) errors.push("Missing bookingPatient");

      // Check data types
      if (caseData.bookingSection && !caseData.bookingSection.date) {
        errors.push("Missing bookingSection.date");
      }

      if (errors.length === 0) {
        validation.validCases++;
      } else {
        validation.invalidCases++;
        validation.errors.push({
          caseIndex: i,
          caseNumber: caseData.caseNumber || `unknown-${i}`,
          errors,
        });
      }
    }

    validation.validationRate =
      (validation.validCases / validation.totalCases) * 100;

    return validation;
  }

  getName() {
    return "json-load-test";
  }

  getDescription() {
    return "Loads test cases from JSON file and validates data quality";
  }

  getDefaultConfig() {
    return {
      requiredFields: ["caseNumber", "bookingSection", "bookingPatient"],
      addStressPrefix: true,
      validateDataQuality: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      supportedFormats: [".json"],
      batchProcessing: {
        enabled: true,
        batchSize: 1000,
      },
    };
  }
}

module.exports = JsonLoadTestScenario;
