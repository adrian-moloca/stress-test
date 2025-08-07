const ComprehensiveStressTestRunner = require('./run-comprehensive-stress-test');

async function runSimpleTest() {
  const runner = new ComprehensiveStressTestRunner({
    scenarios: [
      { cases: 10, proxiesPerCase: 2, parallel: 2 },
      { cases: 50, proxiesPerCase: 3, parallel: 3 }
    ],
    authToken: process.env.STRESS_TEST_TOKEN,
    verbose: true
  });

  try {
    await runner.runAllScenarios();
    console.log('✅ Simple stress test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runSimpleTest();