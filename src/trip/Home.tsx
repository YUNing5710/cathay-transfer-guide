import React, { useEffect, useState } from 'react';
import { dur, FLIGHT, hm, nameOf, placeOf, pname, route } from './data';
import { L, useLang } from './i18n';
import { Trip } from './store';
import { btn, C, Icon, mono } from './ui';
import { Arrow3D, bearingOf, SensorHint, useHeading } from './Arrow3D';
import { Progress } from './Progress';
import { PlanList } from './PlanList';
import { RouteGen } from './RouteGen';
import { Boarded } from './Boarded';

/** Current leg of the walk: the arrow follows this leg, not the straight line to the end. */
export const useLeg = (t: Trip, targetId: string) => {
  const from = t.atSec ? 'arr' : t.here;
  const to = t.atSec ? 'sec' : targetId;
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

export const Home = ({ t, goMap, openOrder, openHelp, arrive, goExplore }: { t: Trip; goMap: () => void; openOrder: () => void; openHelp: () => void; arrive: (id: string) => void; goExplore?: () => void }) => {
  useLang();
  const next = t.tl.stops[0];
  const urgent = t.phase === 'go' || (t.left < 0 && t.free <= 0);
  const targetId = targetOf(t);
  const { r, leg, prog } = useLeg(t, targetId);
  const compass = useHeading();
  const [why, setWhy] = useState(false);
  const [overSeen, setOverSeen] = useState(-1);
  const [delayAsk, setDelayAsk] = useState<'ask' | 'opts' | 'done' | null>(null);
  const [delaySeen, setDelaySeen] = useState(0);
  useEffect(() => { if (t.delay >= 60 && t.delay !== delaySeen) { setDelaySeen(t.delay); setDelayAsk('ask'); } if (!t.delay) setDelayAsk(null); }, [t.delay]);
  const color = t.free <= 0 ? C.red : t.left < 30 ? C.gold : C.jade;
  // Overrun pop-up: only when time ran out because a stop took longer than estimated, while still planning.
  const overrun = t.phase === 'free' && t.left < 0 && t.plan.some((p) => !p.done) && overSeen !== t.plan.length;

  if (t.boarded) return <Boarded t={t} />;

  const mode = !leg ? 'arrive' : leg.turn === 'up' ? 'up' : leg.turn === 'down' ? 'down' : 'walk';
  const angle = mode === 'walk' && leg ? bearingOf(leg.pts[1][0] - leg.pts[0][0], leg.pts[1][1] - leg.pts[0][1]) - (compass.state === 'on' ? compass.heading : 0) : 0;
  const legLeft = leg ? Math.round(leg.meters * (1 - prog)) : 0;
  const legText = leg ? (mode === 'walk' ? leg.text.replace(/\d+ (米|m)/, `${legLeft} $1`) : leg.text) : '';

  return (
    <div style={{ padding: '12px 14px 18px', display: 'grid', gap: 12 }}>
      {/* 安全时间开始、还没有安排时：把推荐放在最上面，避免旅客以为只能去登机口 */}
      {t.phase === 'free' && !t.atSec && t.left >= 20 && t.plan.every((p) => p.done) && (
        <section style={{ border: `2px solid ${C.jade}`, borderRadius: 18, background: C.jadeSoft, padding: 6, display: 'grid', gap: 6 }}>
          <div style={{ padding: '6px 8px 2px' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.jade }}>{L(`你有 ${dur(t.left)} 可以自由安排`, `你有 ${dur(t.left)} 可以自由安排`, `You have ${dur(t.left)} to spare`)}</div>
            <div style={{ fontSize: 13, color: C.ink, marginTop: 2, lineHeight: 1.5 }}>{L('现在不用急着去登机口。选偏好一键排好顺路活动，或者自己去探索挑选，出发时间到了我会提醒你。', '而家唔使急住去閘口。揀喜好一撳排好順路活動，或者自己去探索揀，夠鐘出發我會提你。', 'No need to head to the gate yet. Pick preferences for a ready-made route, or browse yourself. I will tell you when to leave.')}</div>
          </div>
          <RouteGen t={t} />
          {goExplore && <button style={{ ...btn('ghost'), width: '100%', background: C.paper }} onClick={goExplore}>{L('去探索自己挑', '去探索自己揀', 'Browse and pick myself')}</button>}
        </section>
      )}
      {t.change && (
        <section role="status" style={{ background: C.paper, border: `1.5px solid ${t.change.after < t.change.before ? C.gold : C.jade}`, borderRadius: 14, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: 14 }}>{t.change.title}</strong>
            <button aria-label={L('关闭', '閂', 'Close')} onClick={() => t.setChange(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Icon n="x" s={16} c={C.muted} /></button>
          </div>
          <div style={{ fontFamily: mono, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
            <span style={{ color: C.muted }}>{dur(t.change.before)}</span><span style={{ margin: '0 8px', color: C.muted }}>→</span>
            <span style={{ color: t.change.after < t.change.before ? C.gold : C.jade }}>{dur(t.change.after)}</span>
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{L('可支配时间与路线已重算', '可用時間同路線已經重新計', 'Free time and route recalculated')}</div>
        </section>
      )}

      {t.phase !== 'free' && (
        <section role="alert" style={{ background: t.phase === 'go' ? C.redSoft : C.goldSoft, border: `1px solid ${t.phase === 'go' ? C.red : C.gold}`, borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 700, color: t.phase === 'go' ? C.red : C.gold, fontSize: 14 }}>
            {t.phase === 'go' ? L('请立即前往登机口', '請即刻去閘口', 'Head to your gate now') : L(`已进入返回缓冲 · ${hm(t.leaveBy)} 前出发`, `入咗返程緩衝 · ${hm(t.leaveBy)} 前出發`, `Return buffer · leave by ${hm(t.leaveBy)}`)}
          </div>
          <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>
            {t.phase === 'go'
              ? L('所有任务已暂停，未完成的任务不计 Asia Miles。箭头只指向登机口。', '所有任務已經暫停，未完成嘅唔計 Asia Miles。箭咀只指去閘口。', 'All tasks are paused; unfinished ones earn no Asia Miles. The arrow now points only to your gate.')
              : L('不能再添加任务或下单。当前这一项可以继续，后面的已暂停。', '唔可以再加任務或者落單。而家呢項可以繼續，後面嘅暫停咗。', 'No new tasks or orders. You can finish the current one; later ones are paused.')}
          </div>
        </section>
      )}

      {delayAsk && (
        <section role="alert" style={{ background: C.paper, border: `1.5px solid ${C.gold}`, borderRadius: 14, padding: 12 }}>
          {delayAsk === 'ask' && (<>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{L(`航班延误 ${t.delay} 分钟，你赶时间吗？`, `航班延誤 ${t.delay} 分鐘，你趕唔趕時間？`, `Your flight is ${t.delay} min late. Are you in a hurry?`)}</div>
            <div style={{ fontSize: 13, color: C.muted, margin: '4px 0 10px' }}>{L('安全时间已更新。赶时间的话，我可以给你看备选改签方案。', '安全時間已經更新。趕時間嘅話，可以睇吓改機票方案。', 'Safe time is updated. If you are in a hurry, I can show rebooking options.')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => setDelayAsk(null)}>{L('不急', '唔急', 'Not really')}</button>
              <button style={{ ...btn(), flex: 1 }} onClick={() => setDelayAsk('opts')}>{L('赶时间，看方案', '趕，睇吓方案', 'Yes, show options')}</button>
            </div>
          </>)}
          {delayAsk === 'opts' && (<>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{L('备选改签方案', '改機票方案', 'Rebooking options')}</div>
            {[{ no: 'CX659', t: '18:40', note: L('国泰 · 免费改签', '國泰 · 免費改', 'Cathay · free change') }, { no: 'SQ891', t: '19:10', note: L('oneworld 以外合作航空 · 需补差价', '合作航空 · 要補差價', 'Partner airline · fare difference applies') }].map((o) => (
              <div key={o.no} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: `1px solid ${C.line}` }}>
                <div style={{ flex: 1 }}><b style={{ fontFamily: mono }}>{o.no}</b> HKG → {FLIGHT.toCode} · {o.t}<div style={{ fontSize: 12, color: C.muted }}>{o.note}</div></div>
                <button style={{ ...btn(), padding: '6px 10px', fontSize: 13 }} onClick={() => { setDelayAsk('done'); t.note(L(`已提交 ${o.no} 改签申请，客服会与你确认`, `已經提交改 ${o.no}，客服會同你確認`, `Request for ${o.no} sent; an agent will confirm`)); }}>{L('选这班', '揀呢班', 'Choose')}</button>
              </div>
            ))}
            <button style={{ ...btn('ghost'), width: '100%', marginTop: 6 }} onClick={() => setDelayAsk(null)}>{L('暂不改签', '唔改住', 'Keep my flight')}</button>
          </>)}
          {delayAsk === 'done' && <div style={{ fontSize: 13 }}>{L('改签申请已提交，确认前请继续按原航班安排。', '改機票申請已提交，確認之前照原本航班安排。', 'Request sent. Keep to your current flight until confirmed.')} <button onClick={() => setDelayAsk(null)} style={{ border: 'none', background: 'none', color: C.jade, fontWeight: 600, cursor: 'pointer' }}>{L('好的', '好', 'OK')}</button></div>}
        </section>
      )}

      {overrun && (
        <div role="dialog" style={{ position: 'absolute', inset: 0, background: 'rgba(10,25,24,.45)', zIndex: 70, display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ background: C.paper, borderRadius: 16, padding: 16, width: '100%', maxWidth: 320 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.red }}>{L(`后面的安排超出 ${dur(-t.left)}`, `後面嘅安排超咗 ${dur(-t.left)}`, `Remaining plan is over by ${dur(-t.left)}`)}</div>
            <div style={{ fontSize: 13, color: C.muted, margin: '6px 0 14px' }}>{L('刚才停留比预估久，后面时间不够了。可以清理部分安排，或呼叫客服。', '頭先逗留耐過預計，後面唔夠時間。可以清走啲安排，或者搵客服。', 'The last stop ran long, so the rest no longer fits. Trim the plan or call support.')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => { setOverSeen(t.plan.length); openHelp(); }}>{L('呼叫客服', '搵客服', 'Call support')}</button>
              <button style={{ ...btn('danger'), flex: 1 }} onClick={() => { setOverSeen(t.plan.length); const d = t.cleanup(); if (d.length) t.note(L(`已移除：${d.join('、')}`, `刪咗：${d.join('、')}`, `Removed: ${d.join(', ')}`), 'warn'); }}>{L('清理部分', '清走部分', 'Trim plan')}</button>
            </div>
          </div>
        </div>
      )}

      {t.loungeOffer && t.phase === 'free' && (
        <section role="alert" style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 700, color: C.gold, fontSize: 14 }}>{L('The Pier 当前满员', 'The Pier 而家爆滿', 'The Pier is full')}</div>
          <div style={{ fontSize: 13, margin: '4px 0 10px', lineHeight: 1.5 }}>{L('可以改去 L7 Plaza Premium Lounge（现有空位，付费入内）。接受分流，国泰补偿 200 Asia Miles。', '可以轉去 L7 Plaza Premium Lounge（有位，要俾錢入）。肯轉嘅話，國泰補 200 Asia Miles 俾你。', 'Try Plaza Premium Lounge on L7 (seats available, paid entry). Accept and Cathay adds 200 Asia Miles.')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...btn(), flex: 1 }} onClick={() => { t.add('plaza', { miles: 200 }); t.setLoungeOffer(false); }}>{L('接受并加入行程', '好，加入行程', 'Accept and add')}</button>
            <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => t.setLoungeOffer(false)}>{L('暂不需要', '唔使喇', 'No thanks')}</button>
          </div>
        </section>
      )}

      {t.bag === 'unknown' && (
        <section role="alert" style={{ background: C.goldSoft, border: `1px solid ${C.gold}`, borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 700, color: C.gold, fontSize: 14 }}>{L('无法确认行李是否直挂', '確認唔到行李係咪直掛', 'Baggage through-check not confirmed')}</div>
          <div style={{ fontSize: 13, margin: '4px 0 10px', lineHeight: 1.5 }}>{L('请先到 L5 国泰转机柜台出示登机证确认，确认后再重算可用时间。', '麻煩先去 L5 國泰轉機櫃位俾登機證佢哋睇吓，確認咗再計時間。', 'Please check at the Cathay transfer desk on L5 first. Time is recalculated after.')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...btn(), flex: 1 }} onClick={() => { if (!t.has('desk')) t.setPlan((p) => [{ uid: Date.now(), id: 'desk', done: false }, ...p]); goMap(); }}>{L('带我去转机柜台', '帶我去轉機櫃位', 'Take me there')}</button>
            <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => { t.setBag('ok'); t.note(L('已确认行李直挂', '確認咗行李直掛', 'Bags confirmed through')); }}>{L('已确认直挂', '已確認直掛', 'Confirmed')}</button>
          </div>
        </section>
      )}

      {t.left < 0 && t.phase === 'free' && t.plan.some((p) => !p.done) && !overrun && (
        <section role="alert" style={{ background: C.redSoft, border: `1px solid ${C.red}`, borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 700, color: C.red, fontSize: 14 }}>{L(`安排超出可用时间 ${dur(-t.left)}`, `排多咗 ${dur(-t.left)}`, `Plan is over by ${dur(-t.left)}`)}</div>
          <div style={{ fontSize: 13, margin: '4px 0 10px' }}>{L('建议删掉部分安排，先保证准时登机。', '建議刪走幾項，準時登機先。', 'Drop a stop or two so you board on time.')}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...btn('danger'), flex: 1 }} onClick={() => { const d = t.cleanup(); if (d.length) t.note(L(`已移除：${d.join('、')}`, `刪咗：${d.join('、')}`, `Removed: ${d.join(', ')}`), 'warn'); }}>{L('一键清理', '一撳清走', 'Trim plan')}</button>
            <button style={{ ...btn('ghost'), flex: 1 }} onClick={openHelp}>{L('呼叫客服', '搵客服', 'Call support')}</button>
          </div>
        </section>
      )}

      {t.undo && (
        <section style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.ink, color: '#fff', borderRadius: 12, padding: '8px 12px' }}>
          <span style={{ flex: 1, fontSize: 13 }}>{L('已删除', '刪咗', 'Removed')}「{nameOf(t.undo.id)}」</span>
          <button onClick={t.undoRemove} style={{ border: 'none', background: 'none', color: '#7FE0D5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{L('撤销', '還原', 'Undo')}</button>
          <button aria-label={L('关闭', '閂', 'Close')} onClick={t.clearUndo} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Icon n="x" s={14} c="#fff" /></button>
        </section>
      )}

      {[...t.readyOrders, ...t.soonOrders].map((o) => {
        const pl = placeOf(o.id); if (!pl) return null;
        const ready = t.readyOrders.includes(o);
        return (
          <section key={'r' + o.uid} role="status" style={{ display: 'flex', gap: 10, alignItems: 'center', background: ready ? C.goldSoft : C.paper, border: `1px solid ${ready ? C.gold : C.line}`, borderRadius: 14, padding: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: ready ? C.gold : C.ink }}>{ready ? L(`${pname(pl)} 已准备好`, `${pname(pl)} 整好咗`, `${pname(pl)} is ready`) : L(`${pname(pl)} 约 ${(o.readyAt ?? 0) - t.clock} 分后可取`, `${pname(pl)} 大約 ${(o.readyAt ?? 0) - t.clock} 分鐘後攞得`, `${pname(pl)} ready in ~${(o.readyAt ?? 0) - t.clock} min`)}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{o.orderText} · {pl.floor}</div>
            </div>
            <button style={{ ...btn(ready ? 'primary' : 'ghost'), padding: '7px 10px', fontSize: 13, flexShrink: 0 }} onClick={() => { t.setPlan((p) => { const i = p.findIndex((x) => x.uid === o.uid); const c = [...p]; const [it] = c.splice(i, 1); const f = c.findIndex((x) => !x.done); c.splice(f < 0 ? c.length : f, 0, it); return c; }); goMap(); }}>{ready ? L('去取餐', '去攞餐', 'Pick up') : L('先过去', '行過去先', 'Go now')}</button>
          </section>
        );
      })}

      <section style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, padding: '6px 16px 16px' }}>
        <div style={{ display: 'grid', justifyItems: 'center' }}>
          <Arrow3D angle={angle} size={150} mode={mode} tilt={compass.state === 'on' ? compass.tilt : 58} />
          <div style={{ marginTop: 6, minHeight: 4 }}><SensorHint /></div>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, color: C.muted }}>{t.atSec ? L('下机后先去', '落機之後去', 'First, go to') : urgent ? L('时间已到，请直接前往', '夠鐘喇，直接去', 'Time is up, go straight to') : L('下一站', '下一站', 'Next')}</div>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, color: C.jade }}>{nameOf(t.atSec ? 'sec' : targetId)}</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{leg ? `${legText} · ${L('全程', '全程', 'total')} ${r.meters} ${L('米', '米', 'm')}` : L('你已在此处', '你已經喺度', 'You are here')}</div>
          {t.atSec && t.bag === 'ok' && <div style={{ fontSize: 12, color: C.jade, marginTop: 4, fontWeight: 600 }}>{L('行李已直挂，无需提取行李，直接前往转机安检', '行李已經直掛，唔使攞行李，直接去轉機安檢', 'Bags are checked through. No need to collect them, go straight to transfer security')}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={goMap} style={{ ...btn('ghost'), flex: 1 }}>{L('分步导航', '一步步帶路', 'Step by step')}</button>
          <button onClick={() => arrive(t.atSec ? 'sec' : targetId)} style={{ ...btn(), flex: 1 }}>{t.atSec ? L('已过转机安检', '過咗安檢', 'Cleared security') : urgent || !next ? L('已到登机口', '到咗閘口', 'At the gate') : L('完成这一项', '搞掂呢項', 'Done here')}</button>
        </div>
      </section>

      <section style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 18, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 13, color: C.muted }}>{L('真正可自由支配', '真係可以自由用嘅時間', 'Truly free time')}</span>
          <span style={{ fontSize: 12, color: C.muted }}>{L('现在', '而家', 'Now')} {hm(t.clock)}</span>
        </div>
        <div style={{ fontFamily: mono, fontSize: 40, fontWeight: 700, color, lineHeight: 1.15, marginTop: 2 }}>{dur(Math.max(0, t.free))}</div>
        <Progress t={t} />
        <div style={{ fontSize: 12, color: C.muted, marginTop: 8, lineHeight: 1.6 }}>
          {L(`距登机 ${dur(t.dep - t.boardBuffer - t.clock)} − 返回缓冲 30 分${t.pre ? ` − 转机安检 ${t.pre} 分` : ''} − 回 ${t.gateName} 号口步行`, `距離登機 ${dur(t.dep - t.boardBuffer - t.clock)} − 返程緩衝 30 分鐘${t.pre ? ` − 轉機安檢 ${t.pre} 分鐘` : ''} − 行返 ${t.gateName} 號閘口`, `${dur(t.dep - t.boardBuffer - t.clock)} to boarding − 30 min buffer${t.pre ? ` − security ${t.pre} min` : ''} − walk to gate ${t.gateName}`)}
          <button onClick={() => setWhy(!why)} style={{ marginLeft: 6, border: 'none', background: 'none', color: C.jade, fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>{why ? L('收起', '收埋', 'Hide') : L('怎么算的', '點計㗎', 'How is this worked out')}</button>
        </div>
        {why && (
          <div style={{ fontSize: 12, background: C.bg, borderRadius: 10, padding: 10, marginTop: 6, lineHeight: 1.6 }}>
            {L(`起飞 ${hm(t.dep)}，${hm(t.boardTime)} 开始登机，这是最后期限；再往前留 30 分钟返回缓冲。`, `${hm(t.dep)} 起飛，${hm(t.boardTime)} 開始登機，呢個係死線；再預早 30 分鐘返程緩衝。`, `Departs ${hm(t.dep)}, boarding ${hm(t.boardTime)} is the hard deadline, with a 30-min return buffer before it.`)}<br />
            {t.pre ? <>{L(`转机安检：步行 ${t.walkSec} 分 + 排队约 ${t.secWait} 分（前方约 ${t.sec.people} 人）+ 过检 6 分 + 上 L6 3 分 = ${t.pre} 分。`, `轉機安檢：行 ${t.walkSec} 分鐘 + 排隊大約 ${t.secWait} 分鐘（前面大約 ${t.sec.people} 人）+ 過檢 6 分鐘 + 上 L6 3 分鐘 = ${t.pre} 分鐘。`, `Security: walk ${t.walkSec} + queue ~${t.secWait} (~${t.sec.people} ahead) + screening 6 + up to L6 3 = ${t.pre} min.`)}<br /></> : null}
            {L(`步速 ${t.pace} 米/分${t.paceTuned ? '（已按你的实际步速校准）' : '（默认偏慢估算）'}。`, `行路速度每分鐘 ${t.pace} 米${t.paceTuned ? '（已經按你實際速度校準）' : '（預設計慢啲）'}。`, `Pace ${t.pace} m/min${t.paceTuned ? ' (calibrated to you)' : ' (cautious default)'}. `)}
            {L('每站预估占用 = 从上一站走过去 + 在这里的时间（含出餐、淋浴排队），最后一站再走回登机口。排队一律按偏长估算。', '每個站預計用嘅時間 = 由上個站行過去 + 喺度嘅時間（包埋等餐、排隊沖涼），最後一站再行返閘口。排隊時間一律計長啲。', 'Each stop = walk from the previous stop + time there (incl. food or shower queues); then the walk back to the gate. Queues are estimated on the long side.')}
          </div>
        )}
        {t.planned > 0 && (
          <div style={{ marginTop: 8, fontSize: 13, display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
            <span>{L(`已安排 ${dur(t.planned)}`, `已排 ${dur(t.planned)}`, `Planned ${dur(t.planned)}`)}</span>
            <strong style={{ color: t.left < 0 ? C.red : C.jade }}>{t.left < 0 ? L(`超出 ${dur(-t.left)}`, `超咗 ${dur(-t.left)}`, `Over by ${dur(-t.left)}`) : L(`还剩 ${dur(t.left)}`, `仲有 ${dur(t.left)}`, `${dur(t.left)} left`)}</strong>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12, fontSize: 12 }}>
          <Fact k={L('下一程', '下一程', 'Next flight')} v={`${FLIGHT.outNo} ${FLIGHT.toCode}`} />
          <Fact k={L('起飞', '起飛', 'Departs')} v={hm(t.dep)} hot={t.delay > 0} />
          <Fact k={L('登机口', '閘口', 'Gate')} v={t.gateName} hot={t.gate === 'g512'} />
        </div>
        {t.online && t.live && (
          <div style={{ marginTop: 8, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            {L('实时', '實時', 'Live')} · {t.live.in.no} {t.live.in.status}{t.live.in.arrEst ? ` ${t.live.in.arrEst}` : ''}
            {t.live.in.arrTerminal ? ` · ${t.live.in.arrTerminal}` : ''}{t.live.in.baggage ? ` · ${L('行李转盘', '行李轉盤', 'Belt')} ${t.live.in.baggage}` : ''}
            <br />{t.live.out.no} {t.live.out.timeliness || t.live.out.status}
            {t.live.out.depTerminal ? ` · ${t.live.out.depTerminal}` : ''}{t.live.out.depGate ? ` · ${L('登机口', '閘口', 'Gate')} ${t.live.out.depGate}` : ''}
          </div>
        )}
        {urgent && <div style={{ marginTop: 10, fontSize: 13, color: C.red, fontWeight: 600 }}>{L('可支配时间已归零，请优先前往登机口。', '冇時間喇，請即刻去閘口。', 'No free time left. Head to the gate now.')}</div>}
      </section>


      <PlanList t={t} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ ...btn('ghost'), flex: 1, opacity: t.canAdd ? 1 : 0.5 }} disabled={!t.canAdd} onClick={openOrder}>{L('合作商户点餐', '合作商戶落單', 'Order from partners')}</button>
        <button style={{ ...btn('ghost'), flex: 1 }} onClick={openHelp}>{L('呼叫客服', '搵客服', 'Call support')}</button>
      </div>
    </div>
  );
};

const Fact = ({ k, v, hot }: { k: string; v: string; hot?: boolean }) => (
  <div style={{ background: hot ? C.goldSoft : C.bg, borderRadius: 10, padding: '6px 8px' }}>
    <div style={{ color: C.muted }}>{k}</div>
    <div style={{ fontSize: 14, fontWeight: 700, color: hot ? C.gold : C.ink }}>{v}</div>
  </div>
);
