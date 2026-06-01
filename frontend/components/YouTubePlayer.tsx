'use client';

import { useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

interface Props {
  videoId: string;
  onStateChange: (state: 'playing' | 'paused', time: number) => void;
  onSeek: (time: number) => void;
  externalCommand: { action: 'play' | 'pause' | 'seek'; time?: number } | null;
}

export default function YouTubePlayer({ videoId, onStateChange, onSeek, externalCommand }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isSyncing = useRef(false); // prevent echo loops
  const lastTimeRef = useRef(0);

  const initPlayer = useCallback(() => {
    if (!containerRef.current) return;
    const div = document.createElement('div');
    div.id = `yt-player-${videoId}`;
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(div);

    playerRef.current = new window.YT.Player(div.id, {
      videoId,
      playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0 },
      events: {
        onStateChange: (e: any) => {
          if (isSyncing.current) return;
          const time = playerRef.current?.getCurrentTime() || 0;
          if (e.data === window.YT.PlayerState.PLAYING) {
            onStateChange('playing', time);
          } else if (e.data === window.YT.PlayerState.PAUSED) {
            // Detect seek: if time changed significantly
            const diff = Math.abs(time - lastTimeRef.current);
            if (diff > 1.5) onSeek(time);
            else onStateChange('paused', time);
          }
          lastTimeRef.current = time;
        },
      },
    });
  }, [videoId, onStateChange, onSeek]);

  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.getElementById('yt-api-script')) {
        const script = document.createElement('script');
        script.id = 'yt-api-script';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }
      window.onYouTubeIframeAPIReady = initPlayer;
    }
    return () => { playerRef.current?.destroy?.(); };
  }, [initPlayer]);

  // Handle external commands (from partner)
  useEffect(() => {
    if (!externalCommand || !playerRef.current) return;
    isSyncing.current = true;
    const { action, time } = externalCommand;
    if (action === 'play') {
      if (time !== undefined) playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();
    } else if (action === 'pause') {
      if (time !== undefined) playerRef.current.seekTo(time, true);
      playerRef.current.pauseVideo();
    } else if (action === 'seek') {
      playerRef.current.seekTo(time, true);
    }
    setTimeout(() => { isSyncing.current = false; }, 500);
  }, [externalCommand]);

  return (
    <div ref={containerRef} style={{ width: '100%', aspectRatio: '16/9', background: '#000' }} />
  );
}
