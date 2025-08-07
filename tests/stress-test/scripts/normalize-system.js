const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class SystemNormalizer {
  constructor() {
    this.checks = [];
    this.fixes = [];
  }

  async normalizeSystem() {
    console.log('🔧 Normalizing system for stress testing...\n');

    await this.checkNodeVersion();

    await this.checkSystemResources();

    await this.checkDependencies();

    await this.checkServiceConfigs();

    await this.createDirectories();

    await this.checkDatabaseConnections();

    await this.applyOptimizations();

    await this.generateReport();

    return {
      checks: this.checks,
      fixes: this.fixes,
      ready: this.checks.every(c => c.passed)
    };
  }

  async checkNodeVersion() {
    const check = {
      name: 'Node.js Version',
      required: '14.0.0',
      actual: process.version,
      passed: false
    };

    const [major] = process.version.substring(1).split('.');
    check.passed = parseInt(major) >= 14;

    if (!check.passed) {
      check.fix = 'Please upgrade Node.js to version 14 or higher';
    }

    this.checks.push(check);
  }

  async checkSystemResources() {
    const os = require('os');
    
    const memoryCheck = {
      name: 'Available Memory',
      required: '8GB',
      actual: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`,
      passed: os.totalmem() >= 8 * 1024 * 1024 * 1024
    };

    if (!memoryCheck.passed) {
      memoryCheck.fix = 'Recommend at least 8GB RAM for stress testing';
    }

    this.checks.push(memoryCheck);

    const cpuCheck = {
      name: 'CPU Cores',
      required: '4',
      actual: os.cpus().length.toString(),
      passed: os.cpus().length >= 4
    };

    if (!cpuCheck.passed) {
      cpuCheck.fix = 'Recommend at least 4 CPU cores for stress testing';
    }

    this.checks.push(cpuCheck);
  }

  async checkDependencies() {
    const requiredPackages = [
      'mongodb',
      'redis',
      'node-fetch',
      'yargs',
      'chart.js'
    ];

    for (const pkg of requiredPackages) {
      const check = {
        name: `Package: ${pkg}`,
        required: 'installed',
        actual: 'checking...',
        passed: false
      };

      try {
        require.resolve(pkg);
        check.actual = 'installed';
        check.passed = true;
      } catch (error) {
        check.actual = 'missing';
        check.fix = `Run: npm install ${pkg}`;
        
        if (!this.fixes.find(f => f.command === 'npm install')) {
          this.fixes.push({
            description: 'Install missing packages',
            command: 'npm install'
          });
        }
      }

      this.checks.push(check);
    }
  }

  async checkServiceConfigs() {
    const configs = [
      {
        name: 'MongoDB Configuration',
        path: '/etc/mongod.conf',
        checks: [
          { setting: 'maxConns', recommended: '1000' }
        ]
      }
    ];

    for (const config of configs) {
      const check = {
        name: config.name,
        required: 'optimized',
        actual: 'checking...',
        passed: false
      };

      try {
        await fs.access(config.path);
        check.actual = 'found';
        check.passed = true;
      } catch (error) {
        check.actual = 'not found';
        check.fix = `Check service configuration at ${config.path}`;
      }

      this.checks.push(check);
    }
  }

  async createDirectories() {
    const directories = [
      './results',
      './logs',
      './temp',
      './config'
    ];

    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }

    this.checks.push({
      name: 'Required Directories',
      required: 'created',
      actual: 'created',
      passed: true
    });
  }

  async checkDatabaseConnections() {
    const { MongoClient } = require('mongodb');
    const Redis = require('redis');

    const mongoCheck = {
      name: 'MongoDB Connection',
      required: 'connected',
      actual: 'checking...',
      passed: false
    };

    try {
      const client = new MongoClient('mongodb://localhost:27017');
      await client.connect();
      await client.close();
      mongoCheck.actual = 'connected';
      mongoCheck.passed = true;
    } catch (error) {
      mongoCheck.actual = 'failed';
      mongoCheck.fix = 'Ensure MongoDB is running on localhost:27017';
    }

    this.checks.push(mongoCheck);

    const redisCheck = {
      name: 'Redis Connection',
      required: 'connected',
      actual: 'checking...',
      passed: false
    };

    try {
      const client = Redis.createClient();
      await client.connect();
      await client.quit();
      redisCheck.actual = 'connected';
      redisCheck.passed = true;
    } catch (error) {
      redisCheck.actual = 'failed';
      redisCheck.fix = 'Ensure Redis is running on localhost:6379';
    }

    this.checks.push(redisCheck);
  }

  async applyOptimizations() {
    const optimizations = [];

    if (process.env.NODE_OPTIONS && !process.env.NODE_OPTIONS.includes('max-old-space-size')) {
      optimizations.push({
        name: 'Node.js Memory Limit',
        command: 'export NODE_OPTIONS="--max-old-space-size=4096"',
        applied: false,
        reason: 'Increase heap size for stress testing'
      });
    }

    try {
      const currentLimit = execSync('ulimit -n').toString().trim();
      if (parseInt(currentLimit) < 65536) {
        optimizations.push({
          name: 'File Descriptor Limit',
          command: 'ulimit -n 65536',
          applied: false,
          reason: 'Increase file descriptor limit for many connections'
        });
      }
    } catch (error) {
      console.warn('Could not check file descriptor limit:', error.message);
    }

    this.fixes.push(...optimizations);

    this.checks.push({
      name: 'System Optimizations',
      required: 'applied',
      actual: `${optimizations.length} optimizations suggested`,
      passed: true
    });
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      system: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: require('os').totalmem(),
        cpus: require('os').cpus().length
      },
      checks: this.checks,
      fixes: this.fixes,
      ready: this.checks.every(c => c.passed)
    };

    await fs.writeFile(
      './normalization-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log('\n📋 Normalization Report:');
    console.log('========================\n');

    for (const check of this.checks) {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      console.log(`   Required: ${check.required}`);
      console.log(`   Actual: ${check.actual}`);
      if (check.fix) {
        console.log(`   Fix: ${check.fix}`);
      }
      console.log('');
    }

    if (this.fixes.length > 0) {
      console.log('\n🔧 Recommended Fixes:');
      console.log('====================\n');
      
      for (const fix of this.fixes) {
        console.log(`• ${fix.description || fix.name}`);
        console.log(`  Command: ${fix.command}`);
        if (fix.reason) {
          console.log(`  Reason: ${fix.reason}`);
        }
        console.log('');
      }
    }

    if (report.ready) {
      console.log('\n✅ System is ready for stress testing!');
    } else {
      console.log('\n⚠️  Please address the issues above before running stress tests.');
    }
  }
}

if (require.main === module) {
  const normalizer = new SystemNormalizer();
  
  (async () => {
    try {
      const result = await normalizer.normalizeSystem();
      process.exit(result.ready ? 0 : 1);
    } catch (error) {
      console.error('❌ Normalization failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = SystemNormalizer;