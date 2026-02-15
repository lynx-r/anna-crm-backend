import { UserDto } from '@app/users/dto/user.dto';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const { user } = ctx.switchToHttp().getRequest<{ user: UserDto }>();
    return user;
  },
);
