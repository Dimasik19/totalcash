import { useMemo } from 'react';

type CurrencyCode = 'USD' | 'EUR' | 'CNY';

interface CurrencyRate {
  code: CurrencyCode;
  value: number;
}

interface ExchangeRatesWidgetProps {
  rates: CurrencyRate[];
  updatedAt: string;
  isLoading: boolean;
  hasError: boolean;
}

export default function ExchangeRatesWidget({ rates, updatedAt, isLoading, hasError }: ExchangeRatesWidgetProps) {

  const formattedUpdatedAt = useMemo(() => {
    if (!updatedAt) return '';
    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return '';
    const datePart = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    const timePart = new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
    return `${datePart} в ${timePart}`;
  }, [updatedAt]);

  const formattedRates = useMemo(
    () =>
      rates
        .map(rate => {
          const symbol = rate.code === 'USD' ? '$' : rate.code === 'EUR' ? '€' : '¥';
          const value = new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(rate.value);
          return `${symbol} - ${value}Р`;
        })
        .join('  ,  '),
    [rates]
  );

  return (
    <div className="exchange-rates" aria-live="polite">
      {isLoading && <p className="exchange-rates__line">Курсы валют: загружаем...</p>}
      {!isLoading && hasError && (
        <p className="exchange-rates__line exchange-rates__line--error">
          Курсы валют: не удалось получить данные
        </p>
      )}
      {!isLoading && !hasError && (
        <p className="exchange-rates__line">
          {formattedRates}
          {formattedUpdatedAt ? `  ,  обновлено ${formattedUpdatedAt}` : ''}
        </p>
      )}
    </div>
  );
}
