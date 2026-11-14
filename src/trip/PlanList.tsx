import React, { useState } from 'react';
import { dur, floorLabel, hm, placeOf, pname } from './data';
import { L, useLang } from './i18n';
import { Trip } from './store';
import { C, catIcon, Icon } from './ui';

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
        <strong style={{ fontSize: 15 }}>{L('我的行程', '我嘅行程', 'My plan')}</strong>
        <span style={{ fontSize: 12, color: C.muted }}>
          {L(`${openStops.length} 项待完成`, `仲有 ${openStops.length} 項`, `${openStops.length} to go`)}
          {done.length > 0 && <button onClick={() => setShowDone(!showDone)} style={{ marginLeft: 8, border: 'none', background: 'none', color: C.jade, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>{showDone ? L('隐藏已完成', '收埋做完嘅', 'Hide done') : L(`显示已完成 ${done.length} 项`, `睇返做完嘅 ${done.length} 項`, `Show ${done.length} done`)}</button>}
        </span>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {t.atSec && (
          <Row icon="info" title={L('转机安检', '轉機安檢', 'Transfer security')} lock
            sub={t.bag === 'ok'
              ? L(`行李已直挂，无需提取 · 预估占用 ${dur(t.pre)}（含排队约 ${t.secWait} 分）`, `行李已經直掛，唔使攞 · 預計用 ${dur(t.pre)}（排隊大約 ${t.secWait} 分鐘）`, `Bags checked through · est. ${dur(t.pre)} incl. ~${t.secWait} min queue`)
              : L(`行李状态待确认 · 预估占用 ${dur(t.pre)}`, `行李未確認 · 預計用 ${dur(t.pre)}`, `Baggage unconfirmed · est. ${dur(t.pre)}`)} />
        )}
        {showDone && done.map((p) => {
          const pl = placeOf(p.id);
          return <Row key={p.uid} icon="check" title={`${L('已完成', '做完', 'Done')} · ${pl ? pname(pl) : ''}`} sub={L(`停留 ${p.used ?? 0} 分`, `逗留 ${p.used ?? 0} 分鐘`, `Stayed ${p.used ?? 0} min`)} faded />;
        })}
        {openStops.map((s, k) => {
          // Return buffer: the current stop continues, later ones are paused (grey). After it: all paused.
          const paused = t.phase === 'go' || (t.phase === 'buffer' && k > 0);
          const ready = s.item.readyAt !== undefined && t.clock >= s.item.readyAt;
          const extra = s.item.readyAt !== undefined ? (ready ? L(' · 可取餐', ' · 可以攞餐', ' · ready') : L(` · 约 ${hm(s.item.readyAt)} 可取`, ` · 大約 ${hm(s.item.readyAt)} 攞得`, ` · ready ~${hm(s.item.readyAt)}`)) : '';
          return (
            <div key={s.item.uid} data-uid={s.item.uid}
              style={{ display: 'flex', gap: 10, alignItems: 'center', background: paused ? C.grey : C.paper, opacity: paused ? 0.6 : 1, border: `1px solid ${dragUid === s.item.uid ? C.jade : C.line}`, borderRadius: 14, padding: 10, boxShadow: dragUid === s.item.uid ? '0 8px 20px rgba(0,60,58,.18)' : 'none', transform: dragUid === s.item.uid ? 'scale(1.02)' : 'none', transition: 'transform .12s, box-shadow .12s', userSelect: 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: C.jadeSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={catIcon[s.place.cat]} s={18} c={C.jade} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{k + 1}. {pname(s.place)}</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {s.item.orderText ? `${s.item.orderText} · ` : ''}{paused ? L('已暂停，不计 Asia Miles', '暫停咗，唔計 Asia Miles', 'Paused, no Asia Miles') : <>{floorLabel(s.place.floor)} · {L(`约 ${hm(s.arrive)} 到`, `大約 ${hm(s.arrive)} 到`, `arrive ~${hm(s.arrive)}`)} · {L('预估占用', '預計用', 'est.')} {dur(s.walk + s.stay)}{extra}</>}
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
        {!openStops.length && !t.atSec && (
          <div style={{ fontSize: 13, color: C.muted, background: C.paper, borderRadius: 14, padding: 14, border: `1px dashed ${C.line}` }}>{L('还没有安排，可以到探索里挑选。', '未有安排，可以去探索揀吓。', 'Nothing planned yet. Pick places in Explore.')}</div>
        )}
        <Row icon="arrow" title={L(`${t.gateName} 号登机口`, `${t.gateName} 號登機閘口`, `Gate ${t.gateName}`)} lock
          sub={L(`约 ${hm(t.tl.end + t.tl.toGate)} 到 · 步行约 ${t.walkGate} 分 · ${hm(t.dep - t.boardBuffer)} 开始登机`, `大約 ${hm(t.tl.end + t.tl.toGate)} 到 · 行大約 ${t.walkGate} 分鐘 · ${hm(t.dep - t.boardBuffer)} 開始登機`, `arrive ~${hm(t.tl.end + t.tl.toGate)} · ${t.walkGate} min walk · boarding ${hm(t.dep - t.boardBuffer)}`)} />
      </div>
    </section>
  );
};

const Row = ({ icon, title, sub, lock, faded }: { icon: string; title: string; sub: string; lock?: boolean; faded?: boolean }) => (
  <div style={{ display: 'flex', gap: 10, alignItems: 'center', background: lock ? C.bg : C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 10, opacity: faded ? 0.6 : 1 }}>
    <div style={{ width: 34, height: 34, borderRadius: 10, background: lock ? '#DDE7E5' : C.grey, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={icon} s={18} c={C.jade} /></div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: 12, color: C.muted }}>{sub}</div>
    </div>
    {lock && <span aria-label={L('固定顺序', '固定次序', 'Fixed')} style={{ color: C.muted, flexShrink: 0 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span>}
  </div>
);
