const fs = require("fs").promises;
const path = require("path");

class DataManager {
  constructor(resultsDir) {
    this.resultsDir = resultsDir;
    this.dataStructure = {
      config: {},
      rawData: {},
      processedData: {},
      validation: {},
      timeline: [],
    };
  }

  async initialize() {
    // Create directory structure
    const dirs = [
      "raw-data",
      "processed-data",
      "scripts",
      "validation",
      "reports",
      "reference-data",
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(this.resultsDir, dir), { recursive: true });
    }

    console.log(`📁 Data manager initialized at ${this.resultsDir}`);
  }

  async saveConfig(config) {
    this.dataStructure.config = config;
    await this.saveJSON("config.json", config);
  }

  async saveRawData(key, data) {
    this.dataStructure.rawData[key] = {
      timestamp: Date.now(),
      recordCount: Array.isArray(data) ? data.length : 1,
      data,
    };

    await this.saveJSON(`raw-data/${key}.json`, data);
  }

  async saveProcessedData(key, data) {
    this.dataStructure.processedData[key] = {
      processedAt: Date.now(),
      data,
    };

    await this.saveJSON(`processed-data/${key}.json`, data);
  }

  async saveValidationResults(key, results) {
    this.dataStructure.validation[key] = {
      validatedAt: Date.now(),
      results,
    };

    await this.saveJSON(`validation/${key}.json`, results);
  }

  async appendTimelineEvent(event) {
    const timelineEvent = {
      timestamp: Date.now(),
      ...event,
    };

    this.dataStructure.timeline.push(timelineEvent);

    // Save timeline incrementally
    await this.saveJSON("timeline.json", this.dataStructure.timeline);
  }

  async saveJSON(filename, data) {
    const filepath = path.join(this.resultsDir, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));
  }

  async loadJSON(filename) {
    try {
      const filepath = path.join(this.resultsDir, filename);
      const content = await fs.readFile(filepath, "utf8");
      return JSON.parse(content);
    } catch (error) {
      console.warn(`⚠️ Could not load ${filename}:`, error.message);
      return null;
    }
  }

  async getCasesCreated() {
    try {
      return (await this.loadJSON("raw-data/cases-created.json")) || [];
    } catch (error) {
      console.warn(`⚠️ Could not load cases-created.json:`, error.message);
      return [];
    }
  }

  async getK6Results() {
    return (await this.loadJSON("raw-data/k6-results.json")) || {};
  }

  async getValidationResults() {
    const validationFiles = [
      "proxy-validation.json",
      "fragment-validation.json",
      "dependency-validation.json",
    ];

    const results = {};
    for (const file of validationFiles) {
      const key = file.replace(".json", "").replace("-", "_");
      results[key] = await this.loadJSON(`validation/${file}`);
    }

    return results;
  }

  async getTimelineEvents() {
    return (await this.loadJSON("timeline.json")) || [];
  }

  async generateDataSummary() {
    const summary = {
      testId: path.basename(this.resultsDir),
      generatedAt: new Date().toISOString(),
      dataStructure: {
        rawDataFiles: await this.listFiles("raw-data"),
        processedDataFiles: await this.listFiles("processed-data"),
        validationFiles: await this.listFiles("validation"),
        reportFiles: await this.listFiles("reports"),
      },
      metrics: {
        timelineEvents: this.dataStructure.timeline.length,
        rawDataSets: Object.keys(this.dataStructure.rawData).length,
        processedDataSets: Object.keys(this.dataStructure.processedData).length,
        validationResults: Object.keys(this.dataStructure.validation).length,
      },
    };

    await this.saveJSON("data-summary.json", summary);
    return summary;
  }

  async listFiles(directory) {
    try {
      const dirPath = path.join(this.resultsDir, directory);
      const files = await fs.readdir(dirPath);
      return files.filter((file) => file.endsWith(".json"));
    } catch {
      return [];
    }
  }

  async exportForAnalysis() {
    const exportData = {
      config: this.dataStructure.config,
      summary: await this.generateDataSummary(),
      k6Results: await this.getK6Results(),
      casesCreated: await this.getCasesCreated(),
      validationResults: await this.getValidationResults(),
      timeline: await this.getTimelineEvents(),
    };

    await this.saveJSON("complete-dataset.json", exportData);

    // Also create CSV exports for easy analysis
    await this.exportCSVFiles(exportData);

    return exportData;
  }

  async exportCSVFiles(data) {
    // Convert key datasets to CSV for spreadsheet analysis
    if (data.casesCreated && data.casesCreated.length > 0) {
      const csvData = this.convertToCSV(data.casesCreated);
      await fs.writeFile(
        path.join(this.resultsDir, "cases-created.csv"),
        csvData
      );
    }

    if (data.timeline && data.timeline.length > 0) {
      const csvData = this.convertToCSV(data.timeline);
      await fs.writeFile(path.join(this.resultsDir, "timeline.csv"), csvData);
    }
  }

  convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const rows = data.map((item) =>
      headers
        .map((header) => {
          const value = item[header];
          if (typeof value === "object") {
            return JSON.stringify(value);
          }
          return String(value).replace(/"/g, '""');
        })
        .map((v) => `"${v}"`)
        .join(",")
    );

    return [headers.join(","), ...rows].join("\n");
  }
}

module.exports = DataManager;
