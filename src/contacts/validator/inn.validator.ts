import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isInnValid', async: false })
export class IsInnValidConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') return false;
    const inn = value.trim();

    // Проверка на только цифры и длину
    if (!/^\d{10}$|^\d{12}$/.test(inn)) return false;

    const checkDigit = (inn: string, coefficients: number[]): number => {
      let n = 0;
      for (const [i, coeff] of coefficients.entries()) {
        n += coeff * parseInt(inn[i], 10);
      }
      return (n % 11) % 10;
    };

    // Весовые коэффициенты
    const n10 = [2, 4, 10, 3, 5, 9, 4, 6, 8];
    const n11 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
    const n12 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];

    if (inn.length === 10) {
      // Проверка 10-значного ИНН
      return parseInt(inn[9], 10) === checkDigit(inn, n10);
    } else if (inn.length === 12) {
      // Проверка 12-значного ИНН
      const d11 = checkDigit(inn, n11);
      const d12 = checkDigit(inn, n12);
      return parseInt(inn[10], 10) === d11 && parseInt(inn[11], 10) === d12;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    return `ИНН ${args.value} имеет неверную контрольную сумму`;
  }
}
