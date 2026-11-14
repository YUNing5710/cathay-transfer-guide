import { useEffect, useRef, useState } from 'react';
import { dur, showerWait } from './data';
import { L } from './i18n';
import { Trip } from './store';

/** A bubble carries the question that is auto-sent when the user taps it. Text is resolved at show time. */
export interface Hint { text: string; ask: string }

export function useVeraHints(t: Trip, entered: boolean, sheetOpen: boolean) {
  const [hint, setHint] = useState<Hint | null>(null);
  const said = useRef<Set<string>>(new Set());
  const say = (k: string, text: string, ask: string) => { if (!said.current.has(k)) { said.current.add(k); setHint({ text, ask }); return true; } return false; };
  useEffect(() => { if (!entered) said.current.clear(); }, [entered]);

  useEffect(() => {
    if (!entered || t.boarded) return;
    const qTime = L('还剩多少时间', '仲有幾多時間', 'How much time is left');
    const qRoute = L('推荐几条路线', '推介幾條路線', 'Recommend a route');
    if (t.gate === 'g512' && say('gate512', L('登机口改到北卫星 512 了，路比较远，我已经重新算好时间。', '閘口轉咗去北衛星 512，路遠啲，我已經計返好時間。', 'Your gate moved to 512 in the North Satellite. It is further, so I have re-timed everything.'), L('登机口在哪', '閘口喺邊', 'Where is my gate'))) return;
    if (t.delay > 0 && say('delay' + t.delay, L(`航班推迟了 ${t.delay} 分钟，多出来的时间要不要安排一下？`, `航班延遲咗 ${t.delay} 分鐘，多出嚟嘅時間要唔要安排吓？`, `Your flight is ${t.delay} min late. Want to use the extra time?`), qRoute)) return;
    if (t.bag === 'unknown' && say('bag', L('行李状态还没确认，我陪你先去转机柜台问一下？', '行李未確認，我陪你去轉機櫃位問吓先？', 'Your baggage is not confirmed yet. Shall we check at the transfer desk?'), L('行李直挂了吗', '行李直掛咗未', 'Are my bags checked through'))) return;
    if (t.left < 0 && say('over' + t.plan.length, L(`安排超出了 ${dur(-t.left)}，要不要删掉一两项？`, `排多咗 ${dur(-t.left)}，要唔要刪走一兩項？`, `Your plan is over by ${dur(-t.left)}. Drop a stop?`), qTime)) return;
    if (t.readyOrders.length && say('ready' + t.readyOrders[0].uid, L('你的餐好了，现在过去刚刚好。', '你嘅餐整好咗，而家過去啱啱好。', 'Your food is ready. Now is a good time to go.'), L('我有点饿', '我肚餓', 'I am hungry'))) return;
    if (t.free > 0 && t.free < 30 && say('tight', L('时间不多了，建议现在往登机口走。', '冇咩時間喇，建議而家行去閘口。', 'Time is short. Best to head to the gate now.'), qTime)) return;
    if (!t.member && t.pending > 0 && say('login' + t.pending, L(`本次行程已累计 ${t.pending} Asia Miles，登录即可领取哦。`, `今次行程儲咗 ${t.pending} Asia Miles，登入就攞得㗎喇。`, `You have ${t.pending} Asia Miles waiting. Log in to claim them.`), L('怎么领里数', '點樣攞里數', 'How do I claim miles'))) return;
    if (showerWait(t.clock + 20, t.showerPeak).wait >= 45 && t.has('lounge') && say('shower', L('贵宾室淋浴正在高峰，排队可能要一个多小时。', '貴賓室沖涼排緊長龍，可能要等成個鐘。', 'Lounge showers are at peak; the queue may exceed an hour.'), L('想洗个澡', '想沖個涼', 'I want a shower'))) return;
    if (!t.atSec && t.plan.length === 0 && t.left > 60) say('idle', L(`你有 ${dur(t.left)} 可以安排，要我排几条顺路的吗？`, `你有 ${dur(t.left)} 可以安排，使唔使我幫你排幾條順路嘅？`, `You have ${dur(t.left)} to spare. Want me to plan a route?`), qRoute);
  }, [entered, t.boarded, t.gate, t.delay, t.bag, t.left < 0, t.readyOrders.length, t.free < 30, t.member, t.pending, t.showerPeak, t.atSec, t.plan.length]);

  const tip = useRef(0);
  useEffect(() => {
    if (!entered || t.boarded || sheetOpen) return;
    const id = setInterval(() => {
      if (hint) return;
      const tips: Hint[] = [
        { text: L('肚子饿了吗？我看看哪家出餐最快。', '肚唔肚餓？我睇吓邊間出餐最快。', 'Hungry? I can find the fastest food.'), ask: L('我有点饿', '我肚餓', 'I am hungry') },
        { text: L('Sky Bridge 离地 28 米，飞机从脚下滑过，免费。', 'Sky Bridge 離地 28 米，飛機喺腳底滑過，免費。', 'Sky Bridge is 28 m up with planes below. Free.'), ask: L('想去看飞机', '想去睇飛機', 'I want to see the planes') },
        !t.member ? { text: L('登录国泰会员，这次的消费都能累积 Asia Miles。', '登入國泰會員，今次消費都儲到 Asia Miles。', 'Log in to Cathay to earn Asia Miles on this trip.'), ask: L('怎么领里数', '點樣攞里數', 'How do I claim miles') } : { text: L(`你已经累积 ${t.miles} Asia Miles 了。`, `你已經儲咗 ${t.miles} Asia Miles。`, `You have ${t.miles} Asia Miles so far.`), ask: L('我有多少里数', '我有幾多里數', 'How many miles do I have') },
        { text: L(`走回 ${t.gateName} 号口大约 ${t.walkGate} 分钟，我会提前提醒你。`, `行返 ${t.gateName} 號閘口大約 ${t.walkGate} 分鐘，我會提早提你。`, `Gate ${t.gateName} is about ${t.walkGate} min away. I will remind you.`), ask: L('还剩多少时间', '仲有幾多時間', 'How much time is left') },
        { text: L('想带点香港手信吗？', '想買啲香港手信？', 'Want some Hong Kong gifts?'), ask: L('想买手信', '想買手信', 'Gift ideas') },
      ];
      setHint(tips[tip.current++ % tips.length]);
    }, 25000);
    return () => clearInterval(id);
  }, [entered, t.boarded, sheetOpen, hint, t.member, t.miles, t.gateName, t.walkGate]);

  useEffect(() => { if (!hint) return; const id = setTimeout(() => setHint(null), 5000); return () => clearTimeout(id); }, [hint]);
  return { hint, setHint };
}
