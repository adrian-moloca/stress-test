const axios = require('axios');
const { MongoClient } = require('mongodb');
const Redis = require('redis');

class PreflightCheck {
  constructor() {
    this.checks = [];
    this.errors = [];
    this.warnings = [];
    
    this.services = [
      { name: 'Auth Service', url: 'http://localhost:8010/health', critical: false },
      { name: 'Universal Reporting Service', url: 'http://localhost:8160/health', critical: false },
      { name: 'Universal Reporting (Microservice)', url: 'http://localhost:9160/health', critical: false },
      { name: 'Scheduling Cases Service', url: 'http://localhost:8060/health', critical: false },
      { name: 'System Configuration Service', url: 'http://localhost:8080/health', critical: false },
      { name: 'Billing Service', url: 'http://localhost:8130/health', critical: false },
      { name: 'Anagraphics Service', url: 'http://localhost:8050/health', critical: false },
      { name: 'Contracts Service', url: 'http://localhost:8040/health', critical: false },
      { name: 'Patient Anagraphics Service', url: 'http://localhost:8110/health', critical: false },
      { name: 'OR Management Service', url: 'http://localhost:8120/health', critical: false }
    ];
  }

  async runChecks() {
    console.log('🚀 Running Pre-Flight Checks for Stress Test\n');

    console.log('📡 Checking Services...\n');
    await this.checkServices();
    
    console.log('💾 Checking MongoDB...\n');
    await this.checkMongoDB();
    
    console.log('📮 Checking Redis...\n');
    await this.checkRedis();
    
    console.log('⚙️  Checking Configurations...\n');
    await this.checkConfigurations();
    
    this.printResults();
    
    const criticalChecks = this.checks.filter(c => c.critical);
    return criticalChecks.every(check => check.passed);
  }

  async checkServices() {
    for (const service of this.services) {
      const check = {
        name: service.name,
        critical: service.critical,
        passed: false,
        message: ''
      };

      try {
        const response = await axios.get(service.url, { 
          timeout: 5000,
          validateStatus: (status) => status < 500
        });
        
        if (response.status === 200) {
          check.passed = true;
          check.message = 'Service is healthy';
        } else if (response.status === 404) {
          check.message = `HTTP ${response.status} - Health endpoint not found`;
          if (!service.critical) {
            check.passed = true;
          }
        } else {
          check.message = `HTTP ${response.status}`;
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          check.message = `Service not running on ${service.url.split('/')[2]}`;
        } else {
          check.message = `Connection failed: ${error.message}`;
        }
      }

      this.checks.push(check);
    }
  }

  async checkMongoDB() {
    const check = {
      name: 'MongoDB Connection',
      critical: true,
      passed: false,
      message: ''
    };

    try {
      const client = new MongoClient('mongodb://localhost:27017');
      await client.connect();
      await client.db('admin').admin().ping();
      await client.close();
      check.passed = true;
      check.message = 'Connected successfully';
    } catch (error) {
      check.message = `Failed to connect: ${error.message}`;
      this.errors.push('MongoDB connection failed');
    }

    this.checks.push(check);
  }

  async checkRedis() {
    const check = {
      name: 'Redis Connection',
      critical: true,
      passed: false,
      message: ''
    };

    try {
      const client = Redis.createClient({ url: 'redis://localhost:6379' });
      await client.connect();
      await client.ping();
      await client.quit();
      check.passed = true;
      check.message = 'Connected successfully';
    } catch (error) {
      check.message = `Failed to connect: ${error.message}`;
      this.errors.push('Redis connection failed');
    }

    this.checks.push(check);
  }

  async checkConfigurations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
      await client.connect();
      
      const urCheck = {
        name: 'UR Configurations',
        critical: true,
        passed: false,
        message: ''
      };

      const urDb = client.db('universal-reporting');
      
      const billingConfigs = await urDb.collection('jsonconfigs').countDocuments();
      
      if (billingConfigs > 0) {
        const configWithTenant = await urDb.collection('jsonconfigs').findOne({ tenantId: { $exists: true } });
        if (configWithTenant) {
          urCheck.passed = true;
          urCheck.message = `Found ${billingConfigs} billing configs`;
        } else {
          urCheck.message = `Found ${billingConfigs} configs but missing tenantId`;
          this.errors.push('Billing configs missing tenantId');
        }
      } else {
        urCheck.message = 'No billing configurations found';
        this.errors.push('No billing configurations found');
      }
      
      this.checks.push(urCheck);

      const casesDb = client.db('scheduling-cases');
      const collections = await casesDb.listCollections({ name: 'cases' }).toArray();
      
      if (collections.length === 0) {
        this.warnings.push('Collection schedulingCases.cases does not exist');
      }

    } catch (error) {
      this.errors.push(`Configuration check failed: ${error.message}`);
    } finally {
      await client.close();
    }
  }

  printResults() {
    console.log('\n📋 Pre-Flight Check Results:\n');

    const passed = [];
    const failed = [];

    for (const check of this.checks) {
      if (check.passed) {
        passed.push(check);
      } else {
        failed.push(check);
      }
    }

    for (const check of failed) {
      console.log(`❌ ${check.name}: ${check.message}`);
    }

    for (const check of passed) {
      console.log(`✅ ${check.name}: ${check.message}`);
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of this.warnings) {
        console.log(`   • ${warning}`);
      }
    }

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const error of this.errors) {
        console.log(`   • ${error}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total Checks: ${this.checks.length}`);
    console.log(`   Passed: ${passed.length}`);
    console.log(`   Failed: ${failed.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);

    const criticalFailed = failed.filter(c => c.critical).length > 0;
    
    if (criticalFailed) {
      console.log('\n❌ System is NOT ready for stress testing!');
      console.log('   Please fix the errors above before proceeding.\n');
      this.printQuickFixes();
    } else if (failed.length > 0) {
      console.log('\n⚠️  System is ready but with some non-critical issues.');
      console.log('   Consider fixing the issues above for better results.\n');
    } else {
      console.log('\n✅ System is ready for stress testing!\n');
    }
  }

  printQuickFixes() {
    console.log('\n🔧 Quick Fix Suggestions:\n');
    
    if (this.errors.includes('Universal Reporting Service is not accessible')) {
      console.log('For Universal Reporting Service:');
      console.log('   cd backend/universal-reporting && npm run dev');
      console.log('   OR check if UR_PORT=8160 is set in .env\n');
    }

    if (this.errors.includes('Scheduling Cases Service is not accessible')) {
      console.log('For Scheduling Cases Service:');
      console.log('   cd backend/ascos-scheduling-cases && npm run dev\n');
    }

    if (this.errors.includes('No billing configurations found')) {
      console.log('For missing configurations:');
      console.log('   node scripts/setup-test-configs.js\n');
    }

    if (this.errors.includes('Billing configs missing tenantId')) {
      console.log('For missing tenantId:');
      console.log('   node scripts/fix-ur-configs.js\n');
    }
  }
}

if (require.main === module) {
  const checker = new PreflightCheck();
  
  checker.runChecks().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Pre-flight check error:', error);
    process.exit(1);
  });
}

module.exports = PreflightCheck;