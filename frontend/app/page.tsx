'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storeName, getStoredName } from '@/lib/session';

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState(getStoredName());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function createRoom() {
    if (!name.trim()) { setError('Enter your name first.'); return; }
    setLoading(true);
    setError('');
    storeName(name.trim());
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/rooms/create`, { method: 'POST' });
      const data = await res.json();
      router.push(`/room/${data.roomId}`);
    } catch {
      setError('Could not reach server. Is the backend running?');
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(124,106,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px' }}>private viewing room</div>
          <h1 style={{ fontSize: '3.5rem', margin: 0, lineHeight: 1, color: 'var(--text)' }}>SyncWatch</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '12px' }}>watch together, from anywhere.</p>
        </div>

        <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              your name
            </label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && createRoom()}
              placeholder="e.g. alex"
              maxLength={24}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: 'var(--accent2)', padding: '8px 12px', background: 'rgba(232,100,90,0.08)', border: '1px solid rgba(232,100,90,0.2)' }}>
              {error}
            </div>
          )}

          <button className="btn-primary" onClick={createRoom} disabled={loading} style={{ width: '100%', padding: '14px' }}>
            {loading ? 'creating room...' : 'create room'}
          </button>

          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)' }}>
            have a room link? just open it directly.
          </div>
        </div>

        <div style={{ marginTop: '48px', display: 'flex', gap: '24px', justifyContent: 'center' }}>
          {[
            ['youtube', 'YouTube'],
            ['drive', 'Google Drive'],
            ['local', 'local files'],
          ].map(([key, label]) => (
            <div key={key} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', margin: '0 auto 6px', opacity: 0.6 }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
