export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAssetCurrency(amount: number, currency: 'RUB' | 'USD' | 'EUR' | 'CNY'): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function formatMonthYear(value?: string): string {
  if (!value) return '';

  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;

  const [, year, month] = match;
  return `${month}.${year}`;
}

export function formatPercentChange(current: number, base?: number): string {
  if (!base || base <= 0) return '';

  const percent = ((current - base) / base) * 100;
  const rounded = Math.round(percent * 10) / 10;
  const sign = rounded > 0 ? '+' : '';

  return `${sign}${rounded.toFixed(1)}%`;
}

export function formatPercentage(value?: number): string {
  if (value === undefined || Number.isNaN(value)) return '';

  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toFixed(1)}%`;
}
