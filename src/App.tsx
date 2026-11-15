import React, { useEffect, useRef, useState } from 'react';
import { FLIGHT, pname, dur, ensureGate, nameOf } from './trip/data';
import { L, Lang, setLang, useLang } from './trip/i18n';
import { useTrip } from './trip/store';
import { C, Icon, sans, Sheet, btn, GLOBAL_CSS, T, ease, mono } from './trip/ui';
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
  const busy = !!sheet || gateAsk || t.notes.length > 0 || !!t.change || t.loungeOffer || t.readyOrders.length > 0 || (t.left < 0 && t.phase === 'free');
  const { hint, setHint } = useVeraHints(t, entered, busy);

  useEffect(() => { if (t.loungeOffer) { setTab('home'); setSheet(null); } }, [t.loungeOffer]);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); }, [tab]);

  const openOrder = (id?: string) => { if (id) { setShop(id); setSheet('order'); } else setSheet('picker'); };
  const openVera = (init: string | null, voice = false) => { setVeraInit(init); setVeraVoice(voice); setHint(null); setSheet('vera'); };
  const goHome = () => { setSheet(null); setTab('home'); };

  const arrive = (id: string, force = false) => {
    t.setNav({ key: '', leg: 0, prog: 0 });
    if (t.atSec && id === t.preTarget) {
      t.calibrate(id, Math.max(0, t.stepNow - t.walkSec)); t.setClock((c) => c + t.stepNow); t.setHere(id);
      const last = t.posIdx === t.steps.length - 1;
      t.note(last ? L('前置步骤完成 · 自由时间开始', '搞掂晒 · 自由時間開始', 'All clear · free time starts') : L(`已完成 ${nameOf(id)}`, `搞掂 ${nameOf(id)}`, `${nameOf(id)} done`));
      setTab('home'); return;
    }
    if (id === t.gate) {
      // 防误触：离登机还早时先确认，避免时间还很多就显示已登机
      if (!force && t.phase === 'free' && t.free > 20) { setGateAsk(true); return; }
      setGateAsk(false); t.calibrate(t.gate); t.setHere(t.gate); t.setBoarded(true); setTab('home'); return;
    }
    const stop = t.tl.stops.find((s) => s.place.id === id);
    if (stop) {
      t.calibrate(id, stop.stay);
      t.setPlan((p) => p.map((x) => (x.uid === stop.item.uid ? { ...x, done: true, doneAt: stop.end, used: stop.stay } : x)));
      t.setClock(Math.max(t.clock, stop.end));
      // Miles are credited only on completion; partner stops carry their miles on the plan item.
      const m = stop.item.miles ?? (stop.place.partner ? stop.place.miles : 0);
      // One toast per completion: miles fold into it instead of stacking a second line.
      const total = (m || 0) + (id === 'art' ? 10 : 0);
      if (m) t.earn(m, pname(stop.place), true);
      if (id === 'art') t.earn(10, L('艺术展廊打卡', '藝術展廊打卡', 'Art gallery check-in'), true);
      const tail = total ? (t.member ? ` · +${total} Miles` : L(` · 登录领 ${total} Miles`, ` · 登入攞 ${total} Miles`, ` · log in for ${total} Miles`)) : '';
      t.note(L(`✓ ${pname(stop.place)}`, `✓ ${pname(stop.place)}`, `✓ ${pname(stop.place)}`) + tail);
    }
    t.setHere(id);
    setTab('home');
  };

  return (
    <div className="wwroot" style={{ fontFamily: sans, background: 'radial-gradient(120% 80% at 50% 0%, #E6EEEC 0%, #D3DDDA 100%)', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', overflowX: 'hidden', width: '100%' }}>
      <style>{GLOBAL_CSS + '.wwframe{border-radius:22px;height:calc(100vh - 16px)!important;margin:8px}@media (min-width:480px){.wwframe{border-radius:30px;height:min(900px,calc(100vh - 32px))!important;margin:16px 0}}'}</style>
      <div className="wwframe" style={{ position: 'relative', width: '100%', maxWidth: 430, height: '100vh', maxHeight: 900, background: C.bg, color: C.ink, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,50,48,.18), 0 0 0 1px rgba(0,60,58,.08)' }}>
        <header style={{ background: C.paper, padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: T.md, fontWeight: 800, color: C.jade, letterSpacing: 0.2 }}>WingWeave</div>
            <div style={{ fontSize: T.xs, color: C.muted, fontFamily: mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entered ? `${FLIGHT.fromCode || FLIGHT.inNo} → HKG → ${FLIGHT.toCode || FLIGHT.outNo}` : 'Cathay Pacific · HKG'}</div>
          </div>
          <div role="group" aria-label="Language" style={{ display: 'flex', background: C.grey, borderRadius: 999, padding: 2 }}>
            {([['zh', '简'], ['hk', '繁'], ['en', 'EN']] as [Lang, string][]).map(([k, l]) => (
              <button key={k} aria-pressed={lang === k} onClick={() => setLang(k)} style={{ border: 'none', background: lang === k ? C.jade : 'transparent', color: lang === k ? '#fff' : C.muted, fontSize: T.xs, fontWeight: 700, padding: '4px 9px', borderRadius: 999, cursor: 'pointer', transition: `background .2s ${ease}, color .2s` }}>{l}</button>
            ))}
          </div>
          <button aria-label={L('会员', '會員', 'Member')} onClick={() => setSheet('member')} style={{ display: 'flex', alignItems: 'center', gap: 4, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ width: 32, height: 32, borderRadius: 16, background: t.member ? C.jade : '#8A9997', display: 'grid', placeItems: 'center' }}><Icon n="user" s={18} c="#fff" /></span>
            {t.member && <span style={{ fontSize: 12, fontWeight: 700, color: C.gold, fontFamily: 'ui-monospace, Menlo, monospace' }}>{t.miles}</span>}
          </button>
        </header>
        {entered && !t.member && (
          <button onClick={() => setSheet('member')} style={{ border: 'none', background: C.goldSoft, color: C.gold, fontSize: T.xs, fontWeight: 600, padding: '6px 14px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ flex: 1 }}>{t.pending ? L(`${t.pending} Asia Miles 待领取`, `${t.pending} Asia Miles 等緊你攞`, `${t.pending} Asia Miles waiting`) : L('登录 Marco Polo Club，本次消费可赚里数', '登入 Marco Polo Club，今次消費賺里數', 'Log in to earn Asia Miles on this trip')}</span>
            <span style={{ fontWeight: 700 }}>{L('登录', '登入', 'Log in')} ›</span>
          </button>
        )}

        <main ref={scroller} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {!entered && <Entry onDone={(info) => { const g = t.live?.out.depGate || info.gate; if (g) { const id = ensureGate(g); if (id) t.setGate(id); } t.setBag(info.bag); t.setHere('arr'); setEntered(true); setTab('home'); }} />}
          {entered && tab === 'home' && <div key="home" style={{ animation: `fade .25s ease` }}> <Home t={t} goExplore={() => setTab('explore')} goMap={() => setTab('map')} openOrder={() => openOrder()} openHelp={() => setSheet('help')} arrive={arrive} /></div>}
          {entered && tab === 'explore' && <Explore t={t} openOrder={openOrder} goHome={goHome} />}
          {entered && tab === 'map' && <MapView t={t} onArrive={arrive} />}
        </main>

        {entered && <nav style={{ display: 'flex', background: C.paper, borderTop: `1px solid ${C.line}`, padding: '2px 8px 4px' }}>
          {([['home', L('指引', '指引', 'Guide'), 'home'], ['explore', L('探索', '探索', 'Explore'), 'star'], ['map', L('导航', '導航', 'Map'), 'map']] as [Tab, string, string][]).map(([k, label, ic]) => (
            <button key={k} onClick={() => setTab(k)} aria-current={tab === k}
              style={{ flex: 1, border: 'none', background: 'none', padding: '6px 0 8px', cursor: 'pointer', color: tab === k ? C.jade : C.faint, fontSize: T.xs, fontWeight: 700, display: 'grid', justifyItems: 'center', gap: 3, transition: 'color .2s' }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 44, height: 26, borderRadius: 13, background: tab === k ? C.jadeSoft : 'transparent', transition: `background .25s ${ease}` }}><Icon n={ic} s={19} c={tab === k ? C.jade : C.faint} /></span>{label}
            </button>
          ))}
        </nav>}

        {/* Toasts: max two, stacked like cards — the older one tucks behind, never fills the screen. */}
        <div aria-live="polite" style={{ position: 'absolute', top: 62, left: 0, right: 0, display: 'grid', justifyItems: 'center', zIndex: 60, pointerEvents: 'none' }}>
          {t.notes.slice(-2).map((n, i, arr) => {
            const back = i < arr.length - 1;
            return (
              <div key={n.id} style={{ gridArea: '1 / 1', maxWidth: 'calc(100% - 40px)', background: n.tone === 'warn' ? '#3B2E10' : n.tone === 'bad' ? '#4A1612' : C.ink, color: '#fff', padding: '9px 14px', borderRadius: 999, fontSize: T.sm, fontWeight: 600, boxShadow: '0 8px 22px rgba(0,0,0,.18)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                transform: back ? 'translateY(-7px) scale(.92)' : 'none', opacity: back ? 0.55 : 1, transition: `transform .3s ${ease}, opacity .3s`, animation: back ? undefined : `toastIn .3s ${ease}` }}>
                {n.tone === 'warn' && <span style={{ color: '#F2C66D', marginRight: 6 }}>●</span>}{n.text}
              </div>
            );
          })}
        </div>

        {entered && !t.boarded && !sheet && (
          <VeraPet hint={hint?.text ?? null} onOpen={() => openVera(hint?.ask ?? null)} onVoice={() => openVera(null, true)} onDismiss={() => setHint(null)}
            mood={t.free < 30 || t.left < 0 ? 'alert' : 'calm'} />
        )}

        {sheet === 'picker' && <OrderPicker t={t} onPick={(id) => openOrder(id)} onClose={() => setSheet(null)} />}
        {sheet === 'order' && <OrderSheet key={shop} t={t} shopId={shop} onClose={() => setSheet(null)} onDone={goHome} />}
        {sheet === 'help' && <HelpSheet onClose={() => setSheet(null)} />}
        {sheet === 'vera' && <VeraSheet t={t} initial={veraInit} voice={veraVoice} onClose={() => setSheet(null)} openOrder={openOrder} goMap={() => { setSheet(null); setTab('map'); }} openHelp={() => setSheet('help')} openMember={() => setSheet('member')} />}
        {sheet === 'member' && <MemberSheet t={t} onClose={() => setSheet(null)} />}
        {gateAsk && (
          <Sheet title={L('确定已到登机口？', '確定到咗閘口？', 'At your gate already?')} onClose={() => setGateAsk(false)}>
            <div style={{ fontSize: T.base, lineHeight: 1.6, color: C.muted }}>{L(`还有 ${dur(Math.max(0, t.free))} 自由时间，确认后指引将结束。`, `仲有 ${dur(Math.max(0, t.free))} 自由時間，確認之後指引會結束。`, `${dur(Math.max(0, t.free))} still free. Confirming ends the guide.`)}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => setGateAsk(false)}>{L('还没', '未', 'Not yet')}</button>
              <button style={{ ...btn(), flex: 1 }} onClick={() => arrive(t.gate, true)}>{L('已到登机口', '到咗閘口', 'At the gate')}</button>
            </div>
          </Sheet>
        )}
      </div>
      {entered && <EventsPanel t={t} onFired={goHome} onReset={() => { setEntered(false); setTab('home'); setSheet(null); }} />}
    </div>
  );
};
export default App;
