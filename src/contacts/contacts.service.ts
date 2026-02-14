import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Repository } from 'typeorm';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';
import { ParseService } from './parse.service';

@Injectable()
export class ContactsService {
  constructor(
    @Inject(ParseService) private parseService: ParseService,
    @InjectRepository(Contact) private contactsRepository: Repository<Contact>,
  ) {}

  create(createContactDto: CreateContactDto) {
    const newContact = this.contactsRepository.create(createContactDto);
    return this.contactsRepository.save(newContact);
  }

  findAll() {
    return this.contactsRepository.find();
  }

  createMany(createContactsDto: CreateContactDto[]) {
    return this.contactsRepository.insert(createContactsDto);
  }

  async parseAndSave(file: Express.Multer.File) {
    const rawData: CreateContactDto[] =
      await this.parseService.extractData(file);

    const contactsToSave: CreateContactDto[] = [];
    const report = {
      total: rawData.length,
      success: 0,
      failed: 0,
      errors: [] as { row: number; name?: string; messages: string[] }[],
    };
    const seenNames = new Set<string>();
    const seenPhones = new Set<string>();
    const seenInns = new Set<string>();

    for (const [index, item] of rawData.entries()) {
      const rowNumber = index + 2;

      const normalizedItem = this.parseService.mapRawData(item);
      // Если после маппинга объект пустой — скипаем
      if (Object.keys(normalizedItem).length === 0) {
        continue;
      }
      // 1. Превращаем plain object в экземпляр класса DTO
      const dto = plainToInstance(CreateContactDto, normalizedItem);

      // 2. Валидация (class-validator)
      const validationErrors = await validate(dto);
      if (validationErrors.length > 0) {
        report.failed++;
        report.errors.push({
          row: rowNumber,
          name: dto.name, // Чтобы легче было найти строку в файле
          messages: validationErrors.flatMap((err) =>
            Object.values(
              err.constraints || { error: 'Unknown validation error' },
            ),
          ),
        });
        continue;
      }

      // 3. Проверка на дубликаты внутри файла
      if (seenNames.has(dto.name)) {
        report.errors.push({
          row: index + 2,
          messages: [`Дубликат названия компании в файле: ${dto.name}`],
        });
        continue;
      }
      seenNames.add(dto.name);
      // 3. Проверка на дубликаты внутри файла
      if (seenPhones.has(dto.phone)) {
        report.errors.push({
          row: index + 2,
          messages: [`Дубликат телефона в файле: ${dto.phone}`],
        });
        continue;
      }
      seenPhones.add(dto.phone);
      // 3. Проверка на дубликаты внутри файла
      if (seenInns.has(dto.inn)) {
        report.errors.push({
          row: index + 2,
          messages: [`Дубликат ИНН в файле: ${dto.inn}`],
        });
        continue;
      }
      seenInns.add(dto.inn);
      contactsToSave.push(dto);
    }

    // 4. Массовое сохранение (с игнорированием дублей, которые уже есть в БД)
    if (contactsToSave.length > 0) {
      await this.contactsRepository
        .createQueryBuilder()
        .insert()
        .into(Contact)
        .values(contactsToSave)
        .orUpdate(['region', 'contact', 'email'], ['name', 'inn', 'phone']) // Не упадет, если такой email уже есть в базе (для Postgres/MySQL)
        .execute();
    }

    return report;
  }

  findOne(id: number) {
    return this.contactsRepository.findOneBy({ id });
  }

  update(id: number, updateContactDto: UpdateContactDto) {
    return this.contactsRepository.update(id, updateContactDto);
  }

  remove(id: number) {
    return `This action removes a #${id} contact`;
  }
}
