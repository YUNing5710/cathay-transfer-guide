import React, { useMemo, useState } from 'react';
import { dur, pname } from './data';
import { L, tr, useLang } from './i18n';
import { Trip } from './store';
import { generate, markShown, Pref, PREFS } from './routes';
import { btn, C, ease, Icon, MilesTag, T } from './ui';
import { PlaceMark } from './marks';

/** One-tap route: pick preferences, it fills up to 80% of the free time and keeps 10 min spare. */
export const RouteGen = ({ t, onAdded, onClose, onExplore }: { t: Trip; onAdded?: () => void; onClose?: () => void; onExplore?: () => void }) => {
  useLang();
  const [prefs, setPrefs] = useState<Pref[]>(['mix']);
  const toggle = (k: Pref) => setPrefs((ps) => (ps.includes(k) ? (ps.length > 1 ? ps.filter((x) => x !== k) : ps) : [...ps, k]));
  const [seed, setSeed] = useState(0);
  const picks = useMemo(() => generate(t, prefs, seed), [prefs, seed, t.left, t.plan, t.loungeFull, t.member, t.cabin, t.showerPeak, t.here]);
  const cost = picks.length ? t.costList(picks.map((p) => p.id)) : 0;
  const miles = picks.reduce((a, p) => a + p.miles, 0);
  const go = () => {
    markShown(picks);
    picks.forEach((p) => t.add(p.id));
    t.setGenUsed(true);
    t.note(L(`已加入 ${picks.length} 站`, `加咗 ${picks.length} 個站`, `${picks.length} stops added`));
    onAdded?.(); onClose?.();
  };
  return (
    <section style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, minWidth: 0, animation: `rise .3s ${ease}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <strong style={{ fontSize: T.md, flex: 1 }}>{L('一键规划', '一撳排好', 'Plan for me')}</strong>
        <span style={{ fontSize: T.xs, color: C.muted }}>{L('可多选', '可以揀多個', 'Pick any')}</span>
        {onClose && <button aria-label={L('收起', '收埋', 'Collapse')} onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}><Icon n="x" s={14} c={C.muted} /></button>}
      </div>
      <Chips items={PREFS.map((p) => ({ k: p.k, label: tr(p.n), on: prefs.includes(p.k) }))} onPick={(k) => toggle(k as Pref)} />
      {picks.length ? (
        <>
          <div className="noscroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: '12px -2px 10px', padding: '0 2px' }}>
            {picks.map((p, i) => (
              <div key={p.id} style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 6, background: C.bg, borderRadius: 12, padding: '5px 10px 5px 5px', animation: `rise .3s ${ease} ${i * 0.04}s both` }}>
                <PlaceMark id={p.id} cat={p.cat} size={26} />
                <span style={{ fontSize: T.sm, fontWeight: 600, whiteSpace: 'nowrap' }}>{pname(p)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: T.xs, color: C.muted, flex: 1 }}>{L(`${picks.length} 站 · 约 ${dur(cost)}`, `${picks.length} 站 · 大約 ${dur(cost)}`, `${picks.length} stops · ~${dur(cost)}`)} <MilesTag t={t} n={miles} /></span>
            <button aria-label={L('换一条', '換過條', 'Shuffle')} onClick={() => { markShown(picks); setSeed((s) => s + 1); }} style={{ ...btn('soft'), padding: '8px 10px' }}>↻</button>
            <button style={{ ...btn(), padding: '8px 14px' }} onClick={go}>{L('加入行程', '加入行程', 'Add')}</button>
          </div>
        </>
      ) : (
        <div style={{ fontSize: T.sm, color: C.muted, marginTop: 10 }}>{t.left < 20 ? L('时间不多，按时去登机口更稳妥', '時間唔多，準時去閘口穩陣啲', 'Not much time — head to the gate') : L('合适的地方都已在行程里', '啱嘅地方都喺行程度', 'Everything that fits is already planned')}</div>
      )}
      {onExplore && <button onClick={onExplore} style={{ marginTop: 10, border: 'none', background: 'none', color: C.jade, fontSize: T.xs, fontWeight: 600, cursor: 'pointer', padding: 0 }}>{L('或者自己去探索挑', '或者自己去探索揀', 'Or browse yourself')} ›</button>}
    </section>
  );
};

/** Horizontally scrolling pill row — never wraps, edge fades hint that it scrolls. */
export const Chips = ({ items, onPick }: { items: { k: string; label: string; on: boolean }[]; onPick: (k: string) => void }) => (
  <div style={{ position: 'relative', margin: '0 -14px' }}>
    <div className="noscroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '2px 14px', scrollSnapType: 'x proximity' }}>
      {items.map((c) => <button key={c.k} aria-pressed={c.on} onClick={() => onPick(c.k)} style={{ ...chip(c.on), scrollSnapAlign: 'start' }}>{c.label}</button>)}
    </div>
    <div aria-hidden style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 18, background: 'linear-gradient(90deg, transparent, var(--chip-fade, #fff))', pointerEvents: 'none' }} />
  </div>
);
export const chip = (on: boolean): React.CSSProperties => ({ flex: '0 0 auto', padding: '6px 14px', borderRadius: 999, fontSize: T.sm, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? C.jade : C.line}`, background: on ? C.jade : C.paper, color: on ? '#fff' : C.ink, whiteSpace: 'nowrap', transition: `background .18s ${ease}, color .18s, border-color .18s` });
