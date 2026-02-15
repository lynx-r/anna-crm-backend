import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsPhoneNumber } from 'class-validator';

export function IsRussianPhone() {
  return applyDecorators(
    IsPhoneNumber('RU'),
    Transform(({ value }: { value: unknown }) => {
      if (typeof value !== 'string') {
        return value;
      }
      const digits = value.replace(/\D/g, '');
      if (
        digits.length === 11 &&
        (digits.startsWith('8') || digits.startsWith('7'))
      ) {
        return `+7${digits.substring(1)}`;
      }
      if (digits.length === 10) {
        return `+7${digits}`;
      }
      return value;
    }),
  );
}
