'use client';

import { useEffect, useRef, useState } from 'react';

const REACTIONS = ['❤️', '😂', '😮', '👍', '😢'];

interface Message {
  id: string;
  content: string;
  type: 'text' | 'reaction';
  senderName: string;
  timestamp: string;
  isMine?: boolean;
}

interface Props {
  messages: Message[];
  myName: string;
  onSend: (content: string, type: 'text' | 'reaction') => void;
}

export default function Chat({ messages, myName, onSend }: Props) {
  const [input, setInput] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendText() {
    if (!input.trim()) return;
    onSend(input.trim(), 'text');
    setInput('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        chat
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '12px', marginTop: '24px' }}>
            no messages yet
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderName === myName;
          if (msg.type === 'reaction') {
            return (
              <div key={msg.id} className="fade-in" style={{ textAlign: 'center', fontSize: '22px' }}>
                {msg.content}
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{msg.senderName}</div>
              </div>
            );
          }
          return (
            <div key={msg.id} className="fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
              {!isMine && (
                <span style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '3px', letterSpacing: '0.05em' }}>{msg.senderName}</span>
              )}
              <div style={{
                background: isMine ? 'var(--accent)' : 'var(--bg3)',
                color: isMine ? 'white' : 'var(--text)',
                padding: '8px 12px',
                fontSize: '13px',
                maxWidth: '85%',
                wordBreak: 'break-word',
                borderRadius: '2px',
              }}>
                {msg.content}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '3px' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reactions */}
      {showReactions && (
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {REACTIONS.map(r => (
            <button
              key={r}
              onClick={() => { onSend(r, 'reaction'); setShowReactions(false); }}
              style={{ fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'transform 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {r}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setShowReactions(s => !s)}
          style={{ background: 'none', border: '1px solid var(--border)', cursor: 'pointer', padding: '6px 10px', fontSize: '16px', color: showReactions ? 'var(--accent)' : 'var(--muted)', flexShrink: 0 }}
        >
          {showReactions ? '✕' : '☺'}
        </button>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendText()}
          placeholder="type a message…"
          style={{ flex: 1 }}
        />
        <button className="btn-primary" onClick={sendText} style={{ flexShrink: 0, padding: '6px 14px' }}>
          →
        </button>
      </div>
    </div>
  );
}
