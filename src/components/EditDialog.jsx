import React from 'react';

export default function EditDialog({ open, title, fields, onChange, onClose, onSave }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          {fields.map(f => (
            <label key={f.name} className="modal-field">
              <div className="modal-label">{f.label}</div>
              {f.type === 'textarea' ? (
                <textarea value={f.value || ''} onChange={e => onChange(f.name, e.target.value)} />
              ) : (
                <input value={f.value || ''} onChange={e => onChange(f.name, e.target.value)} />
              )}
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-chip" onClick={onClose}>Cancel</button>
          <button className="btn-chip goo" onClick={onSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
