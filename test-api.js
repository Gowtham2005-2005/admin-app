const fetch = require('node-fetch');

// Base URL - change if testing in a different environment
const BASE_URL = 'http://127.0.0.1:3001/api';

// Function to test API endpoints
async function testEndpoints() {
  console.log('🧪 Testing API endpoints...');
  
  try {
    // First check if server is running
    console.log("Checking if server is running...");
    const serverCheck = await fetch('http://127.0.0.1:3001', { timeout: 5000 })
      .then(res => {
        console.log(`Server is running! Status: ${res.status}`);
        return true;
      })
      .catch(err => {
        console.error(`Server check failed: ${err.message}`);
        return false;
      });
      
    if (!serverCheck) {
      console.error("Cannot connect to server. Is the Next.js server running?");
      process.exit(1);
    }
  
    // Test endpoints
    await testGetAttendedParticipants();
    await testGetOutsideParticipants();
    await testMarkAttendanceGet();
    
    console.log('\n✅ All tests completed.');
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

// Test getAttendedParticipants endpoint
async function testGetAttendedParticipants() {
  console.log('\nTesting GET /api/getAttendedParticipants');
  try {
    console.log(`Sending request to ${BASE_URL}/getAttendedParticipants`);
    const response = await fetch(`${BASE_URL}/getAttendedParticipants`, {
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });
    
    const contentType = response.headers.get('content-type');
    console.log(`Status: ${response.status}, Content-Type: ${contentType}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Error: ${text}`);
      return;
    }
    
    const data = await response.json();
    console.log(`Success! Found ${data.total} participants inside.`);
    console.log("Response data:", JSON.stringify(data, null, 2).substring(0, 200) + "...");
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    console.error(`Full error:`, error);
  }
}

// Test getOutsideParticipants endpoint
async function testGetOutsideParticipants() {
  console.log('\nTesting GET /api/getOutsideParticipants');
  try {
    console.log(`Sending request to ${BASE_URL}/getOutsideParticipants`);
    const response = await fetch(`${BASE_URL}/getOutsideParticipants`, {
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });
    
    const contentType = response.headers.get('content-type');
    console.log(`Status: ${response.status}, Content-Type: ${contentType}`);
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`Error: ${text}`);
      return;
    }
    
    const data = await response.json();
    console.log(`Success! Found ${data.total} participants outside.`);
    console.log("Response data:", JSON.stringify(data, null, 2).substring(0, 200) + "...");
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    console.error(`Full error:`, error);
  }
}

// Test markAttendance GET endpoint
async function testMarkAttendanceGet() {
  console.log('\nTesting GET /api/markAttendance?qrResult=test123');
  try {
    console.log(`Sending request to ${BASE_URL}/markAttendance?qrResult=test123`);
    const response = await fetch(`${BASE_URL}/markAttendance?qrResult=test123`, {
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });
    
    const contentType = response.headers.get('content-type');
    console.log(`Status: ${response.status}, Content-Type: ${contentType}`);
    
    // Try to parse as JSON first
    let data;
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
        console.log("JSON Response:", JSON.stringify(data, null, 2).substring(0, 200) + "...");
      } catch (e) {
        console.error("Failed to parse JSON:", e.message);
        const text = await response.text();
        console.log(`Raw Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      }
    } else {
      const text = await response.text();
      console.log(`Raw Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
    }
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    console.error(`Full error:`, error);
  }
}

// Run the tests
testEndpoints(); 