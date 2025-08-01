const CaseDataGenerator = require('../generators/case-data-generator');
const dotenv = require('dotenv');
dotenv.config();

class SystemLimitsTestScenario {
  constructor(testRunner) {
    this.testRunner = testRunner;
    this.baseUrl = testRunner.environment.baseUrl;
    this.dataGenerator = new CaseDataGenerator();
    this.limitsResults = {
      crashPoint: null,
      maxCasesProcessed: 0,
      performanceDegradation: [],
      resourceExhaustion: [],
      recoveryTime: null
    };
  }

  async execute() {
    console.log('🚨 Starting system limits test...');
    console.log('⚠️  This test intentionally pushes the system to failure');
    
    await this.testRunner.dataManager.appendTimelineEvent({
      type: 'limits_test_started',
      message: 'System limits testing started'
    });

    // Initialize data generator
    await this.dataGenerator.initialize(this.testRunner.resultsDir);
    
    // Start with baseline load
    const baselineResults = await this.establishBaseline();
    
    // Gradually increase load until crash or performance threshold
    const escalationResults = await this.escalateLoadUntilLimits();
    
    // Test recovery if crash occurred
    const recoveryResults = await this.testSystemRecovery();
    
    const results = {
      baseline: baselineResults,
      escalation: escalationResults,
      recovery: recoveryResults,
      limits: this.limitsResults
    };
    
    await this.testRunner.dataManager.saveProcessedData('system-limits-results', results);
    
    return results;
  }

  async establishBaseline() {
    console.log('📊 Establishing baseline performance...');
    
    const baselineCases = 100;
    const caseData = await this.dataGenerator.generateBatch(baselineCases);
    
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    let successfulCases = 0;
    const errors = [];
    
    for (const caseInfo of caseData) {
      try {
        const response = await this.createCase(caseInfo);
        if (response.success) {
          successfulCases++;
        } else {
          errors.push(response.error);
        }
      } catch (error) {
        errors.push(error.message);
      }
    }
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const baseline = {
      casesAttempted: baselineCases,
      casesSuccessful: successfulCases,
      successRate: (successfulCases / baselineCases) * 100,
      totalTime: endTime - startTime,
      timePerCase: (endTime - startTime) / baselineCases,
      memoryIncrease: endMemory.heapUsed - startMemory.heapUsed,
      errors: errors.slice(0, 5) // First 5 errors for analysis
    };
    
    console.log(`✅ Baseline established: ${successfulCases}/${baselineCases} cases (${baseline.successRate.toFixed(2)}%)`);
    
    return baseline;
  }

  async escalateLoadUntilLimits() {
    console.log('📈 Escalating load to find system limits...');
    
    const escalationSteps = [
      { name: '500_cases', count: 500, batchSize: 50 },
      { name: '1000_cases', count: 1000, batchSize: 100 },
      { name: '2500_cases', count: 2500, batchSize: 150 },
      { name: '5000_cases', count: 5000, batchSize: 200 },
      { name: '7500_cases', count: 7500, batchSize: 250 },
      { name: '10000_cases', count: 10000, batchSize: 300 },
      { name: '15000_cases', count: 15000, batchSize: 400 },
      { name: '20000_cases', count: 20000, batchSize: 500 }
    ];
    
    const escalationResults = [];
    
    for (const step of escalationSteps) {
      console.log(`🔄 Testing ${step.name}: ${step.count} cases...`);
      
      const stepResult = await this.executeEscalationStep(step);
      escalationResults.push(stepResult);
      
      // Check if system crashed or performance severely degraded
      if (stepResult.crashed || stepResult.successRate < 50) {
        console.log(`🚨 System limits reached at ${step.name}`);
        this.limitsResults.crashPoint = step.name;
        this.limitsResults.maxCasesProcessed = stepResult.casesSuccessful;
        break;
      }
      
      // Check for performance degradation
      if (stepResult.avgResponseTime > 5000) { // 5 second response time
        console.log(`⚠️ Severe performance degradation detected at ${step.name}`);
        this.limitsResults.performanceDegradation.push({
          step: step.name,
          avgResponseTime: stepResult.avgResponseTime,
          timestamp: Date.now()
        });
      }
      
      // Brief pause between escalation steps
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    return escalationResults;
  }

  async executeEscalationStep(step) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    let casesSuccessful = 0;
    let totalResponseTime = 0;
    const errors = [];
    let crashed = false;
    
    try {
      // Generate cases for this step
      const totalBatches = Math.ceil(step.count / step.batchSize);
      
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const batchSize = Math.min(step.batchSize, step.count - (batchIndex * step.batchSize));
        const caseData = await this.dataGenerator.generateBatch(batchSize);
        
        // Process batch with controlled concurrency
        const batchResults = await this.processBatchWithLimits(caseData, step.name);
        
        casesSuccessful += batchResults.successful;
        totalResponseTime += batchResults.totalResponseTime;
        errors.push(...batchResults.errors);
        
        // Check for system health after each batch
        const healthCheck = await this.checkSystemHealth();
        if (!healthCheck.healthy) {
          console.log(`🚨 System health degraded during ${step.name}`);
          crashed = healthCheck.crashed;
          break;
        }
        
        // Log progress
        if (batchIndex % 10 === 0) {
          console.log(`   📊 Processed ${batchIndex * step.batchSize}/${step.count} cases`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Critical error during ${step.name}:`, error.message);
      crashed = true;
      errors.push(`Critical error: ${error.message}`);
    }
    
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    
    const stepResult = {
      stepName: step.name,
      casesAttempted: step.count,
      casesSuccessful,
      successRate: (casesSuccessful / step.count) * 100,
      totalTime: endTime - startTime,
      avgResponseTime: casesSuccessful > 0 ? totalResponseTime / casesSuccessful : 0,
      memoryIncrease: endMemory.heapUsed - startMemory.heapUsed,
      crashed,
      errors: errors.slice(0, 10), // Sample of errors
      timestamp: Date.now()
    };
    
    await this.testRunner.dataManager.appendTimelineEvent({
      type: 'escalation_step_completed',
      message: `Completed ${step.name}`,
      results: {
        successful: casesSuccessful,
        successRate: stepResult.successRate,
        crashed
      }
    });
    
    return stepResult;
  }

  async processBatchWithLimits(caseData, stepName) {
    const maxConcurrency = 10; // Limit concurrency to avoid overwhelming
    const results = {
      successful: 0,
      errors: [],
      totalResponseTime: 0
    };
    
    // Process cases in smaller concurrent groups
    for (let i = 0; i < caseData.length; i += maxConcurrency) {
      const batch = caseData.slice(i, i + maxConcurrency);
      
      const batchPromises = batch.map(async (caseInfo) => {
        const startTime = Date.now();
        try {
          const response = await this.createCaseWithTimeout(caseInfo, 30000); // 30s timeout
          const responseTime = Date.now() - startTime;
          
          if (response.success) {
            results.successful++;
            results.totalResponseTime += responseTime;
          } else {
            results.errors.push(`${caseInfo.caseNumber}: ${response.error}`);
          }
        } catch (error) {
          results.errors.push(`${caseInfo.caseNumber}: ${error.message}`);
        }
      });
      
      await Promise.allSettled(batchPromises);
      
      // Brief pause between concurrent groups
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  async createCaseWithTimeout(caseData, timeoutMs) {
    return new Promise(async (resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, timeoutMs);
      
      try {
        const response = await this.createCase(caseData);
        clearTimeout(timeout);
        resolve(response);
      } catch (error) {
        clearTimeout(timeout);
        resolve({ success: false, error: error.message });
      }
    });
  }

  async checkSystemHealth() {
    try {
      // Check application health endpoint
      const healthResponse = await fetch(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      
      const memoryUsage = process.memoryUsage();
      const memoryMB = memoryUsage.heapUsed / 1024 / 1024;
      
      // Simple health heuristics
      const memoryOk = memoryMB < 4096; // Less than 4GB
      const applicationOk = healthResponse && healthResponse.ok;
      
      return {
        healthy: memoryOk && applicationOk,
        crashed: !applicationOk,
        memoryUsage: memoryMB,
        details: {
          applicationResponding: applicationOk,
          memoryWithinLimits: memoryOk
        }
      };
      
    } catch (error) {
      return {
        healthy: false,
        crashed: true,
        error: error.message
      };
    }
  }

  async testSystemRecovery() {
    if (!this.limitsResults.crashPoint) {
      console.log('✅ No crash detected, skipping recovery test');
      return { recoveryNeeded: false };
    }
    
    console.log('🔄 Testing system recovery...');
    
    const recoveryStartTime = Date.now();
    
    // Wait for system to potentially recover
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    
    // Test with small load
    try {
      const testCases = await this.dataGenerator.generateBatch(10);
      let recoveredCases = 0;
      
      for (const caseData of testCases) {
        const response = await this.createCaseWithTimeout(caseData, 10000);
        if (response.success) {
          recoveredCases++;
        }
      }
      
      const recoveryTime = Date.now() - recoveryStartTime;
      const recoveryRate = (recoveredCases / testCases.length) * 100;
      
      this.limitsResults.recoveryTime = recoveryTime;
      
      console.log(`🔄 Recovery test: ${recoveredCases}/10 cases successful (${recoveryRate}%)`);
      
      return {
        recoveryNeeded: true,
        recoveryTime,
        recoveryRate,
        fullyRecovered: recoveryRate > 80
      };
      
    } catch (error) {
      return {
        recoveryNeeded: true,
        recoveryFailed: true,
        error: error.message
      };
    }
  }

  getAuthToken() {
    return process.env.STRESS_TEST_TOKEN || "stress-test-token";
  }

  async createCase(caseData) {
    try {
      const response = await fetch(`${this.baseUrl}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(caseData)
      });

      if (response.ok) {
        const createdCase = await response.json();
        return {
          success: true,
          caseId: createdCase.caseId
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = SystemLimitsTestScenario;