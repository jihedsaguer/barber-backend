import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    console.log('Health endpoint called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3000,
      mongoConnected: !!process.env.MONGODB_URI || !!process.env.MONGO_URI,
    };
  }

  @Get('test')
  getTest() {
    console.log('Test endpoint called');
    return { message: 'App is working!', timestamp: new Date().toISOString() };
  }

  @Get('hello')
  getHello(): string {
    return this.appService.getHello();
  }
}
