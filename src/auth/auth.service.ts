import { CreateUserDto } from '@app/users/dto/create-user.dto';
import { UserDto } from '@app/users/dto/user.dto';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });
    return this.login(user);
  }

  async validateUser(email: string, pass: string): Promise<UserDto | null> {
    const user = await this.usersService.findOneWithPassword(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const result = { ...user };
      // @ts-expect-error: Удаляем пароль перед возвратом данных
      delete result.password;
      return result;
    }
    return null;
  }

  login(user: UserDto) {
    const payload = {
      email: user.email,
      sub: user.id,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getTokens(userId: number, email: string) {
    const payload = { sub: userId, email };
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { access_token, refresh_token };
  }

  async refreshTokens(userId: number, rt: string) {
    const user = await this.usersService.findOneWithRefreshTokenById(userId); // Создайте этот метод в UsersService
    if (!user || !user.hashedRefreshToken) {
      throw new ForbiddenException('Access Denied');
    }
    // Сравниваем присланный RT с хешем в базе
    const rtMatches = await bcrypt.compare(rt, user.hashedRefreshToken);
    if (!rtMatches) {
      throw new ForbiddenException('Access Denied');
    }

    // Генерируем новую пару
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    this.usersService.update(userId, { hashedRefreshToken });
  }
}
