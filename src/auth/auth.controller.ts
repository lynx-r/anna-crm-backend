import { JwtPayloadDto } from '@app/auth/dto/jwt-payload.dto';
import { CreateUserDto } from '@app/users/dto/create-user.dto';
import { UserDto } from '@app/users/dto/user.dto';
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
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.metadata';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
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
    );
    await this.authService.updateRefreshToken(user.id, refresh_token);

    res.cookie('refreshToken', refresh_token, {
      httpOnly: true,
      secure: true, // true для https
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    return { access_token };
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  async refresh(
    @GetUser() user: JwtPayloadDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(
      user.sub,
      user.refreshToken,
    );

    res.cookie('refreshToken', tokens.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { access_token: tokens.access_token };
  }

  // // @Public()
  @Post('logout')
  async logout(
    @GetUser() user: UserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.usersService.update(user.id, { hashedRefreshToken: null });
    res.clearCookie('refreshToken');
  }

  @Get('me')
  getMe(@Req() req: Request) {
    return req.user;
  }
}
