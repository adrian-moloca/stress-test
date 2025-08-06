const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const Redis = require('ioredis');
const Bull = require('bull');
const chalk = require('chalk');

class PreflightChecker {
  constructor() {
    this.checks = [];
    this.errors = [];
    this.warnings = [];
    this.services = {
      auth: { url: 'http://localhost:3000/api/auth/health', name: 'Auth Service' },
      cases: { url: 'http://localhost:8060/health', name: 'Scheduling Cases Service' },
      ur: { url: 'http://localhost:3002/health', name: 'Universal Reporting Service', port: 9160 },
      billing: { url: 'http://localhost:8080/health', name: 'Billing Service' },
      anagraphics: { url: 'http://localhost:8070/health', name: 'Anagraphics Service' },
      contracts: { url: 'http://localhost:8050/health', name: 'Contracts Service' },
      ormanagement: { url: 'http://localhost:8040/health', name: 'OR Management Service' },
      patientAnagraphics: { url: 'http://localhost:8030/health', name: 'Patient Anagraphics Service' },
      systemConfig: { url: 'http://localhost:8020/health', name: 'System Configuration Service' }
    };
  }

  async checkService(serviceKey, service) {
    try {
      const response = await fetch(service.url, { timeout: 5000 });
      const isHealthy = response.ok;
      
      this.checks.push({
        name: service.name,
        status: isHealthy ? 'PASS' : 'FAIL',
        details: isHealthy ? 'Service is healthy' : `HTTP ${response.status}`
      });

      if (serviceKey === 'ur' && service.port) {
        await this.checkPort('127.0.0.1', service.port, 'UR Microservice Port');
      }

      return isHealthy;
    } catch (error) {
      this.checks.push({
        name: service.name,
        status: 'FAIL',
        details: `Connection failed: ${error.message}`
      });
      this.errors.push(`${service.name} is not accessible`);
      return false;
    }
  }

  async checkPort(host, port, name) {
    const net = require('net');
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      
      socket.on('connect', () => {
        this.checks.push({
          name: `${name} (${host}:${port})`,
          status: 'PASS',
          details: 'Port is open and listening'
        });
        socket.destroy();
        resolve(true);
      });

      socket.on('timeout', () => {
        this.checks.push({
          name: `${name} (${host}:${port})`,
          status: 'FAIL',
          details: 'Connection timeout'
        });
        this.errors.push(`Port ${port} is not accessible`);
        socket.destroy();
        resolve(false);
      });

      socket.on('error', (err) => {
        this.checks.push({
          name: `${name} (${host}:${port})`,
          status: 'FAIL',
          details: `Connection refused: ${err.code}`
        });
        this.errors.push(`Port ${port} connection refused`);
        resolve(false);
      });

      socket.connect(port, host);
    });
  }

  async checkMongoDB() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
      await client.connect();
      
      const essentialDBs = [
        { db: 'schedulingCases', collections: ['cases'] },
        { db: 'universal-reporting', collections: ['importedevents', 'proxies', 'billingconfigs'] },
        { db: 'contracts', collections: ['contracts'] },
        { db: 'anagraphics', collections: ['publicinsurances', 'privateinsurances'] }
      ];

      for (const dbInfo of essentialDBs) {
        const db = client.db(dbInfo.db);
        
        for (const collName of dbInfo.collections) {
          const exists = await db.listCollections({ name: collName }).hasNext();
          
          if (!exists) {
            this.warnings.push(`Collection ${dbInfo.db}.${collName} does not exist`);
          } else {
            const count = await db.collection(collName).countDocuments();
            if (count === 0 && ['contracts', 'publicinsurances', 'privateinsurances'].includes(collName)) {
              this.warnings.push(`Essential collection ${dbInfo.db}.${collName} is empty`);
            }
          }
        }
      }

      const testCases = await client.db('schedulingCases')
        .collection('cases')
        .countDocuments({ caseNumber: /^STRESS_/ });
      
      if (testCases > 0) {
        this.warnings.push(`Found ${testCases} test cases from previous runs`);
      }

      this.checks.push({
        name: 'MongoDB Connection',
        status: 'PASS',
        details: 'Connected successfully'
      });

      return true;
    } catch (error) {
      this.checks.push({
        name: 'MongoDB Connection',
        status: 'FAIL',
        details: error.message
      });
      this.errors.push('MongoDB is not accessible');
      return false;
    } finally {
      await client.close();
    }
  }

  async checkRedis() {
    const redis = new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null
    });

    try {
      await redis.ping();
      
      const queueNames = [
        'ur-trigger-events',
        'ur-dependencies',
        'ur-fields-lifecycle',
        'billing-normalizer',
        'local-events-scheduling-cases'
      ];

      for (const queueName of queueNames) {
        const queue = new Bull(queueName, {
          redis: { host: 'localhost', port: 6379 }
        });

        const jobCounts = await queue.getJobCounts();
        const total = Object.values(jobCounts).reduce((sum, count) => sum + count, 0);
        
        if (total > 100) {
          this.warnings.push(`Queue ${queueName} has ${total} jobs (might be stuck)`);
        }

        await queue.close();
      }

      this.checks.push({
        name: 'Redis Connection',
        status: 'PASS',
        details: 'Connected successfully'
      });

      return true;
    } catch (error) {
      this.checks.push({
        name: 'Redis Connection',
        status: 'FAIL',
        details: error.message
      });
      this.errors.push('Redis is not accessible');
      return false;
    } finally {
      redis.disconnect();
    }
  }

  async checkConfigurations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
      await client.connect();
      const db = client.db('universal-reporting');
      
      const billingConfigs = await db.collection('billingconfigs').countDocuments();
      const jsonConfigs = await db.collection('jsonconfigs').countDocuments();
      const dynamicDataConfigs = await db.collection('dynamicdataconfigs').countDocuments();
      
      if (billingConfigs === 0) {
        this.errors.push('No billing configurations found');
      }
      
      if (jsonConfigs === 0 && dynamicDataConfigs === 0) {
        this.warnings.push('No JSON or dynamic data configurations found');
      }

      const configWithTenant = await db.collection('billingconfigs')
        .findOne({ tenantId: { $exists: true } });
      
      if (!configWithTenant) {
        this.errors.push('Billing configs missing tenantId');
      }

      this.checks.push({
        name: 'UR Configurations',
        status: billingConfigs > 0 ? 'PASS' : 'FAIL',
        details: `Found ${billingConfigs} billing configs`
      });

      return billingConfigs > 0;
    } catch (error) {
      this.checks.push({
        name: 'UR Configurations',
        status: 'FAIL',
        details: error.message
      });
      return false;
    } finally {
      await client.close();
    }
  }

  async runAllChecks() {
    console.log(chalk.bold.blue('\n🚀 Running Pre-Flight Checks for Stress Test\n'));

    console.log(chalk.yellow('📡 Checking Services...'));
    const servicePromises = Object.entries(this.services).map(([key, service]) => 
      this.checkService(key, service)
    );
    await Promise.all(servicePromises);

    console.log(chalk.yellow('\n💾 Checking MongoDB...'));
    await this.checkMongoDB();

    console.log(chalk.yellow('\n📮 Checking Redis...'));
    await this.checkRedis();

    console.log(chalk.yellow('\n⚙️  Checking Configurations...'));
    await this.checkConfigurations();

    this.displayResults();

    return this.errors.length === 0;
  }

  displayResults() {
    console.log(chalk.bold.blue('\n📋 Pre-Flight Check Results:\n'));

    for (const check of this.checks) {
      const icon = check.status === 'PASS' ? '✅' : '❌';
      const color = check.status === 'PASS' ? chalk.green : chalk.red;
      console.log(`${icon} ${color(check.name)}: ${check.details}`);
    }

    if (this.warnings.length > 0) {
      console.log(chalk.bold.yellow('\n⚠️  Warnings:'));
      this.warnings.forEach(warning => {
        console.log(chalk.yellow(`   • ${warning}`));
      });
    }

    if (this.errors.length > 0) {
      console.log(chalk.bold.red('\n❌ Errors:'));
      this.errors.forEach(error => {
        console.log(chalk.red(`   • ${error}`));
      });
    }

    const totalChecks = this.checks.length;
    const passedChecks = this.checks.filter(c => c.status === 'PASS').length;
    const failedChecks = totalChecks - passedChecks;

    console.log(chalk.bold.blue('\n📊 Summary:'));
    console.log(`   Total Checks: ${totalChecks}`);
    console.log(`   ${chalk.green(`Passed: ${passedChecks}`)}`);
    console.log(`   ${chalk.red(`Failed: ${failedChecks}`)}`);
    console.log(`   ${chalk.yellow(`Warnings: ${this.warnings.length}`)}`);

    if (this.errors.length === 0) {
      console.log(chalk.bold.green('\n✅ System is ready for stress testing!\n'));
    } else {
      console.log(chalk.bold.red('\n❌ System is NOT ready for stress testing!'));
      console.log(chalk.red('   Please fix the errors above before proceeding.\n'));
    }
  }
}

function displayQuickFixes(errors) {
  console.log(chalk.bold.blue('\n🔧 Quick Fix Suggestions:\n'));

  if (errors.includes('Universal Reporting Service is not accessible')) {
    console.log(chalk.cyan('For Universal Reporting Service:'));
    console.log('   cd backend/universal-reporting && npm run dev');
    console.log('   OR check if UR_PORT=9160 is set in .env\n');
  }

  if (errors.includes('Port 9160 connection refused')) {
    console.log(chalk.cyan('For Port 9160 issue:'));
    console.log('   1. Check UR service logs for startup errors');
    console.log('   2. Ensure no other service is using port 9160');
    console.log('   3. Check firewall settings\n');
  }

  if (errors.includes('Billing configs missing tenantId')) {
    console.log(chalk.cyan('For missing tenantId:'));
    console.log('   node scripts/fix-ur-service-patch.js\n');
  }

  if (errors.some(e => e.includes('Queue') && e.includes('stuck'))) {
    console.log(chalk.cyan('For stuck queues:'));
    console.log('   npm run clean:queues\n');
  }
}

async function main() {
  const checker = new PreflightChecker();
  const isReady = await checker.runAllChecks();

  if (!isReady) {
    displayQuickFixes(checker.errors);
    process.exit(1);
  }

  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = PreflightChecker;