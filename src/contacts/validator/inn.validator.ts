import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isInnValid', async: false })
export class IsInnValidConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (typeof value !== 'string') return false;

    // Алгоритм проверки контрольной суммы ИНН (упрощенно для примера)
    const inn = value.trim();
    if (!/^\d{10}$|^\d{12}$/.test(inn)) return false;

    // Здесь обычно идет математический расчет весов (контрольных сумм)
    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `Введен некорректный ИНН: ${args.value}`;
  }
}
