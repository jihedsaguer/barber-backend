// auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from './schema/user.schema';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  /** Register a new user */
  async register(createAuthDto: CreateAuthDto, role: UserRole = UserRole.USER): Promise<UserDocument> {
    const { name, phone, password } = createAuthDto;

    const existingUser = await this.userModel.findOne({ phone });
    if (existingUser) {
      throw new ConflictException('Phone number already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new this.userModel({
      name,
      phone,
      password: hashedPassword,
      role,
    });

    return newUser.save();
  }

  /** Login user with access + refresh tokens */
  async login(
    loginAuthDto: LoginAuthDto
  ): Promise<{ access_token: string; refresh_token: string; user: Omit<User, 'password'> & any }> {
    const { phone, password } = loginAuthDto;

    const user = await this.userModel.findOne({ phone });
    if (!user) throw new UnauthorizedException('Invalid phone or password');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid phone or password');

    // Convert Mongoose _id to string
    const userId = user._id.toString(); // Typescript now knows _id exists

    const payload = { sub: userId, role: user.role };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev-secret',
      expiresIn: '15m',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
      expiresIn: '7d',
    });

    const { password: _pw, ...userObj } = user.toObject();

    return { access_token, refresh_token, user: userObj };
  }

  /** Refresh access token */
  async refreshToken(refreshToken: string): Promise<{ access_token: string }> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
      });

      if (!payload || !payload.sub) throw new UnauthorizedException('Invalid refresh token');

      const newAccessToken = await this.jwtService.signAsync(
        { sub: payload.sub, role: payload.role },
        { secret: process.env.JWT_SECRET || 'dev-secret', expiresIn: '15m' },
      );

      return { access_token: newAccessToken };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /** Optional: find user by id */
  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).exec();
  }

  /** Debug method to fetch all users */
  async findAllUsers(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }
}
