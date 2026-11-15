import React, { useState } from 'react';
import { Cat, CAT_LABEL, dur, floorLabel, PLACES, Place, pname, showerWait, waitMin } from './data';
import { L, tr, useLang } from './i18n';
import { Trip } from './store';
import { Chips, RouteGen } from './RouteGen';
import { btn, C, ease, Icon, MilesTag, T } from './ui';
import { PlaceMark } from './marks';

const CATS: ('全部' | Cat)[] = ['全部', '餐饮', '购物', '观光', '贵宾室', '设施', '服务'];

/** One short, factual line per place — the place itself is the headline. */
const blurb = (p: Place): string => {
  const d = tr(p.d).split('·').map((x) => x.trim()).filter((x) => !/国泰合作|國泰合作|Cathay partner|非合作|not a partner|Asia Miles|^免费$|^免費$|^Free$/i.test(x));
  return d[0] ?? '';
};

export const Explore = ({ t, openOrder, goHome }: { t: Trip; openOrder: (id?: string) => void; goHome: () => void }) => {
  useLang();
  const [cat, setCat] = useState<'全部' | Cat>('全部');
  const [ask, setAsk] = useState<Place | null>(null);
  const [gen, setGen] = useState(false);
  const list = PLACES.filter((p) => t.visible(p) && (cat === '全部' || p.cat === cat))
    .map((p) => ({ p, cost: t.costOf(p.id) }))
    .sort((a, b) => Number(!!b.p.partner) - Number(!!a.p.partner) || a.cost - b.cost);

  const addNow = (p: Place) => {
    if (p.partner && p.order) { openOrder(p.id); return; }
    t.add(p.id); t.note(L(`已加入 ${pname(p)}`, `加咗 ${pname(p)}`, `${pname(p)} added`)); goHome();
  };
  const tryAdd = (p: Place) => (t.has(p.id) ? setAsk(p) : addNow(p));

  return (
    <div style={{ padding: '12px 14px 16px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: T.lg, fontWeight: 800 }}>{L('探索', '探索', 'Explore')}</div>
          <div style={{ fontSize: T.xs, color: C.muted }}>{t.canAdd ? L(`可用 ${dur(Math.max(0, t.left))} · 按顺路排序`, `有 ${dur(Math.max(0, t.left))} · 按順路排`, `${dur(Math.max(0, t.left))} free · nearest first`) : L('返回缓冲中，暂不可添加', '返程緩衝中，暫時加唔到', 'Return buffer — adding paused')}</div>
        </div>
        {t.canAdd && !t.atSec && <button onClick={() => setGen(!gen)} aria-pressed={gen} style={{ ...btn(gen ? 'primary' : 'soft'), padding: '7px 12px', fontSize: T.sm }}>{L('一键规划', '一撳排好', 'Plan for me')}</button>}
      </div>
      {gen && <RouteGen t={t} onAdded={goHome} onClose={() => setGen(false)} />}
      <div style={{ ['--chip-fade' as string]: C.bg } as React.CSSProperties}>
        <Chips items={CATS.map((c) => ({ k: c, label: tr(CAT_LABEL[c]), on: cat === c }))} onPick={(k) => setCat(k as '全部' | Cat)} />
      </div>
      <div key={cat} style={{ display: 'grid', gap: 8 }}>
        {list.map(({ p, cost }, i) => {
          const full = p.access && p.access !== 'paid' && t.loungeFull;
          const fits = cost <= t.left && !full && t.canAdd;
          const added = t.plan.filter((x) => x.id === p.id && !x.done).length;
          const sw = p.shower ? showerWait(t.clock + 20, t.showerPeak) : null;
          const food = p.kitchen && p.partner ? waitMin(t.kitchens[p.id] ?? p.kitchen) : 0;
          const b = blurb(p);
          return (
            <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0, background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: '10px 10px 10px 10px', opacity: fits ? 1 : 0.62, animation: `rise .3s ${ease} ${Math.min(i, 8) * 0.025}s both`, transition: 'opacity .2s' }}>
              <PlaceMark id={p.id} cat={p.cat} size={44} muted={!fits} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: T.md, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{pname(p)}</span>
                  {p.partner && <span title="Cathay partner" style={{ flexShrink: 0, width: 16, height: 16, borderRadius: 8, background: C.jade, display: 'grid', placeItems: 'center' }}><Icon n="check" s={10} c="#fff" w={3} /></span>}
                  {added > 0 && <span style={tag(C.jade, C.jadeSoft)}>{L('已加', '加咗', 'Added')}{added > 1 ? ` ×${added}` : ''}</span>}
                </div>
                {b && <div style={{ fontSize: T.sm, color: C.muted, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: T.xs, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <span style={{ fontWeight: 700, color: C.ink }}>{p.floor}</span>
                  <span style={{ color: fits ? C.jade : C.red, fontWeight: 600 }}>{full ? L('满员', '爆滿', 'Full') : dur(cost)}</span>
                  {food > 0 && <span>{L(`出餐 ${food} 分`, `等 ${food} 分鐘`, `food ${food}m`)}</span>}
                  {sw && <span style={{ color: sw.level === 'calm' ? C.muted : C.gold }}>{L(`淋浴 ~${sw.wait} 分`, `沖涼 ~${sw.wait} 分`, `shower ~${sw.wait}m`)}</span>}
                  {p.free && <span>{L('免费', '免費', 'Free')}</span>}
                  {p.partner && <MilesTag t={t} n={p.miles} />}
                </div>
              </div>
              <button disabled={!fits} onClick={() => tryAdd(p)} aria-label={L(`加入 ${pname(p)}`, `加 ${pname(p)}`, `Add ${pname(p)}`)}
                style={{ width: 34, height: 34, borderRadius: 17, border: 'none', background: fits ? C.jade : C.grey, cursor: fits ? 'pointer' : 'not-allowed', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'background .2s' }}>
                <Icon n="plus" s={16} c={fits ? '#fff' : C.faint} w={2.4} />
              </button>
            </div>
          );
        })}
      </div>
      {ask && (
        <div role="dialog" style={{ position: 'absolute', inset: 0, background: 'rgba(10,28,27,.42)', zIndex: 70, display: 'grid', placeItems: 'center', padding: 24, animation: 'fade .2s ease' }} onClick={() => setAsk(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.paper, borderRadius: 20, padding: 18, width: '100%', maxWidth: 320, animation: `pop .3s ${ease}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><PlaceMark id={ask.id} cat={ask.cat} size={36} /><div style={{ fontSize: T.md, fontWeight: 700 }}>{L('再加一次？', '再加多次？', 'Add again?')}</div></div>
            <div style={{ fontSize: T.sm, color: C.muted, margin: '8px 0 14px' }}>{L(`${pname(ask)} 已在行程里，再加需 ${dur(t.costOf(ask.id))}`, `${pname(ask)} 已經喺行程，再加要 ${dur(t.costOf(ask.id))}`, `${pname(ask)} is planned; another visit takes ${dur(t.costOf(ask.id))}`)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => setAsk(null)}>{L('不用', '唔使', 'No')}</button>
              <button style={{ ...btn(), flex: 1 }} onClick={() => { const p = ask; setAsk(null); addNow(p); }}>{L('再加', '再加', 'Add')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const tag = (fg: string, bg: string): React.CSSProperties => ({ fontSize: T.xs, fontWeight: 600, color: fg, background: bg, padding: '1px 6px', borderRadius: 6, flexShrink: 0 });
void floorLabel;
