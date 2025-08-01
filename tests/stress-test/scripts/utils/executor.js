const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

async function findGeneratedScripts(directory) {
  const files = await fs.readdir(directory);
  return files
    .filter(file => file.endsWith('.js'))
    .map(file => path.join(directory, file));
}

async function runK6Script(scriptPath, outputJsonPath, options = {}) {
  return new Promise((resolve, reject) => {
    const k6Args = [
      'run',
      '--out', `json=${outputJsonPath}`,
      ...(options.args || []),
      scriptPath
    ];

    console.log(`🚀 Starting k6 for: ${path.basename(scriptPath)}...`);

    const k6 = spawn('k6', k6Args, { stdio: 'inherit' });

    k6.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ k6 exited with code ${code}`);
        return reject(new Error(`k6 failed for ${scriptPath}`));
      }
      console.log(`✅ Completed: ${path.basename(scriptPath)}`);
      resolve(outputJsonPath);
    });
  });
}

async function parseK6Results(jsonPath) {
  try {
    const rawData = await fs.readFile(jsonPath, 'utf8');
    return rawData
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
  } catch (err) {
    console.warn(`⚠️ Failed to read K6 output from ${jsonPath}:`, err.message);
    return [];
  }
}

async function runAllScripts(generatedDir, resultsDir, options = {}) {
  const scriptPaths = await findGeneratedScripts(generatedDir);

  if (scriptPaths.length === 0) {
    console.warn(`⚠️ No K6 scripts found in: ${generatedDir}`);
    return;
  }

  console.log(`🧩 Found ${scriptPaths.length} scripts to execute.`);

  const parallel = options.parallel ?? false;
  const limit = options.maxParallel ?? os.cpus().length;

  const results = [];

  if (parallel) {
    for (let i = 0; i < scriptPaths.length; i += limit) {
      const batch = scriptPaths.slice(i, i + limit).map(async (scriptPath) => {
        const resultPath = path.join(resultsDir, `result-${path.basename(scriptPath, '.js')}.json`);
        await runK6Script(scriptPath, resultPath, options);
        const metrics = await parseK6Results(resultPath);
        return { script: scriptPath, metrics };
      });
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
    }
  } else {
    for (const scriptPath of scriptPaths) {
      const resultPath = path.join(resultsDir, `result-${path.basename(scriptPath, '.js')}.json`);
      await runK6Script(scriptPath, resultPath, options);
      const metrics = await parseK6Results(resultPath);
      results.push({ script: scriptPath, metrics });
    }
  }

  return results;
}

module.exports = {
  runK6Script,
  parseK6Results,
  runAllScripts,
};
