import { useEffect, useMemo, useRef, useState } from 'react';
import { BUFFER, FLIGHT, Kitchen, PLACES, Place, START_CLOCK, ensureGate, pickupEstimate, pname, route, secQueue, showerWait } from './data';
import { useLiveFlight } from './live';
import { L } from './i18n';

export interface PlanItem { uid: number; id: string; done: boolean; readyAt?: number; orderText?: string; doneAt?: number; used?: number; code?: string; miles?: number }
/** Return buffer before boarding: from here on no new tasks; when it ends, everything stops. */
export const RETURN_BUFFER = 30;
export interface MilesLog { n: number; why: string }
export interface Note { id: number; text: string; tone: 'ok' | 'warn' | 'bad' }
/** Marco Polo Club tiers are proper nouns, shown untranslated. */
export type Tier = 'Green' | 'Silver' | 'Gold' | 'Diamond';
export type Cabin = 'Y' | 'W' | 'J' | 'F';
export interface Stop { item: PlanItem; place: Place; arrive: number; start: number; end: number; walk: number; stay: number }

const initKitchens = () => Object.fromEntries(PLACES.filter((p) => p.kitchen).map((p) => [p.id, { ...p.kitchen! }])) as Record<string, Kitchen>;
let UID = 1;

export function useTrip() {
  const [kitchens, setKitchens] = useState<Record<string, Kitchen>>(initKitchens);
  const [kitchenAt, setKitchenAt] = useState(Date.now());
  const [pace, setPace] = useState(65); // metres per minute, deliberately slow
  // ---- 步速校准：用旅客实际走路花的时间（真实时钟）修正步速 ----
  // 只会变慢、不会快于默认 65 米/分，保证预估时间只会偏长；演示里的模拟导航不计入
  const walkFrom = useRef<{ at: number; from: string }>({ at: Date.now(), from: 'arr' });
  const simRef = useRef(false);
  const [paceTuned, setPaceTuned] = useState(false);
  const [secJitter, setSecJitter] = useState(0);
  const [secSurge, setSecSurge] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setKitchens((k) => Object.fromEntries(Object.entries(k).map(([key, v]) => [key, { ...v, orders: Math.max(1, Math.min(30, v.orders + Math.round(Math.random() * 4 - 2))) }])));
      setSecJitter(Math.round(Math.random() * 16 - 8));
      setKitchenAt(Date.now());
    }, 5000);
    return () => clearInterval(id);
  }, []);
  const [clock, setClock] = useState(START_CLOCK);
  const [delay, setDelay] = useState(0);
  const [boardEarly, setBoardEarly] = useState(0);
  const [gate, setGate] = useState<string>('g23');
  const [member, setMember] = useState<null | { name: string; tier: Tier }>(null);
  const [loginTier, setLoginTier] = useState<Tier>('Silver');
  /** Route generator card on Home: hidden once any one-tap route has been used, or dismissed. */
  const [genUsed, setGenUsed] = useState(false);
  const [cabin, setCabin] = useState<Cabin>('Y');
  const [miles, setMiles] = useState(0);
  const [pending, setPending] = useState(0);
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [here, setHere] = useState('arr');
  const [loungeFull, setLoungeFull] = useState(false);
  const [loungeOffer, setLoungeOffer] = useState(false);
  const [showerPeak, setShowerPeak] = useState(false);
  const [showerTicket, setShowerTicket] = useState<Record<string, number>>({});
  const [boarded, setBoarded] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [speed, setSpeed] = useState(0);
  const [bag, setBag] = useState<'ok' | 'unknown'>('ok');
  const [change, setChange] = useState<null | { title: string; before: number; after: number }>(null);
  const [undo, setUndo] = useState<PlanItem | null>(null);
  const [nav, setNav] = useState({ key: '', leg: 0, prog: 0 });
  useEffect(() => {
    if (!speed || boarded) return;
    const id = setInterval(() => setClock((c) => c + 1), 12000 / speed);
    return () => clearInterval(id);
  }, [speed, boarded]);

  const note = (text: string, tone: Note['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setNotes((n) => [...n, { id, text, tone }]);
    setTimeout(() => setNotes((n) => n.filter((x) => x.id !== id)), 3200);
  };

  const notified = useRef<Set<number>>(new Set());
  useEffect(() => {
    plan.filter((p) => !p.done && p.readyAt !== undefined && clock >= p.readyAt && !notified.current.has(p.uid)).forEach((p) => {
      notified.current.add(p.uid);
      const pl = PLACES.find((x) => x.id === p.id);
      note(L(`取餐提醒：${pl ? pname(pl) : ''} 已准备好`, `攞餐提提你：${pl ? pname(pl) : ''} 整好咗`, `Pickup: ${pl ? pname(pl) : ''} is ready`));
    });
  }, [clock, plan]);
  const readyOrders = plan.filter((p) => !p.done && p.readyAt !== undefined && clock >= p.readyAt);
  const soonOrders = plan.filter((p) => !p.done && p.readyAt !== undefined && clock < p.readyAt && p.readyAt - clock <= 5);

  // ---- time model -------------------------------------------------------
  const dep = FLIGHT.dep + delay;
  const boardBuffer = BUFFER + boardEarly;
  const walkMin = (from: string, to: string) => Math.ceil(route(from, to).meters / pace);
  /** 到达一个地点时调用：stay = 在那里预计停留的分钟数（要从耗时里扣掉） */
  const calibrate = (toId: string, stay = 0) => {
    const w = walkFrom.current, sim = simRef.current;
    walkFrom.current = { at: Date.now(), from: toId }; simRef.current = false;
    if (sim || w.from === toId) return;
    const meters = route(w.from, toId).meters;
    const walk = (Date.now() - w.at) / 60000 - stay;   // 真实分钟
    if (meters < 80 || walk < 1 || walk > 45) return;   // 太短或中途停留太久，不可靠
    const measured = meters / walk;
    const next = Math.round(Math.max(35, Math.min(65, pace * 0.6 + measured * 0.4)));
    if (Math.abs(next - pace) >= 3) {
      setPace(next); setPaceTuned(true);
      note(L(`已按你的实际步速（约 ${next} 米/分）重新估算步行时间`, `已經按你實際行路速度（大約每分鐘 ${next} 米）重新計行路時間`, `Walking times updated to your actual pace (~${next} m/min)`), 'warn');
    }
  };
  const markSim = () => { simRef.current = true; };
  const sec = { people: Math.max(0, secQueue(clock).people + secJitter + secSurge), lanes: 4 };
  const secWait = Math.ceil((sec.people * 20) / sec.lanes / 60) + 2;
  const atSec = here === 'arr';
  const walkSec = walkMin('arr', 'sec');
  /** Security: walk to it + queue + screening 6 + escalator to L6 3. */
  const pre = atSec ? walkSec + secWait + 6 + 3 : 0;
  const origin = atSec ? 'sec' : here;
  const t0 = clock + pre;

  /** Minutes spent at a stop once you are there (kitchen wait, shower queue included, conservative). */
  const stayAt = (p: Place, it: PlanItem | undefined, arrive: number) => {
    let s = p.mins;
    if (p.kitchen && !p.dine) {
      const ready = it?.readyAt ?? arrive + pickupEstimate(kitchens[p.id] ?? p.kitchen);
      s = Math.max(p.mins, Math.max(0, ready - arrive) + 8);
    }
    if (p.access && p.shower) {
      const w = showerWait(arrive, showerPeak).wait;
      const ticket = showerTicket[p.id];
      const q = ticket !== undefined ? Math.max(0, w - (arrive - ticket)) : w;
      s = 30 + q + 20; // settle in + queue + shower
    }
    return s;
  };
  const timeline = (items: PlanItem[]) => {
    let cur = origin, t = t0;
    const stops: Stop[] = [];
    for (const it of items) {
      const p = PLACES.find((x) => x.id === it.id);
      if (!p) continue;
      const w = walkMin(cur, p.id);
      const arrive = t + w;
      const stay = stayAt(p, it, arrive);
      stops.push({ item: it, place: p, arrive, start: arrive, end: arrive + stay, walk: w, stay });
      t = arrive + stay; cur = p.id;
    }
    const toGate = walkMin(cur, gate);
    return { stops, end: t, toGate, last: cur };
  };
  const open = plan.filter((p) => !p.done);
  const tl = useMemo(() => timeline(open), [plan, clock, here, gate, pace, kitchens, showerPeak, showerTicket, secJitter, secSurge]);
  const baseGate = walkMin(origin, gate);
  /** Boarding time is the hard end; a 30-min return buffer sits before it. */
  const boardTime = dep - boardBuffer;
  /** Free time with no stops at all = boarding − 30 min buffer − security − walk to gate. */
  const free = boardTime - RETURN_BUFFER - t0 - baseGate;
  /** Latest moment to leave for the gate from where you are now (buffer end). */
  const leaveBy = boardTime - walkMin(origin, gate) - (atSec ? pre : 0);
  /** free: plan normally · buffer: no new tasks, current one continues, later ones paused · go: everything stops. */
  const phase: 'free' | 'buffer' | 'go' = clock >= leaveBy ? 'go' : clock >= leaveBy - RETURN_BUFFER ? 'buffer' : 'free';
  const walkGate = tl.toGate;
  const planned = tl.end - t0 + tl.toGate - baseGate;
  const left = free - planned;
  /** Extra minutes a stop costs if appended (or with `items` replaced) = detour + time there. */
  const costOf = (id: string, items: PlanItem[] = open) => {
    const a = timeline(items), b = timeline([...items, { uid: -1, id, done: false }]);
    return (b.end + b.toGate) - (a.end + a.toGate);
  };
  const costList = (ids: string[]) => {
    const a = timeline(open), b = timeline([...open, ...ids.map((id, i) => ({ uid: -2 - i, id, done: false }))]);
    return (b.end + b.toGate) - (a.end + a.toGate);
  };
  const gateName = gate.slice(1);

  // ---- lounge access ----------------------------------------------------
  const tierRank = { Green: 0, Silver: 1, Gold: 2, Diamond: 3 } as const;
  const canEnter = (p: Place) => {
    if (!p.access || p.access === 'paid') return true;
    const r = member ? tierRank[member.tier] : -1;
    if (p.access === 'first') return cabin === 'F' || r >= 3;
    return cabin === 'J' || cabin === 'F' || r >= 1;
  };
  const visible = (p: Place) => canEnter(p);

  const [milesLog, setMilesLog] = useState<MilesLog[]>([]);
  const earn = (n: number, why: string) => {
    if (n <= 0) return;
    setMilesLog((l) => [...l, { n, why }]);
    if (member) { setMiles((m) => m + n); note(`+${n} Asia Miles · ${why}`); }
    else { setPending((p) => p + n); note(L(`登录后可领取 ${n} Asia Miles`, `登入後可以攞 ${n} Asia Miles`, `Log in to claim ${n} Asia Miles`), 'warn'); }
  };
  /** Miles are credited only when the task is completed (and only if logged in; otherwise held until login). */
  const add = (id: string, extra?: Partial<PlanItem>) => {
    if (phase !== 'free') { note(L('已进入返回缓冲，不能再添加新任务', '已經入咗返程緩衝，唔可以再加嘢', 'Return buffer has started; no new tasks'), 'warn'); return; }
    setPlan((p) => [...p, { uid: UID++, id, done: false, ...extra }]);
  };
  const has = (id: string) => plan.some((x) => x.id === id && !x.done);
  /** Generator and Explore treat "already visited" the same as planned, to avoid re-suggesting. */
  const visited = (id: string) => plan.some((x) => x.id === id && x.done);
  const removeUid = (uid: number) => {
    const it = plan.find((x) => x.uid === uid);
    if (it) setUndo(it);
    setPlan((p) => p.filter((x) => x.uid !== uid));
  };
  const remove = (id: string) => { const it = plan.find((x) => x.id === id && !x.done); if (it) removeUid(it.uid); };


  // ---- 实时航班（OAG）：延误、登机口变化自动同步；后端没开就用演示数据 ----
  const { live, online } = useLiveFlight(FLIGHT.inNo, FLIGHT.outNo, (f, p) => {
    if (f.delayMin !== (p?.delayMin ?? 0)) {
      setDelay(f.delayMin);
      if (p && f.delayMin > 0) note(`${f.no} 延误 ${f.delayMin} 分钟 · 可支配时间已重算`, 'warn');
    }
    if (f.depGate) {
      const id = ensureGate(f.depGate);
      if (id) { setGate(id); if (p && p.depGate !== f.depGate) note(`${f.no} 登机口变更为 ${f.depGate} · 路线已重算`, 'warn'); }
    }
  });

  return {
    live, online, calibrate, markSim, paceTuned,
    readyOrders, soonOrders, pre, secWait, walkSec, milesLog, pace, setPace, sec, secSurge, setSecSurge,
    clock, setClock, kitchens, setKitchens, kitchenAt, delay, setDelay, boardEarly, setBoardEarly, boardBuffer,
    gate, setGate, member, miles, pending, plan, setPlan, here, setHere, nav, setNav,
    loungeFull, setLoungeFull, loungeOffer, setLoungeOffer, showerPeak, setShowerPeak, showerTicket, setShowerTicket,
    boarded, setBoarded, notes, note, dep, walkGate, free, left, planned, gateName, earn, tl, t0, costOf, costList, timeline,
    cabin, setCabin, loginTier, setLoginTier, canEnter, visible, atSec, genUsed, setGenUsed,
    boardTime, leaveBy, phase, canAdd: phase === 'free',
    login: () => { setMember({ name: '巫俏宁', tier: loginTier }); setMiles((m) => m + pending); if (pending) note(L(`已领取 ${pending} Asia Miles`, `已經攞咗 ${pending} Asia Miles`, `${pending} Asia Miles claimed`)); setPending(0); },
    logout: () => setMember(null),
    add, has, visited, remove, removeUid,
    undo, undoRemove: () => { if (undo) setPlan((p) => [...p, undo]); setUndo(null); }, clearUndo: () => setUndo(null),
    speed, setSpeed, bag, setBag, change, setChange,
    /** Drop open stops from the end until the plan fits. Returns dropped names. */
    cleanup: () => {
      const keep = [...plan];
      const dropped: string[] = [];
      for (let i = keep.length - 1; i >= 0; i--) {
        const o = keep.filter((x) => !x.done);
        const tt = timeline(o);
        if (free - (tt.end - t0 + tt.toGate - baseGate) >= 0) break;
        if (keep[i].done) continue;
        const pl = PLACES.find((x) => x.id === keep[i].id);
        dropped.push(pl ? pname(pl) : '');
        keep.splice(i, 1);
      }
      setPlan(keep);
      return dropped;
    },
    reset: () => {
      setPace(65); setPaceTuned(false); walkFrom.current = { at: Date.now(), from: 'arr' }; setSpeed(0); setBag('ok'); setChange(null); setUndo(null); setMilesLog([]); setSecSurge(0);
      setClock(START_CLOCK); setDelay(0); setBoardEarly(0); setGate('g23'); setMember(null); setMiles(0); setPending(0);
      setPlan([]); notified.current.clear(); setHere('arr'); setLoungeFull(false); setLoungeOffer(false); setBoarded(false);
      setShowerPeak(false); setShowerTicket({}); setCabin('Y'); setNav({ key: '', leg: 0, prog: 0 }); setKitchens(initKitchens()); setGenUsed(false);
    },
  };
}
export type Trip = ReturnType<typeof useTrip>;
