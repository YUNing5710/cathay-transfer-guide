import React, { useRef, useState } from 'react';
import { C } from './ui';

/** Zoom and pan inside a fixed box (no full screen): wheel / pinch zoom, drag to pan, +/−/复位. */
export const ZoomArea = ({ children }: { children: React.ReactNode }) => {
  const [s, setS] = useState(1);
  const [o, setO] = useState({ x: 0, y: 0 });
  const [live, setLive] = useState(false);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const last = useRef<{ d: number; x: number; y: number } | null>(null);
  const moved = useRef(0);
  const clamp = (v: number) => Math.min(3.5, Math.max(1, v));
  const setScale = (f: (v: number) => number) => setS((v) => { const n = clamp(f(v)); if (n === 1) setO({ x: 0, y: 0 }); return n; });

  const down = (e: React.PointerEvent) => { pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); last.current = null; moved.current = 0; };
  const move = (e: React.PointerEvent) => {
    if (!pts.current.has(e.pointerId)) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { pts.current.delete(e.pointerId); return; }
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pts.current.values()];
    const cx = p.reduce((a, q) => a + q.x, 0) / p.length, cy = p.reduce((a, q) => a + q.y, 0) / p.length;
    const d = p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0;
    if (last.current) {
      const L = last.current;
      moved.current += Math.abs(cx - L.x) + Math.abs(cy - L.y) + Math.abs(d - L.d);
      if (moved.current > 6) {
        if (!live) { setLive(true); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }
        if (d && L.d) setScale((v) => v * (d / L.d));
        setO((v) => ({ x: v.x + cx - L.x, y: v.y + cy - L.y }));
      }
    }
    last.current = { d, x: cx, y: cy };
  };
  const up = (e: React.PointerEvent) => { pts.current.delete(e.pointerId); last.current = null; setLive(false); };
  // A drag should not count as a tap on whatever is underneath.
  const clickCap = (e: React.MouseEvent) => { if (moved.current > 6) { e.stopPropagation(); e.preventDefault(); } };

  return (
    <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onClickCapture={clickCap}
      onWheel={(e) => setScale((v) => v * (e.deltaY < 0 ? 1.12 : 1 / 1.12))}
      style={{ position: 'relative', overflow: 'hidden', touchAction: 'none', cursor: s > 1 ? (live ? 'grabbing' : 'grab') : 'default' }}>
      <div style={{ transform: `translate(${o.x}px,${o.y}px) scale(${s})`, transformOrigin: 'center', transition: live ? 'none' : 'transform .15s' }}>
        {children}
      </div>
      <div style={{ position: 'absolute', right: 8, top: 6, zIndex: 4, display: 'flex', gap: 4 }} onPointerDown={(e) => e.stopPropagation()}>
        <button aria-label="缩小" onClick={() => setScale((v) => v / 1.3)} style={zb}>−</button>
        <button aria-label="放大" onClick={() => setScale((v) => v * 1.3)} style={zb}>+</button>
        {s > 1 && <button aria-label="复位" onClick={() => { setS(1); setO({ x: 0, y: 0 }); }} style={{ ...zb, width: 'auto', padding: '0 8px', fontSize: 11 }}>复位 {Math.round(s * 100)}%</button>}
      </div>
    </div>
  );
};
const zb: React.CSSProperties = { width: 28, height: 28, borderRadius: 14, border: `1px solid ${C.line}`, background: 'rgba(255,255,255,.96)', color: C.jade, fontSize: 16, fontWeight: 700, cursor: 'pointer', padding: 0, lineHeight: '26px' };
