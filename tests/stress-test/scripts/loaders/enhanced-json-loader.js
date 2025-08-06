const fs = require('fs').promises;
const path = require('path');

class EnhancedJsonLoader {
  constructor(dataManager, options = {}) {
    this.dataManager = dataManager;
    this.options = options;
    this.configCache = new Map();
  }

  async loadMultipleConfigs(configPaths) {
    console.log(`📂 Loading ${configPaths.length} JSON config files...`);
    
    const configs = [];
    const errors = [];

    for (const configPath of configPaths) {
      try {
        const config = await this.loadSingleConfig(configPath);
        configs.push({
          path: configPath,
          config: config,
          loaded: true
        });
        this.configCache.set(configPath, config);
      } catch (error) {
        errors.push({
          path: configPath,
          error: error.message
        });
        console.error(`❌ Failed to load ${configPath}: ${error.message}`);
      }
    }

    return {
      configs,
      errors,
      summary: {
        total: configPaths.length,
        loaded: configs.length,
        failed: errors.length
      }
    };
  }

  async loadSingleConfig(configPath) {
    if (this.configCache.has(configPath)) {
      console.log(`📋 Using cached config: ${configPath}`);
      return this.configCache.get(configPath);
    }

    const content = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(content);

    this.validateConfig(config);

    return config;
  }

  validateConfig(config) {
    if (!config.billingConfigs && !config.dynamicDataConfigs) {
      throw new Error('Config must contain billingConfigs or dynamicDataConfigs');
    }

    if (config.billingConfigs?.domains) {
      for (const domain of config.billingConfigs.domains) {
        if (!domain.domainId || !domain.trigger) {
          throw new Error('Domain must have domainId and trigger');
        }
      }
    }

    return true;
  }

  async applyConfigToDatabase(config, mongoClient) {
    const db = mongoClient.db('universal-reporting');
    const results = [];

    try {
      // Apply billing configs
      if (config.billingConfigs) {
        const result = await db.collection('billingconfigs').insertOne({
          ...config.billingConfigs,
          tenantId: this.options.tenantId || '66045e2350e8d495ec17bbe9',
          createdAt: new Date(),
          version: config.version || '1'
        });
        results.push({ type: 'billingconfigs', inserted: result.insertedId });
      }

      if (config.dynamicDataConfigs) {
        const result = await db.collection('dynamicdataconfigs').insertOne({
          ...config.dynamicDataConfigs,
          tenantId: this.options.tenantId || '66045e2350e8d495ec17bbe9',
          createdAt: new Date()
        });
        results.push({ type: 'dynamicdataconfigs', inserted: result.insertedId });
      }

      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = EnhancedJsonLoader;