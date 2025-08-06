const fetch = require('node-fetch');

async function getRealToken() {
  try {
    const loginResponse = await fetch('http://localhost:8010/api/auth/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'luca@ambuflow.com',
        password: '0mhk6k^csJ4y6G'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }
    
    const { tokenWithTenant, token } = await loginResponse.json();
    
    console.log('Token with tenant:', tokenWithTenant);
    console.log('\nRegular token:', token);
    
    const testResponse = await fetch('http://localhost:8060/api/schedulingcases/cases', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenWithTenant || token}`,
      }
    });
    
    console.log('\nToken test:', testResponse.ok ? '✅ Success' : `❌ Failed (${testResponse.status})`);
    
    return tokenWithTenant || token;
  } catch (error) {
    console.error('Error:', error.message);
  }
}

getRealToken();