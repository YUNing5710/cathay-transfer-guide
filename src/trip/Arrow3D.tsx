import React, { useEffect, useRef, useState } from 'react';
import { L, useLang } from './i18n';
import { C } from './ui';

/** Shortest signed difference a-b in degrees, range (-180, 180]. */
const diff = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

type SensorState = 'off' | 'asking' | 'on' | 'denied' | 'unsupported';

/**
 * One shared orientation sensor for the whole app: enabling it on one screen enables it everywhere.
 * If the browser does not need a permission prompt (Android, desktop) or it was granted before, it starts on its own.
 */
const S = { state: 'off' as SensorState, heading: 0, tilt: 58, subs: new Set<() => void>(), filt: null as null | { x: number; y: number }, pitch: null as null | number, seen: 0, raw: null as null | number, bound: false, toastShown: false };
const emit = () => S.subs.forEach((f) => f());
const onEvt = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
  let h: number | null = null;
  if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
  else if (typeof e.alpha === 'number') h = 360 - e.alpha;
  let changed = false;
  if (typeof e.beta === 'number') {
    const b = Math.max(0, Math.min(90, e.beta));
    S.pitch = S.pitch === null ? b : S.pitch + (b - S.pitch) * 0.12;
    const target = Math.round(14 + S.pitch * 0.64);
    if (Math.abs(S.tilt - target) > 2) { S.tilt = target; changed = true; }
  }
  if (h !== null && !Number.isNaN(h)) {
    S.seen = Date.now();
    if (S.state !== 'on') { S.state = 'on'; changed = true; }
    const r = (h * Math.PI) / 180, k = 0.12;
    const f = S.filt ?? { x: Math.sin(r), y: Math.cos(r) };
    f.x += (Math.sin(r) - f.x) * k; f.y += (Math.cos(r) - f.y) * k; S.filt = f;
    const sm = ((Math.atan2(f.x, f.y) * 180) / Math.PI + 360) % 360;
    if (S.raw === null || Math.abs(diff(sm, S.raw)) > 3) { S.raw = sm; S.heading = Math.round(sm); changed = true; }
  }
  if (changed) emit();
};
const bind = () => {
  if (S.bound) return; S.bound = true;
  window.addEventListener('deviceorientationabsolute' as any, onEvt as any, true);
  window.addEventListener('deviceorientation', onEvt as any, true);
};
const startSensor = async () => {
  if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) { S.state = 'unsupported'; emit(); return; }
  S.state = 'asking'; emit();
  try {
    const DOE = (window as any).DeviceOrientationEvent;
    if (typeof DOE.requestPermission === 'function') {
      const res = await DOE.requestPermission();
      if (res !== 'granted') { S.state = 'denied'; emit(); return; }
    }
    bind();
    setTimeout(() => { if (!S.seen) { S.state = 'unsupported'; emit(); } }, 1500);
  } catch { S.state = 'denied'; emit(); }
};
// Silent probe: listen without prompting; if events arrive, the sensor is already usable.
if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
  const DOE = (window as any).DeviceOrientationEvent;
  if (typeof DOE.requestPermission !== 'function') bind();
  else { bind(); } // on iOS events only flow after a past grant; otherwise we wait for the tap
}

export function useHeading() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force((n) => n + 1); S.subs.add(f); return () => { S.subs.delete(f); }; }, []);
  return {
    heading: S.state === 'on' ? S.heading : 0, tilt: S.tilt, state: S.state, start: startSensor,
    /** True once per session: show "calibrated" hint only the first time. */
    takeToast: () => { if (S.toastShown) return false; S.toastShown = true; return true; },
  };
}

function _unusedOld() {
  const [state, setState] = useState<SensorState>('off');
  const raw = useRef<number | null>(null);
  const filt = useRef<{ x: number; y: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [tilt, setTilt] = useState(58);
  const pitch = useRef<number | null>(null);
  const lastSeen = useRef(0);

  const onEvent = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
    let h: number | null = null;
    if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading; // iOS, already clockwise from north
    else if (e.absolute && typeof e.alpha === 'number') h = 360 - e.alpha; // Android absolute
    else if (typeof e.alpha === 'number') h = 360 - e.alpha;
    if (typeof e.beta === 'number') {
      // Phone flat (beta 0) = looking down on the arrow; upright (beta 90) = arrow lies flat on the floor ahead.
      const b = Math.max(0, Math.min(90, e.beta));
      pitch.current = pitch.current === null ? b : pitch.current + (b - pitch.current) * 0.12;
      const target = 14 + pitch.current * 0.64;
      setTilt((cur) => (Math.abs(cur - target) > 2 ? Math.round(target) : cur));
    }
    if (h === null || Number.isNaN(h)) return;
    lastSeen.current = Date.now();
    const r = (h * Math.PI) / 180;
    const k = 0.12; // low-pass strength
    const f = filt.current ?? { x: Math.sin(r), y: Math.cos(r) };
    f.x += (Math.sin(r) - f.x) * k;
    f.y += (Math.cos(r) - f.y) * k;
    filt.current = f;
    const sm = ((Math.atan2(f.x, f.y) * 180) / Math.PI + 360) % 360;
    if (raw.current === null || Math.abs(diff(sm, raw.current)) > 3) { raw.current = sm; setHeading(Math.round(sm)); }
  };

  const start = async () => {
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) { setState('unsupported'); return; }
    setState('asking');
    try {
      const DOE = (window as any).DeviceOrientationEvent;
      if (typeof DOE.requestPermission === 'function') {
        const res = await DOE.requestPermission();
        if (res !== 'granted') { setState('denied'); return; }
      }
      window.addEventListener('deviceorientationabsolute' as any, onEvent as any, true);
      window.addEventListener('deviceorientation', onEvent as any, true);
      setState('on');
      lastSeen.current = 0;
      setTimeout(() => { if (!lastSeen.current) setState('unsupported'); }, 1500);
    } catch {
      setState('denied');
    }
  };
  const stop = () => {
    window.removeEventListener('deviceorientationabsolute' as any, onEvent as any, true);
    window.removeEventListener('deviceorientation', onEvent as any, true);
    setState('off'); raw.current = null; filt.current = null; setHeading(0);
  };
  useEffect(() => () => stop(), []);
  return { heading, tilt, state, start, stop, setHeading };
}
void _unusedOld;

/** Sensor status line: tap to trigger the browser's permission prompt; once on, says so briefly then hides. */
export const SensorHint = ({ dark }: { dark?: boolean }) => {
  const c = useHeading();
  useLang();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (c.state === 'on' && c.takeToast()) { setShow(true); const id = setTimeout(() => setShow(false), 2500); return () => clearTimeout(id); }
  }, [c.state]);
  const fg = dark ? '#fff' : C.jade;
  if (c.state === 'on') return show ? <span style={{ fontSize: 12, color: dark ? '#E6F3F1' : C.muted, display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: 4, background: '#7FE0D5' }} />{L('已按手机朝向校准', '已經跟手機方向校準', 'Calibrated to your phone')}</span> : null;
  if (c.state === 'unsupported') return <span style={{ fontSize: 12, color: dark ? '#E6F3F1' : C.muted }}>{L('此设备没有方向传感器，箭头按地图方向显示', '呢部機冇方向感應器，箭咀跟地圖方向', 'No orientation sensor; arrow follows the map')}</span>;
  return (
    <button onClick={c.start} style={{ border: `1px solid ${dark ? 'rgba(255,255,255,.55)' : C.line}`, background: dark ? 'transparent' : C.paper, color: fg, borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
      {c.state === 'asking' ? L('正在请求传感器权限…', '請求緊感應器權限…', 'Requesting sensor access…') : c.state === 'denied' ? L('传感器权限被拒绝，点此重新请求', '感應器權限被拒，撳呢度再試', 'Sensor access denied, tap to retry') : L('点此开启传感器（会弹出权限请求），箭头跟随手机朝向', '撳呢度開感應器（會彈出權限請求），箭咀跟手機方向', 'Tap to enable the sensor (a permission prompt will appear)')}
    </button>
  );
};

/**
 * 3D arrow lying on the floor. `angle` = where to go, relative to the top of the phone (clockwise degrees).
 * Rotation is eased with a critically damped spring each frame, so it turns smoothly and settles without wobble.
 */
export const Arrow3D = ({ angle, size = 150, mode = 'walk', tilt = 58 }: { angle: number; size?: number; mode?: 'walk' | 'up' | 'down' | 'arrive'; tilt?: number }) => {
  const el = useRef<HTMLDivElement>(null);
  const cur = useRef(angle);
  const vel = useRef(0);
  const target = useRef(angle);
  target.current = angle;

  useEffect(() => {
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const d = diff(target.current, cur.current);
      if (Math.abs(d) < 0.4 && Math.abs(vel.current) < 0.5) { vel.current = 0; }
      else {
        const w = 9; // stiffness: critically damped, no overshoot
        const acc = w * w * d - 2 * w * vel.current;
        vel.current += acc * dt;
        cur.current += vel.current * dt;
        if (el.current) el.current.style.transform = `rotateZ(${cur.current}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    if (el.current) el.current.style.transform = `rotateZ(${cur.current}deg)`;
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const layers = 9;
  const shape = 'M50 6 L88 46 L64 46 L64 92 L36 92 L36 46 L12 46 Z';
  const rot = mode === 'up' || mode === 'down' ? 0 : undefined;

  return (
    <div style={{ width: size, height: size * 0.8, perspective: 700, display: 'grid', placeItems: 'center' }} aria-hidden="true">
      <style>{`@keyframes a3bob{0%,100%{transform:translateZ(0)}50%{transform:translateZ(8px)}}@keyframes a3pulse{0%{transform:scale(.6);opacity:.55}100%{transform:scale(1.5);opacity:0}}`}</style>
      <div style={{ width: size, height: size, transformStyle: 'preserve-3d', transform: `rotateX(${tilt}deg)`, transition: 'transform .35s ease-out' }}>
        {/* floor shadow ring */}
        <div style={{ position: 'absolute', inset: '12%', borderRadius: '50%', border: `2px solid ${C.mint}`, opacity: 0.0, animation: 'a3pulse 2.2s ease-out infinite' }} />
        <div style={{ position: 'absolute', inset: '18%', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,60,58,.22), rgba(0,60,58,0))' }} />
        <div ref={el} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: rot !== undefined ? `rotateZ(${rot}deg)` : undefined }}>
          <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', animation: mode === 'arrive' ? undefined : 'a3bob 2.4s ease-in-out infinite' }}>
            {Array.from({ length: layers }).map((_, i) => (
              <svg key={i} viewBox="0 0 100 100" width={size} height={size}
                style={{ position: 'absolute', inset: 0, transform: `translateZ(${i * 2.2 + 6}px)` }}>
                {mode === 'arrive' ? (
                  <circle cx="50" cy="50" r="30" fill={i === layers - 1 ? '#2BA89C' : i === 0 ? '#003F3E' : '#00585A'} />
                ) : (
                  <path d={shape} fill={i === layers - 1 ? '#2BA89C' : i === 0 ? '#003F3E' : '#00585A'} strokeLinejoin="round" stroke={i === layers - 1 ? '#2BA89C' : '#00585A'} strokeWidth="4" />
                )}
                {i === layers - 1 && mode !== 'arrive' && <path d="M50 16 L74 42 L56 42 L56 84 L44 84 L44 42 L26 42 Z" fill="#5FD0C4" opacity=".45" />}
                {i === layers - 1 && mode === 'arrive' && <circle cx="50" cy="50" r="12" fill="#fff" />}
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/** Bearing of a map vector, clockwise from map-up. Map-up is treated as north. */
export const bearingOf = (dx: number, dy: number) => ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
