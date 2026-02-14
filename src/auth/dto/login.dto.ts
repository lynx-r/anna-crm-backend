import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'user@example.com',
    description: 'Электронная почта',
  })
  email: string;

  @IsStrongPassword()
  @ApiProperty({ example: 'passwordDD123!!', description: 'Сильный пароль' })
  password: string;
}
