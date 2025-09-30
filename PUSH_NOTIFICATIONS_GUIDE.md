# 📱 Web Push Notifications Integration Guide

## Backend Setup Complete ✅

Your NestJS backend now supports web push notifications for admin users when:
- New reservations are created
- Reservation status changes (accept, cancel, complete)

## 🔑 Generate VAPID Keys

Run this command to generate your VAPID keys:

```bash
npm run generate:vapid
```

Copy the generated keys to your `.env` file.

## 🌐 Frontend Integration

### 1. Service Worker Setup

Create `public/sw.js` in your frontend:

```javascript
// public/sw.js
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      tag: data.tag || 'notification',
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View Details'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    // Open the app to view reservation details
    event.waitUntil(
      clients.openWindow('/admin/reservations')
    );
  }
});
```

### 2. Frontend Push Subscription

Add this to your admin dashboard:

```javascript
// utils/pushNotifications.js
class PushNotificationManager {
  constructor(apiBaseUrl, authToken) {
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = authToken;
  }

  async initialize() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);

      // Get VAPID public key from backend
      const response = await fetch(`${this.apiBaseUrl}/notifications/vapid-public-key`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      const { publicKey } = await response.json();
      this.vapidPublicKey = publicKey;

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async subscribe(deviceName = 'Unknown Device') {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to backend
      const response = await fetch(`${this.apiBaseUrl}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth'))))
          },
          deviceName
        })
      });

      if (response.ok) {
        console.log('✅ Successfully subscribed to push notifications');
        return true;
      } else {
        console.error('❌ Failed to subscribe to push notifications');
        return false;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  }

  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify backend
        await fetch(`${this.apiBaseUrl}/notifications/unsubscribe`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint
          })
        });
        
        console.log('✅ Successfully unsubscribed from push notifications');
        return true;
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  async checkSubscriptionStatus() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return !!subscription;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export default PushNotificationManager;
```

### 3. React Component Example

```jsx
// components/PushNotificationToggle.jsx
import React, { useState, useEffect } from 'react';
import PushNotificationManager from '../utils/pushNotifications';

const PushNotificationToggle = ({ authToken }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pushManager, setPushManager] = useState(null);

  useEffect(() => {
    const initializePushNotifications = async () => {
      const manager = new PushNotificationManager(
        process.env.REACT_APP_API_URL || 'http://localhost:3000',
        authToken
      );
      
      const initialized = await manager.initialize();
      if (initialized) {
        setPushManager(manager);
        const subscribed = await manager.checkSubscriptionStatus();
        setIsSubscribed(subscribed);
      }
    };

    if (authToken) {
      initializePushNotifications();
    }
  }, [authToken]);

  const handleToggleNotifications = async () => {
    if (!pushManager) return;

    setIsLoading(true);
    try {
      if (isSubscribed) {
        await pushManager.unsubscribe();
        setIsSubscribed(false);
      } else {
        const success = await pushManager.subscribe('Admin Dashboard');
        if (success) {
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!pushManager) {
    return (
      <div className="text-gray-500">
        Push notifications not supported
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleToggleNotifications}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md font-medium ${
          isSubscribed
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } disabled:opacity-50`}
      >
        {isLoading ? 'Loading...' : isSubscribed ? '🔔 Notifications On' : '🔕 Enable Notifications'}
      </button>
      <span className="text-sm text-gray-600">
        {isSubscribed ? 'You will receive reservation alerts' : 'Click to enable push notifications'}
      </span>
    </div>
  );
};

export default PushNotificationToggle;
```

## 🔧 API Endpoints

Your backend now provides these endpoints:

### Admin Subscription Management
- `GET /notifications/vapid-public-key` - Get VAPID public key
- `POST /notifications/subscribe` - Subscribe to notifications (Admin only)
- `DELETE /notifications/unsubscribe` - Unsubscribe from notifications
- `GET /notifications/subscriptions` - Get user's subscriptions
- `POST /notifications/test` - Send test notification (Admin only)

### Reservation Status Updates (New)
- `PUT /reservations/:id/accept` - Accept/confirm reservation (Admin only)
- `PUT /reservations/:id/cancel` - Cancel reservation (Admin only)
- `PUT /reservations/:id/complete` - Complete reservation (Admin only)

## 🧪 Testing

1. **Generate VAPID keys**: `npm run generate:vapid`
2. **Start your backend**: `npm run start:dev`
3. **Test notification endpoint**: 
   ```bash
   curl -X POST http://localhost:3000/notifications/test \
     -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

## 🔒 Security Notes

- Only admin users can subscribe to push notifications
- VAPID private key must be kept secure
- Subscriptions are automatically cleaned up when invalid
- All endpoints require JWT authentication

## 📱 Notification Triggers

Notifications are automatically sent when:

1. **New Reservation Created** (`POST /reservations/create`)
   - Title: "🆕 New Reservation"
   - Body: Client name, services, barber, date

2. **Reservation Status Changed** (`PUT /reservations/:id/accept|cancel|complete`)
   - Title: "✅ Reservation Confirmed" (or cancelled/completed)
   - Body: Client name, barber, new status

The notifications include relevant data for deep linking and actions in your frontend application.