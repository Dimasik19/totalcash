import { formatCurrency } from '../utils';

interface PreviewModalProps {
  title: string;
  name: string;
  amount: number;
  amountMeta?: string;
  secondaryAmountMeta?: string;
  label?: string;
  secondaryLabel?: string;
  comment?: string;
  accent: 'income' | 'expense' | 'asset' | 'liability';
  onClose: () => void;
}

export default function PreviewModal({
  title,
  name,
  amount,
  amountMeta,
  secondaryAmountMeta,
  label,
  secondaryLabel,
  comment,
  accent,
  onClose,
}: PreviewModalProps) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-window preview-modal preview-modal--${accent}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="preview-modal__body">
          <div className="preview-modal__topline">{label && <span className="preview-modal__label">{label}</span>}</div>
          <h2 className="preview-modal__name">{name}</h2>
          <div className="preview-modal__amount">{formatCurrency(amount)}</div>
          {amountMeta && <p className="preview-modal__meta">{amountMeta}</p>}
          {secondaryAmountMeta && <p className="preview-modal__meta">{secondaryAmountMeta}</p>}
          {secondaryLabel && <p className="preview-modal__secondary">{secondaryLabel}</p>}
          {comment && <p className="preview-modal__comment">{comment}</p>}
        </div>
      </div>
    </div>
  );
}
