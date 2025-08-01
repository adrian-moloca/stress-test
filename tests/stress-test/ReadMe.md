# Cases Service Stress Testing Framework

Comprehensive stress testing framework for Cases Service with Universal Reporting integration validation.

## Features

✅ **10k+ Case Creation** with realistic data  
✅ **JSON Data Loading** and validation  
✅ **System Limits Testing** to find crash points  
✅ **Cross-Section Updates** with dependency cascading  
✅ **Universal Reporting** proxy and fragment validation  
✅ **Professional HTML Reports** with charts and metrics  
✅ **File-based Data Storage** (no external database required)  
✅ **K6 Integration** for proper load testing  

## Quick Start

```bash
# Install dependencies
npm install

# Run bulk case creation test (10k cases)
npm run test:bulk

# Test with JSON data file
npm run test:json -- --json-file ./my-cases.json

# Find system limits (destructive test)
npm run test:limits

# Test cross-section updates and dependencies
npm run test:updates

# Comprehensive test (all scenarios)
npm run test:comprehensive

# Basic usage
node scripts/generators/k6-script-generator.js --scenario bulk-case-creation --env local --run

# Batch mode
node scripts/generators/k6-script-generator.js --scenario bulk-case-creation --env local --chunk-size 1000 --run
