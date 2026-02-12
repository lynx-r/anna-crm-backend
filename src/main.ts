import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Удаляет поля, которых нет в DTO
      forbidNonWhitelisted: true, // Выдает ошибку, если есть лишние поля
      transform: true, // Автоматически преобразует типы (например, строку в число)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
