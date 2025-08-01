const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { program } = require('commander');
const environments = require('../../config/enviroments.json');
const scenarios = require('../../config/test-scenarios.json');
const dotenv = require('dotenv');
dotenv.config();

program
  .requiredOption('-s, --scenario <name>', 'Scenario name from test-scenarios.json')
  .option('-e, --env <environment>', 'Target environment', 'local')
  .option('-c, --cases <file>', 'JSON file with cases', './test-data/generated-cases.json')
  .option('-o, --output <file>', 'Output file for the script', './scripts/generated/k6-script.js')
  .option('--run', 'Automatically run the generated K6 script after generation')
  .option('--chunk-size <number>', 'Split into batches with N cases per file')
  .parse();

const options = program.opts();

async function generateK6Script(cases, scenarioConfig, envConfig, outputPath, batchIndex = null) {
  const thresholds = scenarioConfig.thresholds || {};
  const tags = scenarioConfig.tags || {};
  const vus = scenarioConfig.vus || 10;
  const duration = scenarioConfig.duration || '1m';

  const summaryLogic = `
export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
    'summary.json': JSON.stringify(data, null, 2)
  };
}
`;

  const scriptContent = `
import http from 'k6/http';
import { check, group, sleep } from 'k6';
const dotenv = require('dotenv');
dotenv.config();

export const options = {
  vus: ${vus},
  duration: '${duration}',
  thresholds: ${JSON.stringify(thresholds, null, 2)}
};

const BASE_URL = '${envConfig.baseUrl}';
const AUTH_TOKEN = '${envConfig.authToken}';

const HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + AUTH_TOKEN
};

export default function () {
  ${cases.map((c, i) => `
  group("Case ${i + 1}", function () {
    const payload = ${JSON.stringify(c)};
    const res = http.post(\`\${BASE_URL}/cases\`, JSON.stringify(payload), {
      headers: HEADERS,
      tags: ${JSON.stringify(tags)}
    });

    check(res, {
      'status is 201': (r) => r.status === 201,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(1);
  });`).join('\n')}
}

${summaryLogic}
`;

  const finalOutputPath = batchIndex !== null
    ? outputPath.replace(/\.js$/, `.${batchIndex}.js`)
    : outputPath;

  await fs.mkdir(path.dirname(finalOutputPath), { recursive: true });
  await fs.writeFile(finalOutputPath, scriptContent.trim());

  return finalOutputPath;
}

(async () => {
  const scenario = scenarios[options.scenario];
  if (!scenario) {
    console.error(`❌ Scenario "${options.scenario}" not found.`);
    process.exit(1);
  }

  const env = environments[options.env];
  if (!env) {
    console.error(`❌ Environment "${options.env}" not found.`);
    process.exit(1);
  }

  const raw = await fs.readFile(options.cases, 'utf8');
  const cases = JSON.parse(raw);
  const chunkSize = parseInt(options.chunkSize || 0, 10);

  const scriptPaths = [];

  if (chunkSize > 0) {
    const chunks = Array.from({ length: Math.ceil(cases.length / chunkSize) }, (_, i) =>
      cases.slice(i * chunkSize, (i + 1) * chunkSize)
    );

    for (let i = 0; i < chunks.length; i++) {
      const scriptPath = await generateK6Script(chunks[i], scenario, env, options.output, i);
      scriptPaths.push(scriptPath);
    }
  } else {
    const scriptPath = await generateK6Script(cases, scenario, env, options.output);
    scriptPaths.push(scriptPath);
  }

  console.log(`✅ K6 script(s) generated:\n${scriptPaths.map(p => `- ${p}`).join('\n')}`);

  if (options.run) {
    for (const scriptPath of scriptPaths) {
      console.log(`🚀 Running script: ${scriptPath}`);
      exec(`k6 run ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`❌ Error running ${scriptPath}:\n${stderr}`);
        } else {
          console.log(`✅ Finished running ${scriptPath}:\n${stdout}`);
        }
      });
    }
  }
})();
