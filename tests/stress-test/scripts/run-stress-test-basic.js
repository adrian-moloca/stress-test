// scripts/run-stress-test-basic.js
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');

async function runStressTestBasic() {
  console.log('🚀 Running stress test with basic validation...\n');
  
  const child = spawn('node', [
    'scripts/run-stress-test.js',
    '--scenario', 'bulk-case-creation',
    '--volume', '100',
    '--high-concurrency',
    '--validation-level', 'basic'  // Skip UR validation
  ], {
    stdio: 'inherit'
  });
  
  await new Promise((resolve) => {
    child.on('close', resolve);
  });
  
  // Check results directly in DB
  console.log('\n📊 Checking database results...');
  
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    
    const cases = await client.db('schedulingCases')
      .collection('cases')
      .countDocuments({ caseNumber: /^STRESS_/ });
    
    const events = await client.db('universal-reporting')
      .collection('importedevents')
      .countDocuments({ source: 'cases-created' });
    
    const proxies = await client.db('universal-reporting')
      .collection('proxies')
      .countDocuments({ domainId: 'schedulingCases' });
    
    console.log(`✅ Cases created: ${cases}`);
    console.log(`📨 Events created: ${events}`);
    console.log(`🎯 Proxies created: ${proxies}`);
    
  } finally {
    await client.close();
  }
}

runStressTestBasic();