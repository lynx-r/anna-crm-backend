import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { ContactPaginationDto } from './dto/contacts-pagination.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { Contact } from './entities/contact.entity';
import { ParseService } from './parse.service';

@Injectable()
export class ContactsService {
  constructor(
    private parseService: ParseService,
    @InjectRepository(Contact) private contactsRepository: Repository<Contact>,
  ) {}

  create(createContactDto: CreateContactDto) {
    const newContact = this.contactsRepository.create(createContactDto);
    return this.contactsRepository.save(newContact);
  }

  async findAll(userId: string, query: ContactPaginationDto) {
    const { page = 1, limit = 100, search } = query;
    const skip = (page - 1) * limit;

    let whereCondition:
      | FindOptionsWhere<Contact>
      | FindOptionsWhere<Contact>[] = { userId };

    if (search) {
      const searchPattern = `%${search}%`;
      whereCondition = [
        { userId, name: ILike(searchPattern) },
        { userId, inn: ILike(searchPattern) },
        { userId, phone: ILike(searchPattern) },
      ];
    }

    const [data, total] = await this.contactsRepository.findAndCount({
      where: whereCondition,
      take: limit,
      skip: skip,
      order: { id: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  createMany(createContactsDto: CreateContactDto[]) {
    return this.contactsRepository.insert(createContactsDto);
  }

  async parseAndSave(file: Express.Multer.File, userId: string) {
    const rawData: CreateContactDto[] =
      await this.parseService.extractData(file);

    const contactsToSave: CreateContactDto[] = [];
    const report = {
      total: rawData.length,
      success: 0,
      failed: 0,
      errors: [] as { row: number; name?: string; messages: string[] }[],
    };
    const seenNameInnPhone = new Set<string>();

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
      const nameInnPhone = `${dto.name.toUpperCase()}::${dto.inn}::${dto.phone}`;
      if (seenNameInnPhone.has(nameInnPhone)) {
        report.errors.push({
          row: index + 2,
          messages: [`Дубликат в файле по Имя::ИНН::Телефон: ${nameInnPhone}`],
        });
        continue;
      }
      seenNameInnPhone.add(nameInnPhone);

      const contactEntity = {
        ...dto,
        userId: userId, // Связываем с текущим юзером
      };
      contactsToSave.push(contactEntity);
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

  async findOne(id: string, userId: string) {
    const contact = await this.contactsRepository.findOne({
      where: { id, userId },
    });

    if (!contact) {
      throw new NotFoundException(
        `Контакт с ID ${id} не найден или доступ запрещен`,
      );
    }
    return contact;
  }

  update(id: number, updateContactDto: UpdateContactDto) {
    return this.contactsRepository.update(id, updateContactDto);
  }

  remove(id: number) {
    return `This action removes a #${id} contact`;
  }
}
