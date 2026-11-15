import { useEffect, useRef, useState } from 'react';
import { dur } from './data';
import { L } from './i18n';
import { Trip } from './store';

/** A bubble carries the question that is auto-sent when the user taps it. */
export interface Hint { text: string; ask: string }

const IDLE_MS = 22000;   // only speak after this long with no taps
const GAP_MS = 60000;    // and never more often than this

/**
 * Vera speaks up only when the passenger has gone quiet and the screen is calm:
 * no sheet open, no notice or toast waiting for an answer. Things worth saying are queued
 * while the user is busy and delivered together as one bubble once they are idle.
 */
export function useVeraHints(t: Trip, entered: boolean, busy: boolean) {
  const [hint, setHint] = useState<Hint | null>(null);
  const said = useRef<Set<string>>(new Set());
  const queue = useRef<(Hint & { k: string })[]>([]);
  const lastTouch = useRef(Date.now());
  const lastSpoke = useRef(0);
  const tip = useRef(0);

  useEffect(() => {
    const touch = () => { lastTouch.current = Date.now(); };
    window.addEventListener('pointerdown', touch, true);
    window.addEventListener('keydown', touch, true);
    return () => { window.removeEventListener('pointerdown', touch, true); window.removeEventListener('keydown', touch, true); };
  }, []);
  useEffect(() => { if (!entered) { said.current.clear(); queue.current = []; setHint(null); } }, [entered]);
  // Anything new on screen that needs the user wins over Vera: clear her bubble at once.
  useEffect(() => { if (busy) setHint(null); }, [busy]);

  const canRec = t.phase === 'free' && !t.atSec && t.left >= 20;
  const qTime = L('还剩多少时间', '仲有幾多時間', 'How much time is left');
  const qRoute = L('推荐几条路线', '推介幾條路線', 'Recommend a route');

  // Queue situational lines once each; they are spoken later, when the user is idle.
  useEffect(() => {
    if (!entered || t.boarded) return;
    const push = (k: string, text: string, ask: string) => { if (!said.current.has(k)) { said.current.add(k); queue.current.push({ k, text, ask }); } };
    if (t.delay > 0 && canRec) push('delay' + t.delay, L(`航班晚了 ${t.delay} 分钟，多出来的时间要不要安排一下？`, `航班遲咗 ${t.delay} 分鐘，多出嚟嘅時間要唔要安排吓？`, `${t.delay} extra minutes from the delay. Want to use them?`), qRoute);
    if (t.readyOrders.length) push('ready' + t.readyOrders[0].uid, L('你的餐好了，现在过去刚刚好。', '你啲嘢食整好咗，而家過去啱啱好。', 'Your food is ready. Good time to go.'), L('我有点饿', '我肚餓', 'I am hungry'));
    if (canRec && t.plan.length === 0 && t.left > 60) push('idle', L(`还有 ${dur(t.left)}，要我排一条顺路路线吗？`, `仲有 ${dur(t.left)}，使唔使我排條順路路線？`, `${dur(t.left)} to spare. Shall I plan a route?`), qRoute);
    if (canRec && !t.member && t.pending > 0) push('login' + t.pending, L(`已攒下 ${t.pending} Asia Miles，登录就能领取。`, `儲咗 ${t.pending} Asia Miles，登入就攞得。`, `${t.pending} Asia Miles waiting. Log in to claim.`), L('怎么领里数', '點樣攞里數', 'How do I claim miles'));
  }, [entered, t.boarded, t.delay, t.readyOrders.length, t.member, t.pending, t.plan.length, canRec]);

  useEffect(() => {
    if (!entered || t.boarded) return;
    const id = setInterval(() => {
      const now = Date.now();
      if (busy || hint || now - lastTouch.current < IDLE_MS || now - lastSpoke.current < GAP_MS) return;
      let h: Hint | null = null;
      if (queue.current.length) {
        // Deliver what piled up as one bubble: the newest line first, plus a count of the rest.
        const q = queue.current.splice(0);
        const top = q[q.length - 1];
        h = { text: q.length > 1 ? `${top.text} ${L(`另外还有 ${q.length - 1} 件事，点我看看。`, `仲有 ${q.length - 1} 件事，撳我睇吓。`, `Plus ${q.length - 1} more, tap me.`)}` : top.text, ask: top.ask };
      } else {
        const tips: Hint[] = canRec ? [
          { text: L('饿了吗？我看看哪家出餐最快。', '肚唔肚餓？我睇吓邊間最快有得食。', 'Hungry? I can find the fastest food.'), ask: L('我有点饿', '我肚餓', 'I am hungry') },
          { text: L('Sky Bridge 离地 28 米，飞机从脚下滑过。', 'Sky Bridge 離地 28 米，飛機喺腳底滑過。', 'Sky Bridge: 28 m up, planes glide below.'), ask: L('想去看飞机', '想去睇飛機', 'I want to see the planes') },
          { text: L('想带点香港手信吗？', '想買啲香港手信？', 'Some Hong Kong gifts?'), ask: L('想买手信', '想買手信', 'Gift ideas') },
        ] : [{ text: L(`走回 ${t.gateName} 号口约 ${t.walkGate} 分钟，到点我会提醒你。`, `行返 ${t.gateName} 號閘口大約 ${t.walkGate} 分鐘，夠鐘我會提你。`, `Gate ${t.gateName} is ~${t.walkGate} min away. I will remind you.`), ask: qTime }];
        h = tips[tip.current++ % tips.length];
      }
      lastSpoke.current = now;
      setHint(h);
    }, 3000);
    return () => clearInterval(id);
  }, [entered, t.boarded, busy, hint, canRec, t.gateName, t.walkGate]);

  useEffect(() => { if (!hint) return; const id = setTimeout(() => setHint(null), 7000); return () => clearTimeout(id); }, [hint]);
  return { hint, setHint };
}
