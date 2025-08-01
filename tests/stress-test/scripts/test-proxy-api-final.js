// scripts/test-proxy-api-final.js
const fetch = require('node-fetch');

async function testProxyAPI() {
  // Use the proxy context key from the logs
  const contextKey = 'MIN_1754041431061'; // Or use a new one
  const url = `http://localhost:8160/api/ur/proxies/schedulingCases/${contextKey}`;
  
  console.log(`🔍 Testing proxy API...`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url);
    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const proxy = await response.json();
      console.log('\n✅ Proxy retrieved successfully!');
      console.log(JSON.stringify(proxy, null, 2));
    } else {
      const error = await response.text();
      console.log('\n❌ API error:', error);
    }
  } catch (err) {
    console.error('Request failed:', err.message);
  }
}

testProxyAPI();