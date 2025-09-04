const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: process.env.PORT || 3000,
  path: '/',
  method: 'GET',
  timeout: 3000,
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  if (res.statusCode >= 200 && res.statusCode < 400) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.log('Health check failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.log('Health check timeout');
  request.destroy();
  process.exit(1);
});

request.setTimeout(3000);
request.end();