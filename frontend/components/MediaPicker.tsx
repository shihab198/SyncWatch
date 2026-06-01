'use client';

import { useState, useRef } from 'react';
import { detectMediaType, extractYouTubeId, extractGoogleDriveId } from '@/lib/media';

interface Props {
  onMedia: (type: 'youtube' | 'drive' | 'local', source: string, title?: string, file?: File) => void;
}

export default function MediaPicker({ onMedia }: Props) {
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState<'url' | 'local'>('url');
  const [warning, setWarning] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleUrl() {
    setError(''); setWarning('');
    const type = detectMediaType(url.trim());
    if (!type) { setError('Paste a YouTube or Google Drive URL.'); return; }

    if (type === 'drive') {
      const id = extractGoogleDriveId(url.trim());
      if (!id) { setError('Invalid Google Drive link.'); return; }
      setWarning('Make sure the Drive file is set to "Anyone with link can view."');
      onMedia('drive', url.trim());
    } else {
      const id = extractYouTubeId(url.trim());
      if (!id) { setError('Could not extract YouTube video ID.'); return; }
      onMedia('youtube', id);
    }
    setUrl('');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    onMedia('local', objectUrl, file.name, file);
  }

  return (
    <div className="card" style={{ maxWidth: '520px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '1rem' }}>load media</h3>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid var(--border)' }}>
        {(['url', 'local'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); setWarning(''); }}
            style={{
              background: 'none', border: 'none', padding: '8px 16px',
              fontSize: '12px', cursor: 'pointer', letterSpacing: '0.05em',
              color: tab === t ? 'var(--accent)' : 'var(--muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px', fontFamily: 'DM Mono, monospace'
            }}
          >
            {t === 'url' ? 'youtube / drive' : 'local file'}
          </button>
        ))}
      </div>

      {tab === 'url' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            value={url}
            onChange={e => { setUrl(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleUrl()}
            placeholder="paste youtube or google drive url"
          />
          {error && <div style={{ fontSize: '12px', color: 'var(--accent2)' }}>{error}</div>}
          {warning && (
            <div style={{ fontSize: '12px', color: '#fbbf24', padding: '8px 12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
              ⚠ {warning}
            </div>
          )}
          <button className="btn-primary" onClick={handleUrl} style={{ alignSelf: 'flex-start' }}>
            load
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: 0 }}>
            both users must have the same file locally. only playback state is synced.
          </p>
          <input ref={fileRef} type="file" accept="video/*,audio/*" onChange={handleFile} style={{ display: 'none' }} />
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            choose file
          </button>
        </div>
      )}
    </div>
  );
}
