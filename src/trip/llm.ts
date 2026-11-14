// Vera 的 LLM 补充：规则回复答不了的问题，交给后端 /api/chat（Groq）。
// 失败、超时或后端没开时返回 null，Vera 继续用规则回复。
import { dur, FLIGHT, hm, PLACES, pname } from './data';
import { Trip } from './store';

export async function askLLM(q: string, t: Trip, history: { who: string; text: string }[]): Promise<string | null> {
  const ctx = {
    inbound: FLIGHT.inNo, outbound: `${FLIGHT.outNo} 飞往 ${FLIGHT.to}`,
    now: hm(t.clock), departure: hm(t.dep), gate: t.gateName,
    freeTime: dur(Math.max(0, t.left)), live: t.online ? t.live : null,
    places: PLACES.map((p) => pname(p)).slice(0, 40),
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({ q, ctx, history: history.slice(-6) }),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return typeof d.text === 'string' && d.text.trim() ? d.text.trim() : null;
  } catch { return null; } finally { clearTimeout(timer); }
}
