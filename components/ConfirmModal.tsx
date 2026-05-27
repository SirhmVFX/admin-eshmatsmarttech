'use client';

interface Props { message: string; onConfirm: () => void; onCancel: () => void; danger?: boolean; }

export default function ConfirmModal({ message, onConfirm, onCancel, danger = true }: Props) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box" style={{ maxWidth: 400, padding: 28 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>Confirm action</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}
