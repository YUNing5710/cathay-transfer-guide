import React from 'react';
import { C } from './ui';

/**
 * One mark per place, drawn to say what the place IS rather than its category:
 * McDonald's is the arches, a noodle bar is a bowl with noodles, Chanel is the interlocking C, and so on.
 * 24×24 grid, 1.8 stroke, on a tinted tile in the brand's own colour family.
 */
type G = { d: React.ReactNode; tile: string; ink: string };
const s = (d: string, o?: React.SVGProps<SVGPathElement>) => <path d={d} {...o} />;
const f = (d: string, c: string) => <path d={d} fill={c} stroke="none" />;
const dot = (x: number, y: number, r: number, c: string) => <circle cx={x} cy={y} r={r} fill={c} stroke="none" />;

const bowl = 'M4 11.5h16M5 11.5c0 4.2 3.1 7.5 7 7.5s7-3.3 7-7.5M9 19.5h6';
const MARKS: Record<string, G> = {
  // ---- dining
  mcd: { tile: '#FFE9E6', ink: '#DA291C', d: <>{f('M3.6 19.5 5.9 7.8C6.5 4.4 9.8 4.4 10.4 7.8L12 14l1.6-6.2c.6-3.4 3.9-3.4 4.5 0l2.3 11.7h-2.6L15.9 9.4c-.1-.7-.6-.7-.7 0L13 19.5h-2L8.8 9.4c-.1-.7-.6-.7-.7 0L6.2 19.5z', '#FFC72C')}</> },
  kfc: { tile: '#FDE8E6', ink: '#B3261E', d: <>{s('M6 9.5h12l-1.6 10.5H7.6z')}{s('M9.5 9.5 9 20M14.5 9.5 15 20', { opacity: 0.5 })}{s('M8 9.5c-.6-2.2.4-3.6 2-3.6.4-1.8 3.6-1.8 4 0 1.6 0 2.6 1.4 2 3.6')}</> },
  pc: { tile: '#F4E8DE', ink: '#7A3E1D', d: <>{s('M5 9.5h11v4.5a5.5 5.5 0 0 1-11 0z')}{s('M16 11h1.6a2 2 0 0 1 0 4H16')}{s('M8.5 3.5c-.9 1.1.9 2 0 3.2M12 3.5c-.9 1.1.9 2 0 3.2')}{s('M4 20.5h13')}</> },
  sbux: { tile: '#E2F1E9', ink: '#00704A', d: <>{s('M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z')}{f('M12 7.2l1.3 2.8 3 .3-2.3 2 .7 3L12 13.8l-2.7 1.5.7-3-2.3-2 3-.3z', '#00704A')}</> },
  lady: { tile: '#FCEEF2', ink: '#A8456B', d: <>{s('M4 19h16')}{s('M5 19v-6.5l7-4.5 7 4.5V19')}{s('M5 15h14M5 17h14', { opacity: 0.6 })}{dot(12, 6, 1.4, '#A8456B')}</> },
  tsui: { tile: '#FFF1D9', ink: '#B5651D', d: <>{s('M6 9h10v7a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z')}{s('M16 11h1.5a2 2 0 0 1 0 4H16')}{s('M8.5 12.5h5', { opacity: 0.6 })}{s('M9 4c-.7 1 .7 2 0 3M12.5 4c-.7 1 .7 2 0 3')}</> },
  hhk: { tile: '#FDEBDD', ink: '#B5501D', d: <>{s(bowl)}{s('M7 11.5c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6')}{s('M9.5 9.2c.8.7 1.6.7 2.5 0s1.7-.7 2.5 0', { opacity: 0.6 })}{s('M17 3.5 14.5 8')}</> },
  jd: { tile: '#FFF1D9', ink: '#9C5B12', d: <>{s(bowl)}{s('M7.5 14c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0M8 16.2c1.3.9 2.7.9 4 0s2.7-.9 4 0', { opacity: 0.65 })}{s('M8.5 8c0-1.3 1-1.8 1-3.3M12 8c0-1.3 1-1.8 1-3.3', { opacity: 0.6 })}</> },
  cj: { tile: '#EDF3E4', ink: '#4D6B2A', d: <>{s('M4.5 16.5c0-5 3.4-8 7.5-8s7.5 3 7.5 8z')}{s('M12 8.5c-.9-1.2.9-2.2 0-3.6')}{s('M8.5 16.5c.6-2.6 1.6-4.2 3.5-5.8M15.5 16.5c-.6-2.6-1.6-4.2-3.5-5.8M12 16.5v-5', { opacity: 0.65 })}{s('M3.5 19.5h17')}</> },
  ajisen: { tile: '#FDE8E6', ink: '#B3261E', d: <>{s(bowl)}{s('M7.5 14c1.5 1 3 1 4.5 0s3-1 4.5 0', { opacity: 0.7 })}{dot(9, 9.6, 1.4, '#E8A33D')}{s('M14 3.2 11.8 10M17.6 4.2 14 10')}</> },
  tap: { tile: '#FFF1D9', ink: '#A6670A', d: <>{s('M6 8h9v11a1.5 1.5 0 0 1-1.5 1.5h-6A1.5 1.5 0 0 1 6 19z')}{s('M15 10.5h1.6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H15')}{s('M5.6 8c-.4-2 1.4-3.3 3-2.6.9-1.7 4-1.7 4.8 0 1.4 0 2.2 1.2 1.6 2.6')}{s('M9 12v5M12 12v5', { opacity: 0.55 })}</> },
  sushi: { tile: '#FDECE8', ink: '#C0482B', d: <>{s('M3.5 15.5h17a2 2 0 0 1-2 2.5h-13a2 2 0 0 1-2-2.5z')}{f('M6 15.5c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5z', '#F6B9A7')}{s('M6 15.5c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5')}{s('M9 12.2l1.5 3.3M13 11.2l1.4 4.3', { opacity: 0.6 })}</> },
  oldtown: { tile: '#F3E8DE', ink: '#6B3A1E', d: <>{s('M6 8.5h10l-1 11H7z')}{s('M16 10.5h1.5a2 2 0 0 1 0 4H15.6')}{f('M6.4 12h9.2l-.3 3H6.7z', '#E9D7C3')}{s('M9 4.5c-.6.8.6 1.6 0 2.5M12.5 4.5c-.6.8.6 1.6 0 2.5')}</> },
  yoshi: { tile: '#FFEFD6', ink: '#D35400', d: <>{s(bowl)}{f('M6.2 11.5c.8-2 3-3 5.8-3s5 1 5.8 3z', '#F7C27B')}{s('M8.5 10c1-.6 2-.6 3 0s2 .6 3 0', { opacity: 0.6 })}{s('M15.5 3 13 9M18.5 4 15 9')}</> },
  teawood: { tile: '#EDF3E4', ink: '#4D6B2A', d: <>{s('M7 7.5h10l-1.3 12a1 1 0 0 1-1 .9H9.3a1 1 0 0 1-1-.9z')}{s('M6 7.5h12')}{s('M13 7.5l2.2-4.3')}{dot(10, 17, 1, '#4D6B2A')}{dot(12.2, 17.8, 1, '#4D6B2A')}{dot(14.2, 16.8, 1, '#4D6B2A')}</> },
  mx: { tile: '#FDE8E6', ink: '#C8102E', d: <>{s('M3.5 18.5 7 6l5 8 5-8 3.5 12.5')}</> },
  // ---- shopping
  beauty: { tile: '#FCEEF2', ink: '#A8456B', d: <>{s('M8 9.5h8V20H8z')}{s('M10 9.5V6.5h4v3')}{s('M11 6.5V4h2v2.5')}{s('M10 14.5h4', { opacity: 0.6 })}</> },
  lv: { tile: '#F3ECE2', ink: '#6B4A2A', d: <>{s('M4.5 5v12.5h5')}{s('M12.5 5l3.7 12.5L20 5')}</> },
  gucci: { tile: '#EAF1E8', ink: '#2E5B34', d: <>{s('M12.5 7.5a5 5 0 1 0 0 9H15v-3h-2.5')}{s('M11.5 7.5a5 5 0 1 1 0 9', { opacity: 0.5 })}</> },
  chanel: { tile: '#EFEFF1', ink: '#1E1E24', d: <>{s('M10.2 7.4a5 5 0 1 0 0 9.2')}{s('M13.8 7.4a5 5 0 1 1 0 9.2')}</> },
  hermes: { tile: '#FDEAD6', ink: '#E35205', d: <>{s('M5 9.5h14v10H5z')}{s('M9 9.5V7.2a3 3 0 0 1 6 0v2.3')}{s('M5 13.5h14')}{s('M11 13.5v2h2v-2')}</> },
  cartier: { tile: '#FCE9EA', ink: '#9E1B32', d: <>{s('M8.5 3.5h7l-1 3h-5z')}{s('M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14z')}{s('M12 11v3l2 1.2')}</> },
  ctf: { tile: '#FFF3D6', ink: '#A87800', d: <>{s('M12 20a6 6 0 1 0 0-12 6 6 0 0 0 0 12z')}{f('M9 8l3-4.5L15 8z', '#E8C15A')}{s('M9 8l3-4.5L15 8')}</> },
  liquor: { tile: '#F1ECF7', ink: '#6A3E8C', d: <>{s('M10 3h4v4l2 3v10.5H8V10l2-3z')}{f('M8.3 13h7.4v4H8.3z', '#D9C8E8')}{s('M8 13h8M8 17h8')}</> },
  pen: { tile: '#FFF3D6', ink: '#9C6B00', d: <>{s('M12 20a7 7 0 1 0 0-14 7 7 0 0 0 0 14z')}{s('M12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z', { opacity: 0.6 })}{s('M12 6v3.5M12 16.5V20M6 13h3.5M14.5 13H18', { opacity: 0.45 })}</> },
  muji: { tile: '#F4EEE6', ink: '#7B1E1E', d: <>{s('M4 6.5h16v13H4z')}{s('M4 10.5h16')}{s('M10 14h4')}</> },
  books: { tile: '#E6EEF7', ink: '#2A4F7A', d: <>{s('M4 5.5c2.5-1 5.5-1 8 1 2.5-2 5.5-2 8-1V19c-2.5-1-5.5-1-8 1-2.5-2-5.5-2-8-1z')}{s('M12 6.5V20')}</> },
  kee: { tile: '#FDEED6', ink: '#B5651D', d: <>{s('M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z')}{dot(9.3, 10.5, 1.2, '#3A2A1A')}{dot(14.7, 10.5, 1.2, '#3A2A1A')}{s('M10.5 14.5c1 .8 2 .8 3 0')}{f('M5.5 7.2a2.2 2.2 0 1 0 3-3zM18.5 7.2a2.2 2.2 0 1 1-3-3z', '#3A2A1A')}</> },
  // ---- sights
  apron: { tile: '#E3EEF7', ink: '#1F5E8C', d: <>{s('M3 5h18v11H3z')}{s('M12 5v11', { opacity: 0.4 })}{f('M5.5 12.5l5.5-2.8 6.5 1.3-1.5 1.1-3.9-.5-1.8 2.4H9.2l.6-2.6-2.6.7z', '#1F5E8C')}{s('M3 20h18')}</> },
  art: { tile: '#F6EBF5', ink: '#8A3E87', d: <>{s('M12 3a9 9 0 0 0 0 18c1.2 0 1.8-1 1.3-2-.6-1.2.2-2.5 1.6-2.5H18a3 3 0 0 0 3-3C21 7 17 3 12 3z')}{dot(8, 10.5, 1.3, '#E35D5D')}{dot(11.5, 7.3, 1.3, '#E8A33D')}{dot(15.5, 8.5, 1.3, '#2E9488')}</> },
  cam: { tile: '#E3EEF7', ink: '#1F5E8C', d: <>{s('M3 16h18')}{s('M5 16v-5M19 16v-5')}{s('M3 11c3-2 6-3 9-3s6 1 9 3')}{s('M9 20.5l1.5-4.5M15 20.5l-1.5-4.5')}{f('M10 5.6l3.2-1.6 2.6.6-.8.7-1.9-.2-1 1.3h-.7l.3-1.3-1.5.4z', '#1F5E8C')}</> },
  // ---- lounges
  lounge: { tile: '#E3F0EE', ink: '#006564', d: <>{s('M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3')}{s('M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z')}{s('M6 17v2.5M18 17v2.5')}</> },
  wing: { tile: '#F6EED6', ink: '#8A5D00', d: <>{s('M3.5 14.5c4.5-1 7.5-3.8 9-8.5 1.3 4.7 4 7.5 8 8.5')}{s('M3.5 14.5c3.2.4 6 1.6 9 4.5 3-2.9 5.5-4.1 8-4.5')}{dot(12.5, 4.2, 1.2, '#8A5D00')}</> },
  plaza: { tile: '#EDEAF6', ink: '#4B3F8C', d: <>{s('M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3')}{s('M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z')}{s('M10 9h4')}</> },
  // ---- facilities and services
  charge: { tile: '#E3F0EE', ink: '#006564', d: <>{s('M5 7.5h12a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z')}{s('M21 10.5v3')}{f('M11.8 8.8 8.8 12.6h2.6l-1 3 3-3.8h-2.6z', '#006564')}</> },
  wc6: { tile: '#E8EEF2', ink: '#3E5566', d: <>{dot(8, 5.5, 1.6, '#3E5566')}{dot(16, 5.5, 1.6, '#3E5566')}{s('M6.5 9.5h3l.5 5.5h-1v4.5H7V15H6zM14 9.5h4l1.2 5.5H18v4.5h-2.5V15H13z')}{s('M12 4v16', { opacity: 0.4 })}</> },
  prayer: { tile: '#EDEAF6', ink: '#4B3F8C', d: <>{s('M12 3c1.5 2 1.5 4 0 6-1.5-2-1.5-4 0-6z')}{s('M6 20v-6a6 6 0 0 1 12 0v6')}{s('M4 20h16')}</> },
  desk: { tile: '#E3F0EE', ink: '#006564', d: <>{s('M3 11.5h18')}{s('M5 11.5V20M19 11.5V20')}{s('M12 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z')}{s('M8 11.5a4 4 0 0 1 8 0')}</> },
  belt: { tile: '#E8EEF2', ink: '#3E5566', d: <>{s('M3 16.5h18a2 2 0 0 1 0 3H3a2 2 0 0 1 0-3z')}{s('M7 8.5h6v8H7zM9 8.5V6.5h2v2')}{s('M14.5 11h4v5.5h-4z', { opacity: 0.6 })}</> },
  immig: { tile: '#E6EEF7', ink: '#2A4F7A', d: <>{s('M6 3h12v18H6z')}{s('M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z')}{s('M9 17h6')}</> },
  checkin: { tile: '#E3F0EE', ink: '#006564', d: <>{s('M4 9h16v9H4z')}{s('M4 13h16', { opacity: 0.5 })}{s('M8 9V6.5h8V9')}{s('M15 4l2 2.5', { opacity: 0.6 })}</> },
};
MARKS.wc5 = MARKS.wc6;
MARKS.sec = { tile: '#E3F0EE', ink: '#006564', d: <>{s('M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z')}{s('M9 12l2 2 4-4')}</> };
MARKS.dsec = MARKS.sec;

const CAT_FALLBACK: Record<string, G> = {
  餐饮: { tile: C.jadeSoft, ink: C.jade, d: <>{s('M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 2-2 6 0 8v10')}</> },
  购物: { tile: C.jadeSoft, ink: C.jade, d: <>{s('M6 8h12l-1 12H7zM9 8a3 3 0 0 1 6 0')}</> },
  观光: { tile: C.jadeSoft, ink: C.jade, d: <>{s('M4 8h4l2-2h4l2 2h4v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z')}</> },
  贵宾室: { tile: C.jadeSoft, ink: C.jade, d: <>{s('M5 8h11v6a5 5 0 0 1-10 0zM16 10h2a2 2 0 0 1 0 4h-2')}</> },
  设施: { tile: C.jadeSoft, ink: C.jade, d: <>{s('M13 3 5 14h6l-1 7 8-11h-6z')}</> },
  服务: { tile: C.jadeSoft, ink: C.jade, d: <>{s('M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5')}</> },
};

export const PlaceMark = ({ id, cat = '服务', size = 40, muted }: { id: string; cat?: string; size?: number; muted?: boolean }) => {
  const g = MARKS[id] ?? CAT_FALLBACK[cat] ?? CAT_FALLBACK.服务;
  const ink = muted ? C.faint : g.ink;
  const icon = Math.round(size * 0.6);
  return (
    <div aria-hidden="true" style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: muted ? C.grey : g.tile, display: 'grid', placeItems: 'center', flexShrink: 0, filter: muted ? 'grayscale(1)' : undefined, opacity: muted ? 0.7 : 1, transition: 'filter .2s, opacity .2s' }}>
      <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">{g.d}</svg>
    </div>
  );
};
