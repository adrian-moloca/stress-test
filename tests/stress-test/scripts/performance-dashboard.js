const { MongoClient } = require('mongodb');
const http = require('http');

async function startDashboard() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  console.log('🚀 Starting UR Performance Dashboard on http://localhost:3333\n');
  
  const server = http.createServer(async (req, res) => {
    if (req.url === '/api/metrics') {
      try {
        await client.connect();
        const metrics = await getMetrics(client);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metrics));
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(getDashboardHTML());
    }
  });
  
  server.listen(3333);
}

async function getMetrics(client) {
  const db = client.db('universal-reporting');
  
  const [
    totalEvents, processedEvents,
    totalProxies, proxiesWithFields,
    totalNodes
  ] = await Promise.all([
    db.collection('importedevents').countDocuments(),
    db.collection('importedevents').countDocuments({ processed: true }),
    db.collection('proxies').countDocuments(),
    db.collection('proxies').countDocuments({ dynamicFields: { $exists: true, $ne: {} } }),
    db.collection('dependencygraphnodes').countDocuments()
  ]);
  
  const recentEvents = await db.collection('importedevents').countDocuments({
    processed: true,
    processedAt: { $gte: new Date(Date.now() - 300000) }
  });
  
  return {
    timestamp: new Date(),
    events: {
      total: totalEvents,
      processed: processedEvents,
      queued: totalEvents - processedEvents,
      processingRate: (recentEvents / 5).toFixed(1) + '/min'
    },
    proxies: {
      total: totalProxies,
      withFields: proxiesWithFields,
      completionRate: ((proxiesWithFields / totalProxies) * 100).toFixed(1) + '%'
    },
    nodes: {
      total: totalNodes
    },
    health: calculateHealthScore(processedEvents/totalEvents, proxiesWithFields/totalProxies, totalNodes > 0)
  };
}

function getDashboardHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>UR Performance Dashboard</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #1a1a2e; 
            color: white;
        }
        .dashboard { 
            max-width: 1400px; 
            margin: 0 auto; 
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #16213e;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .metric-title {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: #10b981;
        }
        .metric-subtitle {
            font-size: 16px;
            color: #64748b;
            margin-top: 5px;
        }
        .health-indicator {
            text-align: center;
            padding: 40px;
            background: #16213e;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .health-score {
            font-size: 72px;
            font-weight: bold;
        }
        .good { color: #10b981; }
        .warning { color: #f59e0b; }
        .critical { color: #ef4444; }
        .refresh-info {
            text-align: center;
            color: #64748b;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>Universal Reporting Performance Dashboard</h1>
        
        <div class="health-indicator">
            <div class="metric-title">System Health</div>
            <div class="health-score" id="health">--%</div>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">Event Processing</div>
                <div class="metric-value" id="event-rate">--%</div>
                <div class="metric-subtitle">
                    <span id="processed-events">0</span> / <span id="total-events">0</span> processed
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Queue Backlog</div>
                <div class="metric-value" id="queue-size">0</div>
                <div class="metric-subtitle" id="processing-rate">0/min</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Proxy Completion</div>
                <div class="metric-value" id="proxy-rate">--%</div>
                <div class="metric-subtitle">
                    <span id="proxies-with-fields">0</span> / <span id="total-proxies">0</span> complete
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">Dependency Nodes</div>
                <div class="metric-value" id="node-count">0</div>
                <div class="metric-subtitle">Graph nodes created</div>
            </div>
        </div>
        
        <div class="refresh-info">
            Auto-refreshing every 5 seconds | Last update: <span id="last-update">--</span>
        </div>
    </div>
    
    <script>
        async function updateMetrics() {
            try {
                const response = await fetch('/api/metrics');
                const data = await response.json();
                
                // Update health score
                const healthEl = document.getElementById('health');
                healthEl.textContent = data.health + '%';
                healthEl.className = 'health-score ' + 
                    (data.health >= 80 ? 'good' : data.health >= 60 ? 'warning' : 'critical');
                
                // Update metrics
                document.getElementById('event-rate').textContent = 
                    ((data.events.processed / data.events.total) * 100).toFixed(1) + '%';
                document.getElementById('processed-events').textContent = data.events.processed;
                document.getElementById('total-events').textContent = data.events.total;
                document.getElementById('queue-size').textContent = data.events.queued;
                document.getElementById('processing-rate').textContent = data.events.processingRate;
                
                document.getElementById('proxy-rate').textContent = data.proxies.completionRate;
                document.getElementById('proxies-with-fields').textContent = data.proxies.withFields;
                document.getElementById('total-proxies').textContent = data.proxies.total;
                
                document.getElementById('node-count').textContent = data.nodes.total;
                
                document.getElementById('last-update').textContent = 
                    new Date(data.timestamp).toLocaleTimeString();
                    
            } catch (error) {
                console.error('Failed to update metrics:', error);
            }
        }
        
        // Update immediately and then every 5 seconds
        updateMetrics();
        setInterval(updateMetrics, 5000);
    </script>
</body>
</html>
  `;
}

function calculateHealthScore(eventRate, proxyRate, hasNodes) {
  return Math.round(
    (eventRate * 30) +
    (proxyRate * 50) +
    (hasNodes ? 20 : 0)
  );
}

startDashboard().catch(console.error);