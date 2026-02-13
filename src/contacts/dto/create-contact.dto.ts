import { IsNotEmpty, IsPhoneNumber, IsString, Validate } from 'class-validator';
import { IsInnValidConstraint } from '../validator/inn.validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Validate(IsInnValidConstraint)
  inn: string;

  @IsString()
  region?: string;

  @IsString()
  contact?: string;

  @IsPhoneNumber('RU', { message: 'Некорректный российский номер телефона' })
  phone: string;

  @IsString()
  email?: string;
}
