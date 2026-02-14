import { Transform } from 'class-transformer';
import { IsNotEmpty, IsPhoneNumber, IsString, Validate } from 'class-validator';
import { IsInnValidConstraint } from '../validator/inn.validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Validate(IsInnValidConstraint)
  inn: string;

  @IsPhoneNumber('RU', { message: 'Некорректный российский номер телефона' })
  phone: string;

  @IsString()
  region?: string;

  @IsString()
  contact?: string;

  @IsString()
  email?: string;
}
