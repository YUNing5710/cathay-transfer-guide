import React, { useEffect, useRef, useState } from 'react';
import { C } from './ui';
import { L } from './i18n';

/**
 * Floating Vera companion. Drag anywhere; on release it springs to the nearest side edge.
 * When idle it tucks half off-screen and breathes; a speech bubble opens toward the screen centre.
 * Tap (no drag) opens the chat.
 */
export const VeraPet = ({ onOpen, onVoice, hint, onDismiss, mood = 'calm' }: { onOpen: () => void; onVoice?: () => void; hint?: string | null; onDismiss?: () => void; mood?: 'calm' | 'alert' }) => {
  const press = useRef<ReturnType<typeof setTimeout>>();
  const longed = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -1, y: -1 });
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [drag, setDrag] = useState(false);
  const [tucked, setTucked] = useState(false);
  const start = useRef({ px: 0, py: 0, x: 0, y: 0, moved: false });
  const idle = useRef<ReturnType<typeof setTimeout>>();
  const S = 58;

  const bounds = () => {
    const p = box.current?.parentElement;
    return { w: p?.clientWidth ?? 390, h: p?.clientHeight ?? 800 };
  };
  useEffect(() => {
    const { w, h } = bounds();
    setPos({ x: w - S - 10, y: h - S - 90 });
  }, []);

  const armIdle = () => {
    clearTimeout(idle.current);
    setTucked(false);
    idle.current = setTimeout(() => setTucked(true), 4500);
  };
  useEffect(() => { armIdle(); return () => clearTimeout(idle.current); }, []);
  useEffect(() => { if (hint) armIdle(); }, [hint]);

  const down = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y, moved: false };
    setDrag(true); armIdle();
    longed.current = false;
    clearTimeout(press.current);
    press.current = setTimeout(() => { if (!start.current.moved && onVoice) { longed.current = true; setDrag(false); onVoice(); } }, 550);
  };
  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    // Mouse hover with no button held must never move Vera (lost pointerup safety).
    if (e.pointerType === 'mouse' && e.buttons === 0) { setDrag(false); return; }
    const dx = e.clientX - start.current.px, dy = e.clientY - start.current.py;
    if (Math.abs(dx) + Math.abs(dy) > 6) { start.current.moved = true; clearTimeout(press.current); }
    const { w, h } = bounds();
    setPos({ x: Math.max(0, Math.min(w - S, start.current.x + dx)), y: Math.max(60, Math.min(h - S - 64, start.current.y + dy)) });
  };
  const up = () => {
    if (!drag) return;
    setDrag(false);
    clearTimeout(press.current);
    if (longed.current) return;
    if (!start.current.moved) { onOpen(); return; }    const { w } = bounds();
    const toLeft = pos.x + S / 2 < w / 2;
    setSide(toLeft ? 'left' : 'right');
    setPos((p) => ({ ...p, x: toLeft ? 10 : w - S - 10 }));
    armIdle();
  };

  if (pos.x < 0) return <div ref={box} />;
  const { w } = bounds();
  const tuckX = tucked && !hint && !drag ? (side === 'left' ? -S * 0.45 : w - S * 0.55) : pos.x;
  const bubbleOnLeft = side === 'right';
  const eye = mood === 'alert' ? C.gold : '#0F1E1D';

  return (
    <div ref={box} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
      <style>{`
        @keyframes vbreath{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
        @keyframes vring{0%{transform:scale(.8);opacity:.55}100%{transform:scale(1.7);opacity:0}}
        @keyframes vpop{from{opacity:0;transform:translateY(6px) scale(.92)}to{opacity:1;transform:none}}
        @keyframes vblink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
      `}</style>
      <div style={{ position: 'absolute', left: tuckX, top: pos.y, width: S, height: S,
        transition: drag ? 'none' : 'left .45s cubic-bezier(.34,1.4,.64,1), top .3s ease', pointerEvents: 'auto', touchAction: 'none' }}>
        {hint && (
          <div role="status" onClick={onOpen} style={{ position: 'absolute', bottom: S + 8, [bubbleOnLeft ? 'right' : 'left']: 0, width: 220, cursor: 'pointer',
            background: C.paper, color: C.ink, borderRadius: 16, padding: '10px 28px 10px 12px', fontSize: 13, lineHeight: 1.5,
            boxShadow: '0 10px 28px rgba(0,40,38,.18)', border: `1px solid ${C.line}`, animation: 'vpop .28s ease' } as React.CSSProperties}>
            <div style={{ display: 'block' }}>{hint}</div>
            <div style={{ fontSize: 11, color: C.jade, fontWeight: 600, marginTop: 4 }}>{L('点我聊聊', '撳我傾吓', 'Tap to chat')}</div>
            <button aria-label={L('关闭提示', '閂', 'Dismiss')} onClick={(e) => { e.stopPropagation(); onDismiss?.(); }} style={{ position: 'absolute', top: 6, right: 6, width: 18, height: 18, border: 'none', borderRadius: 9, background: C.bg, color: C.muted, cursor: 'pointer', fontSize: 12, lineHeight: '18px', padding: 0 }}>×</button>
            <span style={{ position: 'absolute', bottom: -6, [bubbleOnLeft ? 'right' : 'left']: 22, width: 12, height: 12, background: C.paper, borderRight: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`, transform: 'rotate(45deg)' } as React.CSSProperties} />
          </div>
        )}
        <button aria-label="Vera"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up}
          style={{ position: 'relative', width: S, height: S, padding: 0, border: 'none', background: 'none', cursor: drag ? 'grabbing' : 'pointer', touchAction: 'none' }}>
          {hint && <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${C.mint}`, animation: 'vring 1.8s ease-out infinite' }} />}
          <svg viewBox="0 0 64 64" width={S} height={S} aria-hidden="true"
            style={{ display: 'block', filter: `drop-shadow(0 8px 14px rgba(0,50,48,${drag ? 0.38 : 0.26}))`, animation: drag ? undefined : 'vbreath 3.2s ease-in-out infinite', transform: drag ? 'scale(1.08)' : undefined }}>
            <defs>
              <linearGradient id="vbody" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#1C8A84" /><stop offset="1" stopColor="#005856" />
              </linearGradient>
            </defs>
            {/* body: a soft droplet with a wing-tip tail, Cathay brushwing nod */}
            <path d="M32 6c13 0 24 10 24 24 0 14-11 26-24 26S8 44 8 30C8 16 19 6 32 6z" fill="url(#vbody)" />
            <path d="M44 12c6 1 10 5 11 10-4-3-8-4-12-3z" fill="#7FE0D5" opacity=".9" />
            {/* face screen */}
            <rect x="15" y="21" width="34" height="22" rx="11" fill="#F4FBFA" />
            <g style={{ transformOrigin: '32px 32px', animation: 'vblink 4.5s infinite' }}>
              <rect x="23" y="27" width="5" height="8" rx="2.5" fill={eye} />
              <rect x="36" y="27" width="5" height="8" rx="2.5" fill={eye} />
            </g>
            <path d="M28.5 38.5q3.5 2.2 7 0" stroke="#0F1E1D" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            {mood === 'alert' && <circle cx="52" cy="14" r="5" fill="#C98A12" stroke="#fff" strokeWidth="2" />}
          </svg>
        </button>
      </div>
    </div>
  );
};
