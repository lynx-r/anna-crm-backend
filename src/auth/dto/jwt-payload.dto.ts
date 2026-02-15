import { UserRole } from '@app/users/entities/user-role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class JwtPayloadDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Уникальный идентификатор (UUID v4)',
  })
  @IsUUID(4)
  sub: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Электронная почта',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    enum: UserRole,
    description: 'Роль пользователя',
    example: UserRole.USER,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
