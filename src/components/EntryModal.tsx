import { useState, useEffect } from 'react';
import { AssetType, LiabilityType } from '../types';

interface Field {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'month';
  options?: string[];
  required?: boolean;
  showWhen?: (values: Record<string, string | number>) => boolean;
}

interface EntryModalProps {
  title: string;
  fields: Field[];
  initialValues?: Record<string, string | number>;
  onSave: (values: Record<string, string | number>) => void;
  onClose: () => void;
}

export const ASSET_TYPES: AssetType[] = [
  'Недвижимость',
  'Автомобиль',
  'Банковский счет',
  'Наличные',
  'Инвестиции',
  'Криптовалюта',
  'Бизнес',
  'Другое',
];

export const LIABILITY_TYPES: LiabilityType[] = [
  'Ипотека',
  'Потребительский кредит',
  'Автокредит',
  'Кредитная карта',
  'Долг физлицу',
  'Прочее',
];

export default function EntryModal({ title, fields, initialValues = {}, onSave, onClose }: EntryModalProps) {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const defaults: Record<string, string | number> = {};
    fields.forEach(f => {
      defaults[f.key] = initialValues[f.key] ?? (f.type === 'number' ? '' : f.options ? f.options[0] : '');
    });
    return defaults;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const visibleFields = fields.filter(f => !f.showWhen || f.showWhen(values));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    visibleFields.forEach(f => {
      if (f.required !== false) {
        if (f.type === 'number') {
          const val = Number(values[f.key]);
          const raw = values[f.key];
          if (raw === '' || raw === null || raw === undefined || isNaN(val) || val < 0) {
            newErrors[f.key] = 'Введите корректную сумму';
          }
        } else if (f.type === 'text' || f.type === 'month') {
          if (!String(values[f.key]).trim()) {
            newErrors[f.key] = 'Обязательное поле';
          }
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const processed: Record<string, string | number> = {};
    fields.forEach(f => {
      processed[f.key] = f.type === 'number' ? Number(values[f.key]) : values[f.key];
    });
    onSave(processed);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-window">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {visibleFields.map(field => (
            <div key={field.key} className="form-group">
              <label className="form-label">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  className="form-input"
                  value={String(values[field.key])}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                >
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="form-input form-textarea"
                  value={String(values[field.key])}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  rows={2}
                  placeholder="Заметка (необязательно)"
                />
              ) : (
                <input
                  className={`form-input ${errors[field.key] ? 'form-input--error' : ''}`}
                  type={field.type}
                  value={String(values[field.key])}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.type === 'number' ? '0' : ''}
                  min={field.type === 'number' ? '0' : undefined}
                  step={field.type === 'number' ? 'any' : undefined}
                />
              )}
              {errors[field.key] && <span className="form-error">{errors[field.key]}</span>}
            </div>
          ))}
          <div className="modal-actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}
