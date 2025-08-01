// scripts/loaders/json-case-loader.js
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

class JsonCaseLoader {
  constructor(dataManager, options = {}) {
    this.dataManager = dataManager;
    this.options = options;
    this.loadedCases = [];
    this.loadMetrics = {
      loadStartTime: null,
      loadEndTime: null,
      casesLoaded: 0,
      validationErrors: [],
      memoryUsage: {},
    };
  }

  async loadCasesFromFile(filePath, options = {}) {
    const mergedOptions = { ...this.options, ...options };
    const isDryRun = mergedOptions.dryRun || false;
    const generatorPlugin = mergedOptions.generatorPlugin || null;
    const resultsDir = mergedOptions.resultsDir || ".stress-results";

    console.log("📂 Loading cases from JSON file...");
    this.loadMetrics.loadStartTime = Date.now();
    this.loadMetrics.memoryUsage.beforeLoad = process.memoryUsage();

    try {
      const fileStats = await fs.stat(filePath);
      console.log(
        `   📊 File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`
      );

      const content = await fs.readFile(filePath, "utf8");
      console.log("   🔄 Parsing JSON...");
      const jsonData = JSON.parse(content);

      const validation = await this.validateJsonStructure(
        jsonData,
        mergedOptions
      );
      if (!validation.valid) {
        throw new Error(
          `Invalid JSON structure: ${validation.errors.join(", ")}`
        );
      }

      const processed = await this.processCasesData(
        jsonData,
        mergedOptions,
        generatorPlugin
      );
      this.loadedCases = processed;

      this.loadMetrics.loadEndTime = Date.now();
      this.loadMetrics.casesLoaded = processed.length;
      this.loadMetrics.memoryUsage.afterLoad = process.memoryUsage();

      const loadTime =
        this.loadMetrics.loadEndTime - this.loadMetrics.loadStartTime;
      const memoryDiff =
        this.loadMetrics.memoryUsage.afterLoad.heapUsed -
        this.loadMetrics.memoryUsage.beforeLoad.heapUsed;

      console.log(`✅ Loaded ${processed.length} cases in ${loadTime}ms`);
      console.log(
        `   💾 Memory usage increased: ${(memoryDiff / 1024 / 1024).toFixed(
          2
        )} MB`
      );

      // Save metrics and raw cases (unless dry run)
      if (!isDryRun && this.dataManager) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const dumpPath = path.join(resultsDir, `json-load-${timestamp}.json`);
        await fs.mkdir(resultsDir, { recursive: true });
        await fs.writeFile(dumpPath, JSON.stringify(processed, null, 2));

        await this.dataManager.saveRawData(
          "json-load-metrics",
          this.loadMetrics
        );
        await this.dataManager.saveRawData("loaded-cases", processed);
      }

      return {
        cases: processed,
        metrics: this.loadMetrics,
        summary: {
          casesLoaded: processed.length,
          loadTimeMs: loadTime,
          memoryIncreaseBytes: memoryDiff,
          averageTimePerCase: loadTime / processed.length,
          casesPerSecond: (processed.length / loadTime) * 1000,
        },
      };
    } catch (err) {
      this.loadMetrics.loadEndTime = Date.now();
      this.loadMetrics.validationErrors.push({
        error: err.message,
        timestamp: Date.now(),
      });
      console.error("❌ JSON load failed:", err.message);
      throw err;
    }
  }

  async validateJsonStructure(data, options) {
    const errors = [];
    let cases = [];

    if (Array.isArray(data)) {
      cases = data;
    } else if (data.cases && Array.isArray(data.cases)) {
      cases = data.cases;
    } else {
      errors.push('Top-level JSON must be array or contain "cases" array');
      return { valid: false, errors };
    }

    if (cases.length === 0) {
      errors.push("No cases found in JSON");
      return { valid: false, errors };
    }

    const requiredFields = options.requiredFields || [
      "caseNumber",
      "bookingSection",
      "bookingPatient",
    ];
    for (let i = 0; i < Math.min(5, cases.length); i++) {
      const e = this.validateCaseStructure(cases[i], i, requiredFields);
      if (e.length) errors.push(...e);
    }

    return { valid: errors.length === 0, errors, casesCount: cases.length };
  }

  validateCaseStructure(caseObj, index, requiredFields) {
    const errors = [];

    for (const field of requiredFields) {
      if (!this.hasNestedProperty(caseObj, field)) {
        errors.push(`Case ${index}: Missing required field '${field}'`);
      }
    }

    const section = caseObj.bookingSection;
    if (section && section.date && isNaN(new Date(section.date).getTime())) {
      errors.push(`Case ${index}: Invalid bookingSection.date`);
    }

    const patient = caseObj.bookingPatient;
    if (patient && !patient.name && !patient.patientId) {
      errors.push(`Case ${index}: Patient must have name or patientId`);
    }

    return errors;
  }

  async processCasesData(data, options, plugin) {
    const cases = Array.isArray(data) ? data : data.cases;
    const batchSize = 1000;
    const result = [];

    for (let i = 0; i < cases.length; i += batchSize) {
      const batch = cases.slice(i, i + batchSize);
      const enhanced = batch.map((item, j) => {
        const globalIndex = i + j;
        const enhancedCase = this.enhanceCaseData(item, globalIndex, options);
        return plugin ? plugin(enhancedCase) : enhancedCase;
      });
      result.push(...enhanced);
      if (cases.length > 5000 && (i + batchSize) % 5000 === 0) {
        console.log(`   ⏳ Processed ${i + batchSize}/${cases.length}`);
      }
    }

    return result;
  }

  enhanceCaseData(caseObj, index, options) {
    const enhanced = { ...caseObj };

    enhanced._loadMetadata = {
      loadedAt: Date.now(),
      originalIndex: index,
      loadedFromFile: true,
      validationPassed: true,
    };

    if (!enhanced.timestamps) enhanced.timestamps = {};
    enhanced.timestamps.loadedAt = new Date().toISOString();

    if (enhanced.bookingSection?.date) {
      enhanced.bookingSection.date = new Date(
        enhanced.bookingSection.date
      ).toISOString();
    }

    if (
      !enhanced.caseNumber?.startsWith("STRESS_") &&
      options.addStressPrefix
    ) {
      enhanced.caseNumber = `STRESS_JSON_${enhanced.caseNumber || index}`;
    }

    if (!enhanced.status) {
      enhanced.status = "PENDING";
    }

    ["preOpSection", "surgerySection", "anesthesiaSection"].forEach(
      (section) => {
        if (!enhanced[section]) {
          enhanced[section] = this.generateDefaultSection(section);
        }
      }
    );

    return enhanced;
  }

  generateDefaultSection(name) {
    switch (name) {
      case "preOpSection":
        return { materials: [], medications: [], notes: "Generated" };
      case "surgerySection":
        return { approach: "Unknown", notes: "Generated" };
      case "anesthesiaSection":
        return { anesthesiaTypes: ["General_Anesthesia"], medications: [] };
      default:
        return {};
    }
  }

  hasNestedProperty(obj, path) {
    return path.split(".").reduce((acc, cur) => acc?.[cur], obj) !== undefined;
  }

  async validateDataQuality(cases) {
    console.log("🔍 Validating data quality...");

    const validation = {
      totalCases: cases.length,
      validCases: 0,
      invalidCases: 0,
      fieldCompleteness: {},
      dataIntegrity: {
        dateFormats: { valid: 0, invalid: 0 },
        requiredFields: { complete: 0, incomplete: 0 },
        referentialIntegrity: { valid: 0, invalid: 0 },
      },
      warnings: [],
      errors: [],
    };

    for (let i = 0; i < cases.length; i++) {
      const caseData = cases[i];
      const caseErrors = [];
      const caseWarnings = [];

      // Check required fields
      const requiredFields = ["caseNumber", "bookingSection", "bookingPatient"];
      let hasAllRequired = true;

      for (const field of requiredFields) {
        if (!this.hasNestedProperty(caseData, field)) {
          hasAllRequired = false;
          caseErrors.push(`Missing required field: ${field}`);
        }
      }

      // Check date formats
      if (caseData.bookingSection?.date) {
        const date = new Date(caseData.bookingSection.date);
        if (isNaN(date.getTime())) {
          validation.dataIntegrity.dateFormats.invalid++;
          caseErrors.push("Invalid booking date format");
        } else {
          validation.dataIntegrity.dateFormats.valid++;
        }
      }

      // Check patient data
      if (caseData.bookingPatient) {
        if (
          !caseData.bookingPatient.name &&
          !caseData.bookingPatient.patientId
        ) {
          caseWarnings.push("Patient missing both name and ID");
        }
        if (caseData.bookingPatient.birthDate) {
          const birthDate = new Date(caseData.bookingPatient.birthDate);
          if (isNaN(birthDate.getTime())) {
            caseErrors.push("Invalid patient birth date");
          }
        }
      }

      // Check booking section
      if (caseData.bookingSection) {
        if (!caseData.bookingSection.doctorId) {
          caseWarnings.push("Missing doctor ID");
        }
        if (!caseData.bookingSection.contractId) {
          caseWarnings.push("Missing contract ID");
        }
        if (!caseData.bookingSection.opStandardId) {
          caseWarnings.push("Missing operation standard ID");
        }
      }

      // Aggregate results
      if (caseErrors.length === 0) {
        validation.validCases++;
        if (hasAllRequired) {
          validation.dataIntegrity.requiredFields.complete++;
        }
      } else {
        validation.invalidCases++;
        validation.dataIntegrity.requiredFields.incomplete++;
        validation.errors.push({
          caseIndex: i,
          caseNumber: caseData.caseNumber || `unknown-${i}`,
          errors: caseErrors,
        });
      }

      if (caseWarnings.length > 0) {
        validation.warnings.push({
          caseIndex: i,
          caseNumber: caseData.caseNumber || `unknown-${i}`,
          warnings: caseWarnings,
        });
      }
    }

    // Calculate field completeness
    const allFields = new Set();
    cases.forEach((c) => this.getAllFields(c, "", allFields));

    validation.fieldCompleteness = {
      totalUniqueFields: allFields.size,
      averageFieldsPerCase:
        cases.reduce((sum, c) => {
          const fields = new Set();
          this.getAllFields(c, "", fields);
          return sum + fields.size;
        }, 0) / cases.length,
    };

    validation.validationRate =
      (validation.validCases / validation.totalCases) * 100;
    validation.dataQualityScore = this.calculateDataQualityScore(validation);

    console.log(`✅ Data quality validation complete:`);
    console.log(
      `   Valid cases: ${validation.validCases}/${
        validation.totalCases
      } (${validation.validationRate.toFixed(2)}%)`
    );
    console.log(
      `   Data quality score: ${validation.dataQualityScore.toFixed(2)}%`
    );

    return validation;
  }

  getAllFields(obj, prefix, fieldSet) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fieldPath = prefix ? `${prefix}.${key}` : key;
        fieldSet.add(fieldPath);

        if (
          typeof obj[key] === "object" &&
          obj[key] !== null &&
          !Array.isArray(obj[key])
        ) {
          this.getAllFields(obj[key], fieldPath, fieldSet);
        }
      }
    }
  }

  calculateDataQualityScore(validation) {
    const weights = {
      validCases: 0.4,
      requiredFields: 0.3,
      dateFormats: 0.2,
      warnings: 0.1,
    };

    const scores = {
      validCases: (validation.validCases / validation.totalCases) * 100,
      requiredFields:
        (validation.dataIntegrity.requiredFields.complete /
          validation.totalCases) *
        100,
      dateFormats:
        (validation.dataIntegrity.dateFormats.valid /
          (validation.dataIntegrity.dateFormats.valid +
            validation.dataIntegrity.dateFormats.invalid)) *
          100 || 0,
      warnings: Math.max(
        0,
        100 - (validation.warnings.length / validation.totalCases) * 100
      ),
    };

    return Object.keys(weights).reduce((total, key) => {
      return total + scores[key] * weights[key];
    }, 0);
  }

  getCases() {
    return this.loadedCases;
  }

  getLoadMetrics() {
    return this.loadMetrics;
  }
}

module.exports = JsonCaseLoader;
