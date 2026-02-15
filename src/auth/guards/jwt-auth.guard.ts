import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // constructor(private reflector: Reflector) {
  //   super();
  // }
  // canActivate(context: ExecutionContext) {
  //   console.log('???');
  //   const canActivate = super.canActivate(context);
  //   console.log(canActivate);
  //   return canActivate;
  // }
  // handleRequest(err, user, info) {
  //   if (err || !user) {
  //     // info содержит причину (например, "TokenExpiredError" или "JsonWebTokenError")
  //     console.log('❌ JWT Error Info:', info?.message);
  //     throw err || new UnauthorizedException(info?.message || 'Invalid token');
  //   }
  //   return user;
  // }
}
