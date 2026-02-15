import { Auth } from '@app/auth/decorators/auth.decorator';
import { GetUser } from '@app/auth/decorators/get-user.decorator';
import { UserDto } from '@app/users/dto/user.dto';
import { UserRole } from '@app/users/entities/user-role.enum';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { ContactPaginationDto } from './dto/contacts-pagination.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactsBatchDto } from './dto/create-contacts-batch.dto';
import { UUIDParamDto } from './dto/params.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contacts')
@Auth(UserRole.USER)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все контакты пользователя' })
  findAll(@GetUser() user: UserDto, @Query() query: ContactPaginationDto) {
    return this.contactsService.findAll(user.id, query);
  }

  @Post('batch')
  createMany(@Body() batchDto: CreateContactsBatchDto) {
    return this.contactsService.createMany(batchDto.contacts);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Загрузка контактов из CSV/Excel' })
  @ApiConsumes('multipart/form-data') // Указываем тип контента
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          // Название поля должно совпадать с FileInterceptor('file')
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, callback) => {
        if (!file.originalname.match(/\.(csv|xlsx|xls)$/)) {
          return callback(
            new BadRequestException('Только файлы CSV и Excel!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: UserDto,
  ) {
    return this.contactsService.parseAndSave(file, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить контакт по ID' })
  @ApiResponse({
    status: 200,
    description: 'Контакт успешно найден',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        companyName: 'ООО Ромашка',
        inn: '7701020304',
        phone: '+79991234567',
        userId: 1,
      },
    },
  })
  findOne(@Param() { id }: UUIDParamDto, @GetUser() user: UserDto) {
    return this.contactsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactsService.update(+id, updateContactDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contactsService.remove(+id);
  }
}
