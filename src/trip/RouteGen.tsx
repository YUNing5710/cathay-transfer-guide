import React, { useMemo, useState } from 'react';
import { dur, floorLabel, pname } from './data';
import { L, tr, useLang } from './i18n';
import { Trip } from './store';
import { generate, markShown, Pref, PREFS } from './routes';
import { btn, C, Icon, MilesTag } from './ui';

/** One-tap route generator: pick a preference, it fills about 80% of the free time. */
export const RouteGen = ({ t, onAdded, onClose, compact }: { t: Trip; onAdded?: () => void; onClose?: () => void; compact?: boolean }) => {
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
    t.note(L(`已加入 ${picks.length} 站 · 按楼层动线排好`, `加咗 ${picks.length} 個站 · 跟樓層順路排好`, `${picks.length} stops added in walking order`));
    onAdded?.();
  };
  return (
    <section style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon n="route" c={C.jade} />
        <strong style={{ fontSize: 15, flex: 1 }}>{L('一键生成顺路路线', '一撳排好順路路線', 'One-tap route')}</strong>
        {onClose && <button aria-label={L('收起', '收埋', 'Dismiss')} onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}><Icon n="x" s={16} c={C.muted} /></button>}
      </div>
      <div style={{ fontSize: 12, color: C.muted, margin: '4px 0 10px' }}>{L('偏好可多选；最多排满可支配时间的八成，至少留 10 分钟余量', '喜好可以揀多個；最多排滿八成時間，起碼留 10 分鐘', 'Pick one or more; fills up to 80% of your free time, keeping at least 10 min spare')}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {PREFS.map((p) => <button key={p.k} aria-pressed={prefs.includes(p.k)} onClick={() => toggle(p.k)} style={chip(prefs.includes(p.k))}>{tr(p.n)}</button>)}
      </div>
      <div style={{ fontSize: 12, color: C.muted, margin: '8px 0' }}>{prefs.length > 1 ? L(`已选 ${prefs.length} 项偏好，按比例加权混合`, `揀咗 ${prefs.length} 個喜好，按比例混合`, `${prefs.length} preferences blended by weight`) : tr(PREFS.find((p) => p.k === prefs[0])!.d)}</div>
      {picks.length ? (
        <>
          {compact ? <div style={{ fontSize: 13, marginBottom: 8, lineHeight: 1.5 }}>{picks.map(pname).join(' → ')}</div> : (
            <ol style={{ listStyle: 'none', margin: '0 0 10px', padding: 0, display: 'grid', gap: 6 }}>
              {picks.map((p, i) => (
                <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 20, height: 20, borderRadius: 10, background: C.jade, color: '#fff', fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>{pname(p)} <span style={{ color: C.muted }}>· {floorLabel(p.floor)}</span></span>
                </li>
              ))}
            </ol>
          )}
          <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span>{L(`共 ${picks.length} 站 · 预估占用 ${dur(cost)}（含步行）`, `${picks.length} 個站 · 預計用 ${dur(cost)}（連行路）`, `${picks.length} stops · est. ${dur(cost)} incl. walking`)}</span>
            <MilesTag t={t} n={miles} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...btn('ghost'), flex: '0 0 auto' }} onClick={() => { markShown(picks); setSeed((s) => s + 1); }}>{L('换一条', '換過條', 'Shuffle')}</button>
            <button style={{ ...btn(), flex: 1 }} onClick={go}>{L('生成并加入行程', '加入行程', 'Add to my plan')}</button>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 13, color: C.muted }}>
          {t.left < 20 ? L(`可支配时间只剩 ${dur(Math.max(0, t.left))}，按时去登机口更稳妥。`, `淨返 ${dur(Math.max(0, t.left))}，準時去閘口穩陣啲。`, `Only ${dur(Math.max(0, t.left))} left. Head to the gate on time.`) : L('这个偏好下合适的地点都已在行程里，换个偏好试试。', '呢個喜好啱嘅地方都喺行程度喇，轉個試吓。', 'Everything that fits this preference is already in your plan.')}
        </div>
      )}
    </section>
  );
};
export const chip = (on: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1px solid ${on ? C.jade : C.line}`, background: on ? C.jade : C.paper, color: on ? '#fff' : C.ink });
