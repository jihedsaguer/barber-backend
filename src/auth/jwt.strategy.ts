import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev-secret',
    });

    this.logger.debug(
      `JwtStrategy initialized with secret: ${
        process.env.JWT_SECRET ? '[REDACTED]' : 'dev-secret'
      }`
    );
  }

  async validate(payload: any) {
    console.log('🔍 JWT STRATEGY CALLED! Payload received:', JSON.stringify(payload));
    this.logger.debug('🔍 JWT payload received:', JSON.stringify(payload));

    if (!payload) {
      console.log('❌ JWT STRATEGY: No payload found in JWT!');
      this.logger.error('❌ No payload found in JWT!');
      throw new UnauthorizedException('Invalid token payload');
    }

    // Check for required fields
    const userId = payload.sub || payload.id;
    if (!userId) {
      console.log('❌ JWT STRATEGY: Payload missing user ID:', payload);
      this.logger.warn('❌ Payload missing user ID (sub or id field):', payload);
      throw new UnauthorizedException('Invalid token: missing user identifier');
    }

    // Return user object that will be attached to req.user
    const user = {
      id: userId,
      sub: userId, // Keep both for compatibility
      name: payload.name,
      phone: payload.phone,
      role: payload.role || 'user', // Default role if not provided
      ...payload, // Include any other payload data
    };

    console.log('✅ JWT STRATEGY: Validation successful. User object:', JSON.stringify(user));
    this.logger.debug('✅ JWT validation successful. User object:', JSON.stringify(user));

    return user; // This becomes req.user in your controllers
  }
}