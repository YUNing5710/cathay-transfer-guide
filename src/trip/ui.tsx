import React from 'react';
import { L } from './i18n';

export const C = {
  ink: '#0F1E1D', muted: '#4D605D', line: '#DCE4E2', bg: '#F3F5F4', paper: '#FFFFFF',
  jade: '#006564', jadeSoft: '#E1EFEE', mint: '#2E8F86', gold: '#7A5300', goldSoft: '#FCF1DA',
  red: '#A8261B', redSoft: '#FCE8E5', grey: '#ECEFEE',
};
export const sans = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", "Segoe UI", Roboto, sans-serif';
export const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const btn = (kind: 'primary' | 'ghost' | 'danger' = 'primary'): React.CSSProperties => ({
  border: `1px solid ${kind === 'danger' ? C.red : C.jade}`,
  background: kind === 'ghost' ? C.paper : kind === 'danger' ? C.red : C.jade,
  color: kind === 'ghost' ? C.jade : '#fff',
  borderRadius: 10, padding: '9px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans,
});

const P: Record<string, string> = {
  arrow: 'M5 12h12M12 6l6 6-6 6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4z',
  plus: 'M12 5v14M5 12h14',
  dine: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 2-2 6 0 8v10',
  cup: 'M5 8h11v6a5 5 0 0 1-10 0zM16 10h2a2 2 0 0 1 0 4h-2',
  shower: 'M6 20V8a4 4 0 0 1 8 0M10 12h8M12 15v1M15 15v1M18 15v1',
  bolt: 'M13 3 5 14h6l-1 7 8-11h-6z',
  cam: 'M4 8h4l2-2h4l2 2h4v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  bag: 'M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0',
  phone: 'M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 6a2 2 0 0 1 2-2z',
  check: 'M5 12l5 5 9-10',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  star: 'M12 3l2.7 5.6 6.1.8-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.8z',
  x: 'M6 6l12 12M18 6 6 18',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a4 4 0 0 1 4-4h6M18 9v6a4 4 0 0 1-4 4H8',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5',
};
export const Icon = ({ n, s = 20, c = 'currentColor', w = 2 }: { n: keyof typeof P | string; s?: number; c?: string; w?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={P[n] ?? P.info} />
  </svg>
);

export const catIcon: Record<string, string> = { 餐饮: 'dine', 贵宾室: 'cup', 购物: 'bag', 观光: 'cam', 设施: 'bolt', 服务: 'info' };

/** Miles label. Logged out: never promise miles, say how to get them. */
export const MilesTag = ({ t, n }: { t: { member: unknown }; n: number }) => (
  n <= 0 ? null
    : t.member ? <span style={{ color: C.gold, fontWeight: 700, fontSize: 12 }}>+{n} Asia Miles</span>
    : <span style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}>{L('登录后可赚里程', '登入先賺到里數', 'Log in to earn miles')}</span>
);

export const Sheet = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,25,24,.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}
      style={{ background: C.paper, width: '100%', maxHeight: '86%', overflowY: 'auto', borderRadius: '18px 18px 0 0', padding: '14px 16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 17 }}>{title}</strong>
        <button aria-label={L('关闭', '閂', 'Close')} onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}><Icon n="x" c={C.muted} /></button>
      </div>
      {children}
    </div>
  </div>
);
