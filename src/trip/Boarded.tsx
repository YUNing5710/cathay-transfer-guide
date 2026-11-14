import React from 'react';
import { city, FLIGHT, hm, nameOf } from './data';
import { L, useLang } from './i18n';
import { Trip } from './store';
import { btn, C, Icon, mono } from './ui';

export const Boarded = ({ t }: { t: Trip }) => {
  useLang();
  const done = t.plan.filter((p) => p.done);
  const usedTotal = done.reduce((a, p) => a + (p.used ?? 0), 0);
  const isBonus = (w: string) => /补偿|補償|diversion|打卡|check/i.test(w);
  const merchant = t.milesLog.filter((m) => !isBonus(m.why)).reduce((a, m) => a + m.n, 0);
  const bonus = t.milesLog.filter((m) => isBonus(m.why)).reduce((a, m) => a + m.n, 0);
  const finish = done.length >= 2 ? 100 : 0;
  const total = FLIGHT.flightMiles + merchant + bonus + finish;
  return (
    <div style={{ padding: '18px 16px 24px', display: 'grid', gap: 14 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: C.jadeSoft, margin: '8px auto 10px', display: 'grid', placeItems: 'center' }}><Icon n="check" s={32} c={C.jade} w={2.6} /></div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{L('已顺利登机', '順利登機', 'You are on board')}</div>
        <div style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>{FLIGHT.outNo} HKG → {city(FLIGHT.toCode)} · {hm(t.dep)} · Gate {t.gateName}</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>{done.length ? L(`这一程去了 ${done.length} 个地方，停留共 ${usedTotal} 分钟。`, `今次去咗 ${done.length} 個地方，總共逗留 ${usedTotal} 分鐘。`, `You visited ${done.length} places for ${usedTotal} min.`) : L('这一程直接登机。', '今次直接登機。', 'Straight to the gate this time.')}</div>
      </div>
      <section style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 }}>
        <strong style={{ fontSize: 14 }}>{L('本次中转时间线', '今次轉機時間線', 'Your transfer')}</strong>
        <ol style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'grid', gap: 8 }}>
          <TL time={FLIGHT.arr} title={`${FLIGHT.inNo} · ${nameOf('sec')}`} />
          {done.map((p) => <TL key={p.uid} time={hm((p.doneAt ?? t.clock) - (p.used ?? 0))} title={nameOf(p.id)} sub={`${p.used ?? 0} min${p.orderText ? ' · ' + p.orderText : ''}`} />)}
          <TL time={hm(t.clock)} title={nameOf(t.gate)} last />
        </ol>
      </section>
      <section style={{ background: C.goldSoft, borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <strong style={{ fontSize: 14, color: C.gold }}>{t.member ? L('本次赚到 Asia Miles', '今次賺到 Asia Miles', 'Asia Miles earned') : L('本次可赚 Asia Miles', '今次可以賺 Asia Miles', 'Asia Miles available')}</strong>
          <span style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: C.gold }}>{total}</span>
        </div>
        <div style={{ display: 'grid', gap: 4, marginTop: 8, fontSize: 13 }}>
          <Line k={`${FLIGHT.outNo}`} v={FLIGHT.flightMiles} />
          <Line k={L('合作商户消费', '合作商戶消費', 'Partner spend')} v={merchant} />
          <Line k={L('分流补偿与打卡', '分流補償同打卡', 'Diversion and check-ins')} v={bonus} />
          <Line k={L('完成 2 站以上奖励', '去咗 2 個站以上獎賞', '2+ stops bonus')} v={finish} />
        </div>
        <div style={{ fontSize: 12, color: C.gold, marginTop: 6 }}>{t.member ? `${t.member.name} · Marco Polo Club ${t.member.tier}` : L('登录国泰会员即可领取，未登录不会入账', '登入國泰會員先入到數', 'Log in to Cathay to claim them')}</div>
      </section>
      <button style={{ ...btn('ghost'), width: '100%' }} onClick={t.reset}>{L('开始新的中转', '開始新嘅轉機', 'Start a new transfer')}</button>
    </div>
  );
};
const TL = ({ time, title, sub, last }: { time: string; title: string; sub?: string; last?: boolean }) => (
  <li style={{ display: 'flex', gap: 10 }}>
    <span style={{ fontFamily: mono, fontSize: 12, color: C.muted, width: 42, flexShrink: 0, paddingTop: 1 }}>{time}</span>
    <span style={{ width: 10, height: 10, borderRadius: 5, background: last ? C.jade : C.mint, marginTop: 4, flexShrink: 0 }} />
    <span style={{ minWidth: 0 }}><span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>{sub && <span style={{ display: 'block', fontSize: 12, color: C.muted }}>{sub}</span>}</span>
  </li>
);
const Line = ({ k, v }: { k: string; v: number }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{k}</span><span style={{ fontFamily: mono, fontWeight: 700, color: C.gold }}>+{v}</span></div>
);
