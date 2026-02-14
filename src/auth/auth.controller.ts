import { CreateUserDto } from '@app/users/dto/create-user.dto';
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.metadata';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  // // @Public()
  // @Post('logout')
  // async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  //   // 1. Удаляем Refresh Token из базы (если используете их)
  //   await this.authService.removeRefreshToken(req.user.userId);

  //   // 2. Очищаем Cookie на клиенте
  //   res.clearCookie('refreshToken');

  //   return { message: 'Logged out successfully' };
  // }

  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }
}
