import { formatCurrency } from '../utils';

interface SectionCardProps {
  title: string;
  total: number;
  totalLabel: string;
  totalMeta?: string;
  accent: 'income' | 'expense' | 'asset' | 'liability';
  onAdd: () => void;
  children: React.ReactNode;
}

const SECTION_ICONS: Record<string, string> = {
  income: '§',
  expense: '§',
  asset: '§',
  liability: '§',
};

export default function SectionCard({ title, total, totalLabel, totalMeta, accent, onAdd, children }: SectionCardProps) {
  return (
    <div className={`section-card section-card--${accent}`}>
      <div className="section-card__header">
        <div className="section-card__title-row">
          <span className="section-card__ornament">{SECTION_ICONS[accent]}</span>
          <h2 className="section-card__title">{title}</h2>
        </div>
        <button className="btn btn--add" onClick={onAdd}>+ Добавить</button>
      </div>
      <div className="section-card__divider" />
      <div className="section-card__list">
        {children}
      </div>
      <div className="section-card__footer">
        <div className="section-card__footer-divider" />
        <div className="section-card__total">
          <span className="section-card__total-label">{totalLabel}</span>
          <div className="section-card__total-value">
            <span className="section-card__total-amount">{formatCurrency(total)}</span>
            {totalMeta && <span className="section-card__total-meta">{totalMeta}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
