# Barber Backend API

A production-ready NestJS backend application for barber shop management with MongoDB Atlas integration.

## Features

- 🔐 JWT Authentication
- 👥 User Management (Barbers & Clients)
- 📅 Appointment Scheduling
- 🛠️ Service Management
- ⏰ Availability Management
- 🏥 Health Check Endpoint
- 🌐 CORS Configuration
- 📊 MongoDB Atlas Integration

## Environment Setup

### Development

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
```

### Production

Set the following environment variables in your deployment platform:
- `MONGODB_URI`: Your MongoDB Atlas connection string
- `NODE_ENV`: Set to `production`
- `PORT`: Will be set automatically by most platforms
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend URLs
- `JWT_SECRET`: Strong secret key for JWT tokens

## Installation

```bash
npm install
```

## Running the Application

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## API Endpoints

### Health Check
- `GET /` - Returns application health status

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Other endpoints
- Barber management
- Client management
- Service management
- Availability management
- Reservation management

## Deployment on Render

### Automatic Deployment

1. Connect your GitHub repository to Render
2. Use the included `render.yaml` configuration
3. Set environment variables in Render dashboard:
   - `MONGODB_URI`
   - `ALLOWED_ORIGINS`

### Manual Deployment

1. Create a new Web Service on Render
2. Connect your repository
3. Configure build settings:
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Health Check Path**: `/`
4. Set environment variables as listed above

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Whitelist your deployment IP (or use 0.0.0.0/0 for Render)
4. Get your connection string and set it as `MONGODB_URI`

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
src/
├── auth/           # Authentication module
├── availability/   # Availability management
├── barber/         # Barber management
├── client/         # Client management
├── database/       # Database configuration
├── reservation/    # Reservation management
├── service/        # Service management
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## Production Considerations

- ✅ Environment-based configuration
- ✅ CORS properly configured
- ✅ Health check endpoint
- ✅ Production logging levels
- ✅ Global validation pipes
- ✅ MongoDB connection pooling
- ✅ Error handling and logging
- ✅ Secure JWT configuration

## License

This project is [MIT licensed](LICENSE).