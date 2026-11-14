import React, { useState } from 'react';
import { Cat, CAT_LABEL, dur, floorLabel, PLACES, Place, pname, pnote, SHOWER_LABEL, showerWait, waitMin } from './data';
import { L, tr, useLang } from './i18n';
import { Trip } from './store';
import { RouteGen, chip } from './RouteGen';
import { btn, C, catIcon, Icon, MilesTag } from './ui';

const CATS: ('全部' | Cat)[] = ['全部', '餐饮', '购物', '观光', '贵宾室', '设施', '服务'];

export const Explore = ({ t, openOrder, goHome }: { t: Trip; openOrder: (id?: string) => void; goHome: () => void }) => {
  useLang();
  const [cat, setCat] = useState<'全部' | Cat>('全部');
  const [ask, setAsk] = useState<Place | null>(null);
  void useLang;
  const list = PLACES.filter((p) => t.visible(p) && (cat === '全部' || p.cat === cat))
    .map((p) => ({ p, cost: t.costOf(p.id) }))
    .sort((a, b) => Number(!!b.p.partner) - Number(!!a.p.partner) || a.cost - b.cost);

  const addNow = (p: Place) => {
    if (p.partner && p.order) { openOrder(p.id); return; }
    t.add(p.id); t.note(L(`已加入 ${pname(p)}`, `加咗 ${pname(p)}`, `${pname(p)} added`)); goHome();
  };
  const tryAdd = (p: Place) => (t.has(p.id) ? setAsk(p) : addNow(p));

  return (
    <div style={{ padding: '12px 14px 18px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 12, width: '100%', overflowX: 'hidden' }}>
      <RouteGen t={t} onAdded={goHome} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CATS.map((c) => <button key={c} aria-pressed={cat === c} onClick={() => setCat(c)} style={{ ...chip(cat === c), flex: '0 0 auto' }}>{tr(CAT_LABEL[c])}</button>)}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {list.map(({ p, cost }) => {
          const full = p.access && p.access !== 'paid' && t.loungeFull;
          const fits = cost <= t.left && !full && t.canAdd;
          const added = t.plan.filter((x) => x.id === p.id && !x.done).length;
          const sw = p.shower ? showerWait(t.clock + 20, t.showerPeak) : null;
          return (
            <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0, background: fits ? C.paper : C.grey, border: `1px solid ${C.line}`, borderRadius: 14, padding: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: fits ? C.jadeSoft : '#DDE2E1', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={catIcon[p.cat]} c={fits ? C.jade : C.muted} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {pname(p)}
                  {p.free && <span style={tag(C.jade, C.jadeSoft)}>{L('免费', '免費', 'Free')}</span>}
                  {p.partner && <span style={tag(C.jade, C.jadeSoft)}>{L('国泰合作', '國泰合作', 'Cathay partner')}</span>}
                  {p.partner && <MilesTag t={t} n={p.miles} />}
                  {added > 0 && <span style={tag(C.muted, C.bg)}>{L('已添加', '加咗', 'Added')}{added > 1 ? ` ×${added}` : ''}</span>}
                  {sw && <span style={tag(sw.level === 'calm' ? C.jade : C.gold, sw.level === 'calm' ? C.jadeSoft : C.goldSoft)}>{L('淋浴', '沖涼', 'Shower')} {tr(SHOWER_LABEL[sw.level])} · ~{sw.wait} min</span>}
                </div>
                <div style={{ fontSize: 12, color: fits ? C.muted : C.red, marginTop: 2 }}>
                  {full ? L('当前满员', '而家爆滿', 'Full right now') : `${floorLabel(p.floor)} · ${L('预估占用', '預計用', 'est.')} ${dur(cost)}${p.kitchen && p.partner ? L(`（出餐约 ${waitMin(t.kitchens[p.id] ?? p.kitchen)} 分）`, `（等餐大約 ${waitMin(t.kitchens[p.id] ?? p.kitchen)} 分鐘）`, ` (food ~${waitMin(t.kitchens[p.id] ?? p.kitchen)} min)`) : ''} · ${pnote(p)}`}
                  {!full && !fits && t.canAdd && L(` · 还差 ${dur(cost - Math.max(0, t.left))}`, ` · 差 ${dur(cost - Math.max(0, t.left))}`, ` · ${dur(cost - Math.max(0, t.left))} short`)}
                  {!t.canAdd && L(' · 返回缓冲中，不能再添加', ' · 返程緩衝中，唔加得', ' · return buffer, cannot add')}
                </div>
                {sw && sw.wait >= 45 && t.left < 120 && <div style={{ fontSize: 12, color: C.gold, marginTop: 2 }}>{L('淋浴高峰排队较长，可支配不足 2 小时时不建议去洗澡', '沖涼排長龍，唔夠 2 個鐘就唔好去喇', 'Long shower queue. Not advised with under 2 h free')}</div>}
              </div>
              <button disabled={!fits} onClick={() => tryAdd(p)} aria-label={L(`加入 ${pname(p)}`, `加 ${pname(p)}`, `Add ${pname(p)}`)}
                style={{ width: 34, height: 34, borderRadius: 17, border: `1px solid ${C.line}`, background: C.paper, cursor: fits ? 'pointer' : 'not-allowed', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon n="plus" s={16} c={fits ? C.jade : C.muted} />
              </button>
            </div>
          );
        })}
      </div>
      {ask && (
        <div role="dialog" style={{ position: 'absolute', inset: 0, background: 'rgba(10,25,24,.45)', zIndex: 70, display: 'grid', placeItems: 'center', padding: 24 }} onClick={() => setAsk(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: C.paper, borderRadius: 16, padding: 16, width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{L(`「${pname(ask)}」已添加`, `「${pname(ask)}」已經加咗`, `${pname(ask)} is already added`)}</div>
            <div style={{ fontSize: 13, color: C.muted, margin: '6px 0 14px' }}>{L(`是否还要再添加一次？会多占用 ${dur(t.costOf(ask.id))}。`, `仲要再加多次？會多用 ${dur(t.costOf(ask.id))}。`, `Add it again? It takes another ${dur(t.costOf(ask.id))}.`)}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => setAsk(null)}>{L('不用了', '唔使喇', 'No')}</button>
              <button style={{ ...btn(), flex: 1 }} onClick={() => { const p = ask; setAsk(null); addNow(p); }}>{L('再添加一次', '再加多次', 'Add again')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const tag = (fg: string, bg: string): React.CSSProperties => ({ fontSize: 11, fontWeight: 600, color: fg, background: bg, padding: '1px 6px', borderRadius: 6 });
