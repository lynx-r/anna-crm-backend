import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty({
    example: 'user@example.com',
    description: 'Электронная почта',
  })
  email: string;

  @IsStrongPassword()
  @ApiProperty({ example: 'passwordDD123!!', description: 'Сильный пароль' })
  password: string;
}
