import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { ServiceService } from './service/service.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
    private readonly serviceService: ServiceService, // Inject AuthService
  ) {}

  @Get('test-auth')
  async testAuth() {
    return { message: 'Auth module is working!' };
  }
}
