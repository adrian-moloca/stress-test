const fs = require("fs").promises;
const path = require("path");

class ConfigManager {
  constructor(customConfigPath = null) {
    this.configDir = path.join(__dirname, "..", "..", "config");
    this.customConfigPath = customConfigPath;
    this.cache = {};
  }

  async loadConfig(filename) {
    if (this.cache[filename]) {
      return this.cache[filename];
    }

    try {
      const configPath =
        this.customConfigPath || path.join(this.configDir, filename);
      const content = await fs.readFile(configPath, "utf8");
      const config = JSON.parse(content);
      this.cache[filename] = config;
      return config;
    } catch (error) {
      console.warn(`⚠️ Failed to load config ${filename}:`, error.message);
      return {};
    }
  }

  getEnvironment(envName) {
    const environments = {
      local: {
        casesServiceUrl: "http://localhost:8060/api/schedulingcases",
        urServiceUrl: "http://localhost:3002",
        authServiceUrl: "http://localhost:3000/api/auth",
        description: "Local development environment",
      },
      docker: {
        casesServiceUrl: "http://localhost:8060/api/schedulingcases",
        urServiceUrl: "http://localhost:8081",
        authServiceUrl: "http://localhost:3000/api/auth",
        description: "Docker compose environment",
      },
      staging: {
        casesServiceUrl: "https://staging-cases.smambu.com/api/schedulingcases",
        urServiceUrl: "https://staging-ur.smambu.com",
        authServiceUrl: "https://staging-auth.smambu.com/api/auth",
        description: "Staging environment",
      },
    };

    return environments[envName] || environments.local;
  }

  async getScenarioConfig(scenarioName) {
    // Try to load specific scenario config
    try {
      const scenarioConfig = await this.loadConfig(
        `scenarios/${scenarioName}.json`
      );
      if (Object.keys(scenarioConfig).length > 0) {
        return scenarioConfig;
      }
    } catch (error) {
      // Fall back to general test scenarios
    }

    // Load from general test scenarios
    const testScenarios = await this.loadConfig("test-scenarios.json");
    const scenarioKey = scenarioName.replace(/-/g, "_");

    return (
      testScenarios[scenarioKey] || {
        default_volume: 10,
        concurrent_requests: { max_parallel: 10, batch_size: 5 },
      }
    );
  }

  async getBaselineMetrics() {
    return await this.loadConfig("baseline-metrics.json");
  }

  async getAllConfigs() {
    return {
      environments: this.getEnvironment("all"),
      scenarios: await this.loadConfig("test-scenarios.json"),
      baseline: await this.getBaselineMetrics(),
    };
  }

  validateConfig(config, schema) {
    // Simple validation - can be enhanced with JSON schema
    const errors = [];

    Object.keys(schema).forEach((key) => {
      if (schema[key].required && !config[key]) {
        errors.push(`Missing required field: ${key}`);
      }

      if (config[key] && schema[key].type) {
        const actualType = typeof config[key];
        if (actualType !== schema[key].type) {
          errors.push(
            `Invalid type for ${key}: expected ${schema[key].type}, got ${actualType}`
          );
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }
}

module.exports = ConfigManager;
