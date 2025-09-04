# Deployment Checklist

## Pre-deployment Checklist

### 1. Environment Variables
- [ ] `MONGODB_URI` - MongoDB Atlas connection string
- [ ] `NODE_ENV` - Set to `production`
- [ ] `JWT_SECRET` - Strong secret key (generate new for production)
- [ ] `ALLOWED_ORIGINS` - Your frontend domain(s)

### 2. MongoDB Atlas Setup
- [ ] Cluster created and running
- [ ] Database user created with appropriate permissions
- [ ] Network access configured (whitelist deployment IPs)
- [ ] Connection string tested

### 3. Code Verification
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm run test`
- [ ] No hardcoded secrets in code
- [ ] Health endpoint works: `GET /`

## Render Deployment Steps

### Option 1: Using render.yaml (Recommended)
1. Push code to GitHub
2. Connect repository to Render
3. Render will auto-detect `render.yaml`
4. Set environment variables in Render dashboard
5. Deploy

### Option 2: Manual Setup
1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure settings:
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Health Check Path**: `/`
4. Set environment variables
5. Deploy

## Post-deployment Verification

- [ ] Health check responds: `https://your-app.onrender.com/`
- [ ] Database connection works
- [ ] Authentication endpoints work
- [ ] CORS allows your frontend domain
- [ ] Logs show no errors

## Environment Variables for Render

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Troubleshooting

### Common Issues:
1. **Build fails**: Check TypeScript errors, run `npm run build` locally
2. **Database connection fails**: Verify MongoDB URI and network access
3. **CORS errors**: Check `ALLOWED_ORIGINS` includes your frontend domain
4. **Health check fails**: Ensure app binds to `0.0.0.0` and correct port

### Logs:
- Check Render logs for startup errors
- Monitor MongoDB Atlas logs for connection issues
- Use health endpoint to verify app status