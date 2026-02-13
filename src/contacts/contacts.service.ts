import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';

const CONTACT_REGEX_MAP: Record<keyof CreateContactDto, RegExp> = {
  name: /^(фио|имя|победитель)$/i,
  inn: /^(инн.*)$/i,
  region: /^(регион.*)$/i,
  contact: /^(контакт.*)$/i,
  phone: /^(телефон.*)$/i,
  email: /^(email|e-mail|почта|электронная\s*почта|эл\.\s+почта)$/i,
};

@Injectable()
export class ContactsService {
  constructor(
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
    const rawData: CreateContactDto[] = await this.extractData(file);

    const contactsToSave: CreateContactDto[] = [];
    const errors: { row: number; details: string | ValidationError[] }[] = [];
    const seenNames = new Set<string>();
    const seenPhones = new Set<string>();
    const seenInns = new Set<string>();

    for (const [index, item] of rawData.entries()) {
      const normalizedItem = this.mapRawData(item);
      // Если после маппинга объект пустой — скипаем
      if (Object.keys(normalizedItem).length === 0) {
        continue;
      }
      // 1. Превращаем plain object в экземпляр класса DTO
      const dto = plainToInstance(CreateContactDto, normalizedItem);

      // 2. Валидация (class-validator)
      const validationErrors = await validate(dto);
      if (validationErrors.length > 0) {
        errors.push({ row: index + 2, details: validationErrors });
        continue; // Пропускаем плохую запись
      }

      // 3. Проверка на дубликаты внутри файла
      if (seenNames.has(dto.name)) {
        errors.push({
          row: index + 2,
          details: `Дубликат названия компании в файле: ${dto.name}`,
        });
        continue;
      }
      seenNames.add(dto.name);
      // 3. Проверка на дубликаты внутри файла
      if (seenPhones.has(dto.phone)) {
        errors.push({
          row: index + 2,
          details: `Дубликат телефона в файле: ${dto.phone}`,
        });
        continue;
      }
      seenPhones.add(dto.phone);
      // 3. Проверка на дубликаты внутри файла
      if (seenInns.has(dto.inn)) {
        errors.push({
          row: index + 2,
          details: `Дубликат ИНН в файле: ${dto.inn}`,
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
        .into('contact')
        .values(contactsToSave)
        .orIgnore() // Не упадет, если такой email уже есть в базе (для Postgres/MySQL)
        .execute();
    }

    return {
      imported: contactsToSave.length,
      failed: errors.length,
      errors: errors, // Список ошибок для фронтенда
    };
  }

  private mapRawData(rawItem: Record<string, any>): Partial<CreateContactDto> {
    const mapped: Partial<CreateContactDto> = {};

    // Перебираем все ключи (заголовки) из текущей строки файла
    for (const fileKey of Object.keys(rawItem)) {
      const trimmedKey = fileKey.trim();

      // Ищем, к какому полю из нашей схемы подходит этот заголовок
      for (const [targetField, regex] of Object.entries(CONTACT_REGEX_MAP)) {
        if (regex.test(trimmedKey)) {
          // 2. Берем значение по ключу ИЗ ФАЙЛА (fileKey)
          const rawValue: unknown = rawItem[fileKey];

          // 3. Приводим targetField к типу ключа CreateContactDto
          const field = targetField as keyof CreateContactDto;

          // 3. Безопасно обрабатываем значение
          if (typeof rawValue === 'string') {
            // Присваиваем очищенную строку (используем as any только для конечного маппинга в Partial)
            mapped[field] = rawValue.trim();
          } else if (rawValue !== null && rawValue !== undefined) {
            // Если значение не строка, преобразуем в строку или оставляем как есть
            (mapped[field] as unknown) = rawValue;
          }
          break; // Нашли соответствие, переходим к следующему заголовку
        }
      }
    }

    return mapped;
  }

  private async extractData(file: Express.Multer.File) {
    let rawData: CreateContactDto[] = [];

    if (file.mimetype === 'text/csv') {
      rawData = await this.parseCsv(file.buffer);
    } else if (
      file.mimetype.includes('spreadsheet') ||
      file.originalname.endsWith('.xlsx')
    ) {
      rawData = this.parseExcel(file.buffer);
    }
    return rawData;
  }

  private parseCsv(buffer: Buffer): Promise<CreateContactDto[]> {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      const stream = Readable.from(buffer);
      stream
        .pipe(csv())
        .on('data', (data: Record<string, string>) => {
          // Проверяем, есть ли в строке хотя бы одно непустое значение
          const hasValues = Object.values(data).some(
            (value) => value && value.trim() !== '',
          );
          if (hasValues) {
            results.push(data);
          }
        })
        .on('error', (err: unknown) => {
          const errorToReject =
            err instanceof Error ? err : new Error(String(err));
          reject(errorToReject);
        })
        .on('end', () => resolve(results));
    });
  }

  private parseExcel(buffer: Buffer): CreateContactDto[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // sheet_to_json по умолчанию может возвращать пустые объекты
    const rawData = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
    });

    return (rawData as CreateContactDto[]).filter((row) =>
      Object.values(row).some((value) => {
        // 1. Пропускаем null и undefined
        if (value === null || value === undefined) return false;

        // 2. Если это строка, проверяем на пустоту после trim
        if (typeof value === 'string') return value.trim() !== '';

        // 3. Если это число или булево значение, считаем строку не пустой
        if (typeof value === 'number' || typeof value === 'boolean')
          return true;

        // 4. Для остальных типов (объекты/массивы) возвращаем false,
        // чтобы избежать [object Object]
        return false;
      }),
    );
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
