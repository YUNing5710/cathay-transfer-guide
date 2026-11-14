/* Build prompt
WingWeave · 国泰个性化转机指引 "One Arrow. One Number."，Cathay Hackathon 2026 手机端。
Art direction: 国泰 App 风格的手机界面，浅色。页面 #F3F5F4，白色卡片仅用于重复项和弹层；国泰翠绿 #006564 用于箭头卡、主按钮、
当前位置；金色 #7A5300 只用于里数；红色 #A8261B 用于超时。系统无衬线字体，时间与里数用等宽字体。最大 430px 手机框，底部 Tab。
First screen: 巫俏宁，CX959 杭州 → 香港 → CX715 新加坡 20:15，23 号口。行李已直挂，先去转机安检（固定在行程首位），箭头按当前路段转弯。
Time model: 每站预估占用 = 从上一站步行 + 停留（含出餐、淋浴排队），最后一站再走回登机口；全部按偏保守估算。
Features: 一键生成顺路路线（均衡/美食/购物/观光/休息，填满约 80% 可支配时间，首页可收起）；拖动排序；进度条按真实预计时间标站点，
黄色越靠右越红；贵宾室按舱位与会员等级显示，付费贵宾室人人可见；淋浴高峰排队计入时间；未登录横幅与“登录后可赚里程”；
会员登录动画；呼叫客服直接确认拨通；Vera 精灵（点泡泡自动发对应问题、长按直接说话、主动提醒）；
所有可调参数（步速、舱位、会员等级、时间流速）只在可拖动的现场事件控制台里。
*/
import React, { useEffect, useRef, useState } from 'react';
import { FLIGHT, pname, dur, ensureGate } from './trip/data';
import { L, Lang, setLang, useLang } from './trip/i18n';
import { useTrip } from './trip/store';
import { C, Icon, sans, Sheet, btn } from './trip/ui';
import { Home } from './trip/Home';
import { Explore } from './trip/Explore';
import { MapView } from './trip/NavView';
import { HelpSheet, MemberSheet, OrderPicker, OrderSheet } from './trip/Sheets';
import { EventsPanel } from './trip/EventsPanel';
import { Entry } from './trip/Entry';
import { VeraSheet } from './trip/Vera';
import { VeraPet } from './trip/VeraPet';
import { useVeraHints } from './trip/hints';

type Tab = 'home' | 'explore' | 'map';
type SheetName = null | 'order' | 'picker' | 'help' | 'member' | 'vera';

export const App = () => {
  const t = useTrip();
  const [gateAsk, setGateAsk] = useState(false);
  const lang = useLang();
  const [tab, setTab] = useState<Tab>('home');
  const [sheet, setSheet] = useState<SheetName>(null);
  const [shop, setShop] = useState('mcd');
  const [entered, setEntered] = useState(false);
  const [veraInit, setVeraInit] = useState<string | null>(null);
  const [veraVoice, setVeraVoice] = useState(false);
  const scroller = useRef<HTMLElement>(null);
  const { hint, setHint } = useVeraHints(t, entered, !!sheet);

  useEffect(() => { if (t.loungeOffer) { setTab('home'); setSheet(null); } }, [t.loungeOffer]);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [tab]);

  const openOrder = (id?: string) => { if (id) { setShop(id); setSheet('order'); } else setSheet('picker'); };
  const openVera = (init: string | null, voice = false) => { setVeraInit(init); setVeraVoice(voice); setHint(null); setSheet('vera'); };
  const goHome = () => { setSheet(null); setTab('home'); };

  const arrive = (id: string, force = false) => {
    t.setNav({ key: '', leg: 0, prog: 0 });
    if (id === 'sec') { t.setClock((c) => c + t.pre); t.setHere('sec'); t.note(L('已过转机安检', '過咗轉機安檢', 'Cleared transfer security')); setTab('home'); return; }
    if (id === t.gate) {
      // 防误触：离登机还早时先确认，避免时间还很多就显示已登机
      if (!force && t.phase === 'free' && t.free > 20) { setGateAsk(true); return; }
      setGateAsk(false); t.setHere(t.gate); t.setBoarded(true); setTab('home'); return;
    }
    const stop = t.tl.stops.find((s) => s.place.id === id);
    if (stop) {
      t.setPlan((p) => p.map((x) => (x.uid === stop.item.uid ? { ...x, done: true, doneAt: stop.end, used: stop.stay } : x)));
      t.setClock(Math.max(t.clock, stop.end));
      // Miles are credited only on completion; partner stops carry their miles on the plan item.
      const m = stop.item.miles ?? (stop.place.partner ? stop.place.miles : 0);
      if (m) t.earn(m, pname(stop.place));
      if (id === 'art') t.earn(10, L('艺术展廊打卡', '藝術展廊打卡', 'Art gallery check-in'));
      t.note(L(`已完成 ${pname(stop.place)} · 箭头已指向下一站`, `搞掂 ${pname(stop.place)} · 箭咀指住下一站`, `${pname(stop.place)} done · arrow points to the next stop`));
    }
    t.setHere(id);
    setTab('home');
  };

  return (
    <div style={{ fontFamily: sans, background: '#DDE3E1', minHeight: '100vh', display: 'flex', justifyContent: 'center', overflowX: 'hidden', width: '100%' }}>
      <style>{`*,*::before,*::after{box-sizing:border-box}html,body{margin:0;padding:0;overflow-x:hidden;max-width:100%}button{font-family:inherit;max-width:100%}svg{max-width:100%}`}</style>
      <div style={{ position: 'relative', width: '100%', maxWidth: 430, height: '100vh', maxHeight: 900, background: C.bg, color: C.ink, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 0 0 1px #C9D3D1' }}>
        <header style={{ background: C.paper, borderBottom: `1px solid ${C.line}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.jade }}>{L('国泰转机指引', '國泰轉機指引', 'Cathay Transfer Guide')}</div>
            <div style={{ fontSize: 12, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{FLIGHT.inNo} {FLIGHT.fromCode} → HKG → {FLIGHT.outNo} {FLIGHT.toCode}</div>
          </div>
          <div role="group" aria-label="Language" style={{ display: 'flex', border: `1px solid ${C.line}`, borderRadius: 999, overflow: 'hidden' }}>
            {([['zh', '简'], ['hk', '繁'], ['en', 'EN']] as [Lang, string][]).map(([k, l]) => (
              <button key={k} aria-pressed={lang === k} onClick={() => setLang(k)} style={{ border: 'none', background: lang === k ? C.jade : C.paper, color: lang === k ? '#fff' : C.ink, fontSize: 12, fontWeight: 700, padding: '4px 8px', cursor: 'pointer' }}>{l}</button>
            ))}
          </div>
          <button aria-label={L('会员', '會員', 'Member')} onClick={() => setSheet('member')} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ width: 32, height: 32, borderRadius: 16, background: t.member ? C.jade : '#8A9997', display: 'grid', placeItems: 'center' }}><Icon n="user" s={18} c="#fff" /></span>
            {t.member && <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: 'ui-monospace, Menlo, monospace' }}>{t.miles}</span>}
          </button>
        </header>
        {entered && !t.member && (
          <button onClick={() => setSheet('member')} style={{ border: 'none', borderBottom: `1px solid ${C.line}`, background: C.goldSoft, color: C.gold, fontSize: 12, fontWeight: 600, padding: '6px 14px', textAlign: 'left', cursor: 'pointer' }}>
            {L(`未登录 · 暂时累积不到里数${t.pending ? `（已有 ${t.pending} Asia Miles 待领）` : ''}。点击右上角头像立即登录`, `未登入 · 暫時儲唔到里數${t.pending ? `（有 ${t.pending} Asia Miles 等緊你攞）` : ''}。撳右上角頭像即刻登入`, `Not logged in · miles are not being earned${t.pending ? ` (${t.pending} Asia Miles waiting)` : ''}. Tap the avatar to log in`)}
          </button>
        )}

        <main ref={scroller} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {!entered && <Entry onDone={(info) => { if (info.gate) { const id = ensureGate(info.gate); if (id) t.setGate(id); } if (info.bag) t.setBag(info.bag); setEntered(true); setTab('home'); }} />}
          {entered && tab === 'home' && <Home t={t} goExplore={() => setTab('explore')} goMap={() => setTab('map')} openOrder={() => openOrder()} openHelp={() => setSheet('help')} arrive={arrive} />}
          {entered && tab === 'explore' && <Explore t={t} openOrder={openOrder} goHome={goHome} />}
          {entered && tab === 'map' && <MapView t={t} onArrive={arrive} />}
        </main>

        {entered && <nav style={{ display: 'flex', background: C.paper, borderTop: `1px solid ${C.line}` }}>
          {([['home', L('指引', '指引', 'Guide'), 'home'], ['explore', L('探索', '探索', 'Explore'), 'star'], ['map', L('导航', '導航', 'Map'), 'map']] as [Tab, string, string][]).map(([k, label, ic]) => (
            <button key={k} onClick={() => setTab(k)} aria-current={tab === k}
              style={{ flex: 1, border: 'none', background: 'none', padding: '8px 0 10px', cursor: 'pointer', color: tab === k ? C.jade : C.muted, fontSize: 12, fontWeight: 600, display: 'grid', justifyItems: 'center', gap: 2 }}>
              <Icon n={ic} s={20} c={tab === k ? C.jade : C.muted} />{label}
            </button>
          ))}
        </nav>}

        <div aria-live="polite" style={{ position: 'absolute', top: 92, left: 12, right: 12, display: 'grid', gap: 6, zIndex: 60, pointerEvents: 'none' }}>
          {t.notes.map((n) => (
            <div key={n.id} style={{ background: n.tone === 'warn' ? C.goldSoft : n.tone === 'bad' ? C.redSoft : C.ink, color: n.tone === 'ok' ? '#fff' : n.tone === 'warn' ? C.gold : C.red, padding: '9px 12px', borderRadius: 12, fontSize: 13, fontWeight: 600, boxShadow: '0 6px 18px rgba(0,0,0,.15)' }}>{n.text}</div>
          ))}
        </div>

        {entered && !t.boarded && !sheet && (
          <VeraPet hint={hint?.text ?? null} onOpen={() => openVera(hint?.ask ?? null)} onVoice={() => openVera(null, true)} onDismiss={() => setHint(null)}
            mood={t.free < 30 || t.left < 0 || t.bag === 'unknown' ? 'alert' : 'calm'} />
        )}

        {sheet === 'picker' && <OrderPicker t={t} onPick={(id) => openOrder(id)} onClose={() => setSheet(null)} />}
        {sheet === 'order' && <OrderSheet key={shop} t={t} shopId={shop} onClose={() => setSheet(null)} onDone={goHome} />}
        {sheet === 'help' && <HelpSheet onClose={() => setSheet(null)} />}
        {sheet === 'vera' && <VeraSheet t={t} initial={veraInit} voice={veraVoice} onClose={() => setSheet(null)} openOrder={openOrder} goMap={() => { setSheet(null); setTab('map'); }} openHelp={() => setSheet('help')} openMember={() => setSheet('member')} />}
        {sheet === 'member' && <MemberSheet t={t} onClose={() => setSheet(null)} />}
        {gateAsk && (
          <Sheet title={L('确定已到登机口？', '確定到咗閘口？', 'At your gate already?')} onClose={() => setGateAsk(false)}>
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>{L(`离开始登机还有 ${dur(t.boardTime - t.clock)}，你还有 ${dur(Math.max(0, t.free))} 可以自由安排。确认后转机指引会结束，并显示已登机。`, `離開始登機仲有 ${dur(t.boardTime - t.clock)}，你仲有 ${dur(Math.max(0, t.free))} 可以自由安排。確認之後轉機指引會結束，顯示已登機。`, `Boarding starts in ${dur(t.boardTime - t.clock)} and you still have ${dur(Math.max(0, t.free))} free. Confirming ends the guide and marks you as boarded.`)}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button style={{ ...btn(), flex: 1 }} onClick={() => setGateAsk(false)}>{L('还没到，继续安排', '未到，繼續安排', 'Not yet')}</button>
              <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => arrive(t.gate, true)}>{L('是的，已到登机口', '係，到咗閘口', 'Yes, at the gate')}</button>
            </div>
          </Sheet>
        )}
      </div>
      {entered && <EventsPanel t={t} onFired={goHome} onReset={() => { setEntered(false); setTab('home'); setSheet(null); }} />}
    </div>
  );
};
export default App;
