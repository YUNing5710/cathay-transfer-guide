import React from 'react';
import { L } from './i18n';

/** Palette: one brand green carries the hierarchy; gold only for miles; red only for time trouble. */
export const C = {
  ink: '#132120', muted: '#5C6C6A', faint: '#9AA8A6', line: '#E2E8E6', bg: '#F3F6F5', paper: '#FFFFFF',
  jade: '#006564', jadeDeep: '#00494A', jadeSoft: '#E3F0EE', mint: '#2E9488', gold: '#8A5D00', goldSoft: '#FBF2DF',
  red: '#B3261E', redSoft: '#FCEBE8', grey: '#EEF1F0',
};
/** Type scale — every size in the app comes from here. */
export const T = { xs: 11, sm: 12, base: 14, md: 15, lg: 18, xl: 22, hero: 34 };
export const R = { sm: 10, md: 14, lg: 20 };
export const sans = '"PingFang SC", "PingFang HK", -apple-system, BlinkMacSystemFont, "Noto Sans SC", "Noto Sans TC", "Segoe UI", Roboto, sans-serif';
export const mono = '"SF Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
export const ease = 'cubic-bezier(.2,.8,.2,1)';

export const btn = (kind: 'primary' | 'ghost' | 'danger' | 'soft' = 'primary'): React.CSSProperties => ({
  border: `1px solid ${kind === 'danger' ? C.red : kind === 'soft' ? 'transparent' : C.jade}`,
  background: kind === 'ghost' ? C.paper : kind === 'danger' ? C.red : kind === 'soft' ? C.jadeSoft : C.jade,
  color: kind === 'ghost' || kind === 'soft' ? C.jade : '#fff',
  borderRadius: 12, padding: '10px 14px', fontSize: T.base, fontWeight: 600, cursor: 'pointer', fontFamily: sans,
  transition: `transform .12s ${ease}, opacity .2s`, lineHeight: 1.2,
});
export const card: React.CSSProperties = { background: C.paper, border: `1px solid ${C.line}`, borderRadius: R.md, padding: 14 };

/** Global keyframes and resets, injected once by App. */
export const GLOBAL_CSS = `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;overflow-x:hidden;max-width:100%;-webkit-font-smoothing:antialiased}
button{font-family:inherit;max-width:100%}
button:active:not(:disabled){transform:scale(.97)}
svg{max-width:100%}
.noscroll{scrollbar-width:none}.noscroll::-webkit-scrollbar{display:none}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes sheetUp{from{transform:translateY(100%)}to{transform:none}}
@keyframes pop{0%{transform:scale(.7);opacity:0}100%{transform:none;opacity:1}}
@keyframes toastIn{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}
@keyframes ring{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.5);opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes draw{from{stroke-dashoffset:60}to{stroke-dashoffset:0}}
`;

const P: Record<string, string> = {
  arrow: 'M5 12h12M12 6l6 6-6 6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  plus: 'M12 5v14M5 12h14',
  dine: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 2-2 6 0 8v10',
  bolt: 'M13 3 5 14h6l-1 7 8-11h-6z',
  cam: 'M4 8h4l2-2h4l2 2h4v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  bag: 'M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0',
  suitcase: 'M5 8h14v11H5zM9 8V5h6v3M9 12v3M15 12v3',
  passport: 'M6 3h12v18H6zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 17h6',
  phone: 'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z',
  check: 'M5 12l5 5 9-10',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  star: 'M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z',
  x: 'M6 6l12 12M18 6 6 18',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a4 4 0 0 1 4-4h6M18 9v6a4 4 0 0 1-4 4H8',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
  shield: 'M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  chev: 'M9 6l6 6-6 6',
};
export const Icon = ({ n, s = 20, c = 'currentColor', w = 2 }: { n: keyof typeof P | string; s?: number; c?: string; w?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={P[n] ?? P.info} />
  </svg>
);

/** Miles label. Logged out: never promise miles, say how to get them. */
export const MilesTag = ({ t, n }: { t: { member: unknown }; n: number }) => (
  n <= 0 ? null
    : <span style={{ color: C.gold, fontWeight: 700, fontSize: T.xs, whiteSpace: 'nowrap' }}>{t.member ? `+${n} Miles` : L(`登录 +${n}`, `登入 +${n}`, `+${n} on login`)}</span>
);

export const Sheet = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,28,27,.42)', zIndex: 50, display: 'flex', alignItems: 'flex-end', animation: 'fade .2s ease' }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}
      style={{ background: C.paper, width: '100%', maxHeight: '86%', overflowY: 'auto', borderRadius: '22px 22px 0 0', padding: '8px 16px 20px', animation: `sheetUp .32s ${ease}` }}>
      <div style={{ width: 36, height: 4, borderRadius: 2, background: C.line, margin: '0 auto 10px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <strong style={{ fontSize: T.lg }}>{title}</strong>
        <button aria-label={L('关闭', '閂', 'Close')} onClick={onClose} style={{ border: 'none', background: C.grey, borderRadius: 14, width: 28, height: 28, cursor: 'pointer', padding: 0, display: 'grid', placeItems: 'center' }}><Icon n="x" s={14} c={C.muted} /></button>
      </div>
      {children}
    </div>
  </div>
);

/** Thin notice strip: one line of title, one optional line of detail, actions on the right or below. */
export const Notice = ({ tone = 'gold', title, sub, children, onClose }: { tone?: 'gold' | 'red' | 'jade'; title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode; onClose?: () => void }) => {
  const fg = tone === 'red' ? C.red : tone === 'jade' ? C.jade : C.gold;
  const bg = tone === 'red' ? C.redSoft : tone === 'jade' ? C.jadeSoft : C.goldSoft;
  return (
    <section role="status" style={{ background: bg, borderRadius: R.md, padding: '10px 12px', animation: `rise .3s ${ease}`, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: fg, marginTop: 7, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: T.base, fontWeight: 700, color: fg, lineHeight: 1.4 }}>{title}</div>
          {sub && <div style={{ fontSize: T.sm, color: C.ink, opacity: 0.8, marginTop: 1, lineHeight: 1.5 }}>{sub}</div>}
        </div>
        {onClose && <button aria-label={L('关闭', '閂', 'Close')} onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}><Icon n="x" s={14} c={C.muted} /></button>}
      </div>
      {children && <div style={{ display: 'flex', gap: 8 }}>{children}</div>}
    </section>
  );
};
export const smallBtn = (kind: 'primary' | 'ghost' | 'danger' = 'primary'): React.CSSProperties => ({ ...btn(kind), padding: '7px 12px', fontSize: T.sm, borderRadius: 10, flex: 1 });
