import { formatCurrency } from '../utils';

interface MonthlySummaryProps {
  totalIncome: number;
  totalExpense: number;
}

export function MonthlySummary({ totalIncome, totalExpense }: MonthlySummaryProps) {
  const balance = totalIncome - totalExpense;
  const status = balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'neutral';
  const statusLabel = balance > 0 ? 'Профицит' : balance < 0 ? 'Дефицит' : 'Баланс';

  return (
    <div className={`summary-panel summary-panel--monthly summary-panel--${status}`}>
      <div className="summary-panel__inner">
        <div className="summary-panel__ornament-line">
          <span className="ornament-dash" />
          <span className="ornament-symbol">✦</span>
          <span className="ornament-dash" />
        </div>
        <h3 className="summary-panel__heading">Итог за месяц</h3>
        <div className="summary-panel__row">
          <div className="summary-panel__col">
            <span className="summary-panel__col-label">Доходы</span>
            <span className="summary-panel__col-value summary-panel__col-value--income">{formatCurrency(totalIncome)}</span>
          </div>
          <div className="summary-panel__separator">−</div>
          <div className="summary-panel__col">
            <span className="summary-panel__col-label">Расходы</span>
            <span className="summary-panel__col-value summary-panel__col-value--expense">{formatCurrency(totalExpense)}</span>
          </div>
          <div className="summary-panel__separator">=</div>
          <div className="summary-panel__col summary-panel__col--result">
            <span className="summary-panel__col-label">{statusLabel}</span>
            <span className={`summary-panel__col-value summary-panel__col-value--${status}`}>{formatCurrency(balance)}</span>
          </div>
        </div>
        <div className="summary-panel__ornament-line">
          <span className="ornament-dash" />
          <span className="ornament-symbol">✦</span>
          <span className="ornament-dash" />
        </div>
      </div>
    </div>
  );
}

interface CapitalSummaryProps {
  totalAssets: number;
  totalLiabilities: number;
}

export function CapitalSummary({ totalAssets, totalLiabilities }: CapitalSummaryProps) {
  const capital = totalAssets - totalLiabilities;
  const ratio = totalAssets > 0 ? capital / totalAssets : 0;
  const status = capital > 0 && ratio > 0.3 ? 'positive' : capital <= 0 ? 'negative' : 'low';
  const statusLabel = status === 'positive' ? 'Капитал положительный' : status === 'negative' ? 'Капитал отрицательный' : 'Капитал под давлением';

  return (
    <div className={`summary-panel summary-panel--capital summary-panel--${status}`}>
      <div className="summary-panel__inner">
        <div className="summary-panel__ornament-line">
          <span className="ornament-dash" />
          <span className="ornament-symbol">❧</span>
          <span className="ornament-dash" />
        </div>
        <h3 className="summary-panel__heading summary-panel__heading--large">Капитал всего</h3>
        <p className="summary-panel__status-label">{statusLabel}</p>
        <div className="summary-panel__row">
          <div className="summary-panel__col">
            <span className="summary-panel__col-label">Активы</span>
            <span className="summary-panel__col-value summary-panel__col-value--income">{formatCurrency(totalAssets)}</span>
          </div>
          <div className="summary-panel__separator">−</div>
          <div className="summary-panel__col">
            <span className="summary-panel__col-label">Пассивы</span>
            <span className="summary-panel__col-value summary-panel__col-value--expense">{formatCurrency(totalLiabilities)}</span>
          </div>
          <div className="summary-panel__separator">=</div>
          <div className="summary-panel__col summary-panel__col--result">
            <span className="summary-panel__col-label">Чистый капитал</span>
            <span className={`summary-panel__col-value summary-panel__col-value--${status} summary-panel__col-value--xl`}>{formatCurrency(capital)}</span>
          </div>
        </div>
        <div className="summary-panel__ornament-line">
          <span className="ornament-dash" />
          <span className="ornament-symbol">❧</span>
          <span className="ornament-dash" />
        </div>
      </div>
    </div>
  );
}

interface CapitalHistoryPoint {
  year: number;
  amount: number;
  isFuture: boolean;
  editable?: boolean;
  growthRate?: number;
}

interface CapitalHistoryChartProps {
  points: CapitalHistoryPoint[];
  onPointClick: (point: CapitalHistoryPoint) => void;
}

export function CapitalHistoryChart({ points, onPointClick }: CapitalHistoryChartProps) {
  const maxAmount = Math.max(...points.map(point => point.amount), 1);

  return (
    <div className="capital-chart">
      <div className="capital-chart__header">
        <div>
          <h3 className="capital-chart__title">Динамика чистого капитала</h3>
          <p className="capital-chart__subtitle">Нажмите на столбец, чтобы изменить значение</p>
        </div>
        <div className="capital-chart__legend">
          <span className="capital-chart__legend-item">
            <span className="capital-chart__legend-mark capital-chart__legend-mark--past" />
            Факт
          </span>
          <span className="capital-chart__legend-item">
            <span className="capital-chart__legend-mark capital-chart__legend-mark--future" />
            Прогноз
          </span>
        </div>
      </div>

      <div className="capital-chart__plot">
        <div className="capital-chart__baseline" />
        {points.map(point => (
          <div key={point.year} className="capital-chart__column-wrap">
            <button
              type="button"
              className={`capital-chart__column-button ${!point.editable ? 'capital-chart__column-button--disabled' : ''}`}
              onClick={() => point.editable && onPointClick(point)}
              disabled={!point.editable}
              title={point.editable ? `Изменить значение за ${point.year}` : `Значение за ${point.year} берется из текущего чистого капитала`}
            >
              <span className="capital-chart__value">{formatCurrency(point.amount)}</span>
              {typeof point.growthRate === 'number' && (
                <span className={`capital-chart__growth ${point.isFuture ? 'capital-chart__growth--future' : 'capital-chart__growth--past'}`}>
                  {`${point.growthRate > 0 ? '+' : ''}${point.growthRate.toFixed(1)}%`}
                </span>
              )}
              <div
                className={`capital-chart__column ${point.isFuture ? 'capital-chart__column--future' : 'capital-chart__column--past'}`}
                style={{ height: `${(point.amount / maxAmount) * 100}%` }}
              />
            </button>
            <span className="capital-chart__year">{point.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
