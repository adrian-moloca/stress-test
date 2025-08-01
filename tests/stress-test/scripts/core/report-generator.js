// scripts/core/report-generator.js
const fs = require("fs").promises;
const path = require("path");

class ReportGenerator {
  constructor(dataManager, resultsDir) {
    this.dataManager = dataManager;
    this.resultsDir = resultsDir;
  }

  async generateComprehensiveReport(
    testResults,
    validationResults,
    systemMetrics
  ) {
    console.log("📋 Generating comprehensive HTML report...");

    const reportData = {
      testId: path.basename(this.resultsDir),
      generatedAt: new Date().toISOString(),
      testResults,
      validationResults,
      systemMetrics,
      summary: this.generateExecutiveSummary(
        testResults,
        validationResults,
        systemMetrics
      ),
    };

    // Ensure reports directory exists
    await fs.mkdir(path.join(this.resultsDir, "reports"), { recursive: true });

    // Generate multiple report types
    try {
      await this.generateExecutiveReport(reportData);
      await this.generateDetailedReport(reportData);
      await this.generatePerformanceReport(reportData);
      await this.generateSystemLimitsReport(reportData);
    } catch (error) {
      console.warn("⚠️ Some reports could not be generated:", error.message);
    }

    console.log("✅ All reports generated successfully");

    return {
      executiveReport: path.join(
        this.resultsDir,
        "reports",
        "executive-summary.html"
      ),
      detailedReport: path.join(
        this.resultsDir,
        "reports",
        "detailed-report.html"
      ),
      performanceReport: path.join(
        this.resultsDir,
        "reports",
        "performance-analysis.html"
      ),
      systemLimitsReport: path.join(
        this.resultsDir,
        "reports",
        "system-limits.html"
      ),
    };
  }

  generateExecutiveSummary(testResults, validationResults, systemMetrics) {
    const casesAttempted = testResults.totalCasesAttempted || 0;
    const casesCreated = testResults.casesCreated || 0;
    const successRate =
      casesAttempted > 0 ? (casesCreated / casesAttempted) * 100 : 0;

    // Handle both direct validationResults and nested structure
    const validationData =
      validationResults?.comprehensive || validationResults || {};
    const proxiesValidated =
      validationData?.details?.proxy?.found ||
      validationData?.proxy?.found ||
      0;
    const proxiesExpected =
      validationData?.details?.proxy?.checked ||
      validationData?.proxy?.checked ||
      0;
    const proxySuccessRate =
      proxiesExpected > 0 ? (proxiesValidated / proxiesExpected) * 100 : 0;

    // Use performance metrics from testResults if k6Results not available
    const perfMetrics = testResults.performanceMetrics || {};
    const avgResponseTime =
      perfMetrics.responseTimes?.avg ||
      testResults.k6Results?.metrics?.http_req_duration?.values?.avg ||
      "N/A";
    const p95ResponseTime =
      perfMetrics.responseTimes?.p95 ||
      testResults.k6Results?.metrics?.http_req_duration?.values?.["p(95)"] ||
      "N/A";
    const throughput =
      perfMetrics.throughput?.casesPerSecond ||
      testResults.k6Results?.metrics?.http_reqs?.values?.rate ||
      "N/A";

    return {
      testStatus: this.determineOverallTestStatus(
        testResults,
        validationResults
      ),
      casesCreated: casesCreated,
      casesAttempted: casesAttempted,
      successRate: successRate.toFixed(2),
      proxySuccessRate: proxySuccessRate.toFixed(2),
      avgResponseTime:
        typeof avgResponseTime === "number"
          ? avgResponseTime.toFixed(2)
          : avgResponseTime,
      p95ResponseTime:
        typeof p95ResponseTime === "number"
          ? p95ResponseTime.toFixed(2)
          : p95ResponseTime,
      throughput:
        typeof throughput === "number" ? throughput.toFixed(2) : throughput,
      systemStability: systemMetrics.overallHealth || "Unknown",
      crashDetected: systemMetrics.crashDetected || false,
      memoryPeakUsage: systemMetrics.peakMemoryUsage || "N/A",
      cpuPeakUsage: systemMetrics.peakCpuUsage || "N/A",
    };
  }

  determineOverallTestStatus(testResults, validationResults) {
    const hasErrors = testResults.errors && testResults.errors.length > 0;
    const validationData =
      validationResults?.comprehensive || validationResults || {};
    const hasFailedValidations =
      validationData?.details?.proxy?.missing?.length > 0 ||
      validationData?.proxy?.missing?.length > 0;
    const lowSuccessRate =
      testResults.totalCasesAttempted > 0 &&
      testResults.casesCreated / testResults.totalCasesAttempted < 0.95;

    if (hasErrors || hasFailedValidations || lowSuccessRate) {
      return "FAILED";
    }
    return "PASSED";
  }

  async generateExecutiveReport(reportData) {
    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cases Stress Test - Executive Summary</title>
    <style>
        ${await this.getBaseStyles()}
        .executive-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
        }
        .status-pass { color: #28a745; }
        .status-fail { color: #dc3545; }
        .status-warning { color: #ffc107; }
        .recommendations {
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🏥 Cases Service Stress Test</h1>
            <h2>Executive Summary</h2>
            <div class="test-info">
                <span><strong>Test ID:</strong> ${reportData.testId}</span>
                <span><strong>Generated:</strong> ${new Date(
                  reportData.generatedAt
                ).toLocaleString()}</span>
                <span class="status-${reportData.summary.testStatus.toLowerCase()}">
                    <strong>Status:</strong> ${reportData.summary.testStatus}
                </span>
            </div>
        </header>

        <div class="executive-grid">
            <div class="metric-card">
                <div class="metric-label">Cases Created</div>
                <div class="metric-value status-${
                  parseFloat(reportData.summary.successRate) > 95
                    ? "pass"
                    : "fail"
                }">
                    ${reportData.summary.casesCreated.toLocaleString()}
                </div>
                <div class="metric-detail">${
                  reportData.summary.successRate
                }% success rate</div>
            </div>

            <div class="metric-card">
                <div class="metric-label">Response Time (P95)</div>
                <div class="metric-value status-${
                  parseFloat(reportData.summary.p95ResponseTime) < 200
                    ? "pass"
                    : "fail"
                }">
                    ${reportData.summary.p95ResponseTime}ms
                </div>
                <div class="metric-detail">Average: ${
                  reportData.summary.avgResponseTime
                }ms</div>
            </div>

            <div class="metric-card">
                <div class="metric-label">Throughput</div>
                <div class="metric-value status-${
                  parseFloat(reportData.summary.throughput) > 16
                    ? "pass"
                    : "fail"
                }">
                    ${reportData.summary.throughput}
                </div>
                <div class="metric-detail">requests/second</div>
            </div>

            <div class="metric-card">
                <div class="metric-label">Proxy Success Rate</div>
                <div class="metric-value status-${
                  parseFloat(reportData.summary.proxySuccessRate) > 95
                    ? "pass"
                    : "fail"
                }">
                    ${reportData.summary.proxySuccessRate}%
                </div>
                <div class="metric-detail">UR Integration</div>
            </div>

            <div class="metric-card">
                <div class="metric-label">System Stability</div>
                <div class="metric-value status-${
                  reportData.summary.systemStability === "STABLE"
                    ? "pass"
                    : "fail"
                }">
                    ${reportData.summary.systemStability}
                </div>
                <div class="metric-detail">Crash: ${
                  reportData.summary.crashDetected ? "Yes" : "No"
                }</div>
            </div>

            <div class="metric-card">
                <div class="metric-label">Peak Memory</div>
                <div class="metric-value status-${
                  this.parseMemory(reportData.summary.memoryPeakUsage) < 4000
                    ? "pass"
                    : "warning"
                }">
                    ${reportData.summary.memoryPeakUsage}
                </div>
                <div class="metric-detail">MB</div>
            </div>
        </div>

        ${await this.generateKeyFindings(reportData)}
        ${await this.generateRecommendations(reportData)}
        
        <div class="recommendations">
            <h3>📊 Quick Actions</h3>
            <ul>
                <li><a href="detailed-report.html">View Detailed Analysis</a></li>
                <li><a href="performance-analysis.html">Performance Deep Dive</a></li>
                <li><a href="system-limits.html">System Limits Report</a></li>
                <li><a href="../complete-dataset.json" download>Download Raw Data</a></li>
            </ul>
        </div>
    </div>
</body>
</html>`;

    await fs.writeFile(
      path.join(this.resultsDir, "reports", "executive-summary.html"),
      template
    );
  }

  async generateDetailedReport(reportData) {
    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cases Stress Test - Detailed Report</title>
    <style>
        ${await this.getBaseStyles()}
        .tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
            margin: 20px 0;
        }
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border: none;
            background: none;
            border-bottom: 3px solid transparent;
        }
        .tab.active {
            border-bottom-color: #007bff;
            color: #007bff;
        }
        .tab-content {
            display: none;
            padding: 20px 0;
        }
        .tab-content.active {
            display: block;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .data-table th, .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        .data-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        .error-item {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 10px;
            margin: 5px 0;
        }
        .timeline-item {
            border-left: 3px solid #007bff;
            padding-left: 15px;
            margin: 10px 0;
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🏥 Cases Service Stress Test</h1>
            <h2>Detailed Analysis Report</h2>
            <div class="test-info">
                <span><strong>Test ID:</strong> ${reportData.testId}</span>
                <span><strong>Generated:</strong> ${new Date(
                  reportData.generatedAt
                ).toLocaleString()}</span>
            </div>
        </header>

        <div class="tabs">
            <button class="tab active" onclick="showTab('performance')">Performance</button>
            <button class="tab" onclick="showTab('validation')">Validation</button>
            <button class="tab" onclick="showTab('timeline')">Timeline</button>
            <button class="tab" onclick="showTab('errors')">Errors</button>
            <button class="tab" onclick="showTab('system')">System</button>
        </div>

        <div id="performance" class="tab-content active">
            <h3>📊 Performance Analysis</h3>
            ${await this.generatePerformanceSection(reportData)}
        </div>

        <div id="validation" class="tab-content">
            <h3>✅ Validation Results</h3>
            ${await this.generateValidationSection(reportData)}
        </div>

        <div id="timeline" class="tab-content">
            <h3>⏱️ Test Timeline</h3>
            ${await this.generateTimelineSection(reportData)}
        </div>

        <div id="errors" class="tab-content">
            <h3>❌ Errors & Issues</h3>
            ${await this.generateErrorsSection(reportData)}
        </div>

        <div id="system" class="tab-content">
            <h3>💻 System Metrics</h3>
            ${await this.generateSystemSection(reportData)}
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            event.target.classList.add('active');
        }

        // Initialize charts when page loads
        window.onload = function() {
            ${await this.generateChartScripts(reportData)}
        };
    </script>
</body>
</html>`;

    await fs.writeFile(
      path.join(this.resultsDir, "reports", "detailed-report.html"),
      template
    );
  }

  async generatePerformanceReport(reportData) {
    const performanceMetrics = reportData.testResults.performanceMetrics || {};
    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cases Stress Test - Performance Analysis</title>
    <style>
        ${await this.getBaseStyles()}
        .performance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .chart-container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .metric-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .metric-label {
            font-weight: 600;
            color: #555;
        }
        .metric-value {
            color: #007bff;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🏥 Cases Service Stress Test</h1>
            <h2>Performance Analysis</h2>
            <div class="test-info">
                <span><strong>Test ID:</strong> ${reportData.testId}</span>
                <span><strong>Generated:</strong> ${new Date(
                  reportData.generatedAt
                ).toLocaleString()}</span>
            </div>
        </header>

        <div class="performance-grid">
            <div class="chart-container">
                <h3>📊 Response Time Analysis</h3>
                <div class="metric-row">
                    <span class="metric-label">Minimum:</span>
                    <span class="metric-value">${
                      performanceMetrics.responseTimes?.min?.toFixed(2) || "N/A"
                    }ms</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Average:</span>
                    <span class="metric-value">${
                      performanceMetrics.responseTimes?.avg?.toFixed(2) || "N/A"
                    }ms</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">P95:</span>
                    <span class="metric-value">${
                      performanceMetrics.responseTimes?.p95?.toFixed(2) || "N/A"
                    }ms</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">P99:</span>
                    <span class="metric-value">${
                      performanceMetrics.responseTimes?.p99?.toFixed(2) || "N/A"
                    }ms</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Maximum:</span>
                    <span class="metric-value">${
                      performanceMetrics.responseTimes?.max?.toFixed(2) || "N/A"
                    }ms</span>
                </div>
            </div>

            <div class="chart-container">
                <h3>🚀 Throughput Metrics</h3>
                <div class="metric-row">
                    <span class="metric-label">Cases per Second:</span>
                    <span class="metric-value">${
                      performanceMetrics.throughput?.casesPerSecond?.toFixed(
                        2
                      ) || "N/A"
                    }</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Peak Concurrency:</span>
                    <span class="metric-value">${
                      performanceMetrics.throughput?.peakConcurrency || "N/A"
                    }</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Total Duration:</span>
                    <span class="metric-value">${(
                      (performanceMetrics.totalDuration || 0) / 1000
                    ).toFixed(2)}s</span>
                </div>
            </div>

            <div class="chart-container">
                <h3>✅ Success Metrics</h3>
                <div class="metric-row">
                    <span class="metric-label">Total Cases:</span>
                    <span class="metric-value">${
                      performanceMetrics.totalCases || 0
                    }</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Successful:</span>
                    <span class="metric-value">${
                      performanceMetrics.successfulCases || 0
                    }</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Failed:</span>
                    <span class="metric-value">${
                      performanceMetrics.failedCases || 0
                    }</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Success Rate:</span>
                    <span class="metric-value">${
                      performanceMetrics.successRate?.toFixed(2) || 0
                    }%</span>
                </div>
            </div>
        </div>

        ${await this.generatePerformanceSection(reportData)}
    </div>
</body>
</html>`;

    await fs.writeFile(
      path.join(this.resultsDir, "reports", "performance-analysis.html"),
      template
    );
  }

  async generateSystemLimitsReport(reportData) {
    const systemMetrics = reportData.systemMetrics || {};

    // Calculate these values outside the template
    const memoryStatus = this.getMemoryStatus(systemMetrics.peakMemoryUsage);
    const memoryPercentage = this.getMemoryPercentage(
      systemMetrics.peakMemoryUsage
    );
    const duration = systemMetrics.duration
      ? (systemMetrics.duration / 1000).toFixed(2)
      : "N/A";

    const template = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cases Stress Test - System Limits</title>
    <style>
        ${await this.getBaseStyles()}
        .limits-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        .limit-metric {
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .limit-metric h4 {
            margin-bottom: 10px;
            color: #007bff;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: #28a745;
            transition: width 0.3s ease;
        }
        .progress-fill.warning {
            background: #ffc107;
        }
        .progress-fill.danger {
            background: #dc3545;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🏥 Cases Service Stress Test</h1>
            <h2>System Limits Analysis</h2>
            <div class="test-info">
                <span><strong>Test ID:</strong> ${reportData.testId}</span>
                <span><strong>Generated:</strong> ${new Date(
                  reportData.generatedAt
                ).toLocaleString()}</span>
            </div>
        </header>

        <div class="limits-container">
            <h3>💾 Memory Usage</h3>
            <div class="limit-metric">
                <h4>Heap Memory</h4>
                <p>Peak Usage: ${systemMetrics.peakMemoryUsage || "N/A"}</p>
                <p>Average Usage: ${systemMetrics.avgMemoryUsage || "N/A"}</p>
                <p>Current Usage: ${systemMetrics.currentMemory || "N/A"}</p>
                <div class="progress-bar">
                    <div class="progress-fill ${memoryStatus}" 
                         style="width: ${memoryPercentage}%"></div>
                </div>
            </div>
        </div>

        <div class="limits-container">
            <h3>🏥 System Health</h3>
            <div class="limit-metric">
                <p><strong>Overall Health:</strong> ${
                  systemMetrics.overallHealth || "Unknown"
                }</p>
                <p><strong>Crash Detected:</strong> ${
                  systemMetrics.crashDetected ? "❌ Yes" : "✅ No"
                }</p>
                <p><strong>Duration:</strong> ${duration}s</p>
                <p><strong>Metrics Collected:</strong> ${
                  systemMetrics.metricsCollected || 0
                }</p>
            </div>
        </div>

        ${
          systemMetrics.timeline && systemMetrics.timeline.length > 0
            ? `
        <div class="limits-container">
            <h3>📈 Resource Timeline</h3>
            <canvas id="resourceChart" width="400" height="200"></canvas>
        </div>
        `
            : ""
        }
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        ${this.generateResourceChartScript(systemMetrics)}
    </script>
</body>
</html>`;

    await fs.writeFile(
      path.join(this.resultsDir, "reports", "system-limits.html"),
      template
    );
  }

  // Helper methods
  getMemoryStatus(memoryUsage) {
    const memory = this.parseMemory(memoryUsage);
    if (memory < 2000) return "";
    if (memory < 3000) return "warning";
    return "danger";
  }

  getMemoryPercentage(memoryUsage) {
    const memory = this.parseMemory(memoryUsage);
    const maxMemory = 4096; // 4GB
    return Math.min((memory / maxMemory) * 100, 100);
  }

  parseMemory(memoryString) {
    if (!memoryString || memoryString === "N/A") return 0;
    const match = memoryString.toString().match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  generateResourceChartScript(systemMetrics) {
    if (!systemMetrics.timeline || systemMetrics.timeline.length === 0) {
      return "";
    }

    const labels = systemMetrics.timeline.map((_, i) => i);
    const memoryData = systemMetrics.timeline.map(
      (m) => m.memoryUsage?.heapUsed || 0
    );

    return `
      const ctx = document.getElementById('resourceChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ${JSON.stringify(labels)},
          datasets: [{
            label: 'Memory Usage (MB)',
            data: ${JSON.stringify(memoryData)},
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Memory (MB)'
              }
            }
          }
        }
      });
    `;
  }

  // ... rest of your existing methods remain the same ...

  async generatePerformanceSection(reportData) {
    const k6Data = reportData.testResults.k6Results || {};
    const metrics = k6Data.metrics || {};

    return `
        <div class="chart-container">
            <h4>Response Time Distribution</h4>
            <canvas id="responseTimeChart" width="400" height="200"></canvas>
        </div>

        <div class="chart-container">
            <h4>Throughput Over Time</h4>
            <canvas id="throughputChart" width="400" height="200"></canvas>
        </div>

        <table class="data-table">
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Average</th>
                    <th>P95</th>
                    <th>P99</th>
                    <th>Max</th>
                    <th>Target</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Response Time (ms)</td>
                    <td>${
                      metrics.http_req_duration?.values?.avg?.toFixed(2) ||
                      "N/A"
                    }</td>
                    <td>${
                      metrics.http_req_duration?.values?.["p(95)"]?.toFixed(
                        2
                      ) || "N/A"
                    }</td>
                    <td>${
                      metrics.http_req_duration?.values?.["p(99)"]?.toFixed(
                        2
                      ) || "N/A"
                    }</td>
                    <td>${
                      metrics.http_req_duration?.values?.max?.toFixed(2) ||
                      "N/A"
                    }</td>
                    <td>&lt; 200ms</td>
                    <td class="status-${
                      (metrics.http_req_duration?.values?.["p(95)"] || 0) < 200
                        ? "pass"
                        : "fail"
                    }">
                        ${
                          (metrics.http_req_duration?.values?.["p(95)"] || 0) <
                          200
                            ? "✅"
                            : "❌"
                        }
                    </td>
                </tr>
                <tr>
                    <td>Throughput (req/s)</td>
                    <td>${
                      metrics.http_reqs?.values?.rate?.toFixed(2) || "N/A"
                    }</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>&gt; 16.67</td>
                    <td class="status-${
                      (metrics.http_reqs?.values?.rate || 0) > 16.67
                        ? "pass"
                        : "fail"
                    }">
                        ${
                          (metrics.http_reqs?.values?.rate || 0) > 16.67
                            ? "✅"
                            : "❌"
                        }
                    </td>
                </tr>
                <tr>
                    <td>Error Rate (%)</td>
                    <td>${(
                      (metrics.http_req_failed?.values?.rate || 0) * 100
                    ).toFixed(2)}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>-</td>
                    <td>&lt; 1%</td>
                    <td class="status-${
                      (metrics.http_req_failed?.values?.rate || 0) < 0.01
                        ? "pass"
                        : "fail"
                    }">
                        ${
                          (metrics.http_req_failed?.values?.rate || 0) < 0.01
                            ? "✅"
                            : "❌"
                        }
                    </td>
                </tr>
            </tbody>
        </table>`;
  }

  async generateValidationSection(reportData) {
    const validation =
      reportData.validationResults?.comprehensive?.details ||
      reportData.validationResults?.details ||
      reportData.validationResults ||
      {};

    return `
        <div class="validation-grid">
            <div class="metric-card">
                <h4>🔍 Proxy Creation</h4>
                <p><strong>Found:</strong> ${validation.proxy?.found || 0}/${
      validation.proxy?.checked || 0
    }</p>
                <p><strong>Success Rate:</strong> ${
                  validation.proxy?.checked > 0
                    ? (
                        (validation.proxy?.found / validation.proxy?.checked) *
                        100
                      ).toFixed(2)
                    : 0
                }%</p>
                <p><strong>Missing:</strong> ${
                  validation.proxy?.missing?.length || 0
                }</p>
            </div>

            <div class="metric-card">
                <h4>🧩 Fragment Validation</h4>
                <p><strong>Valid:</strong> ${validation.fragment?.valid || 0}/${
      validation.fragment?.checked || 0
    }</p>
                <p><strong>Success Rate:</strong> ${
                  validation.fragment?.checked > 0
                    ? (
                        (validation.fragment?.valid /
                          validation.fragment?.checked) *
                        100
                      ).toFixed(2)
                    : 0
                }%</p>
                <p><strong>Invalid:</strong> ${
                  validation.fragment?.invalid?.length || 0
                }</p>
            </div>

            <div class="metric-card">
                <h4>🔗 Dependencies</h4>
                <p><strong>Complete:</strong> ${
                  validation.dependency?.complete || 0
                }/${validation.dependency?.checked || 0}</p>
                <p><strong>Completion Rate:</strong> ${
                  validation.dependency?.checked > 0
                    ? (
                        (validation.dependency?.complete /
                          validation.dependency?.checked) *
                        100
                      ).toFixed(2)
                    : 0
                }%</p>
                <p><strong>Incomplete:</strong> ${
                  validation.dependency?.incomplete?.length || 0
                }</p>
            </div>
        </div>

        ${
          validation.proxy?.missing?.length > 0
            ? `
        <h4>❌ Missing Proxies</h4>
        <div class="missing-proxies">
            ${validation.proxy.missing
              .slice(0, 10)
              .map(
                (missing) => `
                <div class="error-item">
                    <strong>Case:</strong> ${missing.caseNumber}<br>
                    <strong>Reason:</strong> ${missing.reason}
                </div>
            `
              )
              .join("")}
            ${
              validation.proxy.missing.length > 10
                ? `<p>... and ${validation.proxy.missing.length - 10} more</p>`
                : ""
            }
        </div>`
            : ""
        }`;
  }

  async generateTimelineSection(reportData) {
    const timeline = reportData.testResults.timeline || [];

    return `
        <div class="chart-container">
            <h4>Test Execution Timeline</h4>
            <canvas id="timelineChart" width="400" height="200"></canvas>
        </div>

        <div class="timeline-events">
            ${timeline
              .slice(0, 20)
              .map(
                (event) => `
                <div class="timeline-item">
                    <strong>${new Date(
                      event.timestamp
                    ).toLocaleTimeString()}</strong> - 
                    ${event.type}: ${event.message}
                    ${
                      event.details
                        ? `<br><small>${JSON.stringify(
                            event.details,
                            null,
                            2
                          )}</small>`
                        : ""
                    }
                </div>
            `
              )
              .join("")}
            ${
              timeline.length > 20
                ? `<p>... and ${timeline.length - 20} more events</p>`
                : ""
            }
        </div>`;
  }

  async generateErrorsSection(reportData) {
    const errors = reportData.testResults.errors || [];
    const k6Errors = reportData.testResults.k6Results?.root_group?.checks || [];

    return `
        <h4>🚨 Test Execution Errors</h4>
        ${
          errors.length > 0
            ? `
            <div class="errors-list">
                ${errors
                  .slice(0, 10)
                  .map(
                    (error) => `
                    <div class="error-item">
                        <strong>Time:</strong> ${new Date(
                          error.timestamp
                        ).toLocaleString()}<br>
                        <strong>Type:</strong> ${
                          error.type || "General Error"
                        }<br>
                        <strong>Message:</strong> ${error.message}<br>
                        ${
                          error.caseNumber
                            ? `<strong>Case:</strong> ${error.caseNumber}<br>`
                            : ""
                        }
                        ${
                          error.stack
                            ? `<details><summary>Stack Trace</summary><pre>${error.stack}</pre></details>`
                            : ""
                        }
                    </div>
                `
                  )
                  .join("")}
                ${
                  errors.length > 10
                    ? `<p>... and ${errors.length - 10} more errors</p>`
                    : ""
                }
            </div>
        `
            : "<p>✅ No errors detected during test execution</p>"
        }

        <h4>📊 K6 Check Failures</h4>
        ${
          k6Errors.length > 0
            ? `
            <table class="data-table">
                <thead>
                    <tr><th>Check</th><th>Passes</th><th>Failures</th><th>Success Rate</th></tr>
                </thead>
                <tbody>
                    ${k6Errors
                      .map(
                        (check) => `
                        <tr>
                            <td>${check.name}</td>
                            <td>${check.passes}</td>
                            <td>${check.fails}</td>
                            <td class="status-${
                              check.fails === 0 ? "pass" : "fail"
                            }">
                                ${(
                                  (check.passes /
                                    (check.passes + check.fails)) *
                                  100
                                ).toFixed(2)}%
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        `
            : "<p>✅ All K6 checks passed</p>"
        }`;
  }

  async generateSystemSection(reportData) {
    const systemMetrics = reportData.systemMetrics || {};

    return `
        <div class="chart-container">
            <h4>System Resource Usage</h4>
            <canvas id="systemChart" width="400" height="200"></canvas>
        </div>

        <table class="data-table">
            <thead>
                <tr><th>Metric</th><th>Current</th><th>Peak</th><th>Average</th><th>Status</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td>Memory Usage (MB)</td>
                    <td>${systemMetrics.currentMemory || "N/A"}</td>
                    <td>${systemMetrics.peakMemoryUsage || "N/A"}</td>
                    <td>${systemMetrics.avgMemoryUsage || "N/A"}</td>
                    <td class="status-${
                      this.parseMemory(systemMetrics.peakMemoryUsage) < 4000
                        ? "pass"
                        : "warning"
                    }">
                        ${
                          this.parseMemory(systemMetrics.peakMemoryUsage) < 4000
                            ? "✅"
                            : "⚠️"
                        }
                    </td>
                </tr>
                <tr>
                    <td>CPU Usage (%)</td>
                    <td>${systemMetrics.currentCpu || "N/A"}</td>
                    <td>${systemMetrics.peakCpuUsage || "N/A"}</td>
                    <td>${systemMetrics.avgCpuUsage || "N/A"}</td>
                    <td class="status-${
                      (systemMetrics.peakCpuUsage || 0) < 85
                        ? "pass"
                        : "warning"
                    }">
                        ${(systemMetrics.peakCpuUsage || 0) < 85 ? "✅" : "⚠️"}
                    </td>
                </tr>
            </tbody>
        </table>

        <h4>🏥 Application Health</h4>
        <div class="metric-card">
            <p><strong>Overall Health:</strong> ${
              systemMetrics.overallHealth || "Unknown"
            }</p>
            <p><strong>Crash Detected:</strong> ${
              systemMetrics.crashDetected ? "❌ Yes" : "✅ No"
            }</p>
            <p><strong>Database Connections:</strong> ${
              systemMetrics.dbConnections || "N/A"
            }</p>
            <p><strong>Queue Backlogs:</strong> ${
              systemMetrics.queueBacklogs || "N/A"
            }</p>
        </div>`;
  }

  async generateChartScripts(reportData) {
    return `
        // Response Time Chart
        const responseTimeCtx = document.getElementById('responseTimeChart')?.getContext('2d');
        if (responseTimeCtx) {
            new Chart(responseTimeCtx, {
                type: 'line',
                data: {
                    labels: ${JSON.stringify(
                      this.generateTimeLabels(reportData)
                    )},
                    datasets: [{
                        label: 'Response Time (ms)',
                        data: ${JSON.stringify(
                          this.extractResponseTimeData(reportData)
                        )},
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // System Chart
        const systemCtx = document.getElementById('systemChart')?.getContext('2d');
        if (systemCtx) {
            new Chart(systemCtx, {
                type: 'line',
                data: {
                    labels: ${JSON.stringify(
                      this.generateTimeLabels(reportData)
                    )},
                    datasets: [{
                        label: 'Memory (MB)',
                        data: ${JSON.stringify(
                          this.extractMemoryData(reportData)
                        )},
                        borderColor: 'rgb(255, 99, 132)',
                        yAxisID: 'y'
                    }, {
                        label: 'CPU (%)',
                        data: ${JSON.stringify(
                          this.extractCpuData(reportData)
                        )},
                        borderColor: 'rgb(54, 162, 235)',
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { type: 'linear', display: true, position: 'left' },
                        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false } }
                    }
                }
            });
        }`;
  }

  async getBaseStyles() {
    return `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header h1 { color: #007bff; margin-bottom: 10px; }
        .header h2 { color: #6c757d; margin-bottom: 20px; }
        .test-info { display: flex; gap: 30px; flex-wrap: wrap; }
        .test-info span { font-size: 0.9em; }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
        .status-warning { color: #ffc107; font-weight: bold; }
        .metric-detail { font-size: 0.8em; color: #666; margin-top: 5px; }
        .validation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .metric-card h4 { margin-bottom: 15px; color: #007bff; }
    `;
  }

  generateTimeLabels(reportData) {
    // Generate time labels based on test duration
    const timeline = reportData.testResults.timeline || [];
    if (timeline.length === 0) return [];

    const startTime = timeline[0].timestamp;
    const endTime = timeline[timeline.length - 1].timestamp;
    const duration = endTime - startTime;
    const intervals = 20; // 20 data points

    const labels = [];
    for (let i = 0; i <= intervals; i++) {
      const time = startTime + (duration * i) / intervals;
      labels.push(new Date(time).toLocaleTimeString());
    }
    return labels;
  }

  extractResponseTimeData(reportData) {
    // Extract response time data from timeline or k6 results
    const timeline = reportData.testResults.timeline || [];
    return timeline
      .filter((event) => event.responseTime)
      .map((event) => event.responseTime);
  }

  extractMemoryData(reportData) {
    const systemData = reportData.systemMetrics?.timeline || [];
    return systemData.map((entry) => entry.memoryUsage?.heapUsed || 0);
  }

  extractCpuData(reportData) {
    const systemData = reportData.systemMetrics?.timeline || [];
    return systemData.map((entry) => entry.cpuUsage?.user || 0);
  }

  async generateKeyFindings(reportData) {
    const findings = [];

    // Performance findings
    const p95ResponseTime = parseFloat(reportData.summary.p95ResponseTime) || 0;
    if (p95ResponseTime > 200) {
      findings.push("⚠️ Response time P95 exceeds 200ms target");
    }

    // Proxy creation findings
    const proxySuccessRate =
      parseFloat(reportData.summary.proxySuccessRate) || 0;
    if (proxySuccessRate < 95) {
      findings.push("❌ Proxy creation success rate below 95%");
    }

    // System findings
    if (reportData.summary.crashDetected) {
      findings.push("🚨 System crash detected during testing");
    }

    if (findings.length === 0) {
      findings.push("✅ All key metrics within acceptable ranges");
    }

    return `
        <div class="recommendations">
            <h3>🔍 Key Findings</h3>
            <ul>
                ${findings.map((finding) => `<li>${finding}</li>`).join("")}
            </ul>
        </div>`;
  }

  async generateRecommendations(reportData) {
    const recommendations = [];

    // Performance recommendations
    const errorRate =
      reportData.testResults.k6Results?.metrics?.http_req_failed?.values
        ?.rate || 0;
    if (errorRate > 0.01) {
      recommendations.push(
        "Consider optimizing database queries and connection pooling"
      );
    }

    // Memory recommendations
    const peakMemory = this.parseMemory(reportData.summary.memoryPeakUsage);
    if (peakMemory > 3000) {
      recommendations.push(
        "Monitor memory usage closely in production, consider increasing heap size"
      );
    }

    // UR integration recommendations
    const proxyMissing =
      reportData.validationResults?.comprehensive?.details?.proxy?.missing
        ?.length ||
      reportData.validationResults?.proxy?.missing?.length ||
      0;
    if (proxyMissing > 0) {
      recommendations.push(
        "Investigate Universal Reporting integration issues"
      );
    }

    if (recommendations.length === 0) {
      recommendations.push("System performing well under stress conditions");
    }

    return `
        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
                ${recommendations.map((rec) => `<li>${rec}</li>`).join("")}
            </ul>
        </div>`;
  }
}

module.exports = ReportGenerator;
