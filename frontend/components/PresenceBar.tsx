'use client';

interface Props {
  myName: string;
  partnerName: string | null;
  partnerConnected: boolean;
  roomId: string;
}

export default function PresenceBar({ myName, partnerName, partnerConnected, roomId }: Props) {
  const shortId = roomId.slice(0, 8) + '...';

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', borderBottom: '1px solid var(--border)',
      background: 'var(--bg2)', flexWrap: 'wrap', gap: '8px'
    }}>
      {/* Logo */}
      <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '1.1rem', color: 'var(--accent)', letterSpacing: '-0.02em' }}>
        SyncWatch
      </span>

      {/* Users */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="dot dot-green" />
          {myName} (you)
        </span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: partnerConnected ? 'var(--text)' : 'var(--muted)' }}>
          <span className={`dot ${partnerConnected ? 'dot-green dot-pulse' : 'dot-yellow'}`} />
          {partnerConnected ? (partnerName || 'partner') : 'waiting for partner…'}
        </span>
      </div>

      {/* Room info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.05em' }}>{shortId}</span>
        <button className="btn-ghost" onClick={copyLink} style={{ padding: '4px 10px', fontSize: '11px' }}>
          copy invite
        </button>
      </div>
    </div>
  );
}
