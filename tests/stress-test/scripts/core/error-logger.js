const fs = require('fs').promises;
const path = require('path');

class ErrorLogger {
  constructor(resultsDir) {
    this.resultsDir = resultsDir;
    this.errorLog = [];
    this.errorCategories = new Map();
  }

  async logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      statusCode: error.statusCode || error.status || 'UNKNOWN',
      message: error.message || String(error),
      category: this.categorizeError(error),
      context: context,
      stack: error.stack
    };

    this.errorLog.push(errorEntry);
    
    const category = errorEntry.category;
    this.errorCategories.set(category, (this.errorCategories.get(category) || 0) + 1);

    if (this.isCriticalError(error)) {
      await this.saveErrorLog();
    }

    return errorEntry;
  }

  categorizeError(error) {
    const message = error.message || String(error);
    const statusCode = error.statusCode || error.status;

    if (statusCode) {
      if (statusCode >= 500) return 'SERVER_ERROR';
      if (statusCode >= 400) return 'CLIENT_ERROR';
      if (statusCode >= 300) return 'REDIRECT';
    }

    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return 'TIMEOUT';
    }
    if (message.includes('ECONNREFUSED') || message.includes('ENOTFOUND')) {
      return 'CONNECTION_ERROR';
    }
    if (message.includes('duplicate') || message.includes('E11000')) {
      return 'DUPLICATE_ERROR';
    }
    if (message.includes('validation') || message.includes('ValidationError')) {
      return 'VALIDATION_ERROR';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'NOT_FOUND';
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return 'AUTH_ERROR';
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return 'PERMISSION_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  isCriticalError(error) {
    const criticalCategories = ['SERVER_ERROR', 'CONNECTION_ERROR', 'AUTH_ERROR'];
    return criticalCategories.includes(this.categorizeError(error));
  }

  async saveErrorLog() {
    const errorSummary = {
      totalErrors: this.errorLog.length,
      categories: Object.fromEntries(this.errorCategories),
      errors: this.errorLog
    };

    const errorFile = path.join(this.resultsDir, 'error-log.json');
    await fs.writeFile(errorFile, JSON.stringify(errorSummary, null, 2));

    const categorizedErrors = {};
    for (const error of this.errorLog) {
      if (!categorizedErrors[error.category]) {
        categorizedErrors[error.category] = [];
      }
      categorizedErrors[error.category].push({
        timestamp: error.timestamp,
        statusCode: error.statusCode,
        message: error.message,
        context: error.context
      });
    }

    const categorizedFile = path.join(this.resultsDir, 'errors-by-category.json');
    await fs.writeFile(categorizedFile, JSON.stringify(categorizedErrors, null, 2));
  }

  generateErrorReport() {
    const report = {
      summary: {
        totalErrors: this.errorLog.length,
        uniqueStatusCodes: [...new Set(this.errorLog.map(e => e.statusCode))],
        categories: Object.fromEntries(this.errorCategories),
        criticalErrors: this.errorLog.filter(e => this.isCriticalError(e)).length
      },
      topErrors: this.getTopErrors(5),
      timeline: this.getErrorTimeline()
    };

    return report;
  }

  getTopErrors(limit = 5) {
    const errorCounts = new Map();
    
    for (const error of this.errorLog) {
      const key = `${error.statusCode}:${error.message}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    }

    return Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => {
        const [statusCode, message] = key.split(':');
        return { statusCode, message, count };
      });
  }

  getErrorTimeline() {
    const timeline = new Map();
    
    for (const error of this.errorLog) {
      const minute = new Date(error.timestamp).toISOString().slice(0, 16);
      timeline.set(minute, (timeline.get(minute) || 0) + 1);
    }

    return Object.fromEntries(timeline);
  }
}

module.exports = ErrorLogger;