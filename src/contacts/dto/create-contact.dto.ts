import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  inn?: string;

  @IsString()
  region?: string;

  @IsString()
  contact?: string;

  @IsString()
  phone?: string;

  @IsEmail({}, { message: 'Некорректный формат email' })
  email: string;
}
