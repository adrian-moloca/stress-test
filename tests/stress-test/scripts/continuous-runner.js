const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const dayjs = require('dayjs');
const fs = require('fs');

const SCENARIO = process.env.SCENARIO || 'bulk-case-creation';
const VOLUME = parseInt(process.env.VOLUME || '100', 10);
const ENV = process.env.ENV || 'dev';
const INTERVAL_MINUTES = parseInt(process.env.INTERVAL_MINUTES || '10', 10);
const MAX_RUNS = parseInt(process.env.MAX_RUNS || '0', 10); // 0 = unlimited
const RESULTS_DIR = process.env.RESULTS_DIR || path.join(__dirname, '..', 'longhaul-results');
const MAX_RETRIES = 3;

let runCounter = 0;
let retryCounter = 0;

fs.mkdirSync(RESULTS_DIR, { recursive: true });

function runOnce() {
  return new Promise((resolve) => {
    const timestamp = dayjs().format('YYYYMMDD-HHmmss');
    const runId = `${SCENARIO}-${timestamp}`;

    console.log(chalk.blue(`\n▶️ Starting run ${runCounter + 1}: ${runId}`));

    const args = [
      'scripts/run-stress-test.js',
      '--scenario', SCENARIO,
      '--volume', VOLUME.toString(),
      '--env', ENV,
      '--results-dir', path.join(RESULTS_DIR, runId),
      '--save-cases',
      '--export-json'
    ];

    const proc = spawn('node', args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const logStream = fs.createWriteStream(path.join(RESULTS_DIR, runId, 'output.log'), { flags: 'a' });

    proc.stdout.pipe(logStream);
    proc.stderr.pipe(logStream);

    proc.on('exit', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ Run ${runCounter + 1} completed successfully.`));
        retryCounter = 0;
      } else {
        console.log(chalk.red(`❌ Run ${runCounter + 1} failed with exit code ${code}.`));
        retryCounter++;
      }
      resolve(code);
    });
  });
}

async function loopRunner() {
  while (MAX_RUNS === 0 || runCounter < MAX_RUNS) {
    const exitCode = await runOnce();

    if (retryCounter >= MAX_RETRIES) {
      console.log(chalk.red(`🛑 Max retries reached. Halting.`));
      break;
    }

    runCounter++;
    if (MAX_RUNS !== 0 && runCounter >= MAX_RUNS) {
      break;
    }

    console.log(chalk.gray(`⏳ Waiting ${INTERVAL_MINUTES} minutes until next run...`));
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MINUTES * 60000));
  }

  console.log(chalk.cyan(`🏁 Long-haul testing completed. Total runs: ${runCounter}`));
}

loopRunner().catch((err) => {
  console.error(chalk.red(`Fatal error in continuous runner:`), err);
  process.exit(1);
});
