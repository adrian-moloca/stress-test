const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

class CrossSectionUpdateTestScenario {
  constructor(testRunner) {
    this.testRunner = testRunner;
    this.baseUrl = testRunner.environment.baseUrl;
    this.updateResults = {
      fieldUpdateTests: [],
      cascadeTimings: [],
      concurrentUpdateTests: []
    };
    this.maxParallel = testRunner.options?.maxParallel || 5;
    this.dryRun = testRunner.options?.dryRun === true;
  }

  async execute() {
    console.log('🔄 Starting cross-section update test...');
    const startTS = new Date().toISOString();

    const testCases = await this.createTestCases(100);

    const singleFieldResults = await this.testSingleFieldUpdates(testCases);
    const multiFieldResults = await this.testMultipleFieldUpdates(testCases);
    const concurrentResults = await this.testConcurrentUpdates(testCases.slice(0, 10));
    const cascadeResults = await this.testDependencyCascadeTiming(testCases.slice(0, 20));

    const results = {
      executedAt: startTS,
      testCases: testCases.length,
      singleFieldUpdates: singleFieldResults,
      multipleFieldUpdates: multiFieldResults,
      concurrentUpdates: concurrentResults,
      dependencyCascades: cascadeResults,
      summary: this.generateUpdateTestSummary(singleFieldResults, multiFieldResults, concurrentResults, cascadeResults)
    };

    const resultsPath = path.join(this.testRunner.resultsDir, `cross-section-update-raw-${startTS.replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`📝 Raw update results saved to ${resultsPath}`);

    await this.testRunner.dataManager.saveProcessedData('cross-section-update-results', results);
    return results;
  }

  async createTestCases(count) {
    console.log(`📋 Creating ${count} test cases for update testing...`);
    const caseDataGenerator = new (require('../generators/case-data-generator'))();
    await caseDataGenerator.initialize(this.testRunner.resultsDir);

    const cases = [];
    const batchSize = 20;

    for (let i = 0; i < count; i += batchSize) {
      const batch = await caseDataGenerator.generateBatch(Math.min(batchSize, count - i));
      for (const caseData of batch) {
        try {
          if (this.dryRun) {
            cases.push({ caseId: `DRY-${Math.random().toString(36).slice(2)}`, originalData: caseData });
          } else {
            const response = await this.createCase(caseData);
            if (response.success) {
              cases.push({
                caseId: response.caseId,
                caseNumber: caseData.caseNumber,
                originalData: caseData
              });
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to create test case: ${error.message}`);
        }
      }
      await new Promise(res => setTimeout(res, 300));
    }

    console.log(`✅ Created ${cases.length} test cases`);
    return cases;
  }

  async testSingleFieldUpdates(testCases) {
    console.log('🎯 Testing single field updates...');
    const fieldsToTest = [
      {
        path: 'bookingPatient.name',
        newValue: 'Updated Name',
        expectsCascade: true,
        cascadeFields: ['billingSection.patientName']
      },
      {
        path: 'preOpSection.materials[0].quantity',
        newValue: 10,
        expectsCascade: true,
        cascadeFields: ['preOpSection.totalCost', 'billingSection.totalCost']
      },
      {
        path: 'status',
        newValue: 'CONFIRMED',
        expectsCascade: true,
        cascadeFields: ['timestamps.confirmedAt', 'billingSection.status']
      }
    ];

    const results = [];
    for (const field of fieldsToTest) {
      const result = await this.testFieldUpdate(testCases.slice(0, 10), field);
      results.push(result);
    }
    return results;
  }

  getAuthToken() {
    return process.env.STRESS_TEST_TOKEN || "stress-test-token";
  }

  async testFieldUpdate(testCases, fieldConfig) {
    const result = {
      field: fieldConfig.path,
      casesUpdated: 0,
      updateTimings: [],
      cascadeTimings: [],
      errors: []
    };

    const parallelGroups = this.chunkArray(testCases, this.maxParallel);
    for (const group of parallelGroups) {
      await Promise.all(group.map(async testCase => {
        try {
          const updateStart = Date.now();
          const updatePayload = this.createUpdatePayload(testCase.originalData, fieldConfig.path, fieldConfig.newValue);
          let success = false;

          if (!this.dryRun) {
            const response = await fetch(`${this.baseUrl}/cases/${testCase.caseId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
              },
              body: JSON.stringify(updatePayload)
            });
            success = response.ok;
          } else {
            success = true;
          }

          const updateTime = Date.now() - updateStart;
          result.updateTimings.push(updateTime);
          if (success) {
            result.casesUpdated++;
            if (fieldConfig.expectsCascade && !this.dryRun) {
              const cascadeTime = await this.measureCascadeTiming(testCase, fieldConfig);
              result.cascadeTimings.push(cascadeTime);
            }
          } else {
            result.errors.push({ caseId: testCase.caseId, error: 'Update failed' });
          }
        } catch (e) {
          result.errors.push({ caseId: testCase.caseId, error: e.message });
        }
      }));
    }

    result.statistics = {
      p95UpdateTime: this.calculatePercentile(result.updateTimings, 95),
      averageUpdateTime: this.calculateAverage(result.updateTimings),
      successRate: (result.casesUpdated / testCases.length) * 100,
      averageCascadeTime: this.calculateAverage(result.cascadeTimings)
    };

    return result;
  }

  async measureCascadeTiming(testCase, fieldConfig) {
    const start = Date.now();
    const maxWait = 8000;
    const interval = 200;

    while (Date.now() - start < maxWait) {
      const currentCase = await this.getCase(testCase.caseId);
      if (this.isCascadeComplete(currentCase, fieldConfig)) return Date.now() - start;
      await new Promise(r => setTimeout(r, interval));
    }

    return maxWait;
  }

  async getCase(caseId) {
    const res = await fetch(`${this.baseUrl}/cases/${caseId}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });
    return res.ok ? await res.json() : {};
  }

  isCascadeComplete(currentCase, config) {
    return config.cascadeFields.every(f => {
      try {
        const val = this.getNestedValue(currentCase, f);
        return val !== null && val !== undefined;
      } catch {
        return false;
      }
    });
  }

  createUpdatePayload(originalData, path, value) {
    const clone = JSON.parse(JSON.stringify(originalData));
    this.setNestedValue(clone, path, value);
    clone.timestamps.updatedAt = new Date().toISOString();

    return {
      caseData: clone,
      caseLoadedAtTS: new Date(),
      acceptedConflicts: [],
      changedFields: [path, 'timestamps.updatedAt']
    };
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => {
      if (part.includes('[')) {
        const [arr, idx] = part.split(/\[|\]/).filter(Boolean);
        return acc?.[arr]?.[+idx];
      }
      return acc?.[part];
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key.includes('[')) {
        const [arr, idx] = key.split(/\[|\]/).filter(Boolean);
        current[arr] = current[arr] || [];
        current = current[arr][+idx] = current[arr][+idx] || {};
      } else {
        current = current[key] = current[key] || {};
      }
    }
    current[keys[keys.length - 1]] = value;
  }

  calculateAverage(arr) {
    return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }

  calculatePercentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor((p / 100) * sorted.length);
    return sorted[Math.min(idx, sorted.length - 1)];
  }

  chunkArray(arr, size) {
    return arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);
  }

  generateUpdateTestSummary(single, multi, concurrent, cascade) {
    const allTimings = [...single.flatMap(f => f.updateTimings), ...multi.flatMap(f => f.updateTimings)];
    const allCascades = [...single.flatMap(f => f.cascadeTimings), ...multi.flatMap(f => f.cascadeTimings)];
    return {
      totalUpdates: allTimings.length,
      p95Update: this.calculatePercentile(allTimings, 95),
      avgUpdate: this.calculateAverage(allTimings),
      avgCascade: this.calculateAverage(allCascades),
      maxCascade: Math.max(...allCascades, 0)
    };
  }
}

module.exports = CrossSectionUpdateTestScenario;
