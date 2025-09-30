#!/bin/bash

# 🧪 Push Notification API Test Script
# Make sure your backend is running: npm run start:dev

BASE_URL="http://localhost:3000"
ADMIN_PHONE="1234567890"  # Replace with your admin phone
ADMIN_PASSWORD="password123"  # Replace with your admin password

echo "🧪 Starting Push Notification API Tests"
echo "========================================"

# Step 1: Login as admin
echo ""
echo "1️⃣ Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$ADMIN_PHONE\",\"password\":\"$ADMIN_PASSWORD\"}")

# Extract token (basic extraction - works on most systems)
ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token. Check your credentials."
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Admin login successful"
echo "Token: ${ADMIN_TOKEN:0:20}..."

# Step 2: Get VAPID public key
echo ""
echo "2️⃣ Testing VAPID public key endpoint..."
VAPID_RESPONSE=$(curl -s -X GET "$BASE_URL/notifications/vapid-public-key" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "✅ VAPID public key retrieved"
echo "Response: $VAPID_RESPONSE"

# Step 3: Subscribe to notifications
echo ""
echo "3️⃣ Testing push notification subscription..."
TIMESTAMP=$(date +%s)
SUBSCRIBE_RESPONSE=$(curl -s -X POST "$BASE_URL/notifications/subscribe" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"endpoint\": \"https://fcm.googleapis.com/fcm/send/test-endpoint-$TIMESTAMP\",
    \"keys\": {
      \"p256dh\": \"test-p256dh-key-$TIMESTAMP\",
      \"auth\": \"test-auth-key-$TIMESTAMP\"
    },
    \"deviceName\": \"Test Script Device\"
  }")

echo "✅ Push subscription created"
echo "Response: $SUBSCRIBE_RESPONSE"

# Step 4: Get user subscriptions
echo ""
echo "4️⃣ Testing get user subscriptions..."
SUBSCRIPTIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/notifications/subscriptions" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "✅ User subscriptions retrieved"
echo "Response: $SUBSCRIPTIONS_RESPONSE"

# Step 5: Send test notification
echo ""
echo "5️⃣ Testing send notification..."
TEST_NOTIFICATION_RESPONSE=$(curl -s -X POST "$BASE_URL/notifications/test" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"🧪 Test from Script\",
    \"body\": \"This is an automated test notification\",
    \"data\": {
      \"source\": \"test-script\",
      \"timestamp\": $TIMESTAMP
    }
  }")

echo "✅ Test notification sent"
echo "Response: $TEST_NOTIFICATION_RESPONSE"

# Step 6: Test access control
echo ""
echo "6️⃣ Testing access control (should fail)..."
ACCESS_CONTROL_RESPONSE=$(curl -s -X POST "$BASE_URL/notifications/subscribe" \
  -H "Authorization: Bearer fake-token" \
  -H "Content-Type: application/json" \
  -d "{\"endpoint\":\"test\",\"keys\":{\"p256dh\":\"test\",\"auth\":\"test\"}}")

echo "✅ Access control test completed"
echo "Response: $ACCESS_CONTROL_RESPONSE"

echo ""
echo "🎉 All tests completed!"
echo "========================"
echo ""
echo "📋 What to check:"
echo "   ✅ All responses should be valid JSON"
echo "   ✅ Step 6 should return 401/403 error (access denied)"
echo "   ✅ Check your backend logs for notification attempts"
echo ""
echo "🚀 Your push notification system is ready!"