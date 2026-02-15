import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsPhoneNumber, IsString, Validate } from 'class-validator';
import { IsInnValidConstraint } from '../validators/inn.validator';

export class CreateContactDto {
  @ApiProperty({
    example: 'ООО Ромашка',
    description: 'Название организации',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '7701020304',
    description: 'ИНН (10 или 12 цифр)',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @Validate(IsInnValidConstraint)
  inn: string;

  @ApiProperty({
    example: '+79991234567',
    description: 'Номер телефона в международном формате',
  })
  @IsPhoneNumber('RU', { message: 'Некорректный российский номер телефона' })
  phone: string;

  @ApiProperty({
    example: 'Москва',
    description: 'Регион',
  })
  @IsString()
  region?: string;

  @ApiProperty({
    example: 'Белкин Дмитрий Павлович',
    description: 'Контакт',
  })
  @IsString()
  contact?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Электронная почта',
  })
  @IsString()
  email?: string;
}
