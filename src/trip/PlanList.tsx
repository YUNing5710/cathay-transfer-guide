import React, { useState } from 'react';
import { dur, floorLabel, hm, nameOf, placeOf, pname } from './data';
import { L, useLang } from './i18n';
import { Trip } from './store';
import { C, ease, Icon, T } from './ui';
import { PlaceMark } from './marks';

export const PlanList = ({ t }: { t: Trip }) => {
  useLang();
  const [showDone, setShowDone] = useState(false);
  const [dragUid, setDragUid] = useState<number | null>(null);
  const openStops = t.tl.stops;
  const done = t.plan.filter((p) => p.done);
  const move = (uid: number, toUid: number) => {
    if (uid === toUid) return;
    t.setPlan((arr) => {
      const c = [...arr];
      const i = c.findIndex((x) => x.uid === uid), j = c.findIndex((x) => x.uid === toUid);
      if (i < 0 || j < 0 || c[j].done) return arr;
      const [it] = c.splice(i, 1); c.splice(j, 0, it); return c;
    });
  };
  const shift = (uid: number, d: number) => {
    const k = openStops.findIndex((s) => s.item.uid === uid);
    const o = openStops[k + d]; if (o) move(uid, o.item.uid);
  };
  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 2px 8px', gap: 8 }}>
        <strong style={{ fontSize: T.md }}>{L('行程', '行程', 'Plan')}</strong>
        <span style={{ fontSize: 12, color: C.muted }}>
          {L(`${openStops.length} 项待完成`, `仲有 ${openStops.length} 項`, `${openStops.length} to go`)}
          {done.length > 0 && <button onClick={() => setShowDone(!showDone)} style={{ marginLeft: 8, border: 'none', background: 'none', color: C.jade, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>{showDone ? L('隐藏已完成', '收埋做完嘅', 'Hide done') : L(`显示已完成 ${done.length} 项`, `睇返做完嘅 ${done.length} 項`, `Show ${done.length} done`)}</button>}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {t.atSec && t.steps.slice(t.posIdx).map((id, i) => (
          <Row key={id} mark={id} title={nameOf(id)} lock active={i === 0}
            sub={i === 0 ? L(`当前 · 约 ${t.stepNow} 分`, `而家 · 大約 ${t.stepNow} 分鐘`, `Now · ~${t.stepNow} min`) : L('之后', '跟住', 'Then')} />
        ))}
        {showDone && done.map((p) => {
          const pl = placeOf(p.id);
          return <Row key={p.uid} mark={p.id} title={pl ? pname(pl) : ''} sub={L(`已完成 · ${p.used ?? 0} 分`, `做完 · ${p.used ?? 0} 分鐘`, `Done · ${p.used ?? 0} min`)} faded />;
        })}
        {openStops.map((s, k) => {
          // Return buffer: the current stop continues, later ones are paused (grey). After it: all paused.
          const paused = t.phase === 'go' || (t.phase === 'buffer' && k > 0);
          const ready = s.item.readyAt !== undefined && t.clock >= s.item.readyAt;
          const extra = s.item.readyAt !== undefined ? (ready ? L(' · 可取餐', ' · 可以攞餐', ' · ready') : L(` · 约 ${hm(s.item.readyAt)} 可取`, ` · 大約 ${hm(s.item.readyAt)} 攞得`, ` · ready ~${hm(s.item.readyAt)}`)) : '';
          return (
            <div key={s.item.uid} data-uid={s.item.uid}
              style={{ display: 'flex', gap: 10, alignItems: 'center', background: paused ? C.grey : C.paper, opacity: paused ? 0.6 : 1, border: `1px solid ${dragUid === s.item.uid ? C.jade : C.line}`, borderRadius: 14, padding: '8px 10px', animation: `rise .3s ${ease}`, boxShadow: dragUid === s.item.uid ? '0 8px 20px rgba(0,60,58,.18)' : 'none', transform: dragUid === s.item.uid ? 'scale(1.02)' : 'none', transition: 'transform .12s, box-shadow .12s', userSelect: 'none' }}>
              <PlaceMark id={s.place.id} cat={s.place.cat} size={36} muted={paused} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: T.base, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pname(s.place)}</div>
                <div style={{ fontSize: T.xs, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.item.orderText ? `${s.item.orderText} · ` : ''}{paused ? L('已暂停，不计 Asia Miles', '暫停咗，唔計 Asia Miles', 'Paused, no Asia Miles') : <>{s.place.floor} · {hm(s.arrive)} · {dur(s.walk + s.stay)}{extra}</>}
                </div>
              </div>
              {openStops.length > 1 && t.phase === 'free' && (
                <span role="button" tabIndex={0} aria-label={L(`拖动调整 ${pname(s.place)} 的顺序`, `拖動調 ${pname(s.place)} 嘅次序`, `Drag to reorder ${pname(s.place)}`)}
                  onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); shift(s.item.uid, -1); } if (e.key === 'ArrowDown') { e.preventDefault(); shift(s.item.uid, 1); } }}
                  onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); setDragUid(s.item.uid); }}
                  onPointerMove={(e) => {
                    if (dragUid !== s.item.uid) return;
                    const row = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-uid]') as HTMLElement | null;
                    if (row) move(s.item.uid, Number(row.dataset.uid));
                  }}
                  onPointerUp={() => setDragUid(null)} onPointerCancel={() => setDragUid(null)}
                  style={{ width: 28, height: 34, display: 'grid', placeItems: 'center', cursor: dragUid === s.item.uid ? 'grabbing' : 'grab', touchAction: 'none', flexShrink: 0, color: C.muted }}>
                  <svg width="14" height="18" viewBox="0 0 14 18" fill="currentColor" aria-hidden="true">{[3, 9, 15].flatMap((y) => [4, 10].map((x) => <circle key={x + '-' + y} cx={x} cy={y} r="1.6" />))}</svg>
                </span>
              )}
              <button aria-label={L(`移除 ${pname(s.place)}`, `刪除 ${pname(s.place)}`, `Remove ${pname(s.place)}`)} onClick={() => t.removeUid(s.item.uid)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Icon n="x" s={16} c={C.muted} /></button>
            </div>
          );
        })}
        
        <Row mark="gate" title={L(`${t.gateName} 号登机口`, `${t.gateName} 號閘口`, `Gate ${t.gateName}`)} lock
          sub={L(`${hm(t.boardTime)} 登机 · 步行 ${t.walkGate} 分`, `${hm(t.boardTime)} 登機 · 行 ${t.walkGate} 分鐘`, `Boarding ${hm(t.boardTime)} · ${t.walkGate} min walk`)} />
      </div>
    </section>
  );
};

const Row = ({ mark, title, sub, lock, faded, active }: { mark: string; title: string; sub: string; lock?: boolean; faded?: boolean; active?: boolean }) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: active ? C.jadeSoft : lock ? 'transparent' : C.paper, border: `1px ${lock && !active ? 'dashed' : 'solid'} ${active ? 'transparent' : C.line}`, borderRadius: 14, padding: '8px 10px', opacity: faded ? 0.55 : 1, transition: 'background .25s' }}>
    {mark === 'gate'
      ? <div style={{ width: 36, height: 36, borderRadius: 11, background: C.jade, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n="arrow" s={18} c="#fff" w={2.4} /></div>
      : <PlaceMark id={mark} size={36} />}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: T.base, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: T.xs, color: active ? C.jade : C.muted }}>{sub}</div>
    </div>
    {lock && <span aria-label={L('固定顺序', '固定次序', 'Fixed')} style={{ color: C.faint, flexShrink: 0 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span>}
  </div>
);
