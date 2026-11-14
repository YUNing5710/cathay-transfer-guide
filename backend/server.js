import path from 'path';
import { fileURLToPath } from 'url';
// 最小后端：把前端请求转发给 OAG Flight Info API（v2），API Key 只放在服务器端
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());
const KEY = process.env.OAG_KEY;
const OAG = 'https://api.oag.com/flight-instances/';

// 调用 OAG，统一加 Subscription-Key 和 version=v2
async function oag(params) {
  const qs = new URLSearchParams({ CodeType: 'IATA', version: 'v2', Content: 'status', ...params });
  const r = await fetch(`${OAG}?${qs}`, { headers: { 'Subscription-Key': KEY } });
  if (!r.ok) throw new Error(`OAG ${r.status}: ${await r.text()}`);
  return r.json();
}

// 状态翻译成中文
const STATE_CN = { Scheduled: '计划中', OutGate: '已推出', InFlight: '飞行中', Landed: '已落地',
  InGate: '已到达', Cancelled: '已取消', Diverted: '已备降', Unknown: '未知' };
const TIMELY_CN = { OnTime: '准点', Early: '提前', Delayed: '延误' };
const hhmm = iso => (iso ? String(iso).slice(11, 16) : undefined);
// "01:05:00" -> 65 分钟
const toMins = v => { if (!v) return 0; const neg = v.startsWith('-'); const [h, m] = v.replace('-', '').split(':').map(Number); return (neg ? -1 : 1) * (h * 60 + m); };

// 把 OAG 返回的一条航班整理成前端需要的简单格式（字段取不到就留空，不报错）
function simplify(f) {
  const dep = f.departure || {}, arr = f.arrival || {};
  const st = (f.statusDetails && f.statusDetails[0]) || {};
  const sd = st.departure || {}, sa = st.arrival || {};
  const de = sd.estimatedTime || {}, ae = sa.estimatedTime || {};
  const da = sd.actualTime || {}, aa = sa.actualTime || {};
  const timely = de.outGateTimeliness || ae.inGateTimeliness;
  return {
    no: `${f.carrier?.iata || ''}${f.flightNumber || ''}`,
    from: dep.airport?.iata, to: arr.airport?.iata,
    depDate: dep.date?.local, arrDate: arr.date?.local,
    depTime: dep.time?.local, arrTime: arr.time?.local,            // 计划时间
    depEst: hhmm(da.outGate?.local || de.outGate?.local),          // 预计/实际离港
    arrEst: hhmm(aa.inGate?.local || ae.inGate?.local),            // 预计/实际到港
    depTerminal: sd.actualTerminal || dep.terminal, arrTerminal: sa.actualTerminal || arr.terminal,
    depGate: sd.gate, arrGate: sa.gate, checkIn: sd.checkInCounter, baggage: sa.baggage,
    delayMin: toMins(de.outGateVariation || ae.inGateVariation),
    timeliness: TIMELY_CN[timely] || timely || '',
    status: STATE_CN[st.state] || st.state || '未知',
    aircraft: f.aircraftType?.icao, miles: f.distance?.greatCircleMiles,
    updatedAt: st.updatedAt,
  };
}

// 查单个航班：/api/flight?no=CX715&date=2026-11-14
app.get('/api/flight', async (req, res) => {
  try {
    const m = String(req.query.no || '').match(/^([A-Z0-9]{2})(\d+)$/i);
    if (!m) return res.status(400).json({ error: '航班号格式应为 CX715' });
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const j = await oag({ CarrierCode: m[1].toUpperCase(), FlightNumber: m[2], DepartureDateTime: date });
    res.json((j.data || []).map(simplify));
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
});

// 查香港到港/离港：/api/board?type=arr|dep&date=2026-11-14
app.get('/api/board', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const p = req.query.type === 'dep'
      ? { DepartureAirport: 'HKG', DepartureDateTime: date }
      : { ArrivalAirport: 'HKG', ArrivalDateTime: date };
    const j = await oag({ CarrierCode: 'CX', ...p });
    res.json((j.data || []).map(simplify));
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
});


// 调试用：看 OAG 原始返回，方便核对字段名 /api/raw?no=CX715
app.get('/api/raw', async (req, res) => {
  try {
    const m = String(req.query.no || 'CX715').match(/^([A-Z0-9]{2})(\d+)$/i);
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    res.json(await oag({ CarrierCode: m[1].toUpperCase(), FlightNumber: m[2], DepartureDateTime: date, Content: 'status' }));
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
});


// ===== Connections & Master Data =====
// 每个 API 的 Key 是分开的；接口地址放在 .env 里，按 OAG 文档填写
const CONN_KEY = process.env.OAG_CONN_KEY, CONN_URL = process.env.OAG_CONN_URL;
const MASTER_KEY = process.env.OAG_MASTER_KEY, MASTER_URL = process.env.OAG_MASTER_URL;

async function call(url, key, params) {
  if (!url || !key) throw new Error('缺少 .env 配置（接口地址或 Key）');
  const r = await fetch(`${url}?${new URLSearchParams(params)}`, { headers: { 'Subscription-Key': key } });
  if (!r.ok) throw new Error(`OAG ${r.status}: ${await r.text()}`);
  return r.json();
}

// 简单内存缓存：Master Data 每月只有 100 次，同一个查询只调用一次
const cache = new Map();
async function cached(k, fn) { if (cache.has(k)) return cache.get(k); const v = await fn(); cache.set(k, v); return v; }

// 衔接航班：/api/connections?from=HGH&to=SIN&via=HKG&date=2026-11-14
// 查询参数原样转发给 OAG（字段名以文档为准），返回原始数据，确认字段后再精简
app.get('/api/connections', async (req, res) => {
  try {
    const q = { version: 'v1', Limit: '10', ...req.query };
    res.json(await cached('c:' + JSON.stringify(q), () => call(CONN_URL, CONN_KEY, q)));
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
});

// 基础资料：/api/master?...（参数按文档填，例如机场代码）
app.get('/api/master', async (req, res) => {
  try {
    const q = { ...req.query };
    res.json(await cached('m:' + JSON.stringify(q), () => call(MASTER_URL, MASTER_KEY, q)));
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
});


// 衔接航班精简版：/api/transfer?from=HGH&to=SIN&date=2026-11-14&via=HKG&in=CX959&out=CX715
// 只保留经 via 转机的组合；给了 in/out 就只留这一对航班
const TYPE_CN = { O: '同一航司衔接', I: '跨航司联运', N: '非联运（分开购票）' };
const fno = l => `${l.carrierCode?.iata || ''}${l.flightNumber || ''}`;
const hm = t => (t ? String(t).slice(0, 5) : undefined);
function simplifyConn(c) {
  const a = c.leg1 || {}, b = c.leg2 || {};
  return {
    id: c.connectionId,
    inNo: fno(a), outNo: fno(b),
    via: a.arrival?.airport?.iata,
    inArr: hm(a.arrival?.localTime), inTerminal: a.arrival?.terminalCode,
    outDep: hm(b.departure?.localTime), outTerminal: b.departure?.terminalCode,
    connectionMin: a.connectionTime,          // 两段之间实际的衔接时间（分钟）
    mctStatus: a.mctStatus,                   // 如 II = 国际转国际
    type: String(c.connectionType || '').toUpperCase(),
    typeCN: TYPE_CN[String(c.connectionType || '').toUpperCase()] || '',
    totalMin: c.elapsedTime,
  };
}
app.get('/api/transfer', async (req, res) => {
  try {
    const { from, to, date, via = 'HKG', in: inNo, out: outNo, ...extra } = req.query;
    const q = { version: 'v1', Limit: '10', DepartureAirport: from, ArrivalAirport: to,
      DepartureDate: date || new Date().toISOString().slice(0, 10), ...extra };
    const j = await cached('t:' + JSON.stringify(q), () => call(CONN_URL, CONN_KEY, q));
    let list = (j.data || []).map(simplifyConn).filter(c => !via || c.via === via);
    if (inNo) list = list.filter(c => c.inNo === inNo);
    if (outNo) list = list.filter(c => c.outNo === outNo);
    res.json({ total: j.paging?.totalCount, list });
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
});


// 香港转机（只用 Flight Info，按实时时间算）：/api/hkg-transfer?in=CX959&out=CX715&date=2026-11-14
// 返回到港/离港的实时时间、航站楼、登机口，以及在香港的实际可用转机分钟数
app.get('/api/hkg-transfer', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const one = async (no, dateKey) => {
      const m = String(no || '').match(/^([A-Z0-9]{2})(\d+)$/i);
      if (!m) throw new Error('航班号格式应为 CX959');
      const j = await oag({ CarrierCode: m[1].toUpperCase(), FlightNumber: m[2], [dateKey]: date });
      return (j.data || []).map(simplify)[0];
    };
    const [inF, outF] = await Promise.all([one(req.query.in, 'ArrivalDateTime'), one(req.query.out, 'DepartureDateTime')]);
    if (!inF || !outF) return res.status(404).json({ error: '查不到航班', inF, outF });
    if (inF.to !== 'HKG' || outF.from !== 'HKG') return res.status(400).json({ error: '这两个航班不是在香港衔接', inF, outF });
    const t = s => { const [h, mm] = (s || '0:0').split(':').map(Number); return h * 60 + mm; };
    const arr = t(inF.arrEst || inF.arrTime), dep = t(outF.depEst || outF.depTime);
    res.json({ in: inF, out: outF, via: 'HKG', transferMin: ((dep - arr) + 1440) % 1440 });
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
});


// ===== Vera 聊天：Groq（OpenAI 兼容格式；改 .env 也能换成 OpenRouter 等）=====
const LLM_URL = process.env.LLM_URL || 'https://api.groq.com/openai/v1/chat/completions';
const LLM_KEY = process.env.LLM_KEY;
const LLM_MODEL = process.env.LLM_MODEL || 'qwen/qwen3-32b';
const SYS = `你是 Vera，国泰航空在香港国际机场的转机助手。
规则：用用户的语言回答（简体中文 / 繁体粤语 / 英文）；回答简短，最多 3 句；
只根据给你的行程信息回答，不知道的就说不确定并建议联系国泰客服，不要编造航班、登机口、店铺或政策；
最高原则：保障旅客准时登机，绝不能因为你的建议导致误机。
如果 canRecommend 为 false（尚未过安检、已进入返回缓冲、需立即登机或时间不足），不要推荐任何餐饮、购物、贵宾室或其他活动，只提醒 leaveBy 出发时间和登机口。
即使可以推荐，也只推荐在 freeTime 内来得及完成的活动，并提醒留足返回登机口的时间。`;
app.post('/api/chat', async (req, res) => {
  try {
    if (!LLM_KEY) return res.status(503).json({ error: '未设置 LLM_KEY' });
    const { q, ctx, history = [] } = req.body || {};
    if (!q) return res.status(400).json({ error: '缺少问题' });
    const messages = [
      { role: 'system', content: SYS + '\n当前行程：' + JSON.stringify(ctx) },
      ...history.map(m => ({ role: m.who === 'me' ? 'user' : 'assistant', content: String(m.text).slice(0, 500) })),
      { role: 'user', content: String(q).slice(0, 500) },
    ];
    const r = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LLM_KEY}` },
      body: JSON.stringify({ model: LLM_MODEL, messages, temperature: 0.4, max_tokens: 400 }),
    });
    if (!r.ok) throw new Error(`LLM ${r.status}: ${await r.text()}`);
    const j = await r.json();
    let text = j.choices?.[0]?.message?.content || '';
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();   // 去掉推理模型的思考过程
    res.json({ text });
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
});

app.get('/api/health', (_q, res) => res.json({ ok: true, flightInfo: !!KEY, connections: !!(CONN_KEY && CONN_URL), master: !!(MASTER_KEY && MASTER_URL), llm: !!LLM_KEY }));

// ===== 同时提供前端网页（先 npm run build 生成 dist/），这样只要开一个服务 =====
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
app.use(express.static(DIST));
app.get(/^\/(?!api\/).*/, (_q, res) => res.sendFile(path.join(DIST, 'index.html')));

app.listen(process.env.PORT || 8787, () => console.log('Backend on :' + (process.env.PORT || 8787)));
