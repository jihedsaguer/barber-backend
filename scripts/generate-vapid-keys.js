const webpush = require('web-push');

console.log('🔑 Generating VAPID keys for web push notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('📋 Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@yourbarber.com`);
console.log('\n🔒 Keep the private key secure and never expose it publicly!');
console.log('📱 Use the public key in your frontend for push subscription.');