import React, { useRef, useState } from 'react';
import { dur, PLACES, pname } from './data';
import { L } from './i18n';
import { Cabin, Tier, Trip } from './store';

/**
 * Floating operator console. Stands in for live data feeds, ground staff and sensor variables.
 * Every adjustable parameter (pace, tier, cabin, speed) lives here only, never in the passenger UI.
 */
export const EventsPanel = ({ t, onFired, onReset }: { t: Trip; onFired: () => void; onReset: () => void }) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'flight' | 'site' | 'pax'>('flight');
  const [pos, setPos] = useState({ x: 16, y: 16 });
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const down = (e: React.PointerEvent) => {
    if (open && (e.target as HTMLElement).closest('button')) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: pos.x, y: pos.y };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    if (e.pointerType === 'mouse' && e.buttons === 0) { drag.current = null; return; }
    setPos({ x: Math.max(0, Math.min(window.innerWidth - 60, d.x + e.clientX - d.px)), y: Math.max(0, Math.min(window.innerHeight - 44, d.y + e.clientY - d.py)) });
  };
  const up = () => { drag.current = null; };

  const fire = (fn: () => void) => { fn(); onFired(); };
  const card = (title: string, fn: () => void, delta: number) => fire(() => { const b = t.free; fn(); t.setChange({ title, before: Math.max(0, b), after: Math.max(0, b + delta) }); });

  if (!open) return (
    <button aria-label="展开现场事件模拟" onPointerDown={down} onPointerMove={move}
      onPointerUp={(e) => { const d = drag.current; up(); if (!d || Math.abs(e.clientX - d.px) + Math.abs(e.clientY - d.py) < 6) setOpen(true); }}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 200, width: 40, height: 40, borderRadius: 20, border: 'none', background: '#1F2B2A', boxShadow: '0 6px 16px rgba(0,0,0,.25)', cursor: 'pointer', display: 'grid', placeItems: 'center', touchAction: 'none', padding: 0 }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7FE0D5" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
    </button>
  );

  const order = t.plan.find((p) => !p.done && p.readyAt !== undefined && p.readyAt > t.clock);
  return (
    <div style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 200, width: 290, maxWidth: 'calc(100vw - 16px)', background: '#1F2B2A', color: '#fff', borderRadius: 14, boxShadow: '0 12px 32px rgba(0,0,0,.28)', fontSize: 13 }}>
      <div onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>
        <span style={{ fontWeight: 700, flex: 1, whiteSpace: 'nowrap' }}>现场事件模拟</span>
        <span style={{ fontSize: 11, color: '#B9CAC7', whiteSpace: 'nowrap' }}>可支配 {dur(Math.max(0, t.free))}</span>
        <button aria-label="收起" onClick={() => setOpen(false)} style={{ border: 'none', background: '#33433F', color: '#fff', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', fontSize: 14 }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '0 10px 8px' }}>
        {([['flight', '航班'], ['site', '现场'], ['pax', '旅客与参数']] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ ...pill(tab === k), flex: 1 }}>{l}</button>
        ))}
      </div>
      <div style={{ padding: '0 10px 10px', display: 'grid', gap: 6, maxHeight: '64vh', overflowY: 'auto' }}>
        <Row label="时间流速">
          {[[0, '暂停'], [1, 'x1'], [5, 'x5'], [20, 'x20']].map(([v, l]) => <button key={v} onClick={() => t.setSpeed(v as number)} style={pill(t.speed === v)}>{l}</button>)}
        </Row>
        {tab === 'flight' && (<>
          <Ev label="时间前进 30 分" onClick={() => fire(() => t.setClock((c) => c + 30))} />
          <Ev label="下一程推迟 40 分" onClick={() => card(L('下一程推迟 40 分钟', '下一程延遲 40 分鐘', 'Next flight delayed 40 min'), () => t.setDelay(t.delay + 40), 40)} />
          <Ev label="下一程推迟 90 分" onClick={() => card(L('下一程推迟 90 分钟', '下一程延遲 90 分鐘', 'Next flight delayed 90 min'), () => t.setDelay(t.delay + 90), 90)} />
          {t.delay > 0 && <Ev label="下一程恢复准点" onClick={() => card(L('下一程恢复准点', '下一程回復準時', 'Next flight back on time'), () => t.setDelay(0), -t.delay)} />}
          <Ev label={t.boardEarly ? '登机时间恢复' : '提前 15 分开始登机'} onClick={() => card(t.boardEarly ? L('登机时间恢复', '登機時間回復', 'Boarding time restored') : L('提前 15 分钟开始登机', '提早 15 分鐘登機', 'Boarding 15 min earlier'), () => t.setBoardEarly(t.boardEarly ? 0 : 15), t.boardEarly ? 15 : -15)} />
          <Ev label={t.gate === 'g23' ? '登机口 23 → 512（北卫星）' : '登机口改回 23'} onClick={() => fire(() => {
            const g = t.gate === 'g512' ? 'g23' : 'g512';
            const b = t.free; t.setGate(g);
            t.setChange({ title: g === 'g512' ? L('登机口变更 23 → 512', '閘口改咗 23 → 512', 'Gate change 23 → 512') : L('登机口改回 23', '閘口改返 23', 'Gate back to 23'), before: Math.max(0, b), after: Math.max(0, b + (g === 'g512' ? -16 : 16)) });
          })} />
          <Ev label="直接跳到快登机" onClick={() => fire(() => t.setClock(t.dep - t.boardBuffer - t.walkGate - 3))} />
        </>)}
        {tab === 'site' && (<>
          <Ev label={t.secSurge ? '转机安检恢复正常' : '转机安检人流激增 +150 人'} onClick={() => fire(() => t.setSecSurge(t.secSurge ? 0 : 150))} />
          <Ev label={t.loungeFull ? '贵宾室恢复空位' : 'The Pier 满员'} onClick={() => fire(() => {
            if (t.loungeFull) { t.setLoungeFull(false); t.setLoungeOffer(false); return; }
            ['lounge', 'wing'].forEach((id) => t.has(id) && t.remove(id)); t.clearUndo(); t.setLoungeFull(true); t.setLoungeOffer(true);
          })} />
          <Ev label={t.showerPeak ? '淋浴排队恢复平峰' : '贵宾室淋浴进入高峰（排队约 70 分）'} onClick={() => fire(() => t.setShowerPeak(!t.showerPeak))} />
          <Ev label="餐厅出餐变慢（每家 +8 单）" onClick={() => fire(() => t.setKitchens((k) => Object.fromEntries(Object.entries(k).map(([a, v]) => [a, { ...v, orders: v.orders + 8 }]))))} />
          {order && <Ev label={`${pname(PLACES.find((p) => p.id === order.id)!)} 餐已做好`} onClick={() => fire(() => t.setPlan((p) => p.map((x) => (x.uid === order.uid ? { ...x, readyAt: t.clock } : x))))} />}
          <Ev label={t.bag === 'ok' ? '行李改为：只挂到香港（需入境）' : '行李改为：直挂'} onClick={() => fire(() => { t.setBag(t.bag === 'ok' ? 'immig' : 'ok'); t.setHere('arr'); })} />
        </>)}
        {tab === 'pax' && (<>
          <Row label="步速">
            {[[50, '慢'], [65, '正常'], [85, '快']].map(([v, l]) => <button key={v} onClick={() => t.setPace(v as number)} style={pill(t.pace === v)}>{l}</button>)}
          </Row>
          <Row label="舱位">
            {(['Y', 'W', 'J', 'F'] as Cabin[]).map((c) => <button key={c} onClick={() => t.setCabin(c)} style={pill(t.cabin === c)}>{{ Y: '经济', W: '超经', J: '商务', F: '头等' }[c]}</button>)}
          </Row>
          <Row label="会员等级">
            {(['Green', 'Silver', 'Gold', 'Diamond'] as Tier[]).map((c) => <button key={c} onClick={() => t.setLoginTier(c)} style={pill(t.loginTier === c)}>{c}</button>)}
          </Row>
          <div style={{ fontSize: 11, color: '#B9CAC7' }}>会员等级在旅客登录时生效。已登录时，先在头像里退出再登录。</div>
        </>)}
        <button onClick={() => { t.reset(); onReset(); }} style={{ marginTop: 2, border: '1px solid #4A5C58', background: 'none', color: '#D5E2DF', borderRadius: 10, padding: '7px 0', cursor: 'pointer', fontSize: 12 }}>重置（回到扫码入口）</button>
      </div>
    </div>
  );
};

const pill = (on: boolean): React.CSSProperties => ({ padding: '4px 8px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', background: on ? '#2FA39B' : '#33433F', color: '#fff' });
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}><span style={{ fontSize: 12, color: '#B9CAC7', width: 64 }}>{label}</span>{children}</div>
);
const Ev = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button onClick={onClick} style={{ textAlign: 'left', border: 'none', background: '#2A3936', color: '#fff', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ width: 6, height: 6, borderRadius: 3, background: '#7FE0D5', flexShrink: 0 }} />{label}
  </button>
);
