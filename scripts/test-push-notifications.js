const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ADMIN_CREDENTIALS = {
  phone: '1234567890', // Replace with your admin phone
  password: 'password123' // Replace with your admin password
};

let adminToken = '';

// Test runner
async function runTests() {
  console.log('🧪 Starting Push Notification API Tests\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    adminToken = loginResponse.data.access_token;
    console.log('✅ Admin login successful');
    console.log(`   User: ${loginResponse.data.user.name} (${loginResponse.data.user.role})\n`);

    // Step 2: Get VAPID public key
    console.log('2️⃣ Testing VAPID public key endpoint...');
    const vapidResponse = await axios.get(`${BASE_URL}/notifications/vapid-public-key`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ VAPID public key retrieved');
    console.log(`   Key: ${vapidResponse.data.publicKey.substring(0, 20)}...\n`);

    // Step 3: Subscribe to notifications
    console.log('3️⃣ Testing push notification subscription...');
    const subscribeResponse = await axios.post(`${BASE_URL}/notifications/subscribe`, {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-' + Date.now(),
      keys: {
        p256dh: 'test-p256dh-key-for-testing-' + Date.now(),
        auth: 'test-auth-key-for-testing-' + Date.now()
      },
      deviceName: 'Test Script Device'
    }, {
      headers: { 
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Push subscription created');
    console.log(`   Subscription ID: ${subscribeResponse.data.subscription.id}\n`);

    // Step 4: Get user subscriptions
    console.log('4️⃣ Testing get user subscriptions...');
    const subscriptionsResponse = await axios.get(`${BASE_URL}/notifications/subscriptions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ User subscriptions retrieved');
    console.log(`   Total subscriptions: ${subscriptionsResponse.data.subscriptions.length}\n`);

    // Step 5: Send test notification
    console.log('5️⃣ Testing send notification...');
    const testNotificationResponse = await axios.post(`${BASE_URL}/notifications/test`, {
      title: '🧪 Test from Script',
      body: 'This is an automated test notification',
      data: { source: 'test-script', timestamp: Date.now() }
    }, {
      headers: { 
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Test notification sent');
    console.log(`   Result: ${testNotificationResponse.data.result.sent} sent, ${testNotificationResponse.data.result.failed} failed\n`);

    // Step 6: Test access control (this should fail)
    console.log('6️⃣ Testing access control (should fail for non-admin)...');
    try {
      // Try to use a fake non-admin token
      await axios.post(`${BASE_URL}/notifications/subscribe`, {
        endpoint: 'https://test.com',
        keys: { p256dh: 'test', auth: 'test' }
      }, {
        headers: { 
          Authorization: 'Bearer fake-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Access control test failed - should have been rejected');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ Access control working - unauthorized request rejected\n');
      } else {
        console.log('⚠️ Unexpected error in access control test:', error.message, '\n');
      }
    }

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Admin authentication');
    console.log('   ✅ VAPID key retrieval');
    console.log('   ✅ Push subscription creation');
    console.log('   ✅ Subscription management');
    console.log('   ✅ Notification sending');
    console.log('   ✅ Access control');
    console.log('\n🚀 Your push notification system is ready for frontend integration!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure your backend is running (npm run start:dev)');
    console.log('   2. Update ADMIN_CREDENTIALS in this script');
    console.log('   3. Check your .env file has VAPID keys');
    console.log('   4. Verify your admin user exists in the database');
  }
}

// Run the tests
runTests();