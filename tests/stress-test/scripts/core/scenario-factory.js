const BulkCaseCreationScenario = require("../scenarios/bulk-case-creation");
const SystemLimitsTestScenario = require("../scenarios/system-limits-test");
const CrossSectionUpdateTestScenario = require("../scenarios/cross-section-update-test");
const JsonLoadTestScenario = require("../scenarios/json-load-test");

class ScenarioFactory {
  constructor() {
    this.scenarios = {
      "bulk-case-creation": BulkCaseCreationScenario,
      "system-limits": SystemLimitsTestScenario,
      "cross-section-updates": CrossSectionUpdateTestScenario,
      "json-load-test": JsonLoadTestScenario,
    };
  }

  create(scenarioName, options = {}) {
    const ScenarioClass = this.scenarios[scenarioName];

    if (!ScenarioClass) {
      throw new Error(
        `Unknown scenario: ${scenarioName}. Available scenarios: ${Object.keys(
          this.scenarios
        ).join(", ")}`
      );
    }

    return new ScenarioClass(options);
  }

  list() {
    return Object.keys(this.scenarios);
  }

  getScenarioInfo(scenarioName) {
    const ScenarioClass = this.scenarios[scenarioName];

    if (!ScenarioClass) {
      return null;
    }

    const instance = new ScenarioClass();

    return {
      name: instance.getName(),
      description: instance.getDescription(),
      defaultConfig: instance.getDefaultConfig
        ? instance.getDefaultConfig()
        : {},
    };
  }

  getAllScenarioInfo() {
    return this.list().map((name) => ({
      name,
      ...this.getScenarioInfo(name),
    }));
  }
}

module.exports = ScenarioFactory;
