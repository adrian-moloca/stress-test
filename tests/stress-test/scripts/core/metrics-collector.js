const os = require("os");

class MetricsCollector {
  constructor(dataManager, options = {}) {
    this.dataManager = dataManager;
    this.options = options;
    this.metrics = {
      api: [],
      system: [],
      custom: {},
    };
    this.interval = null;
    this.startTime = Date.now();
  }

  async start() {
    console.log("📊 Starting metrics collection...");

    if (this.options.collectSystemMetrics) {
      this.interval = setInterval(() => {
        this.collectSystemMetrics();
      }, this.options.metricsInterval || 1000);
    }

    // Initial collection
    await this.collectSystemMetrics();
  }

  async stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Final collection
    await this.collectSystemMetrics();

    // Save all metrics
    await this.dataManager.saveRawData("metrics", this.metrics);

    console.log("📊 Metrics collection stopped");
  }

  collectSystemMetrics() {
    const timestamp = Date.now();
    const cpus = os.cpus();

    // Calculate CPU usage
    const cpuUsage = cpus.map((cpu, index) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b);
      const idle = cpu.times.idle;
      return {
        core: index,
        usage: ((total - idle) / total) * 100,
      };
    });

    const avgCpuUsage =
      cpuUsage.reduce((sum, cpu) => sum + cpu.usage, 0) / cpus.length;

    const systemMetric = {
      timestamp,
      elapsed: timestamp - this.startTime,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usedPercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        process: process.memoryUsage(),
      },
      cpu: {
        count: cpus.length,
        avgUsage: avgCpuUsage,
        perCore: cpuUsage,
      },
      load: os.loadavg(),
    };

    this.metrics.system.push(systemMetric);

    return systemMetric;
  }

  recordApiMetric(endpoint, method, responseTime, statusCode, error = null) {
    const metric = {
      timestamp: Date.now(),
      endpoint,
      method,
      responseTime,
      statusCode,
      success: statusCode >= 200 && statusCode < 300,
      error: error ? error.message : null,
    };

    this.metrics.api.push(metric);

    return metric;
  }

  recordCustomMetric(name, value, tags = {}) {
    if (!this.metrics.custom[name]) {
      this.metrics.custom[name] = [];
    }

    this.metrics.custom[name].push({
      timestamp: Date.now(),
      value,
      tags,
    });
  }

  getMetrics() {
    return {
      duration: Date.now() - this.startTime,
      api: this.getApiMetrics(),
      system: this.getSystemMetrics(),
      custom: this.getCustomMetrics(),
    };
  }

  getApiMetrics() {
    if (this.metrics.api.length === 0) return {};

    const responseTimes = this.metrics.api.map((m) => m.responseTime);
    const successCount = this.metrics.api.filter((m) => m.success).length;

    return {
      totalRequests: this.metrics.api.length,
      successCount,
      errorCount: this.metrics.api.length - successCount,
      successRate: (successCount / this.metrics.api.length) * 100,
      avgResponseTime: this.calculateAverage(responseTimes),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p50ResponseTime: this.calculatePercentile(responseTimes, 50),
      p90ResponseTime: this.calculatePercentile(responseTimes, 90),
      p95ResponseTime: this.calculatePercentile(responseTimes, 95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 99),
      requestsPerSecond:
        this.metrics.api.length / ((Date.now() - this.startTime) / 1000),
    };
  }

  getSystemMetrics() {
    if (this.metrics.system.length === 0) return {};

    const memoryUsages = this.metrics.system.map((m) => m.memory.usedPercent);
    const cpuUsages = this.metrics.system.map((m) => m.cpu.avgUsage);

    return {
      samples: this.metrics.system.length,
      memory: {
        avgUsagePercent: this.calculateAverage(memoryUsages),
        maxUsagePercent: Math.max(...memoryUsages),
        minUsagePercent: Math.min(...memoryUsages),
        currentUsagePercent: memoryUsages[memoryUsages.length - 1],
      },
      cpu: {
        avgUsagePercent: this.calculateAverage(cpuUsages),
        maxUsagePercent: Math.max(...cpuUsages),
        minUsagePercent: Math.min(...cpuUsages),
        currentUsagePercent: cpuUsages[cpuUsages.length - 1],
      },
      timeline: this.metrics.system,
    };
  }

  getCustomMetrics() {
    const processed = {};

    Object.entries(this.metrics.custom).forEach(([name, values]) => {
      const numericValues = values
        .map((v) => v.value)
        .filter((v) => typeof v === "number");

      if (numericValues.length > 0) {
        processed[name] = {
          count: values.length,
          sum: numericValues.reduce((a, b) => a + b, 0),
          avg: this.calculateAverage(numericValues),
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          latest: values[values.length - 1].value,
        };
      } else {
        processed[name] = {
          count: values.length,
          values: values.slice(-10), // Last 10 values
        };
      }
    });

    return processed;
  }

  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

module.exports = MetricsCollector;
