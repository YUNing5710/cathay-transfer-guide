import React, { useEffect, useState } from 'react';
import { ARRIVALS, city, DEPARTURES, FLIGHT, hm, InFlight, OutFlight, resetFlights, setFlights } from './data';
import { L, useLang } from './i18n';
import { btn, C, Icon, mono } from './ui';

type Way = 'card' | 'seat' | 'nfc' | 'app';
const ways = (): { k: Way; t: string; d: string; icon: string }[] => [
  { k: 'card', t: L('值机小卡片', '登機證小卡', 'Check-in card'), d: L('登机时随登机证附上的二维码', '登機時連登機證一齊派嘅 QR code', 'QR code handed out with your boarding pass'), icon: 'cam' },
  { k: 'seat', t: L('座椅屏', '座位屏幕', 'Seatback screen'), d: L('降落前在座椅屏上扫码', '落機前喺座位屏幕掃碼', 'Scan before landing'), icon: 'info' },
  { k: 'nfc', t: L('NFC 立牌', 'NFC 牌', 'NFC stand'), d: L('下机口立牌，手机轻碰即开', '落機位個牌，部機輕輕掂一掂就得', 'Tap your phone at the gate stand'), icon: 'bolt' },
  { k: 'app', t: 'Cathay Pacific App', d: L('已安装用户直接从行程打开', '有裝 App 嘅直接喺行程打開', 'Open from your trip in the app'), icon: 'phone' },
];

const QR = () => {
  const cells: React.ReactElement[] = [];
  let s = 7;
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    const finder = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
    if (finder) continue;
    s = (s * 9301 + 49297) % 233280;
    if (s / 233280 > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />);
  }
  const F = ({ x, y }: { x: number; y: number }) => (
    <g><rect x={x} y={y} width="7" height="7" /><rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" /><rect x={x + 2} y={y + 2} width="3" height="3" /></g>
  );
  return (
    <svg viewBox="-1 -1 23 23" width="100%" height="100%" fill={C.ink} aria-hidden="true">
      <rect x="-1" y="-1" width="23" height="23" fill="#fff" />
      {cells}<F x={0} y={0} /><F x={14} y={0} /><F x={0} y={14} />
    </svg>
  );
};

export const Entry = ({ onDone }: { onDone: () => void }) => {
  useLang();
  const [way, setWay] = useState<Way | null>(null);
  const [stage, setStage] = useState<'choose' | 'scan' | 'pick' | 'ok'>('choose');
  const [inSel, setInSel] = useState<InFlight | null>(null);
  const [outSel, setOutSel] = useState<OutFlight | null>(null);
  const [q, setQ] = useState('');
  const needsPick = way === 'seat' || way === 'nfc';
  const W = ways();

  useEffect(() => {
    if (stage !== 'scan') return;
    const id = setTimeout(() => {
      if (needsPick) { setInSel(null); setOutSel(null); setQ(''); setStage('pick'); }
      else { resetFlights(); setStage('ok'); }
    }, 1500);
    return () => clearTimeout(id);
  }, [stage]);

  const label = W.find((w) => w.k === way)?.t ?? '';
  const match = (s: string) => !q.trim() || s.toLowerCase().includes(q.trim().toLowerCase());
  const arrivals = ARRIVALS.filter((f) => match(`${f.no}${f.from}${f.fromCode}${city(f.fromCode)}`));
  const departures = DEPARTURES.filter((f) => match(`${f.no}${f.to}${f.toCode}${city(f.toCode)}`));

  return (
    <div style={{ flex: 1, padding: '18px 16px', display: 'grid', alignContent: 'start', gap: 14 }}>
      <style>{`@keyframes scanl{0%{top:6%}100%{top:90%}}@keyframes pop{0%{transform:scale(.6);opacity:0}100%{transform:none;opacity:1}}`}</style>
      {stage === 'choose' && (
        <>
          <div>
            <div style={{ fontSize: 13, color: C.muted }}>Hong Kong International Airport · {L('中转', '轉機', 'Transfer')}</div>
            <h1 style={{ fontSize: 24, margin: '4px 0 0', color: C.ink }}>{L('扫一下，开始转机指引', '掃一掃，開始轉機指引', 'Scan to start your transfer')}</h1>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 1.5 }}>{L('选择你手边的入口，航班信息会自动带入。', '揀你手邊嘅入口，航班資料會自動帶入。', 'Pick whichever is at hand; your flights load automatically.')}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 10 }}>
            {W.map((w) => (
              <button key={w.k} onClick={() => { setWay(w.k); setStage('scan'); }}
                style={{ textAlign: 'left', minWidth: 0, border: `1px solid ${C.line}`, background: C.paper, borderRadius: 14, padding: 12, cursor: 'pointer', color: C.ink }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.jadeSoft, display: 'grid', placeItems: 'center' }}><Icon n={w.icon} c={C.jade} /></div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>{w.t}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.45 }}>{w.d}</div>
              </button>
            ))}
          </div>
        </>
      )}
      {stage === 'scan' && (
        <div style={{ display: 'grid', justifyItems: 'center', gap: 14, paddingTop: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{way === 'nfc' ? L('请将手机靠近立牌', '將部機靠近個牌', 'Hold your phone to the stand') : L('对准二维码', '對準 QR code', 'Point at the QR code')}</div>
          <div style={{ position: 'relative', width: 220, height: 220, borderRadius: 18, overflow: 'hidden', border: `3px solid ${C.jade}`, padding: 16, background: '#fff' }}>
            {way === 'nfc' ? <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}><Icon n="bolt" s={80} c={C.jade} w={1.6} /></div> : <QR />}
            <div style={{ position: 'absolute', left: 10, right: 10, height: 3, background: C.mint, borderRadius: 2, animation: 'scanl 1.1s ease-in-out infinite alternate' }} />
          </div>
          <div style={{ fontSize: 13, color: C.muted }}>{label} · {L('识别中…', '識別緊…', 'Reading…')}</div>
          <button style={btn('ghost')} onClick={() => setStage('choose')}>{L('换一种方式', '轉個方法', 'Try another way')}</button>
        </div>
      )}
      {stage === 'pick' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: C.muted }}>{L('已连接', '已連接', 'Connected')} · {label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{L('选择你的航班', '揀你嘅航班', 'Choose your flights')}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.5 }}>{L(`${label}为公共设备，无法读取你的行程。请选择刚乘坐和接下来要转乘的航班。`, `${label}係公共設備，讀唔到你嘅行程。麻煩揀返啱啱搭同埋跟住要轉嘅航班。`, `${label} is shared and cannot read your booking. Pick the flight you arrived on and your next flight.`)}</div>
          </div>
          <div>
            <label htmlFor="fq" style={{ fontSize: 12, color: C.muted }}>{L('搜索航班号或城市', '搵航班號或者城市', 'Search flight or city')}</label>
            <input id="fq" value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('例如 CX715 或 新加坡', '例如 CX715 或者 新加坡', 'e.g. CX715 or Singapore')}
              style={{ display: 'block', width: '100%', marginTop: 4, height: 38, borderRadius: 10, border: `1px solid ${C.line}`, padding: '0 12px', fontSize: 14, fontFamily: 'inherit', background: C.paper, color: C.ink }} />
          </div>
          <Step n={1} title={L('刚乘坐的航班', '啱啱搭嘅航班', 'Arrived on')} done={!!inSel} />
          <div style={{ display: 'grid', gap: 6 }}>
            {arrivals.map((f) => <Choice key={f.no} on={inSel?.no === f.no} onClick={() => setInSel(f)} a={`${f.no} ${city(f.fromCode)}`} b={`${L('抵达', '到達', 'arr')} ${f.arr}`} sub={f.status === 'landed' ? L('已落地', '已經落地', 'Landed') : L('即将落地', '就嚟落地', 'Landing soon')} />)}
            {!arrivals.length && <div style={{ fontSize: 13, color: C.muted }}>{L('没有匹配的到港航班', '搵唔到到港航班', 'No matching arrivals')}</div>}
          </div>
          <Step n={2} title={L('接下来转乘的航班', '跟住轉嘅航班', 'Connecting to')} done={!!outSel} />
          <div style={{ display: 'grid', gap: 6, opacity: inSel ? 1 : 0.5, pointerEvents: inSel ? 'auto' : 'none' }}>
            {departures.map((f) => <Choice key={f.no} on={outSel?.no === f.no} onClick={() => setOutSel(f)} a={`${f.no} ${city(f.toCode)}`} b={`${L('起飞', '起飛', 'dep')} ${hm(f.dep)}`} sub={`${f.miles} Asia Miles`} />)}
            {!departures.length && <div style={{ fontSize: 13, color: C.muted }}>{L('没有匹配的离港航班', '搵唔到離港航班', 'No matching departures')}</div>}
          </div>
          <button disabled={!inSel || !outSel} style={{ ...btn(), width: '100%', padding: '12px 14px', fontSize: 15, opacity: inSel && outSel ? 1 : 0.5 }}
            onClick={() => { if (inSel && outSel) { setFlights(inSel, outSel); setStage('ok'); } }}>{L('确认航班', '確認航班', 'Confirm flights')}</button>
          <button style={btn('ghost')} onClick={() => setStage('choose')}>{L('换一种方式', '轉個方法', 'Try another way')}</button>
        </div>
      )}
      {stage === 'ok' && (
        <div style={{ display: 'grid', gap: 14, paddingTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 22, background: C.jadeSoft, display: 'grid', placeItems: 'center', animation: 'pop .4s ease' }}><Icon n="check" s={26} c={C.jade} w={2.6} /></div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{needsPick ? L('已确认你的航班', '確認咗你嘅航班', 'Flights confirmed') : L('已识别你的行程', '認到你嘅行程', 'Trip found')}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{label}</div>
            </div>
          </div>
          <div style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 16, padding: 14, display: 'grid', gap: 10 }}>
            <Row a={`${FLIGHT.inNo} ${city(FLIGHT.fromCode)}`} b={`${L('抵达', '到達', 'arr')} ${FLIGHT.arr}`} sub={L('已落地 · HKG T1', '已經落地 · HKG T1', 'Landed · HKG T1')} />
            <div style={{ borderTop: `1px dashed ${C.line}` }} />
            <Row a={`${FLIGHT.outNo} ${city(FLIGHT.toCode)}`} b={`${L('起飞', '起飛', 'dep')} ${hm(FLIGHT.dep)}`} sub={`Gate 23 · ${needsPick ? L('行李状态待确认', '行李未確認', 'Baggage to confirm') : L('行李已直挂', '行李已經直掛', 'Bags checked through')}`} />
          </div>
          <button style={{ ...btn(), width: '100%', padding: '12px 14px', fontSize: 15 }} onClick={onDone}>{L('进入转机指引', '開始轉機指引', 'Start guide')}</button>
        </div>
      )}
    </div>
  );
};
const Step = ({ n, title, done }: { n: number; title: string; done: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
    <span style={{ width: 22, height: 22, borderRadius: 11, background: done ? C.jade : C.jadeSoft, color: done ? '#fff' : C.jade, fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center' }}>{done ? '✓' : n}</span>
    <strong style={{ fontSize: 15 }}>{title}</strong>
  </div>
);
const Choice = ({ on, onClick, a, b, sub }: { on: boolean; onClick: () => void; a: string; b: string; sub: string }) => (
  <button onClick={onClick} aria-pressed={on} style={{ textAlign: 'left', width: '100%', border: `1.5px solid ${on ? C.jade : C.line}`, background: on ? C.jadeSoft : C.paper, borderRadius: 12, padding: '9px 12px', cursor: 'pointer', color: C.ink }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 14 }}>{a}</strong><span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: C.jade }}>{b}</span></div>
    <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{sub}</div>
  </button>
);
const Row = ({ a, b, sub }: { a: string; b: string; sub: string }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 15 }}>{a}</strong><span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: C.jade }}>{b}</span></div>
    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{sub}</div>
  </div>
);
