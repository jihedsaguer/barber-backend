import { Body, Controller, Post, HttpCode, HttpStatus, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UserRole, UserDocument } from './schema/user.schema';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() createAuthDto: CreateAuthDto) {
    const user: UserDocument = await this.authService.register(createAuthDto, UserRole.USER);
    const { password, ...result } = user.toObject();
    return result;
  }
  @Post('refresh')
@HttpCode(HttpStatus.OK)
async refresh(@Body('refresh_token') refreshToken: string) {
  return this.authService.refreshToken(refreshToken);
}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginAuthDto: LoginAuthDto) {
    // returns { access_token, user }
    return this.authService.login(loginAuthDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async me(@Req() req: any) {
    // req.user is the JWT payload from JwtStrategy.validate
    return req.user; // { sub, role, name, phone, iat, exp }
  }
}
