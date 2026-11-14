// 实时航班：按用户选的到港 + 离港航班，每 3 分钟查一次后端 /api/hkg-transfer（OAG Flight Info）
// 后端没开时静默失败，App 继续用演示数据，演示事件面板照常可用
import { useEffect, useRef, useState } from 'react';

export interface LiveFlight {
  no: string; from?: string; to?: string;
  depTime?: string; depEst?: string; arrTime?: string; arrEst?: string;
  depTerminal?: string; arrTerminal?: string; depGate?: string; checkIn?: string; baggage?: string;
  delayMin: number; timeliness: string; status: string; updatedAt?: string;
}
export interface LiveTransfer { in: LiveFlight; out: LiveFlight; transferMin: number }

const POLL_MS = 3 * 60 * 1000;   // 每次消耗 2 次 Flight Info 额度
const toMin = (t?: string) => { if (!t) return NaN; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

export function useLiveFlight(inNo: string, outNo: string, onChange: (f: LiveFlight, prev: LiveFlight | null) => void) {
  const [live, setLive] = useState<LiveTransfer | null>(null);
  const [online, setOnline] = useState(false);
  const prev = useRef<LiveFlight | null>(null);
  const cb = useRef(onChange); cb.current = onChange;
  useEffect(() => {
    let stop = false;
    prev.current = null; setLive(null);
    const tick = async () => {
      try {
        const r = await fetch(`/api/hkg-transfer?in=${encodeURIComponent(inNo)}&out=${encodeURIComponent(outNo)}`);
        if (!r.ok) throw new Error(String(r.status));
        const d: LiveTransfer = await r.json();
        const f = d.out; if (!f || stop) return;
        const est = toMin(f.depEst), sch = toMin(f.depTime);
        if (!isNaN(est) && !isNaN(sch)) { const v = ((est - sch) + 1440) % 1440; f.delayMin = v > 720 ? 0 : v; }
        const p = prev.current;
        if (!p || p.delayMin !== f.delayMin || (f.depGate && p.depGate !== f.depGate)) cb.current(f, p);
        prev.current = f; setLive(d); setOnline(true);
      } catch { if (!stop) setOnline(false); }
    };
    tick();
    const id = setInterval(() => { if (document.visibilityState === 'visible') tick(); }, POLL_MS);
    return () => { stop = true; clearInterval(id); };
  }, [inNo, outNo]);
  return { live, online };
}
