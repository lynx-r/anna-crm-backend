import { GetUser } from '@/auth/decorators/get-user.decorator';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateContactsBatchDto } from './dto/create-contacts-batch.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(createContactDto);
  }

  @Get()
  findAll(@GetUser() user: { userId: number }) {
    return this.contactsService.findAll(user.userId);
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
    @GetUser() user: { userId: number },
  ) {
    return this.contactsService.parseAndSave(file, user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: { userId: number }) {
    return this.contactsService.findOne(+id, user.userId);
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
