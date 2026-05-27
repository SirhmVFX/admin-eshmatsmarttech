'use client';

import { useState, KeyboardEvent } from 'react';

interface Props { values: string[]; onChange: (v: string[]) => void; placeholder?: string; }

export default function TagInput({ values, onChange, placeholder = 'Add item, press Enter' }: Props) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input && values.length) onChange(values.slice(0, -1));
  };

  return (
    <div>
      <input className="adm-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} onBlur={add} placeholder={placeholder} />
      {values.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
          {values.map((v, i) => (
            <span key={i} className="tag-chip">
              {v}
              <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
