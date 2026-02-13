import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';

export class CreateContactsBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateContactDto)
  contacts: CreateContactDto[];
}
