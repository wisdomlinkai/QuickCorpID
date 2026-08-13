// Test Organisation Service API
const https = require('https');

const API_URL = 'https://2cbejgemyi.execute-api.ap-southeast-1.amazonaws.com/v1';

// Test data
const testData = {
  name: 'Test Company Ltd',
  br_number: '12345678',
  cr_number: '98765432',
  contact_email: 'test@example.com'
};

// Simple HTTP request
function makeRequest(path, method, data, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log(`\n${method} ${path}`);
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
        resolve({ status: res.statusCode, body: body });
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test endpoints without auth first to see response
async function testAPI() {
  console.log('Testing Organisation Service API...\n');
  console.log('API URL:', API_URL);
  console.log('---');
  
  try {
    // Test 1: List organisations (should fail with 401)
    await makeRequest('/organisations', 'GET', null, null);
    
    // Test 2: Create organisation (should fail with 401)
    await makeRequest('/organisations', 'POST', testData, null);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n---');
  console.log('Next steps:');
  console.log('1. Get a valid Cognito token');
  console.log('2. Test with authentication');
}

testAPI();
