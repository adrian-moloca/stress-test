const { spawn } = require('child_process');
const PreflightChecker = require('./preflight-check');

async function quickStart() {
  console.log('🚀 SMAMBU Stress Test Quick Start\n');

  console.log('🧹 Step 1: Cleaning environment...');
  await runCommand('npm', ['run', 'clean:all']);

  console.log('\n🔍 Step 2: Running preflight check...');
  const checker = new PreflightChecker();
  const isReady = await checker.runAllChecks();

  if (!isReady) {
    console.error('\n❌ System not ready. Please fix the issues above.');
    process.exit(1);
  }

  console.log('\n🧪 Step 3: Running small test (5 cases)...');
  await runCommand('node', [
    'scripts/run-stress-test.js',
    '--scenario', 'bulk-case-creation',
    '--volume', '5',
    '--max-parallel', '2',
    '--validation-level', 'standard'
  ]);

  console.log('\n✅ Quick start complete! System is ready for larger tests.');
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit',
      shell: true 
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });

    child.on('error', reject);
  });
}

quickStart().catch(console.error);