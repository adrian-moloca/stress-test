# Universal Reporting Stress Test Framework

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
5. [Running Tests](#running-tests)
6. [Performance Benchmarks](#performance-benchmarks)
7. [Critical Implementation Points](#critical-implementation-points)
8. [Edge Cases & Limitations](#edge-cases--limitations)
9. [Interpreting Results](#interpreting-results)
10. [Troubleshooting](#troubleshooting)
11. [Development Guide](#development-guide)

## Overview

The Universal Reporting (UR) Stress Test Framework is designed to validate the performance, reliability, and scalability of the SMAMBU Universal Reporting system. It tests the entire event-driven architecture from case creation through billing proxy generation.

### What Does This Test?

```
[Case Creation] → [Event Generation] → [Event Import] → [Trigger Evaluation] → [Proxy Creation] → [Fragment Generation] → [Document Creation]
```

### Key Metrics Tracked
- **Event Flow**: How many events are successfully imported and processed
- **Trigger Performance**: Evaluation success rate and processing time
- **Proxy Generation**: Creation rate and data integrity
- **System Performance**: Response times, throughput, error rates
- **End-to-End Completion**: Full flow success rate

## Architecture

```
tests/stress-test/
├── scripts/
│   ├── core/                    # Core testing components
│   │   ├── validation-engine.js # Validates UR system behavior
│   │   ├── data-manager.js      # Manages test data and results
│   │   ├── config-manager.js    # Configuration management
│   │   ├── event-indexer.js     # Event tracking and indexing
│   │   └── error-logger.js      # Error categorization and logging
│   │
│   ├── scenarios/               # Test scenarios
│   │   ├── bulk-case-creation.js
│   │   ├── json-load-test.js
│   │   └── system-limits-test.js
│   │
│   ├── utils/                   # Utilities
│   │   ├── parallel-runner.js   # Controlled parallel execution
│   │   ├── database-cleaner.js  # DB cleanup utilities
│   │   └── auth.js              # Authentication handling
│   │
│   └── run-stress-test.js       # Main entry point
│
├── config/                      # Configuration files
│   ├── test-scenarios.json      # Scenario definitions
│   └── baseline-metrics.json    # Performance baselines
│
└── results/                     # Test results (generated)
```

## Quick Start

### Prerequisites

```bash
# Required services running:
- MongoDB (localhost:27017)
- Redis (localhost:6379)
- Scheduling Cases Service (localhost:8060)
- Universal Reporting Service (localhost:3002 & 9160)
- Auth Service (localhost:3000)

# Node.js version: 14+
# RAM: 8GB minimum recommended
```

### Installation

```bash
cd tests/stress-test
npm install
```

### Basic Test Run

```bash
# Simple test with 100 cases
node scripts/run-stress-test.js --scenario bulk-case-creation --volume 100

# With database cleanup
node scripts/run-stress-test.js --scenario bulk-case-creation --volume 100 --clean-start

# With custom configuration
node scripts/run-stress-test.js --scenario json-load-test --json-file ./data/test-cases.json
```

## Core Concepts

### 1. Test Scenarios

#### Bulk Case Creation
- Creates multiple cases in parallel
- Tests system throughput and concurrent handling
- Default: 3 parallel requests, 5 cases per batch

#### JSON Load Test
- Loads cases from JSON configuration files
- Tests complex billing configurations
- Supports multiple config files

#### System Limits Test
- Pushes system to breaking point
- Identifies performance bottlenecks
- Requires `--force` flag for safety

### 2. Validation Levels

```javascript
// Basic: Just checks if operations succeeded
--validation-level basic

// Standard: Validates data integrity and basic UR flow
--validation-level standard

// Ultimate: Full end-to-end validation including dependency graphs
--validation-level ultimate
```

### 3. Parallel Execution Control

```javascript
// Controlled parallel execution (2-5 max)
--max-parallel 3  // Recommended for most systems

// Higher values may cause:
// - Database connection pool exhaustion
// - Memory pressure
// - Race conditions
```

## Running Tests

### Pre-Flight Check

Always run the pre-flight check before testing:

```bash
npm run preflight
```

This checks:
- All services are running
- Database connections are healthy
- Redis queues are clear
- Essential configurations exist
- No stuck jobs from previous runs

### Complete Test Suite

```bash
# Full stress test with all validations
./run-complete-stress-test.sh

# This runs:
# 1. Database cleanup
# 2. Index creation
# 3. Case creation (500 cases)
# 4. Wait for UR processing (30s)
# 5. Ultimate validation
# 6. Report generation
```

### Scenario-Specific Tests

```bash
# Load custom billing configuration
node scripts/run-stress-test.js \
  --scenario json-load-test \
  --json-configs config/billing-config.json \
  --volume 50 \
  --validation-level ultimate

# High concurrency test
node scripts/run-stress-test.js \
  --scenario bulk-case-creation \
  --volume 1000 \
  --high-concurrency \
  --max-parallel 5

# System limits test (careful!)
node scripts/run-stress-test.js \
  --scenario system-limits \
  --force \
  --monitor-resources
```

### Environment-Specific Tests

```bash
# Local environment (default)
node scripts/run-stress-test.js --env local

# Docker environment
node scripts/run-stress-test.js --env docker

# Staging environment
node scripts/run-stress-test.js --env staging --volume 50
```

## Performance Benchmarks

### 🟢 Good Performance Indicators

```json
{
  "case_creation": {
    "p95_response_time": "< 200ms",
    "average_response_time": "< 50ms",
    "throughput": "> 20 cases/second",
    "error_rate": "< 0.1%"
  },
  "event_processing": {
    "import_rate": "> 99%",
    "processing_rate": "> 98%",
    "processing_time": "< 1s per event"
  },
  "proxy_generation": {
    "creation_rate": "> 99%",
    "field_accuracy": "100%",
    "trigger_evaluation": "< 100ms"
  }
}
```

### 🔴 Poor Performance Indicators

```json
{
  "case_creation": {
    "p95_response_time": "> 1000ms",
    "average_response_time": "> 500ms",
    "throughput": "< 5 cases/second",
    "error_rate": "> 5%"
  },
  "event_processing": {
    "import_rate": "< 90%",
    "processing_rate": "< 80%",
    "processing_time": "> 10s per event"
  },
  "proxy_generation": {
    "creation_rate": "< 90%",
    "field_accuracy": "< 95%",
    "trigger_evaluation": "> 1000ms"
  }
}
```

### Comparison Matrix

| Metric | Excellent | Good | Acceptable | Poor | Critical |
|--------|-----------|------|------------|------|----------|
| **Case Creation Rate** | 50+ /sec | 20-50 /sec | 10-20 /sec | 5-10 /sec | <5 /sec |
| **Event Import Success** | 100% | 99%+ | 95-99% | 90-95% | <90% |
| **Proxy Creation Success** | 100% | 99%+ | 95-99% | 90-95% | <90% |
| **P95 Response Time** | <100ms | 100-200ms | 200-500ms | 500-1000ms | >1000ms |
| **Error Rate** | 0% | <0.1% | 0.1-1% | 1-5% | >5% |
| **Memory Usage Growth** | <100MB | 100-500MB | 500MB-1GB | 1-2GB | >2GB |

## Critical Implementation Points

### 1. Event Processing Pipeline

**Location**: `backend/universal-reporting/src/services/events-processer.service.ts`

```javascript
// Critical: Events are processed in batches with locks
// Issue: If lock duration < processing time, events may be skipped
const lockDuration = 60000; // Must be > max processing time
```

### 2. Database Indexes

**Location**: `scripts/core/event-indexer.js`

```javascript
// Critical indexes for performance:
{ processed: 1 }           // Event processing status
{ source: 1, processed: 1 } // Event filtering
{ createdAt: -1 }          // Time-based queries
```

### 3. Parallel Processing Limits

**Location**: `scripts/utils/parallel-runner.js`

```javascript
// Critical: Too many parallel requests cause:
// - MongoDB connection pool exhaustion (default: 10)
// - Node.js memory pressure
// - Race conditions in trigger evaluation
this.maxParallel = Math.min(5, requestedParallel);
```

### 4. Trigger Evaluation

**Location**: `backend/universal-reporting/src/services/trigger.service.ts`

```javascript
// Critical: Trigger conditions must be deterministic
// Non-deterministic conditions cause inconsistent proxy creation
```

### 5. Configuration Loading

**Location**: `backend/universal-reporting/src/services/json-config.service.ts`

```javascript
// Critical: Configs MUST have tenantId
// Missing tenantId = silent failures
```

### 6. Port Configuration

**Critical**: UR service must listen on port 9160 for microservice communication

```bash
# In backend/universal-reporting/.env
UR_PORT=9160
MICROSERVICE_PORT=9160
```

## Edge Cases & Limitations

### Known Edge Cases

1. **Concurrent Case Updates**
   - Multiple updates to same case can cause event ordering issues
   - Mitigation: Use event timestamps for ordering

2. **Large Batch Processing**
   - Batches >1000 may timeout
   - Mitigation: Process in smaller chunks

3. **Configuration Changes During Test**
   - Changing billing configs mid-test causes inconsistent results
   - Mitigation: Lock configs during test execution

4. **Memory Limitations**
   - Node.js heap limit (~1.5GB default)
   - Mitigation: Use `--max-old-space-size=4096` for large tests

### System Limitations

1. **MongoDB Connection Pool**
   - Default: 10 connections
   - Exhaustion causes connection timeouts

2. **Event Queue Processing**
   - Single-threaded cron job
   - Processes events sequentially

3. **Proxy Field Evaluation**
   - Complex expressions have performance impact
   - Circular dependencies cause failures

## Interpreting Results

### Success Metrics

```json
{
  "validation_summary": {
    "status": "✅ GOOD",              // Overall health
    "total_cases": 500,
    "successful_flows": 495,          // End-to-end success
    "success_rate": "99%",
    "average_completion_time": "2.3s" // Case to proxy time
  }
}
```

### Warning Signs

1. **High Error Rate**
   ```
   ERROR_CATEGORIES:
   - TIMEOUT: 15%        // Network or processing delays
   - SERVER_ERROR: 5%    // Service issues
   - VALIDATION: 10%     // Data integrity problems
   ```

2. **Processing Delays**
   ```
   Event Import → Processing: >5s    // Queue backlog
   Processing → Proxy: >10s          // Complex evaluations
   ```

3. **Resource Exhaustion**
   ```
   Memory Usage: Growing >1GB
   CPU: Sustained >80%
   MongoDB Connections: At limit
   ```

### Reading the Reports

**Location**: `results/[test-id]/`

1. **execution-summary.json**
   - Overall test metrics
   - Success/failure counts
   - Performance statistics

2. **validation-results.json**
   - Detailed validation for each phase
   - Specific failure reasons
   - Recommendations

3. **error-log.json**
   - Categorized errors
   - Stack traces
   - Timing information

4. **performance-metrics.json**
   - Response time distributions
   - Throughput measurements
   - Resource utilization

## Troubleshooting

### Common Issues

1. **"connect ECONNREFUSED 127.0.0.1:9160"**
   ```bash
   # UR service not listening on microservice port
   cd backend/universal-reporting
   UR_PORT=9160 npm run dev
   ```

2. **"No events to process"**
   ```bash
   # Check if events are being imported
   mongo universal-reporting --eval "db.importedevents.count()"
   
   # Check tenant ID
   mongo universal-reporting --eval "db.importedevents.findOne()"
   ```

3. **"Configuration not found"**
   ```bash
   # Ensure configs have correct tenantId
   node scripts/fix-ur-service-patch.js
   ```

4. **"Connection timeout"**
   ```bash
   # Check service health
   curl http://localhost:3002/health
   curl http://localhost:8060/health
   ```

5. **"Memory exhaustion"**
   ```bash
   # Run with increased memory
   node --max-old-space-size=4096 scripts/run-stress-test.js
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=true node scripts/run-stress-test.js --scenario bulk-case-creation

# Save all intermediate data
node scripts/run-stress-test.js --debug --save-intermediate
```

## Development Guide

### Adding New Scenarios

1. Create scenario file: `scripts/scenarios/my-scenario.js`
2. Implement required methods:
   ```javascript
   class MyScenario {
     getName() { return 'my-scenario'; }
     getDescription() { return 'Description'; }
     async initialize() { /* Setup */ }
     async execute() { /* Run test */ }
   }
   ```

3. Register in main script
4. Add configuration in `config/test-scenarios.json`

### Adding Validations

1. Extend `ValidationEngine` in `scripts/core/validation-engine.js`
2. Add new validation phase:
   ```javascript
   async validateMyPhase(data) {
     // Validation logic
     return { passed: boolean, details: {} };
   }
   ```

### Custom Error Categories

Add to `scripts/core/error-logger.js`:
```javascript
categorizeError(error) {
  // Add custom patterns
  if (error.message.includes('my-pattern')) {
    return 'MY_CUSTOM_ERROR';
  }
}
```

## Best Practices

1. **Always run with `--clean-start` for reproducible results**
2. **Start with small volumes (50-100) to validate setup**
3. **Monitor system resources during tests**
4. **Save results for trend analysis**
5. **Run multiple iterations for statistical significance**
6. **Document any configuration changes**
7. **Always run pre-flight check before major tests**

## Contact & Support

- **Issues**: Create GitHub issue with test results
- **Logs**: Include error-log.json and execution-summary.json
- **Environment**: Specify all service versions and configurations

---
