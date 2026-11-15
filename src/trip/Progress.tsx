import React from 'react';
import { hm, pname, START_CLOCK } from './data';
import { L, useLang } from './i18n';
import { Trip } from './store';
import { C, mono } from './ui';

const mix = (a: string, b: string, k: number) => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
};
/**
 * Amber by absolute position on the bar: barely shifts over the first 60%,
 * then moves steadily toward red over the last 40%.
 */
const Y = '#E3B23C', Y2 = '#E0A23A', R = '#C2402F';
const amber = (p: number) => (p <= 60 ? mix(Y, Y2, p / 60) : mix(Y2, R, Math.min(1, (p - 60) / 40)));

export const Progress = ({ t }: { t: Trip }) => {
  useLang();
  const start = START_CLOCK;
  const endT = t.dep - t.boardBuffer;
  const span = Math.max(1, endT - start);
  const pct = (m: number) => Math.min(100, Math.max(0, ((m - start) / span) * 100));
  const now = pct(t.clock);
  const planEnd = pct(t.tl.end + t.tl.toGate);
  const G = '#2E9E6B', N = '#D3DAD8';
  const f = 2;
  void pname; const stops: string[] = [`${G} 0%`, `${G} ${Math.max(0, now - f)}%`];
  if (planEnd > now + 0.5) {
    const a = now + f, b = Math.max(a, planEnd - f);
    for (let p = a; p < b; p += 4) stops.push(`${amber(p)} ${p.toFixed(1)}%`);
    stops.push(`${amber(b)} ${b.toFixed(1)}%`, `${N} ${Math.min(100, planEnd + f).toFixed(1)}%`);
  } else stops.push(`${N} ${Math.min(100, now + f)}%`);
  stops.push(`${N} 100%`);
  const open = t.tl.stops;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ position: 'relative', paddingTop: 20 }}>
        <div role="img" aria-label={L('中转时间进度', '轉機時間進度', 'Transfer time progress')} style={{ height: 8, borderRadius: 4, transition: 'background .4s', background: `linear-gradient(90deg, ${stops.join(', ')})` }} />
        {open.map((s, i) => (
          <div key={s.item.uid} title={`${pname(s.place)} ${hm(s.arrive)}`} style={{ position: 'absolute', left: `${pct(s.arrive)}%`, top: 0, transform: 'translateX(-50%)', display: 'grid', justifyItems: 'center' }}>
            <span style={{ width: 16, height: 16, borderRadius: 8, fontSize: 10, fontWeight: 700, lineHeight: '16px', textAlign: 'center', background: C.gold, color: '#fff', boxShadow: '0 0 0 2px #fff' }}>{i + 1}</span>
            <span style={{ width: 2, height: 12, background: '#fff', marginTop: 1, borderRadius: 1, boxShadow: '0 0 0 1px rgba(0,0,0,.18)' }} />
          </div>
        ))}
        <div aria-hidden="true" style={{ position: 'absolute', left: `${now}%`, top: 16, transform: 'translateX(-50%)', width: 3, height: 18, borderRadius: 2, background: C.ink }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.muted, marginTop: 4, fontFamily: mono }}>
        <span>{hm(start)} {L('落地', '落地', 'landed')}</span><span style={{ display: 'flex', gap: 10 }}><Key c={Y} l={L('已安排', '已排', 'Planned')} /><span>{hm(endT)} {L('登机', '登機', 'boarding')}</span></span>
      </div>


    </div>
  );
};
const Key = ({ c, l }: { c: string; l: string }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}</span>
);
