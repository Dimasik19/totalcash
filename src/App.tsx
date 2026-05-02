import { useState, useEffect } from 'react';
import { AppData, IncomeEntry, ExpenseEntry, AssetEntry, LiabilityEntry, AssetCurrency } from './types';
import { formatAssetCurrency, formatMonthYear, formatPercentChange, formatPercentage, generateId } from './utils';
import Header from './components/Header';
import SectionCard from './components/SectionCard';
import ItemCard from './components/ItemCard';
import EntryModal, { ASSET_TYPES, LIABILITY_TYPES } from './components/EntryModal';
import { MonthlySummary, CapitalSummary, CapitalHistoryChart } from './components/SummaryPanel';
import ExchangeRatesWidget from './components/ExchangeRatesWidget';
import PreviewModal from './components/PreviewModal';

const STORAGE_KEY = 'total_cash_data';
const CAPITAL_HISTORY_STORAGE_KEY = 'total_cash_capital_history';

const defaultData: AppData = {
  incomes: [
    {
      id: 'demo-income-salary',
      name: 'Основная работа',
      amount: 185000,
      comment: 'Зарплата после налогов',
    },
    {
      id: 'demo-income-freelance',
      name: 'Проектная работа',
      amount: 45000,
      comment: 'Средний доход по разовым задачам',
    },
    {
      id: 'demo-income-investments',
      name: 'Дивиденды',
      amount: 12000,
      comment: 'Среднемесячные выплаты по портфелю',
    },
  ],
  expenses: [
    {
      id: 'demo-expense-rent',
      name: 'Аренда квартиры',
      amount: 65000,
      comment: 'Ежемесячный платеж за жилье',
    },
    {
      id: 'demo-expense-food',
      name: 'Продукты и кафе',
      amount: 42000,
      comment: 'Питание дома и вне дома',
    },
    {
      id: 'demo-expense-transport',
      name: 'Транспорт',
      amount: 14000,
      comment: 'Такси, каршеринг и общественный транспорт',
    },
  ],
  assets: [
    {
      id: 'demo-asset-apartment',
      type: 'Недвижимость',
      name: 'Квартира',
      amount: 9200000,
      currency: 'RUB',
      comment: 'Оценочная рыночная стоимость',
      acquiredAt: '2022-08',
      acquisitionCost: 7600000,
    },
    {
      id: 'demo-asset-brokerage',
      type: 'Инвестиции',
      name: 'Брокерский счет',
      amount: 1450000,
      currency: 'RUB',
      comment: 'Акции, облигации и фонды',
      rate: 13,
    },
    {
      id: 'demo-asset-cash',
      type: 'Наличные',
      name: 'Резервный фонд',
      amount: 580000,
      currency: 'RUB',
      comment: 'Подушка безопасности на несколько месяцев',
    },
  ],
  liabilities: [
    {
      id: 'demo-liability-mortgage',
      type: 'Ипотека',
      name: 'Остаток ипотеки',
      amount: 4100000,
      comment: 'Аннуитетный платеж до 2038 года',
      rate: 8.4,
    },
    {
      id: 'demo-liability-card',
      type: 'Кредитная карта',
      name: 'Кредитная карта',
      amount: 85000,
      comment: 'Текущий долг в льготном периоде',
      rate: 0,
    },
    {
      id: 'demo-liability-auto',
      type: 'Автокредит',
      name: 'Автокредит',
      amount: 720000,
      comment: 'Остаток по кредиту за автомобиль',
      rate: 11.9,
    },
  ],
};

const ASSET_TYPES_WITH_ACQUISITION_DATE: AssetEntry['type'][] = ['Недвижимость', 'Автомобиль', 'Бизнес'];
const ASSET_TYPES_WITH_ACQUISITION_COST: AssetEntry['type'][] = ['Недвижимость', 'Автомобиль'];
const ASSET_TYPES_WITH_RATE: AssetEntry['type'][] = ['Инвестиции', 'Банковский счет', 'Криптовалюта'];
const ASSET_TYPES_WITH_CURRENCY: AssetEntry['type'][] = ['Банковский счет', 'Наличные', 'Инвестиции', 'Криптовалюта'];
const ASSET_CURRENCIES: AssetCurrency[] = ['RUB', 'USD', 'EUR', 'CNY'];
const CBR_API_URL = 'https://www.cbr-xml-daily.ru/daily_json.js';

interface ExchangeRatesState {
  USD: number;
  EUR: number;
  CNY: number;
}

interface CbrResponse {
  Date: string;
  Valute: Record<'USD' | 'EUR' | 'CNY', { Value: number }>;
}

function assetNeedsAcquisitionDate(type: AssetEntry['type']): boolean {
  return ASSET_TYPES_WITH_ACQUISITION_DATE.includes(type);
}

function assetNeedsAcquisitionCost(type: AssetEntry['type']): boolean {
  return ASSET_TYPES_WITH_ACQUISITION_COST.includes(type);
}

function assetNeedsRate(type: AssetEntry['type']): boolean {
  return ASSET_TYPES_WITH_RATE.includes(type);
}

function assetNeedsCurrency(type: AssetEntry['type']): boolean {
  return ASSET_TYPES_WITH_CURRENCY.includes(type);
}

function getAssetCurrency(entry: AssetEntry): AssetCurrency {
  return assetNeedsCurrency(entry.type) ? entry.currency ?? 'RUB' : 'RUB';
}

function convertToRub(amount: number, currency: AssetCurrency, rates: ExchangeRatesState): number {
  if (currency === 'RUB') return amount;
  return amount * rates[currency];
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppData;
  } catch {}
  return defaultData;
}

function loadCapitalHistoryOverrides(): { amounts: Record<number, number>; growthRates: Record<number, number> } {
  try {
    const raw = localStorage.getItem(CAPITAL_HISTORY_STORAGE_KEY);
    if (!raw) return { amounts: {}, growthRates: {} };

    const parsed = JSON.parse(raw) as
      | Record<string, number>
      | { amounts?: Record<string, number>; growthRates?: Record<string, number> };

    if ('amounts' in parsed || 'growthRates' in parsed) {
      const amounts = Object.fromEntries(
        Object.entries(parsed.amounts ?? {})
          .filter(([, value]) => typeof value === 'number' && !Number.isNaN(value))
          .map(([year, value]) => [Number(year), value])
      );
      const growthRates = Object.fromEntries(
        Object.entries(parsed.growthRates ?? {})
          .filter(([, value]) => typeof value === 'number' && !Number.isNaN(value))
          .map(([year, value]) => [Number(year), value])
      );
      return { amounts, growthRates };
    }

    const amounts = Object.fromEntries(
      Object.entries(parsed)
        .filter(([, value]) => typeof value === 'number' && !Number.isNaN(value))
        .map(([year, value]) => [Number(year), value])
    );
    return { amounts, growthRates: {} };
  } catch {
    return { amounts: {}, growthRates: {} };
  }
}

type ModalState =
  | { type: 'income'; entry?: IncomeEntry }
  | { type: 'expense'; entry?: ExpenseEntry }
  | { type: 'asset'; entry?: AssetEntry }
  | { type: 'liability'; entry?: LiabilityEntry }
  | null;

type CapitalChartModalState = {
  year: number;
  value: number;
  mode: 'amount' | 'growth';
} | null;

type PreviewModalState = {
  title: string;
  name: string;
  amount: number;
  amountMeta?: string;
  secondaryAmountMeta?: string;
  label?: string;
  secondaryLabel?: string;
  comment?: string;
  accent: 'income' | 'expense' | 'asset' | 'liability';
} | null;

export default function App() {
  const [data, setData] = useState<AppData>(loadData);
  const [modal, setModal] = useState<ModalState>(null);
  const [capitalHistoryOverrides, setCapitalHistoryOverrides] = useState(loadCapitalHistoryOverrides);
  const [capitalChartModal, setCapitalChartModal] = useState<CapitalChartModalState>(null);
  const [previewModal, setPreviewModal] = useState<PreviewModalState>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesState>({ USD: 0, EUR: 0, CNY: 0 });
  const [exchangeRatesUpdatedAt, setExchangeRatesUpdatedAt] = useState('');
  const [exchangeRatesLoading, setExchangeRatesLoading] = useState(true);
  const [exchangeRatesError, setExchangeRatesError] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(CAPITAL_HISTORY_STORAGE_KEY, JSON.stringify(capitalHistoryOverrides));
  }, [capitalHistoryOverrides]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadRates() {
      try {
        setExchangeRatesError(false);
        const response = await fetch(CBR_API_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json() as CbrResponse;
        if (controller.signal.aborted) return;

        setExchangeRates({
          USD: payload.Valute.USD.Value,
          EUR: payload.Valute.EUR.Value,
          CNY: payload.Valute.CNY.Value,
        });
        setExchangeRatesUpdatedAt(payload.Date);
      } catch {
        if (!controller.signal.aborted) {
          setExchangeRatesError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setExchangeRatesLoading(false);
        }
      }
    }

    loadRates();
    return () => controller.abort();
  }, []);

  const totalIncome = data.incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = data.expenses.reduce((s, i) => s + i.amount, 0);
  const sortedIncomes = [...data.incomes].sort((a, b) => b.amount - a.amount);
  const sortedExpenses = [...data.expenses].sort((a, b) => b.amount - a.amount);
  const sortedAssets = [...data.assets].sort((a, b) => {
    const amountA = convertToRub(a.amount, getAssetCurrency(a), exchangeRates);
    const amountB = convertToRub(b.amount, getAssetCurrency(b), exchangeRates);
    return amountB - amountA;
  });
  const sortedLiabilities = [...data.liabilities].sort((a, b) => b.amount - a.amount);
  const totalAssets = data.assets.reduce((sum, asset) => {
    const currency = getAssetCurrency(asset);
    return sum + convertToRub(asset.amount, currency, exchangeRates);
  }, 0);
  const totalLiabilities = data.liabilities.reduce((s, i) => s + i.amount, 0);
  const netCapital = totalAssets - totalLiabilities;
  const liabilitiesWithRate = data.liabilities.filter(item =>
    typeof item.rate === 'number' && !Number.isNaN(item.rate) && item.amount > 0
  );
  const weightedLiabilityAmount = liabilitiesWithRate.reduce((sum, item) => sum + item.amount, 0);
  const averageLiabilityRate = weightedLiabilityAmount > 0
    ? liabilitiesWithRate.reduce((sum, item) => sum + item.rate * item.amount, 0) / weightedLiabilityAmount
    : undefined;
  const currentYear = new Date().getFullYear();
  const chartCapitalBase = netCapital > 0 ? netCapital : 3200000;
  const capitalHistoryPast = [
    { year: currentYear - 4, amount: capitalHistoryOverrides.amounts[currentYear - 4] ?? Math.round(chartCapitalBase * 0.46), isFuture: false, editable: true },
    { year: currentYear - 3, amount: capitalHistoryOverrides.amounts[currentYear - 3] ?? Math.round(chartCapitalBase * 0.61), isFuture: false, editable: true },
    { year: currentYear - 2, amount: capitalHistoryOverrides.amounts[currentYear - 2] ?? Math.round(chartCapitalBase * 0.74), isFuture: false, editable: true },
    { year: currentYear - 1, amount: capitalHistoryOverrides.amounts[currentYear - 1] ?? Math.round(chartCapitalBase * 0.88), isFuture: false, editable: true },
    { year: currentYear, amount: netCapital, isFuture: false, editable: false },
  ];
  const defaultFutureGrowthRates: Record<number, number> = {
    [currentYear + 1]: 14,
    [currentYear + 2]: 12,
    [currentYear + 3]: 10,
    [currentYear + 4]: 9,
    [currentYear + 5]: 8,
  };
  const capitalHistoryFutureYears = [currentYear + 1, currentYear + 2, currentYear + 3, currentYear + 4, currentYear + 5];
  const capitalHistoryFuture = capitalHistoryFutureYears.reduce<Array<{ year: number; amount: number; isFuture: boolean; editable: boolean; growthRate: number }>>((acc, year) => {
    const previousAmount = acc.length > 0 ? acc[acc.length - 1].amount : netCapital;
    const growthRate = capitalHistoryOverrides.growthRates[year] ?? defaultFutureGrowthRates[year];
    const amount = Math.round(previousAmount * (1 + growthRate / 100));
    acc.push({ year, amount, isFuture: true, editable: true, growthRate });
    return acc;
  }, []);
  const capitalHistory = [...capitalHistoryPast, ...capitalHistoryFuture].map((point, index, allPoints) => {
    if (index === 0) return point;

    const prevAmount = allPoints[index - 1].amount;
    const growthRate = prevAmount > 0 ? ((point.amount - prevAmount) / prevAmount) * 100 : undefined;

    return { ...point, growthRate };
  });

  const handleCapitalHistoryPointClick = (point: { year: number; amount: number; editable?: boolean; isFuture: boolean; growthRate?: number }) => {
    if (!point.editable) return;
    setCapitalChartModal({
      year: point.year,
      value: point.isFuture ? point.growthRate ?? 0 : point.amount,
      mode: point.isFuture ? 'growth' : 'amount',
    });
  };

  const handleSaveCapitalHistoryPoint = (vals: Record<string, string | number>) => {
    if (!capitalChartModal) return;

    if (capitalChartModal.mode === 'growth') {
      setCapitalHistoryOverrides(current => ({
        ...current,
        growthRates: {
          ...current.growthRates,
          [capitalChartModal.year]: Number(vals.value),
        },
      }));
    } else {
      setCapitalHistoryOverrides(current => ({
        ...current,
        amounts: {
          ...current.amounts,
          [capitalChartModal.year]: Math.round(Number(vals.value)),
        },
      }));
    }
    setCapitalChartModal(null);
  };

  // INCOME
  const handleSaveIncome = (vals: Record<string, string | number>) => {
    if (modal?.type !== 'income') return;
    const entry = modal.entry;
    if (entry) {
      setData(d => ({ ...d, incomes: d.incomes.map(i => i.id === entry.id ? { ...i, name: String(vals.name), amount: Number(vals.amount), comment: String(vals.comment) } : i) }));
    } else {
      setData(d => ({ ...d, incomes: [...d.incomes, { id: generateId(), name: String(vals.name), amount: Number(vals.amount), comment: String(vals.comment) }] }));
    }
    setModal(null);
  };

  // EXPENSE
  const handleSaveExpense = (vals: Record<string, string | number>) => {
    if (modal?.type !== 'expense') return;
    const entry = modal.entry;
    if (entry) {
      setData(d => ({ ...d, expenses: d.expenses.map(i => i.id === entry.id ? { ...i, name: String(vals.name), amount: Number(vals.amount), comment: String(vals.comment) } : i) }));
    } else {
      setData(d => ({ ...d, expenses: [...d.expenses, { id: generateId(), name: String(vals.name), amount: Number(vals.amount), comment: String(vals.comment) }] }));
    }
    setModal(null);
  };

  // ASSET
  const handleSaveAsset = (vals: Record<string, string | number>) => {
    if (modal?.type !== 'asset') return;
    const entry = modal.entry;
    const type = vals.type as AssetEntry['type'];
    const acquiredAt = assetNeedsAcquisitionDate(type) ? String(vals.acquiredAt ?? '') : '';
    const acquisitionCost = assetNeedsAcquisitionCost(type) ? Number(vals.acquisitionCost) : undefined;
    const rate = assetNeedsRate(type) ? Number(vals.rate) : undefined;
    const currency = assetNeedsCurrency(type) ? vals.currency as AssetCurrency : 'RUB';

    if (entry) {
      setData(d => ({ ...d, assets: d.assets.map(i => i.id === entry.id ? { ...i, type, name: String(vals.name), amount: Number(vals.amount), currency, comment: String(vals.comment), acquiredAt, acquisitionCost, rate } : i) }));
    } else {
      setData(d => ({ ...d, assets: [...d.assets, { id: generateId(), type, name: String(vals.name), amount: Number(vals.amount), currency, comment: String(vals.comment), acquiredAt, acquisitionCost, rate }] }));
    }
    setModal(null);
  };

  // LIABILITY
  const handleSaveLiability = (vals: Record<string, string | number>) => {
    if (modal?.type !== 'liability') return;
    const entry = modal.entry;
    if (entry) {
      setData(d => ({ ...d, liabilities: d.liabilities.map(i => i.id === entry.id ? { ...i, type: vals.type as LiabilityEntry['type'], name: String(vals.name), amount: Number(vals.amount), comment: String(vals.comment), rate: Number(vals.rate) } : i) }));
    } else {
      setData(d => ({ ...d, liabilities: [...d.liabilities, { id: generateId(), type: vals.type as LiabilityEntry['type'], name: String(vals.name), amount: Number(vals.amount), comment: String(vals.comment), rate: Number(vals.rate) }] }));
    }
    setModal(null);
  };

  return (
    <div className="app">
      <Header />

      <main className="main-grid">
        <div className="main-grid__rates">
          <ExchangeRatesWidget
            rates={[
              { code: 'USD', value: exchangeRates.USD },
              { code: 'EUR', value: exchangeRates.EUR },
              { code: 'CNY', value: exchangeRates.CNY },
            ]}
            updatedAt={exchangeRatesUpdatedAt}
            isLoading={exchangeRatesLoading}
            hasError={exchangeRatesError}
          />
        </div>

        {/* ROW 1 */}
        <div className="main-grid__income">
          <SectionCard
            title="Доходы"
            total={totalIncome}
            totalLabel="Итого доходов:"
            accent="income"
            onAdd={() => setModal({ type: 'income' })}
          >
            {data.incomes.length === 0 && <p className="empty-state">Нет записей</p>}
            {sortedIncomes.map(item => (
              <ItemCard
                key={item.id}
                name={item.name}
                amount={item.amount}
                accent="income"
                onOpen={() => setPreviewModal({
                  title: 'Просмотр дохода',
                  name: item.name,
                  amount: item.amount,
                  comment: item.comment,
                  accent: 'income',
                })}
                onEdit={() => setModal({ type: 'income', entry: item })}
                onDelete={() => setData(d => ({ ...d, incomes: d.incomes.filter(i => i.id !== item.id) }))}
              />
            ))}
          </SectionCard>
        </div>

        <div className="main-grid__expense">
          <SectionCard
            title="Расходы"
            total={totalExpense}
            totalLabel="Итого расходов:"
            accent="expense"
            onAdd={() => setModal({ type: 'expense' })}
          >
            {data.expenses.length === 0 && <p className="empty-state">Нет записей</p>}
            {sortedExpenses.map(item => (
              <ItemCard
                key={item.id}
                name={item.name}
                amount={item.amount}
                accent="expense"
                onOpen={() => setPreviewModal({
                  title: 'Просмотр расхода',
                  name: item.name,
                  amount: item.amount,
                  comment: item.comment,
                  accent: 'expense',
                })}
                onEdit={() => setModal({ type: 'expense', entry: item })}
                onDelete={() => setData(d => ({ ...d, expenses: d.expenses.filter(i => i.id !== item.id) }))}
              />
            ))}
          </SectionCard>
        </div>

        {/* MONTHLY SUMMARY */}
        <div className="main-grid__summary-row">
          <MonthlySummary totalIncome={totalIncome} totalExpense={totalExpense} />
        </div>

        {/* ROW 2 */}
        <SectionCard
          title="Активы"
          total={totalAssets}
          totalLabel="Итого активов:"
          accent="asset"
          onAdd={() => setModal({ type: 'asset' })}
        >
          {data.assets.length === 0 && <p className="empty-state">Нет записей</p>}
          {sortedAssets.map(item => (
            (() => {
              const currency = getAssetCurrency(item);
              const rubAmount = convertToRub(item.amount, currency, exchangeRates);
              const baseMeta = assetNeedsRate(item.type) && typeof item.rate === 'number'
                ? `Ставка: ${formatPercentage(item.rate)}`
                : formatPercentChange(rubAmount, item.acquisitionCost);
              const originalAmountMeta = currency !== 'RUB'
                ? formatAssetCurrency(item.amount, currency)
                : undefined;

              return (
                <ItemCard
                  key={item.id}
                  name={item.name}
                  amount={rubAmount}
                  amountMeta={originalAmountMeta}
                  secondaryAmountMeta={baseMeta || undefined}
                  label={item.type}
                  secondaryLabel={item.acquiredAt ? `Приобретено: ${formatMonthYear(item.acquiredAt)}` : undefined}
                  accent="asset"
                  onOpen={() => setPreviewModal({
                    title: 'Просмотр актива',
                    name: item.name,
                    amount: rubAmount,
                    amountMeta: originalAmountMeta,
                    secondaryAmountMeta: baseMeta || undefined,
                    comment: item.comment,
                    label: item.type,
                    secondaryLabel: item.acquiredAt ? `Приобретено: ${formatMonthYear(item.acquiredAt)}` : undefined,
                    accent: 'asset',
                  })}
                  onEdit={() => setModal({ type: 'asset', entry: item })}
                  onDelete={() => setData(d => ({ ...d, assets: d.assets.filter(i => i.id !== item.id) }))}
                />
              );
            })()
          ))}
        </SectionCard>

        <SectionCard
          title="Пассивы"
          total={totalLiabilities}
          totalLabel="Итого пассивов:"
          totalMeta={averageLiabilityRate !== undefined ? `Средняя ставка: ${formatPercentage(averageLiabilityRate)}` : undefined}
          accent="liability"
          onAdd={() => setModal({ type: 'liability' })}
        >
          {data.liabilities.length === 0 && <p className="empty-state">Нет записей</p>}
          {sortedLiabilities.map(item => (
            <ItemCard
              key={item.id}
              name={item.name}
              amount={item.amount}
              amountMeta={typeof item.rate === 'number' ? `Ставка: ${formatPercentage(item.rate)}` : undefined}
              label={item.type}
              accent="liability"
              onOpen={() => setPreviewModal({
                title: 'Просмотр пассива',
                name: item.name,
                amount: item.amount,
                amountMeta: typeof item.rate === 'number' ? `Ставка: ${formatPercentage(item.rate)}` : undefined,
                comment: item.comment,
                label: item.type,
                accent: 'liability',
              })}
              onEdit={() => setModal({ type: 'liability', entry: item })}
              onDelete={() => setData(d => ({ ...d, liabilities: d.liabilities.filter(i => i.id !== item.id) }))}
            />
          ))}
        </SectionCard>

        {/* CAPITAL SUMMARY */}
        <div className="main-grid__summary-row">
          <CapitalSummary totalAssets={totalAssets} totalLiabilities={totalLiabilities} />
        </div>
        <div className="main-grid__summary-row">
          <CapitalHistoryChart points={capitalHistory} onPointClick={handleCapitalHistoryPointClick} />
        </div>
      </main>

      <footer className="app-footer">
        <span className="footer-ornament">❧ Финансовая книга ❧</span>
      </footer>

      {/* MODALS */}
      {modal?.type === 'income' && (
        <EntryModal
          title={modal.entry ? 'Редактировать доход' : 'Новый источник дохода'}
          fields={[
            { key: 'name', label: 'Название источника', type: 'text' },
            { key: 'amount', label: 'Сумма в месяц (₽)', type: 'number' },
            { key: 'comment', label: 'Комментарий', type: 'textarea', required: false },
          ]}
          initialValues={modal.entry ? { name: modal.entry.name, amount: modal.entry.amount, comment: modal.entry.comment } : {}}
          onSave={handleSaveIncome}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'expense' && (
        <EntryModal
          title={modal.entry ? 'Редактировать расход' : 'Новый расход'}
          fields={[
            { key: 'name', label: 'Название расхода', type: 'text' },
            { key: 'amount', label: 'Сумма в месяц (₽)', type: 'number' },
            { key: 'comment', label: 'Комментарий', type: 'textarea', required: false },
          ]}
          initialValues={modal.entry ? { name: modal.entry.name, amount: modal.entry.amount, comment: modal.entry.comment } : {}}
          onSave={handleSaveExpense}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'asset' && (
        <EntryModal
          title={modal.entry ? 'Редактировать актив' : 'Новый актив'}
          fields={[
            { key: 'type', label: 'Тип актива', type: 'select', options: ASSET_TYPES },
            { key: 'name', label: 'Название', type: 'text' },
            { key: 'amount', label: 'Стоимость (₽)', type: 'number' },
            {
              key: 'rate',
              label: 'Ставка (%)',
              type: 'number',
              showWhen: values => assetNeedsRate(values.type as AssetEntry['type']),
            },
            {
              key: 'currency',
              label: 'Валюта',
              type: 'select',
              options: ASSET_CURRENCIES,
              showWhen: values => assetNeedsCurrency(values.type as AssetEntry['type']),
            },
            {
              key: 'acquisitionCost',
              label: 'Стоимость приобретения (₽)',
              type: 'number',
              showWhen: values => assetNeedsAcquisitionCost(values.type as AssetEntry['type']),
            },
            {
              key: 'acquiredAt',
              label: 'Дата приобретения',
              type: 'month',
              showWhen: values => assetNeedsAcquisitionDate(values.type as AssetEntry['type']),
            },
            { key: 'comment', label: 'Комментарий', type: 'textarea', required: false },
          ]}
          initialValues={modal.entry ? { type: modal.entry.type, name: modal.entry.name, amount: modal.entry.amount, rate: modal.entry.rate ?? '', currency: getAssetCurrency(modal.entry), acquisitionCost: modal.entry.acquisitionCost ?? '', acquiredAt: modal.entry.acquiredAt ?? '', comment: modal.entry.comment } : { currency: 'RUB' }}
          onSave={handleSaveAsset}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'liability' && (
        <EntryModal
          title={modal.entry ? 'Редактировать пассив' : 'Новый пассив'}
          fields={[
            { key: 'type', label: 'Тип пассива', type: 'select', options: LIABILITY_TYPES },
            { key: 'name', label: 'Название', type: 'text' },
            { key: 'amount', label: 'Сумма обязательства (₽)', type: 'number' },
            { key: 'rate', label: 'Ставка (%)', type: 'number' },
            { key: 'comment', label: 'Комментарий', type: 'textarea', required: false },
          ]}
          initialValues={modal.entry ? { type: modal.entry.type, name: modal.entry.name, amount: modal.entry.amount, rate: modal.entry.rate, comment: modal.entry.comment } : {}}
          onSave={handleSaveLiability}
          onClose={() => setModal(null)}
        />
      )}
      {capitalChartModal && (
        <EntryModal
          title={capitalChartModal.mode === 'growth' ? `Прирост капитала на ${capitalChartModal.year}` : `Чистый капитал за ${capitalChartModal.year}`}
          fields={[
            {
              key: 'value',
              label: capitalChartModal.mode === 'growth' ? 'Прирост к прошлому году (%)' : 'Значение (₽)',
              type: 'number',
            },
          ]}
          initialValues={{ value: capitalChartModal.value }}
          onSave={handleSaveCapitalHistoryPoint}
          onClose={() => setCapitalChartModal(null)}
        />
      )}
      {previewModal && (
        <PreviewModal
          title={previewModal.title}
          name={previewModal.name}
          amount={previewModal.amount}
          amountMeta={previewModal.amountMeta}
          secondaryAmountMeta={previewModal.secondaryAmountMeta}
          label={previewModal.label}
          secondaryLabel={previewModal.secondaryLabel}
          comment={previewModal.comment}
          accent={previewModal.accent}
          onClose={() => setPreviewModal(null)}
        />
      )}
    </div>
  );
}
