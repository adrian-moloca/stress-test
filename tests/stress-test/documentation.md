markdown# Universal Reporting Stress Test Framework

## Quick Start

```bash
# Install dependencies
npm install

# Run complete stress test
npm run stress-test

# Or run individual components
npm run stress-test:normalize  # Check system readiness
npm run stress-test:clean      # Clean databases
npm run stress-test:simple     # Run simple 100-case test
npm run stress-test:comprehensive  # Run full test suite
Test Scenarios
The framework includes progressive stress scenarios:
ScenarioCasesProxies/CaseParallelPurpose110022Baseline performance250033Moderate load31,00044Standard load42,00055High load55,00077Stress conditions610,0001010Breaking point
Understanding Results
Performance Ratings

EXCELLENT (90-100): System performing optimally
GOOD (75-89): Minor optimizations recommended
ACCEPTABLE (60-74): Performance improvements needed
POOR (40-59): Significant issues to address
CRITICAL (<40): Major problems requiring immediate attention

Key Metrics

Response Time: Time to create cases

Target: <100ms average
Critical: >1000ms


Throughput: Cases processed per second

Target: >30 cases/second
Critical: <5 cases/second


Success Rate: Percentage of successful operations

Target: >99%
Critical: <80%


Resource Usage: CPU and memory utilization

Target: <40% sustained
Critical: >85% sustained



Interpreting Reports
metrics.html

Overall system health score
Performance trends across scenarios
Resource utilization graphs
Detailed recommendations

logs.html

Filterable log entries
Error categorization
Detailed stack traces

analysis.json

Raw performance data
Baseline comparisons
System recommendations

Common Issues
"Connection refused" errors
bash# Ensure all services are running
./scripts/start-all-services.sh
Memory exhaustion
bash# Run with increased memory
NODE_OPTIONS="--max-old-space-size=4096" npm run stress-test
Database performance issues
bash# Create indexes before testing
node scripts/utils/complete-db-cleaner.js
Advanced Usage
Custom Scenarios
bashnode scripts/run-comprehensive-stress-test.js \
  --scenarios 100:2:2 500:5:3 1000:10:5
Specific Validations
bashnode scripts/run-stress-test.js \
  --validation-level ultimate \
  --skip-proxy false \
  --skip-fragment false
Production Simulation
bashnode scripts/run-stress-test.js \
  --scenario production-load \
  --duration 3600 \
  --ramp-up 300
Best Practices

Always run normalization first to ensure system readiness
Start with small tests before running comprehensive suite
Monitor system resources during tests
Clean databases between tests for consistent results
Save baseline metrics from successful runs
Review logs for errors even if tests pass

Troubleshooting
See Troubleshooting Guide for detailed solutions.
Contributing

Add new scenarios in scripts/scenarios/
Update baseline metrics based on improvements
Document any new metrics or validations
Include example reports with PRs


This comprehensive stress testing framework provides:

1. **Complete database cleanup** with preservation of essential configs
2. **Progressive stress scenarios** from 100 to 10,000 cases
3. **Detailed metrics collection** including timing, success rates, and resource usage
4. **Beautiful HTML reports** with charts and recommendations
5. **System normalization** to ensure consistent test environments
6. **Intelligent analysis** with actionable recommendations
7. **Error categorization** and detailed logging
8. **Baseline comparisons** to track performance over time

The framework is designed to be extensible and can be customized for your specific needs. All scripts include CLI interfaces for easy automation and integration into CI/CD pipelines.