import { formatCurrency } from '../utils';

interface ItemCardProps {
  name: string;
  amount: number;
  amountMeta?: string;
  secondaryAmountMeta?: string;
  label?: string;
  secondaryLabel?: string;
  accent?: 'income' | 'expense' | 'asset' | 'liability';
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ICONS: Record<string, string> = {
  income: '₊',
  expense: '₋',
  asset: '◈',
  liability: '◇',
};

export default function ItemCard({ name, amount, amountMeta, secondaryAmountMeta, label, secondaryLabel, accent = 'income', onOpen, onEdit, onDelete }: ItemCardProps) {
  return (
    <div
      className={`item-card item-card--${accent}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="item-card__main">
        <div className="item-card__info">
          <span className="item-card__icon">{ICONS[accent]}</span>
          <div className="item-card__text">
            <span className="item-card__name">{name}</span>
            {label && <span className="item-card__label">{label}</span>}
            {secondaryLabel && <span className="item-card__meta">{secondaryLabel}</span>}
          </div>
        </div>
        <div className="item-card__right">
          <div className="item-card__amount-block">
            <span className="item-card__amount">{formatCurrency(amount)}</span>
            {amountMeta && <span className="item-card__amount-meta">{amountMeta}</span>}
            {secondaryAmountMeta && <span className="item-card__amount-meta item-card__amount-meta--secondary">{secondaryAmountMeta}</span>}
          </div>
          <div className="item-card__actions">
            <button className="item-card__btn" onClick={(event) => { event.stopPropagation(); onEdit(); }} title="Редактировать">✎</button>
            <button className="item-card__btn item-card__btn--delete" onClick={(event) => { event.stopPropagation(); onDelete(); }} title="Удалить">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}
