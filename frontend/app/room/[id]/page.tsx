'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { getSessionId } from '@/lib/session';
import NamePrompt from '@/components/NamePrompt';
import PresenceBar from '@/components/PresenceBar';
import MediaPicker from '@/components/MediaPicker';
import YouTubePlayer from '@/components/YouTubePlayer';
import DrivePlayer from '@/components/DrivePlayer';
import LocalPlayer from '@/components/LocalPlayer';
import Chat from '@/components/Chat';

interface RoomState {
  id: string;
  mediaType: 'youtube' | 'drive' | 'local' | null;
  mediaSource: string | null;
  mediaTitle: string | null;
  playbackState: 'playing' | 'paused';
  playbackTime: number;
}

interface ChatMessage {
  id: string;
  content: string;
  type: 'text' | 'reaction';
  senderName: string;
  timestamp: string;
}

interface ExternalCommand {
  action: 'play' | 'pause' | 'seek';
  time?: number;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const [myName, setMyName] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [externalCommand, setExternalCommand] = useState<ExternalCommand | null>(null);
  const [localSrc, setLocalSrc] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(true);

  const sessionId = getSessionId();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Join room via socket
  const joinRoom = useCallback((name: string) => {
    setMyName(name);
    const socket = connectSocket();

    socket.on('connect', () => {
      socket.emit('room:join', { roomId, name, sessionId });
    });

    socket.on('error', (data: { message: string }) => {
      setError(data.message);
      disconnectSocket();
    });

    socket.on('room:state', (data: { room: RoomState; messages: ChatMessage[]; isHost: boolean }) => {
      setRoomState(data.room);
      setMessages(data.messages);
      setJoined(true);
    });

    socket.on('user:joined', (data: { name: string }) => {
      setPartnerName(data.name);
      setPartnerConnected(true);
    });

    socket.on('user:left', (data: { name: string }) => {
      setPartnerConnected(false);
    });

    socket.on('presence:update', (data: { count: number }) => {
      if (data.count >= 2) setPartnerConnected(true);
    });

    socket.on('playback:sync', (data: { state: 'playing' | 'paused'; time: number }) => {
      setRoomState(prev => prev ? { ...prev, playbackState: data.state, playbackTime: data.time } : prev);
      setExternalCommand({ action: data.state, time: data.time });
    });

    socket.on('playback:seek', (data: { time: number }) => {
      setRoomState(prev => prev ? { ...prev, playbackTime: data.time } : prev);
      setExternalCommand({ action: 'seek', time: data.time });
    });

    socket.on('media:changed', (data: { mediaType: string; mediaSource: string; mediaTitle: string }) => {
      setRoomState(prev => prev ? {
        ...prev,
        mediaType: data.mediaType as any,
        mediaSource: data.mediaSource,
        mediaTitle: data.mediaTitle,
        playbackTime: 0,
        playbackState: 'paused',
      } : prev);
      setLocalSrc(null);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    // Start periodic sync ping every 5s
    syncIntervalRef.current = setInterval(() => {
      if (socket.connected && roomState?.mediaType && roomState.mediaType !== 'drive') {
        socket.emit('sync:ping', { roomId, clientTime: 0 });
      }
    }, 5000);

    socket.connect();
  }, [roomId, sessionId]);

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      disconnectSocket();
    };
  }, []);

  // Reset external command after it fires
  useEffect(() => {
    if (externalCommand) {
      const t = setTimeout(() => setExternalCommand(null), 100);
      return () => clearTimeout(t);
    }
  }, [externalCommand]);

  function handlePlaybackChange(state: 'playing' | 'paused', time: number) {
    const socket = getSocket();
    socket.emit('playback:change', { roomId, state, time, sessionId });
    setRoomState(prev => prev ? { ...prev, playbackState: state, playbackTime: time } : prev);
  }

  function handleSeek(time: number) {
    const socket = getSocket();
    socket.emit('playback:seek', { roomId, time, sessionId });
  }

  function handleMedia(type: 'youtube' | 'drive' | 'local', source: string, title?: string, file?: File) {
    const socket = getSocket();
    socket.emit('media:set', { roomId, mediaType: type, mediaSource: source, mediaTitle: title || '', sessionId });
    setRoomState(prev => prev ? { ...prev, mediaType: type, mediaSource: source, mediaTitle: title || '', playbackTime: 0, playbackState: 'paused' } : prev);
    if (type === 'local' && file) {
      setLocalSrc(source);
    }
  }

  function sendMessage(content: string, type: 'text' | 'reaction') {
    const socket = getSocket();
    socket.emit('chat:message', { roomId, content, type, sessionId, senderName: myName });
  }

  // Room full / not found error
  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: '360px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ margin: 0 }}>cannot join</h2>
          <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>{error}</p>
          <button className="btn-primary" onClick={() => router.push('/')}>go home</button>
        </div>
      </main>
    );
  }

  // Name prompt
  if (!myName) {
    return <NamePrompt onSubmit={joinRoom} />;
  }

  // Loading
  if (!joined) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
          <div className="dot dot-pulse dot-yellow" style={{ margin: '0 auto 12px' }} />
          connecting…
        </div>
      </main>
    );
  }

  const hasMedia = roomState?.mediaType && roomState?.mediaSource;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PresenceBar
        myName={myName}
        partnerName={partnerName}
        partnerConnected={partnerConnected}
        roomId={roomId}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Main area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 0 }}>
          {/* Player */}
          <div style={{ background: '#000', position: 'relative' }}>
            {!hasMedia && (
              <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', border: '1px solid var(--border)', margin: '16px 16px 0' }}>
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px', opacity: 0.3 }}>▶</div>
                  no media loaded
                </div>
              </div>
            )}
            {hasMedia && roomState.mediaType === 'youtube' && (
              <YouTubePlayer
                videoId={roomState.mediaSource!}
                onStateChange={handlePlaybackChange}
                onSeek={handleSeek}
                externalCommand={externalCommand}
              />
            )}
            {hasMedia && roomState.mediaType === 'drive' && (
              <DrivePlayer driveUrl={roomState.mediaSource!} />
            )}
            {hasMedia && roomState.mediaType === 'local' && localSrc && (
              <LocalPlayer
                src={localSrc}
                onStateChange={handlePlaybackChange}
                onSeek={handleSeek}
                externalCommand={externalCommand}
              />
            )}
            {hasMedia && roomState.mediaType === 'local' && !localSrc && (
              <div style={{ aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)' }}>
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
                  <div style={{ marginBottom: '8px' }}>partner loaded: <strong style={{ color: 'var(--text)' }}>{roomState.mediaTitle}</strong></div>
                  load the same file locally to watch together
                </div>
              </div>
            )}
          </div>

          {/* Media picker */}
          <div style={{ padding: '16px' }}>
            <MediaPicker onMedia={handleMedia} />
          </div>
        </div>

        {/* Chat sidebar */}
        <div style={{
          width: chatOpen ? '320px' : '0',
          minWidth: chatOpen ? '320px' : '0',
          borderLeft: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', transition: 'all 0.2s ease',
          background: 'var(--bg2)',
        }}>
          {chatOpen && (
            <Chat
              messages={messages}
              myName={myName}
              onSend={sendMessage}
            />
          )}
        </div>

        {/* Chat toggle */}
        <button
          onClick={() => setChatOpen(s => !s)}
          style={{
            position: 'fixed', right: chatOpen ? '324px' : '4px', bottom: '20px',
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--muted)', cursor: 'pointer', padding: '8px 10px',
            fontSize: '14px', transition: 'right 0.2s ease', zIndex: 10,
          }}
          title={chatOpen ? 'hide chat' : 'show chat'}
        >
          {chatOpen ? '→' : '←'}
        </button>
      </div>
    </div>
  );
}
