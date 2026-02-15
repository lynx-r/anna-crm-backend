import { CreateUserDto } from '@app/users/dto/create-user.dto';
import { UserDto } from '@app/users/dto/user.dto';
import { UserRole } from '@app/users/entities/user-role.enum';
import { UsersService } from '@app/users/users.service';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  // @Public()
  @Post('register')
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  // @Public()
  @Post('login')
  @ApiOperation({ summary: 'Авторизация и получение токенов' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException();
    }

    const { access_token, refresh_token } = await this.authService.getTokens(
      user.id,
      user.email,
      user.role,
    );
    await this.authService.updateRefreshToken(user.id, refresh_token);

    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      // Если НЕ продакшн, разрешаем передачу по http (secure: false)
      secure: isProduction,
      // На локалхосте 'lax' позволяет Swagger подхватывать куку лучше
      sameSite: isProduction ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    return { access_token };
  }

  // @Public()
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiOperation({ summary: 'Обновление access_token токенов' })
  async refresh(
    @GetUser() user: JwtPayloadDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.authService.refreshTokens(user.sub, user.refreshToken);

    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token };
  }

  // // @Public()
  @Post('logout')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Выход' })
  async logout(
    @GetUser() user: UserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.usersService.update(user.id, { hashedRefreshToken: null });
    res.clearCookie('refreshToken');
  }

  @Get('me')
  @Auth(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Профиль пользователя' })
  getMe(@Req() req: Request) {
    return req.user;
  }
}
