import { UserRole } from '@app/users/entities/user-role.enum';

export class JwtPayloadDto {
  sub: number;

  email: string;

  role: UserRole;

  refreshToken: string;
}
