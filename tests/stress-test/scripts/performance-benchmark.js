const { MongoClient } = require('mongodb');

class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date(),
      tests: []
    };
  }

  async run() {
    console.log('🏃 Running UR Performance Benchmark\n');
    
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
      await client.connect();
      
      await this.testEventProcessing(client);
      
      await this.testProxyCreation(client);
      
      await this.testQueryPerformance(client);
      
      await this.testSystemLimits(client);
      
      this.generateReport();
      
    } finally {
      await client.close();
    }
  }

  async testEventProcessing(client) {
    console.log('📨 Testing Event Processing Speed...');
    
    const db = client.db('universal-reporting');
    const startCount = await db.collection('importedevents').countDocuments({ processed: false });
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    const endCount = await db.collection('importedevents').countDocuments({ processed: false });
    const processed = startCount - endCount;
    
    this.results.tests.push({
      name: 'Event Processing',
      duration: 30,
      processed: processed,
      rate: (processed / 30).toFixed(2) + ' events/sec'
    });
    
    console.log(`   ✅ Processed ${processed} events in 30s\n`);
  }

  async testProxyCreation(client) {
    console.log('🎯 Testing Proxy Creation Speed...');
    
    const db = client.db('universal-reporting');
    const collection = db.collection('proxies');
    
    const testData = [];
    for (let i = 0; i < 100; i++) {
      testData.push({
        domainId: 'schedulingCases',
        contextKey: `PERF_TEST_${Date.now()}_${i}`,
        context: { caseNumber: `PERF_${i}` },
        dynamicFields: { test: i },
        fragments: {},
        tenantId: '66045e2350e8d495ec17bbe9',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    const start = Date.now();
    await collection.insertMany(testData);
    const duration = Date.now() - start;
    
    this.results.tests.push({
      name: 'Proxy Creation',
      count: 100,
      duration: duration,
      rate: ((100 / duration) * 1000).toFixed(2) + ' proxies/sec'
    });
    
    console.log(`   ✅ Created 100 proxies in ${duration}ms\n`);
  }

  async testQueryPerformance(client) {
    console.log('🔍 Testing Query Performance...');
    
    const db = client.db('universal-reporting');
    const tests = [
      {
        name: 'Find unprocessed events',
        collection: 'importedevents',
        query: { processed: false }
      },
      {
        name: 'Find proxy by context',
        collection: 'proxies',
        query: { domainId: 'schedulingCases', contextKey: 'TEST_123' }
      },
      {
        name: 'Find dirty nodes',
        collection: 'dependencygraphnodes',
        query: { status: 'DIRTY' }
      }
    ];
    
    for (const test of tests) {
      const start = Date.now();
      await db.collection(test.collection).find(test.query).limit(100).toArray();
      const duration = Date.now() - start;
      
      this.results.tests.push({
        name: `Query: ${test.name}`,
        duration: duration + 'ms'
      });
    }
    
    console.log(`   ✅ Query tests completed\n`);
  }

  async testSystemLimits(client) {
    console.log('💪 Testing System Limits...');
    
    const db = client.db('universal-reporting');
    
    const stats = {};
    const collections = ['importedevents', 'proxies', 'dependencygraphnodes'];
    
    for (const coll of collections) {
      const collStats = await db.collection(coll).stats();
      stats[coll] = {
        count: collStats.count,
        size: (collStats.size / 1024 / 1024).toFixed(2) + ' MB',
        avgDocSize: (collStats.avgObjSize / 1024).toFixed(2) + ' KB'
      };
    }
    
    this.results.tests.push({
      name: 'Collection Statistics',
      stats: stats
    });
    
    console.log(`   ✅ System limits analyzed\n`);
  }

  generateReport() {
    console.log('=' * 60);
    console.log('📊 PERFORMANCE BENCHMARK REPORT');
    console.log('=' * 60);
    
    this.results.tests.forEach(test => {
      console.log(`\n${test.name}:`);
      Object.entries(test).forEach(([key, value]) => {
        if (key !== 'name') {
          console.log(`   ${key}: ${typeof value === 'object' ? 
            JSON.stringify(value, null, 2).split('\n').join('\n   ') : 
            value}`);
        }
      });
    });
    
    const filename = `benchmark-${Date.now()}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Detailed report saved to: ${filename}`);
  }
}

new PerformanceBenchmark().run().catch(console.error);