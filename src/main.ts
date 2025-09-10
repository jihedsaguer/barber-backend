import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    logger.log('🔄 Starting NestJS application...');

    const app = await NestFactory.create(AppModule, {
      logger:
        process.env.NODE_ENV === 'production'
          ? ['error', 'warn', 'log']
          : ['log', 'debug', 'error', 'verbose', 'warn'],
    });

    logger.log('✅ NestJS application created successfully');

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Explicitly set allowed origins
    const allowedOrigins = [
      'https://razor-spark-book-git-prod-jihedxais-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:8080',
    ];

    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    const port = process.env.PORT || 3000;

    logger.log(`🔧 Attempting to bind to port ${port}...`);

    // Bind to 0.0.0.0 for deployment platforms like Koyeb
    await app.listen(port, '0.0.0.0');

    logger.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🔗 CORS Origins: ${allowedOrigins.join(', ')}`);
    logger.log(`✅ Application startup completed successfully`);
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    throw error;
  }
}

bootstrap().catch((error) => {
  console.error('❌ Error starting the application:', error);
  console.error('Stack trace:', error.stack);
  console.error('Environment variables check:');
  console.error('- PORT:', process.env.PORT);
  console.error('- NODE_ENV:', process.env.NODE_ENV);
  console.error('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
  console.error('- MONGO_URI exists:', !!process.env.MONGO_URI);
  process.exit(1);
});
