const { MongoClient } = require('mongodb');
const fs = require('fs').promises;

async function generatePerformanceReport() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('universal-reporting');
    
    console.log('📊 Generating Comprehensive Performance Report...\n');
    
    const report = {
      timestamp: new Date(),
      summary: {},
      metrics: {},
      performance: {},
      recommendations: []
    };
    
    const [
      totalEvents, processedEvents,
      totalProxies, proxiesWithFields,
      totalNodes, evaluatedNodes,
      totalFieldOps, processedFieldOps
    ] = await Promise.all([
      db.collection('importedevents').countDocuments(),
      db.collection('importedevents').countDocuments({ processed: true }),
      db.collection('proxies').countDocuments(),
      db.collection('proxies').countDocuments({ dynamicFields: { $exists: true, $ne: {} } }),
      db.collection('dependencygraphnodes').countDocuments(),
      db.collection('dependencygraphnodes').countDocuments({ status: 'EVALUATED' }),
      db.collection('fieldoperations').countDocuments(),
      db.collection('fieldoperations').countDocuments({ processed: true })
    ]);
    
    report.summary = {
      eventProcessingRate: ((processedEvents / totalEvents) * 100).toFixed(1) + '%',
      proxyCompletionRate: ((proxiesWithFields / totalProxies) * 100).toFixed(1) + '%',
      nodeEvaluationRate: totalNodes > 0 ? ((evaluatedNodes / totalNodes) * 100).toFixed(1) + '%' : '0%',
      fieldOperationRate: ((processedFieldOps / totalFieldOps) * 100).toFixed(1) + '%',
      systemHealthScore: calculateHealthScore(processedEvents/totalEvents, proxiesWithFields/totalProxies, totalNodes > 0)
    };
    
    const eventTimeline = await db.collection('importedevents').aggregate([
      { $match: { processed: true, processedAt: { $exists: true } } },
      { $project: {
        processingTime: { $subtract: ['$processedAt', '$createdAt'] },
        hour: { $dateToString: { format: '%Y-%m-%d %H:00', date: '$processedAt' } }
      }},
      { $group: {
        _id: '$hour',
        count: { $sum: 1 },
        avgProcessingTime: { $avg: '$processingTime' },
        maxProcessingTime: { $max: '$processingTime' }
      }},
      { $sort: { _id: -1 } },
      { $limit: 24 }
    ]).toArray();
    
    report.metrics = {
      events: {
        total: totalEvents,
        processed: processedEvents,
        queued: totalEvents - processedEvents,
        processingTimeline: eventTimeline
      },
      proxies: {
        total: totalProxies,
        withFields: proxiesWithFields,
        completionRate: ((proxiesWithFields / totalProxies) * 100).toFixed(1) + '%',
        byDomain: await db.collection('proxies').aggregate([
          { $group: { _id: '$domainId', count: { $sum: 1 } } }
        ]).toArray()
      },
      nodes: {
        total: totalNodes,
        evaluated: evaluatedNodes,
        dirty: totalNodes - evaluatedNodes,
        byField: await db.collection('dependencygraphnodes').aggregate([
          { $group: { _id: '$field', count: { $sum: 1 } } }
        ]).toArray()
      }
    };
    
    const recentEvents = await db.collection('importedevents').find({
      processed: true,
      processedAt: { $gte: new Date(Date.now() - 3600000) }
    }).toArray();
    
    if (recentEvents.length > 0) {
      const processingTimes = recentEvents.map(e => 
        new Date(e.processedAt) - new Date(e.createdAt)
      );
      
      report.performance = {
        lastHour: {
          eventsProcessed: recentEvents.length,
          avgProcessingTime: (processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length / 1000).toFixed(2) + 's',
          throughput: (recentEvents.length / 60).toFixed(2) + ' events/min'
        },
        currentBacklog: totalEvents - processedEvents,
        estimatedClearTime: ((totalEvents - processedEvents) / (recentEvents.length / 60)).toFixed(1) + ' minutes'
      };
    }
    
    report.recommendations = generateRecommendations(report);
    
    const filename = `ur-performance-report-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));
    
    console.log('📊 UNIVERSAL REPORTING PERFORMANCE REPORT');
    console.log('=' * 50);
    console.log(`\n📈 System Health Score: ${report.summary.systemHealthScore}%`);
    console.log(`\n✅ Key Metrics:`);
    console.log(`   Event Processing: ${report.summary.eventProcessingRate}`);
    console.log(`   Proxy Completion: ${report.summary.proxyCompletionRate}`);
    console.log(`   Node Evaluation: ${report.summary.nodeEvaluationRate}`);
    
    console.log(`\n⚡ Performance:`);
    console.log(`   Current Throughput: ${report.performance.throughput || 'N/A'}`);
    console.log(`   Avg Processing Time: ${report.performance.lastHour?.avgProcessingTime || 'N/A'}`);
    console.log(`   Queue Backlog: ${report.performance.currentBacklog}`);
    
    if (report.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      report.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }
    
    console.log(`\n💾 Full report saved to: ${filename}`);
    
    await createHTMLReport(report);
    
  } finally {
    await client.close();
  }
}

function calculateHealthScore(eventRate, proxyRate, hasNodes) {
  return Math.round(
    (eventRate * 30) +
    (proxyRate * 50) +
    (hasNodes ? 20 : 0)
  );
}

function generateRecommendations(report) {
  const recommendations = [];
  
  if (report.performance.currentBacklog > 1000) {
    recommendations.push('High event backlog - consider increasing cron frequency to */2 seconds');
  }
  
  if (report.metrics.nodes.total < report.metrics.proxies.withFields * 3) {
    recommendations.push('Low dependency node count - verify field operations are processing correctly');
  }
  
  if (parseFloat(report.performance.lastHour?.avgProcessingTime) > 10) {
    recommendations.push('Slow event processing - check for performance bottlenecks in expressions');
  }
  
  if (parseFloat(report.summary.systemHealthScore) < 80) {
    recommendations.push('System health below optimal - review and address above recommendations');
  } else {
    recommendations.push('System is healthy! Consider load testing with higher volumes');
  }
  
  return recommendations;
}

async function createHTMLReport(report) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>UR Performance Report - ${new Date().toLocaleString()}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1, h2 { color: #333; }
        .metric-card { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #28a745; }
        .health-score { font-size: 48px; text-align: center; padding: 20px; }
        .good { color: #28a745; }
        .warning { color: #ffc107; }
        .critical { color: #dc3545; }
        .recommendation { background: #e7f3ff; padding: 10px; margin: 5px 0; border-left: 4px solid #2196F3; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Universal Reporting Performance Report</h1>
        <p>Generated: ${report.timestamp}</p>
        
        <div class="health-score ${report.summary.systemHealthScore >= 80 ? 'good' : report.summary.systemHealthScore >= 60 ? 'warning' : 'critical'}">
            System Health: ${report.summary.systemHealthScore}%
        </div>
        
        <h2>Key Metrics</h2>
        <div class="metric-card">
            <div>Event Processing Rate</div>
            <div class="metric-value">${report.summary.eventProcessingRate}</div>
        </div>
        <div class="metric-card">
            <div>Proxy Completion Rate</div>
            <div class="metric-value">${report.summary.proxyCompletionRate}</div>
        </div>
        
        <h2>Performance Metrics</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Total Events</td>
                <td>${report.metrics.events.total}</td>
            </tr>
            <tr>
                <td>Processed Events</td>
                <td>${report.metrics.events.processed}</td>
            </tr>
            <tr>
                <td>Queue Backlog</td>
                <td>${report.metrics.events.queued}</td>
            </tr>
            <tr>
                <td>Total Proxies</td>
                <td>${report.metrics.proxies.total}</td>
            </tr>
            <tr>
                <td>Dependency Nodes</td>
                <td>${report.metrics.nodes.total}</td>
            </tr>
        </table>
        
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
    </div>
</body>
</html>
  `;
  
  const htmlFile = `ur-performance-report-${Date.now()}.html`;
  await fs.writeFile(htmlFile, html);
  console.log(`\n🌐 HTML report saved to: ${htmlFile}`);
}

generatePerformanceReport().catch(console.error);