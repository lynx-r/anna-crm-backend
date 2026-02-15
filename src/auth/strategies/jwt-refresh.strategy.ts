import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      // Извлекаем токен из куки
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => (req?.cookies?.refreshToken as string) || null,
      ]),
      secretOrKey:
        config.get<string>('JWT_REFRESH_SECRET') || 'jwt_refresh_secret',
      passReqToCallback: true, // Позволяет получить объект req в методе validate
    });
  }

  validate(req: Request, payload: JwtPayloadDto) {
    const refreshToken = (req.cookies?.refreshToken as string) || undefined;
    if (!refreshToken) {
      throw new ForbiddenException('Refresh token missing');
    }

    // Возвращаем данные пользователя и сам токен для дальнейшей проверки в БД
    return { ...payload, refreshToken };
  }
}
