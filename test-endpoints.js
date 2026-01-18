import http from 'http';

function testEndpoint(path, body) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (e) => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('\n✅ Testing Dynamic Coordinates Implementation\n');
  
  // Test 1: validate-pincode
  console.log('1️⃣  POST /api/validate-pincode (with pincode 400070)');
  let result = await testEndpoint('/api/validate-pincode', JSON.stringify({ pincode: '400070' }));
  console.log('   Status:', result.status);
  console.log('   Response:', result.data);
  console.log('');
  
  // Test 2: geocode
  console.log('2️⃣  POST /api/geocode (with address "Kurla West Mumbai")');
  result = await testEndpoint('/api/geocode', JSON.stringify({ query: 'Kurla West Mumbai', pincode: '400070' }));
  console.log('   Status:', result.status);
  console.log('   Response:', result.data);
  console.log('');
  
  // Test 3: validate-pincode with area extraction
  console.log('3️⃣  POST /api/validate-pincode (fallback with area name in address)');
  result = await testEndpoint('/api/validate-pincode', JSON.stringify({ pincode: '400070', address: 'Kurla West, Mumbai' }));
  console.log('   Status:', result.status);
  console.log('   Response:', result.data);
  console.log('');
  
  console.log('✨ All three endpoints tested! Check if they use dynamic coordinates from database.');
})();
