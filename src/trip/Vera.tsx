import React, { useEffect, useRef, useState } from 'react';
import { dur } from './data';
import { L, useLang } from './i18n';
import { Trip } from './store';
import { btn, C, Icon, Sheet } from './ui';
import { Msg, quick, reply, voiceSamples } from './veraBrain';
import { askLLM } from './llm';

/* ------------------------------------------------------------------
 * 浏览器自带语音识别（Web Speech API）
 * 不需要 API Key、不需要后端、不占用 OAG / LLM 额度。
 * Chrome / Edge / Safari 支持；Firefox 不支持识别，会自动提示改用打字。
 * 必须 https:// 或 localhost，且由用户手势（按住）触发。
 * ------------------------------------------------------------------ */
type SRResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SRErrorEvent = { error: string };
interface SR {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SRResultEvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SRCtor = new () => SR;
const getSR = (): SRCtor | null => {
  const w = window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Vera chat. `initial` is auto-sent (the bubble the user tapped); `voice` starts listening right away (long-press on the pet). */
export const VeraSheet = ({ t, onClose, openOrder, goMap, openHelp, openMember, initial, voice }: {
  t: Trip; onClose: () => void; openOrder: (id?: string) => void; goMap: () => void; openHelp: () => void; openMember: () => void; initial?: string | null; voice?: boolean;
}) => {
  const lang = useLang();
  const [msgs, setMsgs] = useState<Msg[]>(initial ? [] : [{ who: 'vera', text: L(`你好，我是 Vera。你现在有 ${dur(Math.max(0, t.left))} 可以自由安排，想吃、想逛、想歇都可以问我。`, `你好，我係 Vera。你而家有 ${dur(Math.max(0, t.left))} 自由時間，想食、想行、想抖都可以問我。`, `Hi, I am Vera. You have ${dur(Math.max(0, t.left))} free. Ask me about food, shops or a place to rest.`) }]);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(false);
  const [speechNote, setSpeechNote] = useState<string | null>(null); // 语音不可用时的提示
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

  // 识别回调可能晚于 render，用 ref 永远拿到最新的 send
  const sendRef = useRef(send);
  sendRef.current = send;
  const recRef = useRef<SR | null>(null);
  const heardRef = useRef('');
  const downAtRef = useRef(0);
  const autoRef = useRef(false); // 精灵长按带起来的自动识别

  const noteFor = (code: string) => L(
    code === 'not-allowed' || code === 'service-not-allowed'
      ? '麦克风权限没开，请在浏览器地址栏允许后重试，或直接打字问我。'
      : code === 'network'
        ? '语音识别需要联网，现在连不上。直接打字也一样能问。'
        : '这个浏览器用不了语音识别，直接打字问我吧。',
    code === 'not-allowed' || code === 'service-not-allowed'
      ? '咪高風權限未開，請喺瀏覽器允許後再試，或者直接打字問我。'
      : code === 'network'
        ? '語音辨識要上網，而家連唔到。直接打字都一樣問得。'
        : '呢個瀏覽器用唔到語音辨識，直接打字問我啦。',
    code === 'not-allowed' || code === 'service-not-allowed'
      ? 'Microphone permission was denied. Allow it in the address bar, or just type.'
      : code === 'network'
        ? 'Speech recognition needs a network connection. Typing works offline.'
        : 'Speech recognition is not available in this browser. Please type instead.',
  );

  const startListen = (auto = false) => {
    const Ctor = getSR();
    if (!Ctor) { setSpeechNote(noteFor('unsupported')); return; }
    // 已经在听，不重复开一个实例
    if (recRef.current && listening) return;
    try {
      const rec = new Ctor();
      rec.lang = lang === 'hk' ? 'zh-HK' : lang === 'en' ? 'en-US' : 'zh-CN';
      rec.interimResults = false;   // 只要最终一句，不边听边蹦字
      rec.continuous = false;       // 说完静音自动结束
      rec.maxAlternatives = 1;
      heardRef.current = '';
      autoRef.current = auto;
      rec.onresult = (e) => { heardRef.current = (e.results?.[0]?.[0]?.transcript ?? '').trim(); };
      rec.onerror = (e) => { setListening(false); setSpeechNote(noteFor(e.error)); };
      rec.onend = () => {
        setListening(false);
        recRef.current = null;
        const v = heardRef.current.trim();
        if (v) sendRef.current(v);   // ★ 只有真听到内容才发，空手绝不发指令
      };
      recRef.current = rec;
      rec.start();
      setListening(true);
      setSpeechNote(null);
    } catch {
      setListening(false);
      setSpeechNote(noteFor('unsupported'));
    }
  };
  const stopListen = () => { try { recRef.current?.stop(); } catch { /* 已结束 */ } };
  const abortListen = () => {
    heardRef.current = '';           // 轻点取消：清掉内容，onend 不会发 anything
    try { recRef.current?.abort(); } catch { /* 已结束 */ }
    recRef.current = null;
    setListening(false);
  };

  useEffect(() => {
    if (initial) send(initial);
    if (voice) {
      // 等精灵长按的 pointerup 过去再开麦，避免刚打开就被结束
      const id = window.setTimeout(() => startListen(true), 400);
      return () => window.clearTimeout(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 关闭面板时一定要收麦，避免后台还在听
  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* noop */ } }, []);

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    downAtRef.current = Date.now();
    startListen(false);
  };
  const onUp = () => {
    if (Date.now() - downAtRef.current < 420 && !autoRef.current) { abortListen(); return; }
    stopListen();
  };

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
        {quick(t).map((q) => <button key={q} onClick={() => send(q)} style={{ border: `1px solid ${C.line}`, background: C.paper, borderRadius: 999, padding: '4px 10px', fontSize: 12, cursor: 'pointer', color: C.ink }}>{q}</button>)}
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <label htmlFor="vera-in" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Vera</label>
        <input id="vera-in" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(text); }}
          placeholder={L('问我吃什么、去哪逛、还剩多久', '問我食咩、去邊、仲有幾耐', 'Ask about food, places, time left')}
          style={{ flex: 1, minWidth: 0, height: 38, borderRadius: 19, border: `1px solid ${C.line}`, padding: '0 14px', fontSize: 14, fontFamily: 'inherit', color: C.ink }} />
        <button aria-label={L('发送', '發送', 'Send')} onClick={() => send(text)} style={{ width: 38, height: 38, borderRadius: 19, border: 'none', background: C.jade, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n="arrow" s={18} c="#fff" /></button>
      </div>
      <button onPointerDown={onDown} onPointerUp={onUp} onPointerLeave={() => { if (listening) stopListen(); }}
        aria-label={L('按住说话', '㩒住講嘢', 'Hold to talk')}
        style={{ ...btn(listening ? 'primary' : 'ghost'), width: '100%', marginTop: 8, userSelect: 'none', touchAction: 'none' }}>
        {listening
          ? L('正在聆听… 松开发送', '聽緊… 放手就發送', 'Listening… release to send')
          : L('按住说话', '㩒住講嘢', 'Hold to talk')}
      </button>
      {speechNote && (
        <div role="status" style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5, color: C.muted, background: C.bg, borderRadius: 10, padding: '8px 10px' }}>
          {speechNote}
          <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => startListen(false)} style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 12 }}>{L('再试一次', '再試多次', 'Try again')}</button>
            <button onClick={() => { const s = voiceSamples(); send(s[sent.current % s.length]); }} style={{ ...btn('ghost'), padding: '4px 10px', fontSize: 12 }}>{L('用演示语句', '用示範句', 'Use a sample')}</button>
          </div>
        </div>
      )}
      <div style={{ marginTop: 8, fontSize: 11, lineHeight: 1.5, color: C.muted }}>
        {L('语音由浏览器转成文字，声音可能送往浏览器厂商的云端处理；不想用语音，直接打字即可。', '語音由瀏覽器轉做文字，聲音可能送去瀏覽器廠商嘅雲端處理；唔想用語音，直接打字就得。', 'Speech is converted by your browser and audio may be processed by the browser vendor cloud. Typing always works.')}
      </div>
    </Sheet>
  );
};
