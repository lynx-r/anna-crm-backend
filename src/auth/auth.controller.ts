import { CreateUserDto } from '@/users/dto/create-user.dto';
import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/get-user.decorator';
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
  // @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@GetUser() user: { userId: number }) {
    return this.authService.login(user);
  }

  @Public()
  // @UseGuards(LocalAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    return req.logout();
  }

  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }
}
