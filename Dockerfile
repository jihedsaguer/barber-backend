# Use Node.js 22 LTS Alpine for smaller image size
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies and clean up for production
RUN npm prune --production && npm cache clean --force

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Health check - give more time for startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node healthcheck.js || exit 1

# Start the application
CMD ["node", "dist/main.js"]