import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ParseService {
  private contactRegexMap: Record<keyof CreateContactDto, RegExp>;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.loadMappingConfig();
  }

  private loadMappingConfig() {
    // Читаем путь к конфигу из .env или берем дефолтный
    const configPath =
      this.configService.get<string>('MAPPING_CONFIG_PATH') ||
      'mapping.config.json';
    const absolutePath = path.resolve(process.cwd(), configPath);

    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    const rawConfig = JSON.parse(fileContent) as Record<string, string>;

    // Преобразуем строки в объекты RegExp
    const map: Record<keyof CreateContactDto, RegExp> = {} as Record<
      keyof CreateContactDto,
      RegExp
    >;
    for (const [key, pattern] of Object.entries(rawConfig)) {
      map[key] = new RegExp(pattern, 'i');
    }

    this.contactRegexMap = map;
  }

  public mapRawData(rawItem: Record<string, any>): Partial<CreateContactDto> {
    const mapped: Partial<CreateContactDto> = {};

    // Перебираем все ключи (заголовки) из текущей строки файла
    for (const fileKey of Object.keys(rawItem)) {
      const trimmedKey = fileKey.trim();

      // Ищем, к какому полю из нашей схемы подходит этот заголовок
      for (const [targetField, regex] of Object.entries(this.contactRegexMap)) {
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

  public async extractData(file: Express.Multer.File) {
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
}
