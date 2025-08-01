class MetricsTracker {
  constructor() {
    this.responseTimes = [];
    this.throughputWindows = [];
    this.windowSize = 60000; // 1 minute windows
  }

  recordResponseTime(responseTime) {
    this.responseTimes.push({
      time: Date.now(),
      value: responseTime,
    });

    // Update throughput
    this.updateThroughput();
  }

  updateThroughput() {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    // Remove old entries
    this.responseTimes = this.responseTimes.filter((r) => r.time > windowStart);

    // Calculate current throughput
    const throughput = (this.responseTimes.length / this.windowSize) * 1000;

    this.throughputWindows.push({
      time: now,
      throughput,
    });
  }

  getAllMetrics() {
    const times = this.responseTimes.map((r) => r.value);

    return {
      count: times.length,
      averageResponseTime: this.calculateAverage(times),
      minResponseTime: Math.min(...times),
      maxResponseTime: Math.max(...times),
      p50ResponseTime: this.calculatePercentile(times, 50),
      p90ResponseTime: this.calculatePercentile(times, 90),
      p95ResponseTime: this.calculatePercentile(times, 95),
      p99ResponseTime: this.calculatePercentile(times, 99),
      throughput: this.getCurrentThroughput(),
    };
  }

  getThroughputMetrics() {
    return this.throughputWindows;
  }

  getCurrentThroughput() {
    if (this.throughputWindows.length === 0) return 0;
    return this.throughputWindows[this.throughputWindows.length - 1].throughput;
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

module.exports = MetricsTracker;
