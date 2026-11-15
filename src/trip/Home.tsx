import React, { useEffect, useState } from 'react';
import { dur, FLIGHT, hm, nameOf, placeOf, pname, route } from './data';
import { L, useLang } from './i18n';
import { Trip } from './store';
import { btn, C, card, ease, mono, Notice, smallBtn, T } from './ui';
import { Arrow3D, bearingOf, SensorHint, useHeading } from './Arrow3D';
import { Progress } from './Progress';
import { PlanList } from './PlanList';
import { RouteGen } from './RouteGen';
import { Boarded } from './Boarded';

/** Current leg of the walk: the arrow follows this leg, not the straight line to the end. */
export const useLeg = (t: Trip, targetId: string) => {
  const from = t.atSec ? t.preFrom : t.here;
  const to = t.atSec ? t.preTarget : targetId;
  const key = from + '>' + to;
  const r = route(from, to);
  const ok = t.nav.key === key;
  const legIdx = ok ? Math.min(t.nav.leg, Math.max(0, r.legs.length - 1)) : 0;
  const prog = ok ? t.nav.prog : 0;
  return { r, leg: r.legs[legIdx], legIdx, prog, to, key };
};
export const targetOf = (t: Trip) => {
  const next = t.tl.stops[0];
  return t.phase === 'go' || (t.left < 0 && t.free <= 0) || !next ? t.gate : next.place.id;
};

/** Short label for the pre-free-time step the passenger is on. */
const stepLabel = (id: string) => ({
  sec: L('完成转机安检', '過咗轉機安檢', 'Cleared security'), immig: L('已过入境', '過咗入境', 'Through immigration'),
  belt: L('已取行李', '攞咗行李', 'Bags collected'), checkin: L('已办好值机', '登記咗', 'Checked in'), dsec: L('已过安检', '過咗安檢', 'Cleared security'),
}[id] ?? L('完成', '搞掂', 'Done'));

export const Home = ({ t, goMap, openOrder, openHelp, arrive, goExplore }: { t: Trip; goMap: () => void; openOrder: () => void; openHelp: () => void; arrive: (id: string) => void; goExplore?: () => void }) => {
  useLang();
  const next = t.tl.stops[0];
  const urgent = t.phase === 'go' || (t.left < 0 && t.free <= 0);
  const targetId = targetOf(t);
  const { r, leg, prog, to } = useLeg(t, targetId);
  const compass = useHeading();
  const [why, setWhy] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [overSeen, setOverSeen] = useState(-1);
  const [delayAsk, setDelayAsk] = useState<'ask' | 'opts' | null>(null);
  const [delaySeen, setDelaySeen] = useState(0);
  useEffect(() => { if (t.delay >= 60 && t.delay !== delaySeen) { setDelaySeen(t.delay); setDelayAsk('ask'); } if (!t.delay) setDelayAsk(null); }, [t.delay]);
  const color = t.free <= 0 ? C.red : t.left < 30 ? C.gold : C.jade;
  const overrun = t.phase === 'free' && t.left < 0 && t.plan.some((p) => !p.done) && overSeen !== t.plan.length;

  if (t.boarded) return <Boarded t={t} />;

  const mode = !leg ? 'arrive' : leg.turn === 'up' ? 'up' : leg.turn === 'down' ? 'down' : 'walk';
  const angle = mode === 'walk' && leg ? bearingOf(leg.pts[1][0] - leg.pts[0][0], leg.pts[1][1] - leg.pts[0][1]) - (compass.state === 'on' ? compass.heading : 0) : 0;
  const legLeft = leg ? Math.round(leg.meters * (1 - prog)) : 0;
  const legText = leg ? (mode === 'walk' ? leg.text.replace(/\d+ (米|m)/, `${legLeft} $1`) : leg.text) : '';
  const showGen = t.phase === 'free' && !t.atSec && t.left >= 20 && t.plan.every((p) => p.done);
  const stepNo = t.posIdx + 1, steps = t.steps.length;

  return (
    <div style={{ padding: '12px 14px 16px', display: 'grid', gap: 10 }}>
      {/* ---- the hero: where to go now ---- */}
      <section style={{ background: `linear-gradient(160deg, ${C.jade} 0%, ${C.jadeDeep} 100%)`, color: '#fff', borderRadius: 22, padding: '8px 16px 14px', boxShadow: '0 10px 28px rgba(0,73,74,.22)', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, background: 'radial-gradient(closest-side, rgba(127,224,213,.18), transparent)' }} />
        <div style={{ display: 'grid', justifyItems: 'center', textAlign: 'center', gap: 2 }}>
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 150, height: 150 }}>
            <div aria-hidden style={{ position: 'absolute', inset: 10, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,255,255,.95), rgba(214,244,239,.55) 62%, rgba(255,255,255,0) 100%)', boxShadow: '0 0 0 1px rgba(255,255,255,.25), 0 10px 30px rgba(0,0,0,.18)' }} />
            <div style={{ position: 'relative', filter: 'drop-shadow(0 6px 10px rgba(0,40,40,.35))' }}><Arrow3D angle={angle} size={136} mode={mode} tilt={compass.state === 'on' ? compass.tilt : 58} /></div>
          </div>
          <div style={{ minWidth: 0, width: '100%' }}>
            <div style={{ fontSize: T.xs, fontWeight: 700, letterSpacing: 0.6, opacity: 0.75 }}>
              {t.atSec ? (steps > 1 ? L(`入境转机 ${stepNo}/${steps}`, `入境轉機 ${stepNo}/${steps}`, `Re-entry ${stepNo}/${steps}`) : L('第一步', '第一步', 'First')) : urgent ? L('立即前往', '即刻去', 'Go now') : next ? L('下一站', '下一站', 'Next') : L('登机口', '閘口', 'Gate')}
            </div>
            <div key={to} style={{ fontSize: T.xl, fontWeight: 800, lineHeight: 1.2, marginTop: 2, animation: `rise .35s ${ease}` }}>{nameOf(to)}</div>
            <div style={{ fontSize: T.sm, opacity: 0.85, marginTop: 4, lineHeight: 1.45 }}>{leg ? legText : L('你已在此处', '你已經喺度', 'You are here')}</div>
            {leg && <div style={{ fontFamily: mono, fontSize: T.xs, opacity: 0.6, marginTop: 3 }}>{r.meters} m · {dur(Math.max(1, Math.ceil(r.meters / t.pace)))}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button onClick={goMap} style={{ ...btn(), flex: 1, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.22)' }}>{L('分步导航', '一步步帶路', 'Navigate')}</button>
          <button onClick={() => arrive(t.atSec ? t.preTarget : targetId)} style={{ ...btn(), flex: 1, background: '#fff', color: C.jade, border: 'none' }}>
            {t.atSec ? stepLabel(t.preTarget) : urgent || !next ? L('已到登机口', '到咗閘口', 'At the gate') : L('完成这一站', '搞掂呢站', 'Done here')}
          </button>
        </div>
        <div style={{ marginTop: 6, minHeight: 0 }}><SensorHint dark /></div>
      </section>

      {/* ---- notices: one compact strip each ---- */}
      {t.change && (
        <Notice tone={t.change.after < t.change.before ? 'gold' : 'jade'} onClose={() => t.setChange(null)}
          title={<>{t.change.title} <span style={{ fontFamily: mono, marginLeft: 4 }}>{dur(t.change.before)} → {dur(t.change.after)}</span></>} />
      )}
      {t.phase !== 'free' && (
        <Notice tone={t.phase === 'go' ? 'red' : 'gold'}
          title={t.phase === 'go' ? L('请立即前往登机口', '請即刻去閘口', 'Head to your gate now') : L(`返回缓冲 · ${hm(t.leaveBy)} 前出发`, `返程緩衝 · ${hm(t.leaveBy)} 前出發`, `Buffer · leave by ${hm(t.leaveBy)}`)}
          sub={t.phase === 'go' ? L('其余安排已暂停', '其他安排已暫停', 'Everything else is paused') : L('不再添加新安排', '唔再加新安排', 'No new stops')} />
      )}
      {delayAsk && (
        <Notice tone="gold" title={L(`航班延误 ${t.delay} 分钟`, `航班延誤 ${t.delay} 分鐘`, `Flight ${t.delay} min late`)} sub={delayAsk === 'ask' ? L('需要看改签方案吗？', '要唔要睇改機票方案？', 'See rebooking options?') : undefined} onClose={() => setDelayAsk(null)}>
          {delayAsk === 'ask' ? <>
            <button style={smallBtn('ghost')} onClick={() => setDelayAsk(null)}>{L('不用', '唔使', 'No')}</button>
            <button style={smallBtn()} onClick={() => setDelayAsk('opts')}>{L('看方案', '睇方案', 'Show')}</button>
          </> : <div style={{ display: 'grid', gap: 6, width: '100%' }}>
            {[{ no: 'CX659', t: '18:40', n: L('免费改签', '免費改', 'Free change') }, { no: 'SQ891', t: '19:10', n: L('需补差价', '要補差價', 'Fare difference') }].map((o) => (
              <button key={o.no} style={{ ...smallBtn('ghost'), display: 'flex', justifyContent: 'space-between' }} onClick={() => { setDelayAsk(null); t.note(L(`已申请改签 ${o.no}`, `已申請改 ${o.no}`, `Requested ${o.no}`)); }}>
                <span style={{ fontFamily: mono }}>{o.no} · {o.t}</span><span style={{ color: C.muted, fontWeight: 400 }}>{o.n}</span>
              </button>
            ))}
          </div>}
        </Notice>
      )}
      {t.loungeOffer && t.phase === 'free' && (
        <Notice tone="gold" title={L('The Pier 满员', 'The Pier 爆滿', 'The Pier is full')} sub={L('改去 Plaza Premium（L7），补偿 200 Asia Miles', '轉去 Plaza Premium（L7），補 200 Asia Miles', 'Try Plaza Premium (L7) for 200 Asia Miles')}>
          <button style={smallBtn('ghost')} onClick={() => t.setLoungeOffer(false)}>{L('不用', '唔使', 'No')}</button>
          <button style={smallBtn()} onClick={() => { t.add('plaza', { miles: 200 }); t.setLoungeOffer(false); }}>{L('加入', '加入', 'Add')}</button>
        </Notice>
      )}
      {t.left < 0 && t.phase === 'free' && t.plan.some((p) => !p.done) && !overrun && (
        <Notice tone="red" title={L(`超出 ${dur(-t.left)}`, `超咗 ${dur(-t.left)}`, `Over by ${dur(-t.left)}`)} sub={L('删掉一两站，先保证准时登机', '刪走一兩站，準時登機先', 'Drop a stop to board on time')}>
          <button style={smallBtn('ghost')} onClick={openHelp}>{L('客服', '客服', 'Support')}</button>
          <button style={smallBtn('danger')} onClick={() => { const d = t.cleanup(); if (d.length) t.note(L(`已移除 ${d.join('、')}`, `刪咗 ${d.join('、')}`, `Removed ${d.join(', ')}`), 'warn'); }}>{L('一键清理', '一撳清走', 'Trim')}</button>
        </Notice>
      )}
      {t.undo && (
        <section style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.ink, color: '#fff', borderRadius: R12, padding: '8px 12px', animation: `rise .25s ${ease}` }}>
          <span style={{ flex: 1, fontSize: T.sm }}>{L('已删除', '刪咗', 'Removed')} {nameOf(t.undo.id)}</span>
          <button onClick={t.undoRemove} style={{ border: 'none', background: 'none', color: '#7FE0D5', fontWeight: 700, fontSize: T.sm, cursor: 'pointer' }}>{L('撤销', '還原', 'Undo')}</button>
        </section>
      )}
      {[...t.readyOrders, ...t.soonOrders].slice(0, 2).map((o) => {
        const pl = placeOf(o.id); if (!pl) return null;
        const ready = t.readyOrders.includes(o);
        return (
          <Notice key={'r' + o.uid} tone={ready ? 'gold' : 'jade'} title={ready ? L(`${pname(pl)} 可取餐`, `${pname(pl)} 攞得`, `${pname(pl)} is ready`) : L(`${pname(pl)} 约 ${(o.readyAt ?? 0) - t.clock} 分后可取`, `${pname(pl)} 大約 ${(o.readyAt ?? 0) - t.clock} 分鐘後攞得`, `${pname(pl)} in ~${(o.readyAt ?? 0) - t.clock} min`)} sub={`${o.orderText} · ${pl.floor}`}>
            <button style={smallBtn(ready ? 'primary' : 'ghost')} onClick={() => { t.setPlan((p) => { const i = p.findIndex((x) => x.uid === o.uid); const c = [...p]; const [it] = c.splice(i, 1); const f = c.findIndex((x) => !x.done); c.splice(f < 0 ? c.length : f, 0, it); return c; }); goMap(); }}>{ready ? L('去取餐', '去攞', 'Pick up') : L('先过去', '行過去先', 'Go now')}</button>
          </Notice>
        );
      })}

      {/* ---- one-tap route: a slim bar that unfolds ---- */}
      {showGen && (genOpen
        ? <RouteGen t={t} onClose={() => setGenOpen(false)} onExplore={goExplore} />
        : <button onClick={() => setGenOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 999, padding: '7px 8px 7px 14px', cursor: 'pointer', color: '#fff', textAlign: 'left', background: `linear-gradient(90deg, ${C.jade}, ${C.mint}, #C9A227, ${C.mint}, ${C.jade})`, backgroundSize: '200% 100%', animation: `rise .3s ${ease}, ribbon 9s linear infinite`, boxShadow: '0 6px 16px rgba(0,93,91,.18)' }}>
            <span aria-hidden style={{ fontSize: T.md }}>✦</span>
            <span style={{ flex: 1, minWidth: 0, fontSize: T.sm, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{L('一键规划顺路路线', '一撳排好順路路線', 'Plan a route for me')}</span>
            <span style={{ fontFamily: mono, fontSize: T.xs, fontWeight: 700, background: 'rgba(255,255,255,.22)', borderRadius: 999, padding: '3px 9px', flexShrink: 0 }}>{dur(t.left)}</span>
          </button>)}

      {/* ---- time: the one number ---- */}
      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: T.sm, color: C.muted }}>{L('可自由支配', '自由時間', 'Free time')}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: T.xs, color: C.faint, fontFamily: mono }}>{L('现在', '而家', 'Now')} {hm(t.clock)}</span><button onClick={() => setWhy(!why)} aria-expanded={why} style={{ border: `1px solid ${C.line}`, background: why ? C.jadeSoft : C.paper, color: C.jade, fontSize: T.xs, fontWeight: 600, cursor: 'pointer', padding: '2px 8px', borderRadius: 999 }}>{why ? L('收起', '收埋', 'Hide') : L('怎么算的 ⓘ', '點計 ⓘ', 'How ⓘ')}</button></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontFamily: mono, fontSize: T.hero, fontWeight: 700, color, lineHeight: 1.15, transition: 'color .3s' }}>{dur(Math.max(0, t.free))}</div>
          {t.planned > 0 && <span style={{ fontSize: T.sm, fontWeight: 700, color: t.left < 0 ? C.red : C.jade }}>{t.left < 0 ? L(`超 ${dur(-t.left)}`, `超 ${dur(-t.left)}`, `+${dur(-t.left)} over`) : L(`余 ${dur(t.left)}`, `淨 ${dur(t.left)}`, `${dur(t.left)} left`)}</span>}
        </div>
        <Progress t={t} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 10 }}>
          <Fact k={L('下一程', '下一程', 'Flight')} v={`${FLIGHT.outNo}`} />
          <Fact k={L('起飞', '起飛', 'Departs')} v={hm(t.dep)} hot={t.delay > 0} />
          <Fact k={L('登机口', '閘口', 'Gate')} v={t.gateName} hot={t.gate === 'g512'} />
        </div>
        {t.online && t.live && <div style={{ marginTop: 8, fontSize: T.xs, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#2E9E6B', boxShadow: '0 0 0 3px rgba(46,158,107,.18)' }} />
          {t.live.out.no} {t.live.out.timeliness || t.live.out.status}{t.live.in.baggage ? ` · ${L('行李转盘', '行李轉盤', 'Belt')} ${t.live.in.baggage}` : ''}
        </div>}
        {why && (
          <div style={{ fontSize: T.xs, color: C.muted, background: C.bg, borderRadius: 10, padding: 10, marginTop: 6, lineHeight: 1.7, animation: `rise .25s ${ease}` }}>
            <div>{L(`登机 ${hm(t.boardTime)} − 返回缓冲 30 分${t.pre ? ` − 前置步骤 ${t.pre} 分` : ''} − 步行到 ${t.gateName} 号口`, `登機 ${hm(t.boardTime)} − 緩衝 30 分鐘${t.pre ? ` − 之前步驟 ${t.pre} 分鐘` : ''} − 行去 ${t.gateName} 號閘口`, `Boarding ${hm(t.boardTime)} − 30 min buffer${t.pre ? ` − ${t.pre} min steps` : ''} − walk to gate ${t.gateName}`)}</div>
            <div>{L(`步速 ${t.pace} 米/分，排队按偏长估算`, `每分鐘 ${t.pace} 米，排隊計長啲`, `Pace ${t.pace} m/min, queues estimated long`)}</div>
            <button onClick={() => (t.gpsOn ? t.stopGps() : t.startGps())} style={{ border: 'none', background: 'none', color: C.jade, fontSize: T.xs, fontWeight: 600, cursor: 'pointer', padding: 0 }}>{t.gpsOn ? L('关闭定位校准', '閂定位校準', 'Stop location') : L('用定位校准步速', '用定位校準速度', 'Tune pace with location')}</button>
          </div>
        )}
      </section>

      <PlanList t={t} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ ...btn('soft'), flex: 1, opacity: t.canAdd ? 1 : 0.5 }} disabled={!t.canAdd} onClick={openOrder}>{L('提前点餐', '預先落單', 'Order ahead')}</button>
        <button style={{ ...btn('soft'), flex: 1 }} onClick={openHelp}>{L('呼叫客服', '搵客服', 'Call support')}</button>
      </div>

      {overrun && (
        <div role="dialog" style={{ position: 'absolute', inset: 0, background: 'rgba(10,28,27,.42)', zIndex: 70, display: 'grid', placeItems: 'center', padding: 24, animation: 'fade .2s ease' }}>
          <div style={{ background: C.paper, borderRadius: 20, padding: 18, width: '100%', maxWidth: 320, animation: `pop .3s ${ease}` }}>
            <div style={{ fontSize: T.lg, fontWeight: 800, color: C.red }}>{L(`后面的安排超出 ${dur(-t.left)}`, `後面超咗 ${dur(-t.left)}`, `Over by ${dur(-t.left)}`)}</div>
            <div style={{ fontSize: T.sm, color: C.muted, margin: '6px 0 14px' }}>{L('上一站停留比预估久', '上一站逗留耐過預計', 'The last stop ran long')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => { setOverSeen(t.plan.length); openHelp(); }}>{L('客服', '客服', 'Support')}</button>
              <button style={{ ...btn('danger'), flex: 1 }} onClick={() => { setOverSeen(t.plan.length); const d = t.cleanup(); if (d.length) t.note(L(`已移除 ${d.join('、')}`, `刪咗 ${d.join('、')}`, `Removed ${d.join(', ')}`), 'warn'); }}>{L('清理', '清走', 'Trim')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const R12 = 14;

const Fact = ({ k, v, hot }: { k: string; v: string; hot?: boolean }) => (
  <div style={{ background: hot ? C.goldSoft : C.bg, borderRadius: 10, padding: '6px 10px', transition: 'background .3s' }}>
    <div style={{ fontSize: T.xs, color: C.muted }}>{k}</div>
    <div key={v} style={{ fontFamily: mono, fontSize: T.md, fontWeight: 700, color: hot ? C.gold : C.ink, animation: `rise .3s ${ease}` }}>{v}</div>
  </div>
);
