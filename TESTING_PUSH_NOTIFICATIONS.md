# 🧪 Testing Push Notification Endpoints

This guide shows you how to test all push notification features using Postman, curl, or any REST client before implementing in React.

## 🚀 Prerequisites

1. **Start your backend**: `npm run start:dev`
2. **Get an admin JWT token** by logging in as an admin user
3. **Have a regular user JWT token** for testing restrictions

## 📋 Step-by-Step Testing Guide

### Step 1: Get Admin JWT Token

First, login as an admin user to get a JWT token:

```bash
# POST /auth/login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "your-admin-phone",
    "password": "your-admin-password"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8a1b2c3d4e5f6789012ab",
    "name": "Admin User",
    "phone": "1234567890",
    "role": "admin"
  }
}
```

**Save the `access_token` for the next steps!**

### Step 2: Test VAPID Public Key Endpoint

```bash
# GET /notifications/vapid-public-key
curl -X GET http://localhost:3000/notifications/vapid-public-key \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "publicKey": "BLYgJbwMoOcoQ6IQoMKEEt7MdIum5-pdsXftoyFZpJYz0HZ-umSXPt6ztcEFhK_Vl1eVbBnk04aE3_j-Q8bbZO0"
}
```

### Step 3: Test Push Subscription (Mock Data)

Since we can't generate real browser push subscriptions in testing, we'll use mock data:

```bash
# POST /notifications/subscribe
curl -X POST http://localhost:3000/notifications/subscribe \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Test Browser)" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/mock-endpoint-for-testing",
    "keys": {
      "p256dh": "mock-p256dh-key-for-testing-purposes-only",
      "auth": "mock-auth-key-for-testing"
    },
    "deviceName": "Test Device"
  }'
```

**Expected Response:**
```json
{
  "message": "Successfully subscribed to push notifications",
  "subscription": {
    "id": "64f8a1b2c3d4e5f6789012cd",
    "deviceName": "Test Device",
    "createdAt": "2025-01-09T12:00:00.000Z"
  }
}
```

### Step 4: Test Getting User Subscriptions

```bash
# GET /notifications/subscriptions
curl -X GET http://localhost:3000/notifications/subscriptions \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "subscriptions": [
    {
      "id": "64f8a1b2c3d4e5f6789012cd",
      "deviceName": "Test Device",
      "userAgent": "Mozilla/5.0 (Test Browser)",
      "createdAt": "2025-01-09T12:00:00.000Z"
    }
  ]
}
```

### Step 5: Test Notification Sending (Test Endpoint)

```bash
# POST /notifications/test
curl -X POST http://localhost:3000/notifications/test \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🧪 Custom Test Notification",
    "body": "Testing push notifications from API",
    "icon": "/test-icon.png",
    "data": {
      "type": "test",
      "customData": "hello world"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Test notification sent",
  "result": {
    "sent": 0,
    "failed": 1
  }
}
```

*Note: `failed: 1` is expected because we're using mock subscription data. In real implementation with browser subscriptions, this would be `sent: 1, failed: 0`.*

### Step 6: Test Reservation Creation (Triggers Notification)

Create a new reservation to test automatic notification:

```bash
# POST /reservations/create
curl -X POST http://localhost:3000/reservations/create \
  -H "Authorization: Bearer YOUR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Client",
    "clientPhone": "1234567890",
    "serviceIds": ["YOUR_SERVICE_ID"],
    "barberName": "Adib",
    "date": "2025-01-15",
    "startTime": "14:00",
    "endTime": "15:00",
    "notes": "Test reservation for notification"
  }'
```
**Check your backend logs** - you should see:
```
📱 Push notification sent for new reservation
📊 Notification results: 0 sent, 1 failed
```

### Step 7: Test Reservation Status Updates

```bash
# PUT /reservations/:id/accept
curl -X PUT http://localhost:3000/reservations/RESERVATION_ID/accept \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# PUT /reservations/:id/cancel  
curl -X PUT http://localhost:3000/reservations/RESERVATION_ID/cancel \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"

# PUT /reservations/:id/complete
curl -X PUT http://localhost:3000/reservations/RESERVATION_ID/complete \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Check backend logs** for notification sending messages.

### Step 8: Test Access Control (Non-Admin User)

Test that regular users can't subscribe:

```bash
# This should fail with 403 Forbidden
curl -X POST http://localhost:3000/notifications/subscribe \
  -H "Authorization: Bearer YOUR_REGULAR_USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://test.com",
    "keys": {
      "p256dh": "test",
      "auth": "test"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Only admin users can subscribe to push notifications",
  "error": "Forbidden",
  "statusCode": 403
}
```

### Step 9: Test Unsubscribe

```bash
# DELETE /notifications/unsubscribe
curl -X DELETE http://localhost:3000/notifications/unsubscribe \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/mock-endpoint-for-testing"
  }'
```

**Expected Response:**
```json
{
  "message": "Successfully unsubscribed from push notifications"
}
```

## 📱 Postman Collection

Here's a Postman collection you can import:

```json
{
  "info": {
    "name": "Push Notifications API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "adminToken",
      "value": "YOUR_ADMIN_JWT_TOKEN"
    }
  ],
  "item": [
    {
      "name": "Get VAPID Public Key",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          }
        ],
        "url": "{{baseUrl}}/notifications/vapid-public-key"
      }
    },
    {
      "name": "Subscribe to Notifications",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"endpoint\": \"https://fcm.googleapis.com/fcm/send/mock-endpoint-for-testing\",\n  \"keys\": {\n    \"p256dh\": \"mock-p256dh-key-for-testing-purposes-only\",\n    \"auth\": \"mock-auth-key-for-testing\"\n  },\n  \"deviceName\": \"Postman Test Device\"\n}"
        },
        "url": "{{baseUrl}}/notifications/subscribe"
      }
    },
    {
      "name": "Get My Subscriptions",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          }
        ],
        "url": "{{baseUrl}}/notifications/subscriptions"
      }
    },
    {
      "name": "Send Test Notification",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{adminToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"title\": \"🧪 Test from Postman\",\n  \"body\": \"This is a test notification\",\n  \"data\": {\n    \"source\": \"postman\"\n  }\n}"
        },
        "url": "{{baseUrl}}/notifications/test"
      }
    }
  ]
}
```

## 🔍 What to Look For

### ✅ Success Indicators:

1. **VAPID Key Retrieved** - You get a valid public key
2. **Subscription Created** - Returns subscription ID and details
3. **Notifications Logged** - Backend logs show notification attempts
4. **Status Updates Work** - Reservation status changes trigger notifications
5. **Access Control Works** - Non-admin users get 403 errors

### ❌ Common Issues:

1. **"VAPID keys not configured"** - Check your `.env` file
2. **"Only admin users can subscribe"** - Make sure you're using admin JWT token
3. **"Failed to send notification"** - Expected with mock data, real subscriptions will work
4. **401 Unauthorized** - Check your JWT token is valid and not expired

## 🎯 Testing Checklist

- [ ] Get VAPID public key
- [ ] Subscribe as admin user ✅
- [ ] Try to subscribe as regular user ❌ (should fail)
- [ ] Get user subscriptions
- [ ] Send test notification
- [ ] Create reservation (triggers notification)
- [ ] Update reservation status (triggers notification)
- [ ] Unsubscribe from notifications
- [ ] Check backend logs for notification attempts

## 🚀 Next Steps

Once all endpoints work correctly:

1. **Implement frontend** using the guide in `PUSH_NOTIFICATIONS_GUIDE.md`
2. **Test with real browser subscriptions**
3. **Deploy to production** with proper VAPID keys

Your push notification system is ready for frontend integration! 🎉