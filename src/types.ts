export interface IncomeEntry {
  id: string;
  name: string;
  amount: number;
  comment: string;
}

export interface ExpenseEntry {
  id: string;
  name: string;
  amount: number;
  comment: string;
}

export type AssetType =
  | 'Недвижимость'
  | 'Автомобиль'
  | 'Банковский счет'
  | 'Наличные'
  | 'Инвестиции'
  | 'Криптовалюта'
  | 'Бизнес'
  | 'Другое';

export type AssetCurrency = 'RUB' | 'USD' | 'EUR' | 'CNY';

export interface AssetEntry {
  id: string;
  type: AssetType;
  name: string;
  amount: number;
  currency?: AssetCurrency;
  comment: string;
  acquiredAt?: string;
  acquisitionCost?: number;
  rate?: number;
}

export type LiabilityType =
  | 'Ипотека'
  | 'Потребительский кредит'
  | 'Автокредит'
  | 'Кредитная карта'
  | 'Долг физлицу'
  | 'Прочее';

export interface LiabilityEntry {
  id: string;
  type: LiabilityType;
  name: string;
  amount: number;
  comment: string;
  rate: number;
}

export interface AppData {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  assets: AssetEntry[];
  liabilities: LiabilityEntry[];
}
