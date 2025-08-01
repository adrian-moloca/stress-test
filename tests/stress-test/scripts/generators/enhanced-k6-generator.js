const dotenv = require('dotenv');
dotenv.config();

class EnhancedK6ScriptGenerator {
  constructor(environment, scenarioConfig) {
    this.environment = environment;
    this.scenarioConfig = scenarioConfig;
  }

  generate(cases, options = {}) {
    const stages = options.stages ||
      this.scenarioConfig.k6_stages || [
        { duration: "2m", target: 10 },
        { duration: "5m", target: 50 },
        { duration: "2m", target: 10 },
        { duration: "1m", target: 0 },
      ];

    const thresholds =
      options.thresholds || this.scenarioConfig.thresholds || {};

    return `
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Custom metrics
const caseCreationRate = new Rate('case_creation_success');
const caseCreationDuration = new Trend('case_creation_duration');
const proxyCreationDuration = new Trend('proxy_creation_duration');
const dotenv = require('dotenv');
dotenv.config();

// Load test data
const testCases = new SharedArray('cases', function() {
  return ${JSON.stringify(cases)};
});

export const options = {
  stages: ${JSON.stringify(stages)},
  thresholds: ${JSON.stringify(
    {
      http_req_duration: ["p(95)<500", "p(99)<1000"],
      http_req_failed: ["rate<0.01"],
      case_creation_success: ["rate>0.99"],
      case_creation_duration: ["p(95)<300"],
      ...thresholds,
    },
    null,
    2
  )},
  ext: {
    loadimpact: {
      projectID: ${Date.now()},
      name: "${
        options.chunkIndex ? `Chunk ${options.chunkIndex}` : "Main"
      } - ${new Date().toISOString()}"
    }
  }
};

const BASE_URL = '${this.environment.casesServiceUrl}';
const UR_URL = '${this.environment.urServiceUrl}';
const AUTH_TOKEN = __ENV.K6_AUTH_TOKEN || 'stress-test-token';

const params = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${AUTH_TOKEN}\`,
    'User-Agent': 'K6-Stress-Test/2.0'
  },
  timeout: '30s',
  compression: 'gzip'
};

function createCase(caseData) {
  const payload = JSON.stringify(caseData);
  
  const res = http.post(
    \`\${BASE_URL}/cases/stress-test\`,
    payload,
    {
      ...params,
      tags: { 
        name: 'CreateCase',
        caseNumber: caseData.caseNumber 
      }
    }
  );

  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'has case ID': (r) => r.json('_id') !== undefined,
    'response time OK': (r) => r.timings.duration < 500
  });

  caseCreationRate.add(success);
  caseCreationDuration.add(res.timings.duration);

  return res.json();
}

function validateProxy(caseNumber, maxRetries = 10) {
  let retries = 0;
  let proxyFound = false;
  const startTime = Date.now();

  while (retries < maxRetries && !proxyFound) {
    const res = http.get(
      \`\${UR_URL}/proxies/by-case/\${caseNumber}\`,
      {
        ...params,
        tags: { name: 'ValidateProxy' }
      }
    );

    if (res.status === 200) {
      proxyFound = true;
      const duration = Date.now() - startTime;
      proxyCreationDuration.add(duration);
      
      check(res, {
        'proxy created': () => true,
        'has fragments': (r) => r.json('fragments') !== undefined
      });
    } else if (res.status === 404) {
      sleep(1);
      retries++;
    } else {
      break;
    }
  }

  return proxyFound;
}

export default function() {
  const caseData = testCases[Math.floor(Math.random() * testCases.length)];
  
  group('Case Creation Flow', function() {
    // Create case
    const createdCase = createCase(caseData);
    
    if (createdCase && createdCase.caseNumber) {
      // Validate proxy creation
      sleep(2); // Give system time to create proxy
      validateProxy(createdCase.caseNumber);
    }
  });

  sleep(Math.random() * 2 + 1); // Random sleep between 1-3 seconds
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
    'summary.html': htmlReport(data)
  };
}

// Helper function for HTML report
function htmlReport(data) {
  return \`
<!DOCTYPE html>
<html>
<head>
  <title>K6 Test Results</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .metric { margin: 10px 0; padding: 10px; background: #f0f0f0; }
    .passed { color: green; }
    .failed { color: red; }
  </style>
</head>
<body>
  <h1>K6 Stress Test Results</h1>
  <div class="metrics">
    \${Object.entries(data.metrics).map(([name, metric]) => \`
      <div class="metric">
        <h3>\${name}</h3>
        <pre>\${JSON.stringify(metric, null, 2)}</pre>
      </div>
    \`).join('')}
  </div>
</body>
</html>\`;
}

function textSummary(data, options) {
  // Implementation of text summary
  return JSON.stringify(data, null, 2);
}
`;
  }
}

module.exports = EnhancedK6ScriptGenerator;
