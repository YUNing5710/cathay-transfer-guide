import React, { useEffect, useRef, useState } from 'react';
import { dur } from './data';
import { L, useLang } from './i18n';
import { Trip } from './store';
import { btn, C, Icon, Sheet } from './ui';
import { Msg, quick, reply, voiceSamples } from './veraBrain';
import { askLLM } from './llm';

/** Vera chat. `initial` is auto-sent (the bubble the user tapped); `voice` starts listening right away (long-press on the pet). */
export const VeraSheet = ({ t, onClose, openOrder, goMap, openHelp, openMember, initial, voice }: {
  t: Trip; onClose: () => void; openOrder: (id?: string) => void; goMap: () => void; openHelp: () => void; openMember: () => void; initial?: string | null; voice?: boolean;
}) => {
  useLang();
  const [msgs, setMsgs] = useState<Msg[]>(initial ? [] : [{ who: 'vera', text: L(`你好，我是 Vera。你现在有 ${dur(Math.max(0, t.left))} 可以自由安排，想吃、想逛、想歇都可以问我。`, `你好，我係 Vera。你而家有 ${dur(Math.max(0, t.left))} 自由時間，想食、想行、想抖都可以問我。`, `Hi, I am Vera. You have ${dur(Math.max(0, t.left))} free. Ask me about food, shops or a place to rest.`) }]);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const sent = useRef(0);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, typing]);
  const ctx = { t, openOrder, goMap, openHelp, openMember, close: onClose };
  const send = (q: string) => {
    const v = q.trim(); if (!v) return;
    sent.current++;
    setMsgs((m) => [...m, { who: 'me', text: v }]);
    setText(''); setTyping(true);
    const r = reply(v, ctx);
    if (!r.fallback) { setTimeout(() => { setTyping(false); setMsgs((m) => [...m, r]); }, 600); return; }
    // 规则答不了：问 LLM；失败就用规则的兜底回复（带“呼叫客服”按钮）
    askLLM(v, t, msgs).then((ans) => {
      setTyping(false);
      setMsgs((m) => [...m, ans ? { who: 'vera', text: ans, acts: r.acts } : r]);
    });
  };
  useEffect(() => { if (initial) send(initial); if (voice) setListening(true); }, []);
  const finish = () => { if (!listening) return; setListening(false); const s = voiceSamples(); send(s[sent.current % s.length]); };
  useEffect(() => {
    if (!listening) return;
    const upH = () => finish();
    window.addEventListener('pointerup', upH, { once: true });
    return () => window.removeEventListener('pointerup', upH);
  }, [listening]);

  return (
    <Sheet title={L('Vera · 你的中转向导', 'Vera · 你嘅轉機助手', 'Vera · your transfer guide')} onClose={onClose}>
      <div style={{ display: 'grid', gap: 8, maxHeight: 320, overflowY: 'auto', paddingBottom: 4 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ justifySelf: m.who === 'me' ? 'end' : 'start', maxWidth: '86%' }}>
            <div style={{ background: m.who === 'me' ? C.jade : C.bg, color: m.who === 'me' ? '#fff' : C.ink, borderRadius: m.who === 'me' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '8px 12px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{m.text}</div>
            {m.acts && <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>{m.acts.map((a) => <button key={a.label} onClick={a.run} style={{ ...btn('ghost'), padding: '5px 10px', fontSize: 12 }}>{a.label}</button>)}</div>}
          </div>
        ))}
        {typing && <div style={{ fontSize: 12, color: C.muted }}>{L('Vera 正在输入…', 'Vera 打緊字…', 'Vera is typing…')}</div>}
        <div ref={end} />
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
        {quick().map((q) => <button key={q} onClick={() => send(q)} style={{ border: `1px solid ${C.line}`, background: C.paper, borderRadius: 999, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: C.ink }}>{q}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <label htmlFor="vera-in" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Vera</label>
        <input id="vera-in" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(text); }}
          placeholder={L('问我吃什么、去哪逛、还剩多久', '問我食咩、去邊、仲有幾耐', 'Ask about food, places, time left')}
          style={{ flex: 1, minWidth: 0, height: 38, borderRadius: 19, border: `1px solid ${C.line}`, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', color: C.ink }} />
        <button aria-label={L('发送', '發送', 'Send')} onClick={() => send(text)} style={{ width: 38, height: 38, borderRadius: 19, border: 'none', background: C.jade, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n="arrow" s={18} c="#fff" /></button>
      </div>
      <button onPointerDown={() => setListening(true)} onPointerUp={finish} onPointerLeave={finish}
        style={{ ...btn(listening ? 'primary' : 'ghost'), width: '100%', marginTop: 8, userSelect: 'none', touchAction: 'none' }}>
        {listening ? L('正在聆听… 松开发送', '聽緊… 放手就發送', 'Listening… release to send') : L('按住说话', '㩒住講嘢', 'Hold to talk')}
      </button>
    </Sheet>
  );
};
