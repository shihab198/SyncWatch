'use client';

// Google Drive embed via iframe — limited control.
// Playback sync is best-effort; users control via the iframe's built-in controls.
// Our sync layer handles play/pause state notifications from chat context.

interface Props {
  driveUrl: string; // full drive URL
}

export default function DrivePlayer({ driveUrl }: Props) {
  // Convert share URL to embed URL
  let embedUrl = driveUrl;
  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
  }

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000' }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        allow="autoplay"
        allowFullScreen
        style={{ border: 'none', position: 'absolute', inset: 0 }}
        title="Google Drive Media"
      />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        padding: '8px 12px', fontSize: '11px', color: 'rgba(255,255,255,0.5)',
        pointerEvents: 'none'
      }}>
        google drive — use chat to coordinate play/pause
      </div>
    </div>
  );
}
