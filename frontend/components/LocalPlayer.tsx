'use client';

import { useEffect, useRef } from 'react';

interface Props {
  src: string;
  onStateChange: (state: 'playing' | 'paused', time: number) => void;
  onSeek: (time: number) => void;
  externalCommand: { action: 'play' | 'pause' | 'seek'; time?: number } | null;
}

export default function LocalPlayer({ src, onStateChange, onSeek, externalCommand }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSyncing = useRef(false);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    function handlePlay() {
      if (isSyncing.current) return;
      onStateChange('playing', v!.currentTime);
    }
    function handlePause() {
      if (isSyncing.current) return;
      const diff = Math.abs(v!.currentTime - lastTimeRef.current);
      if (diff > 1.5) onSeek(v!.currentTime);
      else onStateChange('paused', v!.currentTime);
      lastTimeRef.current = v!.currentTime;
    }

    v.addEventListener('play', handlePlay);
    v.addEventListener('pause', handlePause);
    return () => { v.removeEventListener('play', handlePlay); v.removeEventListener('pause', handlePause); };
  }, [onStateChange, onSeek]);

  useEffect(() => {
    if (!externalCommand || !videoRef.current) return;
    const v = videoRef.current;
    isSyncing.current = true;
    const { action, time } = externalCommand;
    if (time !== undefined) v.currentTime = time;
    if (action === 'play') v.play().catch(() => {});
    else if (action === 'pause') v.pause();
    else if (action === 'seek') v.pause();
    setTimeout(() => { isSyncing.current = false; }, 500);
  }, [externalCommand]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      style={{ width: '100%', aspectRatio: '16/9', background: '#000', display: 'block' }}
    />
  );
}
