import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class UserDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsEmail()
  email: string;

  @IsString()
  role: UserRole;

  @IsString()
  refreshToken?: string;
}
