import { Injectable } from '@nestjs/common';
import { AuthService } from './auth/auth.service';

@Injectable()
export class AppService {
  constructor(private readonly authService: AuthService) {}

  getHello(): string {
    return 'Hello World!';
  }

  /** Test AuthService */
  async testAuth(): Promise<string> {
    const users = await this.authService.findAllUsers?.();
    return `There are ${users?.length || 0} users in the system`;
  }
}
