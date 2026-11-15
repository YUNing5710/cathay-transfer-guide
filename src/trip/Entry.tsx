import React, { useEffect, useState } from 'react';
import { ARRIVALS, city, DEPARTURES, FLIGHT, hm, InFlight, OutFlight, resetFlights, setFlights } from './data';
import { L, useLang } from './i18n';
import { btn, C, ease, Icon, mono, T } from './ui';
import { clearDeepLink, DeepLink, readDeepLink } from './deeplink';
import { Bag } from './store';

type Way = 'card' | 'seat' | 'nfc' | 'app';
const ways = (): { k: Way; t: string; icon: string }[] => [
  { k: 'card', t: L('登机证二维码', '登機證 QR code', 'Boarding-pass QR'), icon: 'cam' },
  { k: 'seat', t: L('座椅屏', '座位屏幕', 'Seatback screen'), icon: 'info' },
  { k: 'nfc', t: L('NFC 立牌', 'NFC 牌', 'NFC stand'), icon: 'bolt' },
  { k: 'app', t: 'Cathay App', icon: 'phone' },
];

const QR = () => {
  const cells: React.ReactElement[] = [];
  let s = 7;
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue;
    s = (s * 9301 + 49297) % 233280;
    if (s / 233280 > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  }
  const F = ({ x, y }: { x: number; y: number }) => <g><rect x={x} y={y} width="7" height="7" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" /></g>;
  return <svg viewBox="-1 -1 23 23" width="100%" height="100%" fill={C.ink} aria-hidden="true"><rect x="-1" y="-1" width="23" height="23" fill="#fff" />{cells}<F x={0} y={0} /><F x={14} y={0} /><F x={0} y={14} /></svg>;
};

export interface EntryInfo { gate?: string; bag: Bag; term?: string }
type Stage = 'choose' | 'scan' | 'pick' | 'bag' | 'ok' | 'link';

export const Entry = ({ onDone }: { onDone: (info: EntryInfo) => void }) => {
  useLang();
  const [link] = useState<DeepLink>(() => readDeepLink());
  const fromLink = link.status === 'ok';
  const [way, setWay] = useState<Way>(() => ((['card', 'seat', 'nfc', 'app'] as Way[]).includes(link.src as Way) ? (link.src as Way) : 'card'));
  const [stage, setStage] = useState<Stage>(fromLink ? 'link' : 'choose');
  const [bag, setBag] = useState<Bag | null>(fromLink ? link.bag ?? null : null);
  const [inNo, setInNo] = useState(''); const [outNo, setOutNo] = useState('');
  const [inSel, setInSel] = useState<InFlight | null>(null);
  const [outSel, setOutSel] = useState<OutFlight | null>(null);
  const [q, setQ] = useState('');
  const W = ways();
  const label = W.find((w) => w.k === way)?.t ?? '';
  const finish = (b: Bag) => { clearDeepLink(); onDone({ gate: fromLink ? link.gate : undefined, bag: b, term: fromLink ? link.term : undefined }); };
  /** After flights are known: ask about bags only if we do not already know, then play the confirmation. */
  const afterFlights = () => setStage(bag ? 'ok' : 'bag');

  useEffect(() => {
    if (stage === 'link' && link.inF && link.outF) { setFlights(link.inF, link.outF); const a = setTimeout(afterFlights, 750); return () => clearTimeout(a); }
    if (stage === 'scan') { const a = setTimeout(() => setStage('pick'), 900); return () => clearTimeout(a); }
    if (stage === 'ok' && bag) { const a = setTimeout(() => finish(bag), 850); return () => clearTimeout(a); }
  }, [stage]);

  const match = (s: string) => !q.trim() || s.toLowerCase().includes(q.trim().toLowerCase());
  const arrivals = ARRIVALS.filter((f) => match(`${f.no}${f.from}${f.fromCode}${city(f.fromCode)}`));
  const departures = DEPARTURES.filter((f) => match(`${f.no}${f.to}${f.toCode}${city(f.toCode)}`));
  const ok = /^[A-Z0-9]{2}\d{1,4}$/;
  const a = inSel ?? (ok.test(inNo) ? ({ no: inNo, from: '', fromCode: '', arr: '--:--', status: 'landed' } as InFlight) : null);
  const d = outSel ?? (ok.test(outNo) ? ({ no: outNo, to: '', toCode: '', dep: 20 * 60, miles: 0 } as OutFlight) : null);

  return (
    <div key={stage} style={{ flex: 1, padding: '20px 18px', display: 'grid', alignContent: stage === 'choose' || stage === 'pick' ? 'start' : 'center', gap: 16, animation: `rise .35s ${ease}` }}>
      {stage === 'link' && link.inF && link.outF && (
        <div style={{ display: 'grid', justifyItems: 'center', gap: 18 }}>
          <Pulse icon="route" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: mono, fontSize: T.xl, fontWeight: 700 }}>
            <span style={{ animation: `pop .4s ${ease} both` }}>{link.inF.no}</span>
            <span style={{ color: C.faint, fontSize: T.md, animation: `pop .4s ${ease} .2s both` }}>HKG</span>
            <span style={{ animation: `pop .4s ${ease} .4s both` }}>{link.outF.no}</span>
          </div>
          <div style={{ fontSize: T.sm, color: C.muted }}>{L('正在读取行程', '讀緊行程', 'Reading your trip')}</div>
        </div>
      )}

      {stage === 'choose' && (<>
        <div>
          <div style={{ fontSize: T.sm, color: C.mint, fontWeight: 700, letterSpacing: 1 }}>HKG · TRANSFER</div>
          <h1 style={{ fontSize: T.xl, lineHeight: 1.3, margin: '6px 0 0' }}>{L('扫一下，开始转机', '掃一掃，開始轉機', 'Scan to start')}</h1>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {W.map((w, i) => (
            <button key={w.k} onClick={() => { setWay(w.k); setStage('scan'); }}
              style={{ textAlign: 'left', border: `1px solid ${C.line}`, background: C.paper, borderRadius: 16, padding: '14px 12px', cursor: 'pointer', color: C.ink, display: 'flex', alignItems: 'center', gap: 10, animation: `rise .35s ${ease} ${i * 0.05}s both` }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: C.jadeSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={w.icon} s={18} c={C.jade} /></span>
              <span style={{ fontSize: T.base, fontWeight: 600, lineHeight: 1.3 }}>{w.t}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setStage('pick')} style={{ border: 'none', background: 'none', color: C.jade, fontSize: T.sm, fontWeight: 600, cursor: 'pointer', justifySelf: 'start', padding: 0 }}>{L('手动输入航班', '手動輸入航班', 'Enter flights manually')} ›</button>
      </>)}

      {stage === 'scan' && (
        <div style={{ display: 'grid', justifyItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', width: 200, height: 200, borderRadius: 20, overflow: 'hidden', border: `3px solid ${C.jade}`, padding: 16, background: '#fff' }}>
            {way === 'nfc' ? <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}><Icon n="bolt" s={72} c={C.jade} w={1.6} /></div> : <QR />}
            <div style={{ position: 'absolute', left: 10, right: 10, height: 3, background: C.mint, borderRadius: 2, animation: 'scanl 1s ease-in-out infinite alternate' }} />
            <style>{'@keyframes scanl{0%{top:6%}100%{top:90%}}'}</style>
          </div>
          <div style={{ fontSize: T.sm, color: C.muted }}>{label}</div>
        </div>
      )}

      {stage === 'pick' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: T.lg, fontWeight: 800 }}>{link.status === 'bad' ? L('二维码无法识别，请选择航班', '認唔到 QR code，請揀航班', 'Code unreadable — pick your flights') : L('你的航班', '你嘅航班', 'Your flights')}</div>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('搜索航班号或城市', '搵航班號或者城市', 'Search flight or city')} aria-label="search" style={fld} />
          <Step n={1} title={L('刚乘坐', '啱啱搭', 'Arrived on')} done={!!a} />
          <div className="noscroll" style={rail}>
            {arrivals.map((f) => <Choice key={f.no} on={inSel?.no === f.no} onClick={() => setInSel(f)} a={f.no} c={city(f.fromCode)} b={f.arr} />)}
          </div>
          <Step n={2} title={L('转乘', '轉搭', 'Connecting to')} done={!!d} />
          <div className="noscroll" style={{ ...rail, opacity: a ? 1 : 0.45, pointerEvents: a ? 'auto' : 'none', transition: 'opacity .25s' }}>
            {departures.map((f) => <Choice key={f.no} on={outSel?.no === f.no} onClick={() => setOutSel(f)} a={f.no} c={city(f.toCode)} b={hm(f.dep)} />)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input value={inNo} onChange={(e) => { setInNo(e.target.value.toUpperCase()); setInSel(null); }} placeholder={L('到港 如 CX959', '到港 例如 CX959', 'In, e.g. CX959')} style={{ ...fld, fontFamily: mono }} />
            <input value={outNo} onChange={(e) => { setOutNo(e.target.value.toUpperCase()); setOutSel(null); }} placeholder={L('离港 如 CX715', '離港 例如 CX715', 'Out, e.g. CX715')} style={{ ...fld, fontFamily: mono }} />
          </div>
          <button disabled={!a || !d} style={{ ...btn(), width: '100%', padding: '12px', opacity: a && d ? 1 : 0.45 }}
            onClick={() => { if (a && d) { if (!inSel && !outSel && !inNo && !outNo) resetFlights(); setFlights(a, d); afterFlights(); } }}>{L('下一步', '下一步', 'Next')}</button>
        </div>
      )}

      {stage === 'bag' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ fontSize: T.lg, fontWeight: 800 }}>{L('你的行李', '你嘅行李', 'Your checked bags')}</div>
            <div style={{ fontSize: T.sm, color: C.muted, marginTop: 4 }}>{L('看行李牌上的目的地', '睇行李牌上面嘅目的地', 'Check the destination on your bag tag')}</div>
          </div>
          <BagOpt icon="suitcase" title={L(`直挂到 ${city(FLIGHT.toCode) || FLIGHT.outNo}`, `直掛去 ${city(FLIGHT.toCode) || FLIGHT.outNo}`, `Through to ${city(FLIGHT.toCode) || FLIGHT.outNo}`)} sub={L('不取行李，直接转机安检', '唔使攞行李，直接轉機安檢', 'No reclaim · straight to transfer security')} onClick={() => { setBag('ok'); setStage('ok'); }} />
          <BagOpt icon="passport" title={L('只挂到香港', '只係掛到香港', 'Only to Hong Kong')} sub={L('需入境、取行李、重新值机安检', '要入境、攞行李、再登記同安檢', 'Enter HK, reclaim, check in again')} onClick={() => { setBag('immig'); setStage('ok'); }} />
        </div>
      )}

      {stage === 'ok' && (
        <div style={{ display: 'grid', gap: 14, justifyItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: C.jade, display: 'grid', placeItems: 'center', animation: `pop .35s ${ease}` }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" strokeDasharray="60" style={{ animation: 'draw .5s ease .1s both' }} /></svg>
          </div>
          <div style={{ width: '100%', background: C.paper, borderRadius: 18, padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(0,60,58,.08)', animation: `rise .4s ${ease} .1s both` }}>
            <End no={FLIGHT.inNo} code={FLIGHT.fromCode} t={FLIGHT.arr} />
            <span style={{ color: C.faint, fontSize: T.sm, fontWeight: 700 }}>HKG</span>
            <End no={FLIGHT.outNo} code={FLIGHT.toCode} t={hm(FLIGHT.dep)} right />
          </div>
          <div style={{ fontSize: T.sm, color: C.muted, animation: `fade .4s ease .25s both` }}>{bag === 'immig' ? L('行李到香港 · 已规划入境路线', '行李到香港 · 已排好入境路線', 'Bags end in HK · entry route planned') : L('行李已直挂', '行李已經直掛', 'Bags checked through')}</div>
        </div>
      )}
    </div>
  );
};

const Pulse = ({ icon }: { icon: string }) => (
  <div style={{ position: 'relative', width: 96, height: 96, borderRadius: 48, background: C.jadeSoft, display: 'grid', placeItems: 'center' }}>
    <div style={{ position: 'absolute', inset: 0, borderRadius: 48, border: `2px solid ${C.jade}`, animation: 'ring 1.1s ease-out infinite' }} />
    <Icon n={icon} s={42} c={C.jade} w={1.8} />
  </div>
);
const End = ({ no, code, t, right }: { no: string; code: string; t: string; right?: boolean }) => (
  <div style={{ textAlign: right ? 'right' : 'left', minWidth: 0 }}>
    <div style={{ fontFamily: mono, fontSize: T.lg, fontWeight: 700 }}>{code || '—'}</div>
    <div style={{ fontSize: T.xs, color: C.muted, marginTop: 2 }}>{no} · {t}</div>
  </div>
);
const BagOpt = ({ icon, title, sub, onClick }: { icon: string; title: string; sub: string; onClick: () => void }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', border: `1px solid ${C.line}`, background: C.paper, borderRadius: 16, padding: 14, cursor: 'pointer', color: C.ink }}>
    <span style={{ width: 40, height: 40, borderRadius: 12, background: C.jadeSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={icon} c={C.jade} /></span>
    <span style={{ flex: 1, minWidth: 0 }}><span style={{ display: 'block', fontSize: T.md, fontWeight: 700 }}>{title}</span><span style={{ display: 'block', fontSize: T.sm, color: C.muted, marginTop: 2 }}>{sub}</span></span>
    <Icon n="chev" s={16} c={C.faint} />
  </button>
);
const Step = ({ n, title, done }: { n: number; title: string; done: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 20, height: 20, borderRadius: 10, background: done ? C.jade : C.jadeSoft, color: done ? '#fff' : C.jade, fontSize: T.xs, fontWeight: 700, display: 'grid', placeItems: 'center', transition: 'background .2s' }}>{done ? '✓' : n}</span>
    <strong style={{ fontSize: T.base }}>{title}</strong>
  </div>
);
/** Swipeable boarding-pass stubs: one row, snap scrolling, never a long list. */
const rail: React.CSSProperties = { display: 'flex', gap: 8, overflowX: 'auto', scrollSnapType: 'x mandatory', margin: '0 -18px', padding: '2px 18px 4px', transition: 'opacity .25s' };
const Choice = ({ on, onClick, a, b, c }: { on: boolean; onClick: () => void; a: string; b: string; c: string }) => (
  <button onClick={onClick} aria-pressed={on} style={{ flex: '0 0 auto', width: 118, scrollSnapAlign: 'start', display: 'grid', gap: 2, textAlign: 'left', border: `1.5px solid ${on ? C.jade : C.line}`, background: on ? `linear-gradient(160deg, ${C.jade}, ${C.jadeDeep})` : C.paper, color: on ? '#fff' : C.ink, borderRadius: 16, padding: '10px 12px', cursor: 'pointer', boxShadow: on ? '0 8px 18px rgba(0,63,64,.22)' : 'none', transform: on ? 'translateY(-2px)' : 'none', transition: `background .2s, color .2s, transform .25s ${ease}, box-shadow .25s` }}>
    <span style={{ fontFamily: mono, fontSize: T.xs, opacity: 0.7 }}>{a}</span>
    <strong style={{ fontSize: T.md, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c || '—'}</strong>
    <span style={{ fontFamily: mono, fontSize: T.sm, fontWeight: 700, color: on ? '#9FE7DD' : C.jade }}>{b}</span>
  </button>
);
const fld: React.CSSProperties = { display: 'block', width: '100%', height: 40, borderRadius: 12, border: `1px solid ${C.line}`, padding: '0 12px', fontSize: T.base, fontFamily: 'inherit', background: C.paper, color: C.ink };
