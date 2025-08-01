const fs = require('fs');
const path = require('path');
const xmlbuilder = require('xmlbuilder');

/**
 * Formats the given execution result into JUnit XML and saves it to disk.
 * @param {Object} validationMetrics - Final validation metrics object.
 * @param {Object} executionResult - Raw execution result with errors and timings.
 * @param {string} runDir - Directory where the report will be saved.
 * @param {string} runId - ID of the stress test run.
 */
async function formatAsJUnit(validationMetrics, executionResult, runDir, runId) {
  const tests = executionResult.total || validationMetrics.total || 0;
  const failures = executionResult.errors?.length || validationMetrics.failures || 0;
  const time = (validationMetrics.durationMs || 0) / 1000;

  const testsuite = xmlbuilder
    .create('testsuite', { encoding: 'UTF-8' })
    .att('name', `StressTest-${runId}`)
    .att('tests', tests)
    .att('failures', failures)
    .att('errors', 0)
    .att('timestamp', new Date().toISOString())
    .att('time', time.toFixed(3));

  if (executionResult.results?.length) {
    executionResult.results.forEach((result, index) => {
      const testcase = testsuite.ele('testcase', {
        classname: result.endpoint || 'CaseService',
        name: result.caseNumber || `Test-${index + 1}`,
        time: (result.duration || 0) / 1000
      });

      if (!result.success) {
        testcase.ele('failure', {}, result.error || 'Unknown failure');
      }
    });
  }

  if (executionResult.errors?.length) {
    executionResult.errors.slice(0, 10).forEach((err, idx) => {
      testsuite.ele('testcase', {
        classname: 'StressTestError',
        name: `Error-${idx + 1}`
      }).ele('failure', {}, err.toString());
    });
  }

  const xml = testsuite.end({ pretty: true });

  const junitPath = path.join(runDir, 'junit-report.xml');
  await fs.promises.writeFile(junitPath, xml, 'utf-8');

  console.log(`🧪 JUnit report saved to: ${junitPath}`);
}

module.exports = {
  formatAsJUnit
};
