const EnhancedJsonLoader = require('./loaders/enhanced-json-loader');
const DatabaseCleaner = require('./utils/database-cleaner');
const ErrorLogger = require('./core/error-logger');
const EventIndexer = require('./core/event-indexer');
const ParallelRunner = require('./utils/parallel-runner');
const { program } = require("commander");

class EnhancedStressTestExecutor {
  constructor(options) {
    this.options = {
      ...options,
      maxParallel: Math.min(options.maxParallel || 3, 5)
    };
    
    this.errorLogger = new ErrorLogger(this.resultsDir);
    this.eventIndexer = new EventIndexer();
    this.dbCleaner = new DatabaseCleaner({
      dryRun: options.dryRun,
      testPrefix: 'STRESS_'
    });
    
    this.parallelRunner = new ParallelRunner({
      maxParallel: this.options.maxParallel,
      batchSize: options.batchSize || 5
    });
  }

  async initialize() {
    await this.eventIndexer.connect();
    await this.eventIndexer.createEventIndexes();
    
    if (this.options.cleanStart) {
      console.log('🧹 Performing clean start...');
      await this.dbCleaner.clean();
    }
    
    if (this.options.jsonConfigs && this.options.jsonConfigs.length > 0) {
      const loader = new EnhancedJsonLoader(this.dataManager, {
        tenantId: this.options.tenantId
      });
      
      const loadResults = await loader.loadMultipleConfigs(this.options.jsonConfigs);
      console.log(`📋 Loaded ${loadResults.summary.loaded} configs successfully`);
      
      if (loadResults.errors.length > 0) {
        for (const error of loadResults.errors) {
          await this.errorLogger.logError(
            new Error(error.error),
            { configPath: error.path }
          );
        }
      }
    }
  }

  async createSingleCase(caseData) {
    try {
      const result = await this.createCase(caseData);
      return result;
    } catch (error) {
      await this.errorLogger.logError(error, {
        caseNumber: caseData.caseNumber,
        operation: 'createCase'
      });
      throw error;
    }
  }

  async execute() {
    try {
      await this.initialize();
      
      const results = await this.parallelRunner.run(
        this.testCases,
        async (caseData, index) => {
          return await this.createSingleCase(caseData);
        }
      );
      
      for (const error of results.errors) {
        await this.errorLogger.logError(error);
      }
      
      await this.generateReports();
      
      return results;
    } catch (error) {
      await this.errorLogger.logError(error, { phase: 'execution' });
      throw error;
    } finally {
      await this.errorLogger.saveErrorLog();
      await this.eventIndexer.close();
    }
  }

  async generateReports() {
    const errorReport = this.errorLogger.generateErrorReport();
    await this.dataManager.saveProcessedData('error-report', errorReport);
    
    const eventStats = await this.eventIndexer.getEventStats();
    await this.dataManager.saveProcessedData('event-stats', eventStats);
  }
}

program
  .option('--clean-start', 'Clean database before starting')
  .option('--json-configs <paths...>', 'JSON config files to load')
  .option('--max-parallel <number>', 'Max parallel cases (2-5)', parseInt)
  .option('--save-errors', 'Save detailed error logs (default: true)');

module.exports = EnhancedStressTestExecutor;