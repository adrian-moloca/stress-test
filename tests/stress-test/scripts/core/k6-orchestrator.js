const fs = require("fs").promises;
const path = require("path");
const { spawn } = require("child_process");
const K6ScriptGenerator = require("../generators/enhanced-k6-generator");

class K6Orchestrator {
  constructor(resultsDir, environment, scenarioConfig) {
    this.resultsDir = resultsDir;
    this.environment = environment;
    this.scenarioConfig = scenarioConfig;
    this.k6ScriptsDir = path.join(resultsDir, "k6-scripts");
    this.k6ResultsDir = path.join(resultsDir, "k6-results");
    this.scriptGenerator = new K6ScriptGenerator(environment, scenarioConfig);
  }

  async generateScripts(cases, options = {}) {
    console.log("📝 Generating K6 scripts...");

    const scripts = [];

    if (options.chunking && cases.length > options.chunking) {
      // Generate chunked scripts
      const chunks = this.chunkArray(cases, options.chunking);

      for (let i = 0; i < chunks.length; i++) {
        const scriptPath = path.join(this.k6ScriptsDir, `k6-chunk-${i}.js`);
        const script = await this.scriptGenerator.generate(chunks[i], {
          ...options,
          chunkIndex: i,
          totalChunks: chunks.length,
        });

        await fs.writeFile(scriptPath, script);
        scripts.push(scriptPath);
      }
    } else {
      // Single script
      const scriptPath = path.join(this.k6ScriptsDir, "k6-main.js");
      const script = await this.scriptGenerator.generate(cases, options);
      await fs.writeFile(scriptPath, script);
      scripts.push(scriptPath);
    }

    console.log(`✅ Generated ${scripts.length} K6 script(s)`);
    return scripts;
  }

  async executeScripts(scripts, options = {}) {
    console.log(`🏃 Executing ${scripts.length} K6 scripts...`);

    const results = [];

    if (options.parallel && scripts.length > 1) {
      // Execute in parallel
      const promises = scripts.map((script) =>
        this.executeK6Script(script, options)
      );

      const execResults = await Promise.allSettled(promises);

      execResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          console.error(`❌ Script ${scripts[index]} failed:`, result.reason);
          results.push({
            script: scripts[index],
            error: result.reason.message,
          });
        }
      });
    } else {
      // Execute sequentially
      for (const script of scripts) {
        try {
          const result = await this.executeK6Script(script, options);
          results.push(result);
        } catch (error) {
          console.error(`❌ Script ${script} failed:`, error.message);
          results.push({ script, error: error.message });
        }
      }
    }

    if (options.aggregateResults) {
      return this.aggregateK6Results(results);
    }

    return results;
  }

  async executeK6Script(scriptPath, options) {
    return new Promise((resolve, reject) => {
      const scriptName = path.basename(scriptPath, ".js");
      const outputPath = path.join(
        this.k6ResultsDir,
        `${scriptName}-result.json`
      );

      const args = ["run", "--out", `json=${outputPath}`];

      if (options.outputFormat?.includes("html")) {
        args.push("--out", `html=${outputPath.replace(".json", ".html")}`);
      }

      args.push(scriptPath);

      console.log(`  ▶️ Running ${scriptName}...`);

      const k6Process = spawn("k6", args, {
        env: { ...process.env, K6_NO_USAGE_REPORT: "1" },
      });

      let stdout = "";
      let stderr = "";

      k6Process.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      k6Process.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      k6Process.on("close", async (code) => {
        if (code !== 0) {
          reject(new Error(`K6 exited with code ${code}: ${stderr}`));
          return;
        }

        try {
          // Parse K6 output
          const jsonData = await fs.readFile(outputPath, "utf8");
          const results = this.parseK6Output(jsonData);

          // Extract summary from stdout
          const summary = this.extractK6Summary(stdout);

          resolve({
            script: scriptPath,
            results,
            summary,
            outputPath,
            executionTime: Date.now(),
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  parseK6Output(jsonData) {
    const lines = jsonData.split("\n").filter(Boolean);
    const metrics = {};
    const checks = {};
    const errors = [];

    lines.forEach((line) => {
      try {
        const data = JSON.parse(line);

        if (data.type === "Metric") {
          if (!metrics[data.metric]) {
            metrics[data.metric] = [];
          }
          metrics[data.metric].push(data.data);
        } else if (data.type === "Point" && data.metric === "checks") {
          const checkName = data.data.tags.check || "unknown";
          if (!checks[checkName]) {
            checks[checkName] = { passed: 0, failed: 0 };
          }
          if (data.data.value === 1) {
            checks[checkName].passed++;
          } else {
            checks[checkName].failed++;
          }
        }
      } catch (e) {
        // Skip invalid lines
      }
    });

    return { metrics, checks, errors };
  }

  extractK6Summary(stdout) {
    // Extract summary statistics from K6 stdout
    const summary = {};

    // Pattern matching for common K6 output
    const patterns = {
      vus: /vus\s+\.+\s+(\d+)/,
      duration: /duration\s+\.+\s+([\d.]+)([ms]+)/,
      iterations: /iterations\s+\.+\s+(\d+)/,
      dataReceived: /data_received\s+\.+\s+([\d.]+)\s+(\w+)/,
      dataSent: /data_sent\s+\.+\s+([\d.]+)\s+(\w+)/,
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = stdout.match(pattern);
      if (match) {
        summary[key] = match[1];
        if (match[2]) {
          summary[`${key}Unit`] = match[2];
        }
      }
    });

    return summary;
  }

  async validateResults(results, thresholds) {
    const validation = {
      passed: [],
      failed: [],
      warnings: [],
      allThresholdsPassed: true,
    };

    // Validate against configured thresholds
    Object.entries(thresholds).forEach(([metric, threshold]) => {
      const metricResults = this.getMetricValue(results, metric);
      const thresholdPassed = this.evaluateThreshold(metricResults, threshold);

      if (thresholdPassed) {
        validation.passed.push({ metric, threshold, value: metricResults });
      } else {
        validation.failed.push({ metric, threshold, value: metricResults });
        validation.allThresholdsPassed = false;
      }
    });

    return validation;
  }

  evaluateThreshold(value, threshold) {
    // Parse threshold expressions like "p(95)<200" or "avg<120"
    const match = threshold.match(/([\w()]+)([<>]=?)(\d+)/);
    if (!match) return true;

    const [, stat, operator, target] = match;
    const targetValue = parseFloat(target);

    let actualValue;
    if (stat.startsWith("p(")) {
      // Percentile
      const percentile = parseInt(stat.match(/\d+/)[0]);
      actualValue = this.calculatePercentile(value, percentile);
    } else if (stat === "avg") {
      actualValue = this.calculateAverage(value);
    } else if (stat === "max") {
      actualValue = Math.max(...value);
    } else if (stat === "min") {
      actualValue = Math.min(...value);
    } else if (stat === "rate") {
      actualValue = value; // Assuming rate is already calculated
    }

    switch (operator) {
      case "<":
        return actualValue < targetValue;
      case "<=":
        return actualValue <= targetValue;
      case ">":
        return actualValue > targetValue;
      case ">=":
        return actualValue >= targetValue;
      default:
        return true;
    }
  }

  aggregateK6Results(results) {
    // Aggregate results from multiple K6 runs
    const aggregated = {
      scripts: results.length,
      successfulRuns: results.filter((r) => !r.error).length,
      failedRuns: results.filter((r) => r.error).length,
      aggregatedMetrics: {},
      aggregatedChecks: {},
      summaries: [],
    };

    results.forEach((result) => {
      if (result.error) return;

      // Aggregate metrics
      Object.entries(result.results.metrics).forEach(([metric, values]) => {
        if (!aggregated.aggregatedMetrics[metric]) {
          aggregated.aggregatedMetrics[metric] = [];
        }
        aggregated.aggregatedMetrics[metric].push(...values);
      });

      // Aggregate checks
      Object.entries(result.results.checks).forEach(([check, data]) => {
        if (!aggregated.aggregatedChecks[check]) {
          aggregated.aggregatedChecks[check] = { passed: 0, failed: 0 };
        }
        aggregated.aggregatedChecks[check].passed += data.passed;
        aggregated.aggregatedChecks[check].failed += data.failed;
      });

      // Collect summaries
      if (result.summary) {
        aggregated.summaries.push(result.summary);
      }
    });

    // Calculate final statistics
    aggregated.finalStats = this.calculateFinalStats(aggregated);

    return aggregated;
  }

  calculateFinalStats(aggregated) {
    const stats = {};

    Object.entries(aggregated.aggregatedMetrics).forEach(([metric, values]) => {
      stats[metric] = {
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: this.calculateAverage(values),
        p50: this.calculatePercentile(values, 50),
        p90: this.calculatePercentile(values, 90),
        p95: this.calculatePercentile(values, 95),
        p99: this.calculatePercentile(values, 99),
      };
    });

    return stats;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  calculatePercentile(values, percentile) {
    if (!values || values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  getMetricValue(results, metric) {
    // Extract metric values from aggregated results
    if (results.aggregatedMetrics && results.aggregatedMetrics[metric]) {
      return results.aggregatedMetrics[metric];
    }
    return [];
  }
}

module.exports = K6Orchestrator;
