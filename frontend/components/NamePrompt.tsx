'use client';

import { useState } from 'react';
import { getStoredName, storeName } from '@/lib/session';

interface Props {
  onSubmit: (name: string) => void;
}

export default function NamePrompt({ onSubmit }: Props) {
  const [name, setName] = useState(getStoredName());
  const [error, setError] = useState('');

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Please enter a name.'); return; }
    storeName(trimmed);
    onSubmit(trimmed);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(10,10,15,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100, backdropFilter: 'blur(8px)'
    }}>
      <div className="card fade-in" style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.5rem' }}>join room</h2>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted)' }}>what should we call you?</p>
        </div>
        <input
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="your name"
          maxLength={24}
          autoFocus
        />
        {error && <div style={{ fontSize: '12px', color: 'var(--accent2)' }}>{error}</div>}
        <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', padding: '12px' }}>
          enter room
        </button>
      </div>
    </div>
  );
}
