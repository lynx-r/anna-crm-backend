import { GetUser } from '@app/auth/decorators/get-user.decorator';
import { UserDto } from '@app/users/dto/user.dto';
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
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { ContactPaginationDto } from './dto/contacts-pagination.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactsBatchDto } from './dto/create-contacts-batch.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contacts')
@ApiBearerAuth('access_token')
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
  findOne(@Param('id') id: string, @GetUser() user: UserDto) {
    return this.contactsService.findOne(+id, user.id);
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
