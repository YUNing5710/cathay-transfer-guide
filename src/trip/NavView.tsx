import React, { useEffect, useState } from 'react';
import { ALL, dur, Floor, floorLabel, FLOOR_ORDER, LIFT, nameOf, PLACES, pname } from './data';
import { L, tr, useLang } from './i18n';
import { Trip } from './store';
import { btn, C, mono } from './ui';
import { Arrow3D, bearingOf, SensorHint, useHeading } from './Arrow3D';
import { ZoomArea } from './ZoomArea';
import { targetOf, useLeg } from './Home';

const W = 340, H = 220;
const px = (x: number) => 14 + (x / 100) * (W - 28);
const py = (y: number) => 14 + (y / 100) * (H - 28);

/**
 * Step-by-step navigation. Leg progress lives in the trip store, so the Home arrow and this screen
 * always point along the same current leg, turning only at each corner.
 */
export const MapView = ({ t, onArrive }: { t: Trip; onArrive: (id: string) => void }) => {
  useLang();
  const targetId = targetOf(t);
  const { r, leg: cur, legIdx: leg, prog, to, key } = useLeg(t, targetId);
  const fromId = t.atSec ? 'arr' : t.here;
  const here = ALL[fromId], target = ALL[to];
  const [running, setRunning] = useState(false);
  const [view, setView] = useState<Floor>(cur?.floor ?? here?.floor ?? 'L5');
  const compass = useHeading();
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { setRunning(false); setView(cur?.floor ?? here?.floor ?? 'L5'); }, [key]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const Lg = r.legs[leg];
      if (!Lg) { setRunning(false); return; }
      const step = Math.max(0.04, 18 / Math.max(15, Lg.meters));
      if (prog + step < 1) { t.setNav({ key, leg, prog: prog + step }); return; }
      if (leg + 1 >= r.legs.length) { setRunning(false); t.setNav({ key, leg, prog: 1 }); setTimeout(() => { t.markSim(); onArrive(to); }, 300); return; }
      setView(r.legs[leg + 1].floor);
      t.setNav({ key, leg: leg + 1, prog: 0 });
    }, 180);
    return () => clearInterval(id);
  }, [running, r, to, key, leg, prog]);

  if (!here || !target) return null;
  const pos = (() => {
    if (!cur) return { floor: target.floor, x: target.x, y: target.y, dir: 0 };
    const [[x1, y1], [x2, y2]] = cur.pts;
    return { floor: cur.floor, x: x1 + (x2 - x1) * prog, y: y1 + (y2 - y1) * prog, dir: bearingOf(x2 - x1, y2 - y1) };
  })();
  // Blue dot arrow: the way the phone faces when the sensor is on, else the walking direction.
  const faceDir = compass.state === 'on' ? compass.heading : pos.dir;
  const remain = Math.round(r.legs.slice(leg).reduce((s, l, i) => s + l.meters * (i === 0 ? 1 - prog : 1), 0) + (r.meters - r.legs.reduce((s, l) => s + l.meters, 0)));
  const floors: Floor[] = here.floor === target.floor ? [here.floor] : [here.floor, target.floor];
  const crossing = floors.length > 1;
  const legsOn = (f: Floor) => r.legs.filter((l) => l.floor === f && l.turn !== 'up' && l.turn !== 'down');
  const mode = !cur ? 'arrive' : cur.turn === 'up' ? 'up' : cur.turn === 'down' ? 'down' : 'walk';
  const angle = mode === 'walk' && cur ? pos.dir - (compass.state === 'on' ? compass.heading : 0) : 0;

  const floorSvg = (f: Floor) => (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={floorLabel(f)}>
      <rect x="6" y="6" width={W - 12} height={H - 12} rx="14" fill="#FFFFFF" stroke={f === view ? C.jade : '#9DB8B4'} strokeWidth="2" />
      <rect x="20" y={py(50) - 16} width={W - 40} height="32" rx="8" fill="#EAF1EF" />
      {(() => {
        const rank = (id: string) => (id === to ? 0 : t.has(id) ? 1 : 2);
        const ps = PLACES.filter((p) => p.floor === f && t.visible(p)).sort((a, b) => rank(a.id) - rank(b.id));
        const boxes: { x1: number; y1: number; x2: number; y2: number }[] = [];
        Object.entries(ALL).filter(([id, n]) => n.floor === f && (id.startsWith('g') || id === 'sec')).forEach(([id, n]) => {
          const w = nameOf(id).length * 9; boxes.push({ x1: px(n.x) - w / 2, y1: py(n.y) - 21, x2: px(n.x) + w / 2, y2: py(n.y) + 6 });
        });
        if (crossing) boxes.push({ x1: px(LIFT.x) - 13, y1: py(LIFT.y) - 13, x2: px(LIFT.x) + 13, y2: py(LIFT.y) + 28 });
        const hit = (b: typeof boxes[0]) => boxes.some((o) => b.x1 < o.x2 + 2 && b.x2 > o.x1 - 2 && b.y1 < o.y2 && b.y2 > o.y1);
        return ps.map((p) => {
          const x = px(p.x), y = py(p.y);
          const nm = pname(p);
          const ascii = /^[\x00-\x7f]+$/.test(nm);
          const label = ascii ? (nm.length > 12 ? nm.slice(0, 11) + '…' : nm) : (nm.length > 6 ? nm.slice(0, 6) : nm);
          const w = label.length * (ascii ? 6.2 : 11) + 2;
          let ty: number | null = null;
          for (const dy of [21, -13]) {
            const b = { x1: x - w / 2, y1: y + dy - 10, x2: x + w / 2, y2: y + dy + 2 };
            if (b.x1 >= 8 && b.x2 <= W - 8 && !hit(b)) { boxes.push(b); ty = dy; break; }
          }
          const hot = rank(p.id) < 2;
          return (
            <g key={p.id} transform={`translate(${x},${y})`}>
              <circle r={hot ? 8 : 5} fill="#fff" stroke={hot ? C.jade : C.mint} strokeWidth={hot ? 2 : 1.5} />
              {ty !== null && <text y={ty} fontSize="11" fontWeight={hot ? 700 : 400} textAnchor="middle" fill="#2F403E" stroke="#fff" strokeWidth="3" paintOrder="stroke">{label}</text>}
            </g>
          );
        });
      })()}
      {Object.entries(ALL).filter(([id, n]) => n.floor === f && (id.startsWith('g') || id === 'sec')).map(([id, n]) => (
        <g key={id} transform={`translate(${px(n.x)},${py(n.y)})`}>
          <rect x="-5" y="-5" width="10" height="10" rx="2" fill={id === t.gate || id === 'sec' ? C.jade : '#9DB8B4'} />
          <text y="-9" fontSize="11" textAnchor="middle" fill="#2F403E" stroke="#fff" strokeWidth="3" paintOrder="stroke">{nameOf(id)}</text>
        </g>
      ))}
      {crossing && (
        <g transform={`translate(${px(LIFT.x)},${py(LIFT.y)})`}>
          <rect x="-11" y="-11" width="22" height="22" rx="5" fill={C.gold} />
          <path d="M-6 5h3l6-9h3" stroke="#fff" strokeWidth="2" fill="none" />
          <text y="25" fontSize="11" textAnchor="middle" fill={C.gold} fontWeight="700" stroke="#fff" strokeWidth="3" paintOrder="stroke">{L('扶梯', '扶手電梯', 'Escalator')}</text>
        </g>
      )}
      {legsOn(f).map((l, i) => (
        <line key={i} x1={px(l.pts[0][0])} y1={py(l.pts[0][1])} x2={px(l.pts[1][0])} y2={py(l.pts[1][1])} stroke={r.legs.indexOf(l) < leg ? '#A9BDB9' : C.jade} strokeWidth="5" strokeLinecap="round" />
      ))}
      {target.floor === f && <g transform={`translate(${px(target.x)},${py(target.y)})`}><circle r="9" fill={C.gold} stroke="#fff" strokeWidth="2.5" /></g>}
      {pos.floor === f && (
        <g transform={`translate(${px(pos.x)},${py(pos.y)})`}>
          <circle r="18" fill="#1A73E8" opacity=".15"><animate attributeName="r" values="12;20;12" dur="1.6s" repeatCount="indefinite" /></circle>
          <g transform={`rotate(${faceDir})`}>
            <path d="M0 -15 L7 -4 L-7 -4 Z" fill="#1A73E8" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
          </g>
          <circle r="7.5" fill="#1A73E8" stroke="#fff" strokeWidth="3" />
        </g>
      )}
      <text x={W - 20} y={H - 16} fontSize="20" fontWeight="800" textAnchor="end" fill={f === view ? C.jade : '#6F8885'}>{f}</text>
    </svg>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', position: 'relative' }}>
      <div style={{ background: C.jade, color: '#fff', padding: '4px 14px 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flexShrink: 0, margin: '0 -10px 0 -14px' }}>
          <Arrow3D size={96} tilt={compass.state === 'on' ? compass.tilt : 58} mode={mode} angle={angle} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: mono, fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{cur ? (mode === 'walk' ? `${Math.round(cur.meters * (1 - prog))} ${L('米', '米', 'm')}` : mode === 'up' ? L('上扶梯', '上扶手電梯', 'Escalator up') : L('下扶梯', '落扶手電梯', 'Escalator down')) : L('已到达', '到咗', 'Arrived')}</div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{cur?.text ?? nameOf(to)}</div>
          {r.legs[leg + 1] && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{L('然后', '跟住', 'Then')} {r.legs[leg + 1].text}</div>}
          <div style={{ marginTop: 6 }}><SensorHint dark /></div>
        </div>
      </div>

      <div style={{ background: '#E7EEEC', padding: '4px 0 6px', position: 'relative' }}>
        <ZoomArea>
          <div style={{ display: 'grid', gridTemplateColumns: crossing ? 'minmax(0,1fr) auto minmax(0,1fr)' : 'minmax(0,1fr)', alignItems: 'center', padding: '0 6px' }}>
            {floors.map((f, i) => {
              const act = f === view;
              return (
                <React.Fragment key={f}>
                  {i === 1 && (
                    <div style={{ display: 'grid', justifyItems: 'center', gap: 2, fontSize: 11, fontWeight: 700, color: C.gold, padding: '0 2px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      {FLOOR_ORDER.indexOf(target.floor) > FLOOR_ORDER.indexOf(here.floor) ? L('扶梯上', '扶梯上', 'Up') : L('扶梯下', '扶梯落', 'Down')}
                    </div>
                  )}
                  <div onClick={() => setView(f)} role="button" aria-label={floorLabel(f)}
                    style={{ position: 'relative', height: crossing ? 150 : 200, perspective: 700, overflow: 'hidden', cursor: 'pointer', minWidth: 0 }}>
                    <div style={{ position: 'absolute', left: 4, top: 2, zIndex: 2, border: `1px solid ${act ? C.jade : C.line}`, background: act ? C.jade : 'rgba(255,255,255,.94)', color: act ? '#fff' : C.ink, borderRadius: 7, padding: '2px 7px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {f === here.floor ? L('当前 ', '而家 ', 'Now ') : L('目的地 ', '目的地 ', 'To ')}{f}
                    </div>
                    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 290, height: 188, marginLeft: -145, marginTop: -88,
                      transform: crossing ? 'scale(.6) rotateX(48deg) rotateZ(-16deg)' : 'scale(.92) rotateX(46deg) rotateZ(-18deg)',
                      opacity: act ? 1 : 0.55, transition: 'opacity .4s', borderRadius: 14, boxShadow: act ? '0 16px 26px rgba(0,60,58,.22)' : 'none' }}>
                      {floorSvg(f)}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </ZoomArea>
      </div>

      <div style={{ background: C.paper, borderTop: `1px solid ${C.line}`, padding: '12px 14px', display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <strong style={{ fontSize: 16, flex: 1, minWidth: 0 }}>{nameOf(to)}</strong>
          <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.jade }}>{L('步行约', '行大約', 'walk')} {dur(Math.max(1, Math.ceil(remain / t.pace)))}</span>
          <span style={{ fontSize: 13, color: C.muted }}>{remain} {L('米', '米', 'm')}</span>
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
          {r.legs.map((l, i) => (showAll || i === leg) && (
            <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: i < leg ? '#5E6F6C' : C.ink, fontWeight: i === leg ? 700 : 400 }}>
              <span style={{ width: 20, height: 20, borderRadius: 10, background: i < leg ? C.grey : i === leg ? C.jade : C.jadeSoft, color: i === leg ? '#fff' : C.jade, fontSize: 11, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{i < leg ? '✓' : i + 1}</span>
              <span style={{ flex: 1 }}>{l.text}</span>
              <span style={{ color: C.muted, fontWeight: 400 }}>{l.floor}</span>
            </li>
          ))}
        </ol>
        {r.legs.length > 1 && (
          <button onClick={() => setShowAll(!showAll)} style={{ border: 'none', background: 'none', color: C.jade, fontSize: 12, fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
            {showAll ? L('收起步骤', '收埋步驟', 'Fewer steps') : L(`查看全部 ${r.legs.length} 步`, `睇晒 ${r.legs.length} 步`, `All ${r.legs.length} steps`)}
          </button>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...btn(running ? 'ghost' : 'primary'), flex: 1 }} onClick={() => setRunning(!running)}>{running ? L('暂停导航', '暫停導航', 'Pause') : leg || prog ? L('继续导航', '繼續導航', 'Resume') : L('开始导航', '開始導航', 'Start')}</button>
          <button style={{ ...btn('ghost') }} onClick={() => onArrive(to)}>{L('已到达', '到咗', 'Arrived')}</button>
        </div>
      </div>
    </div>
  );
};
