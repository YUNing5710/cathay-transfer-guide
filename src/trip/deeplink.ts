// 读取网址参数，直接带入航班。二维码 / NFC / 座椅屏 / 国泰 App 都打开同一个网址。
// 例：https://cathay-transfer-guide.onrender.com/?in=CX959&out=CX715&from=HGH&to=SIN&arr=14:05&dep=20:15&gate=61&term=T1&date=2026-11-15&lang=zh&src=card
//
// 参数（大小写不敏感）：
//   in    到港航班号（必填，如 CX959）        out   离港航班号（必填，如 CX715）
//   from  出发城市三字码（如 HGH）            to    目的地三字码（如 SIN）
//   arr   到港时间 HH:MM                     dep   起飞时间 HH:MM
//   gate  离港登机口（如 61）                 term  抵达航站楼（如 T1）
//   date  日期 YYYY-MM-DD                    lang  zh / hk / en
//   src   入口：card 值机小卡 / seat 座椅屏 / nfc 立牌 / app 国泰 App
//   bag   ok 行李已直挂 / immig 只挂到香港（需入境）；不写则进入前询问
import { ARRIVALS, DEPARTURES, InFlight, OutFlight } from './data';
import { Lang, setLang } from './i18n';

export interface DeepLink {
  status: 'none' | 'ok' | 'bad';     // none: 纯网址；ok: 识别到航班；bad: 参数格式不对
  inF?: InFlight; outF?: OutFlight;
  gate?: string; term?: string; date?: string; src?: string; bag?: 'ok' | 'immig';
  problems: string[];
}

const FNO = /^[A-Z0-9]{2}\d{1,4}$/;
const IATA = /^[A-Z]{3}$/;
const HHMM = /^([01]?\d|2[0-3]):?([0-5]\d)$/;
const toMin = (s: string) => { const m = s.match(HHMM)!; return +m[1] * 60 + +m[2]; };
const fmt = (s: string) => { const m = s.match(HHMM)!; return `${m[1].padStart(2, '0')}:${m[2]}`; };

export function readDeepLink(search = typeof window !== 'undefined' ? window.location.search : ''): DeepLink {
  const raw = new URLSearchParams(search);
  const q = new Map<string, string>();
  raw.forEach((v, k) => q.set(k.toLowerCase(), v.trim()));

  // 语言单独处理：就算航班参数错了也照样生效
  const lang = (q.get('lang') || '').toLowerCase();
  const langMap: Record<string, Lang> = { zh: 'zh', 'zh-cn': 'zh', cn: 'zh', hk: 'hk', 'zh-hk': 'hk', tc: 'hk', en: 'en' };
  if (langMap[lang]) setLang(langMap[lang]);

  const keys = ['in', 'out', 'from', 'to', 'arr', 'dep', 'gate', 'term', 'date', 'src', 'bag'];
  if (!keys.some((k) => q.has(k))) return { status: 'none', problems: [] };

  const problems: string[] = [];
  const inNo = (q.get('in') || '').toUpperCase().replace(/\s/g, '');
  const outNo = (q.get('out') || '').toUpperCase().replace(/\s/g, '');
  if (!FNO.test(inNo)) problems.push('in');
  if (!FNO.test(outNo)) problems.push('out');
  const from = (q.get('from') || '').toUpperCase(), to = (q.get('to') || '').toUpperCase();
  if (from && !IATA.test(from)) problems.push('from');
  if (to && !IATA.test(to)) problems.push('to');
  const arr = q.get('arr') || '', dep = q.get('dep') || '';
  if (arr && !HHMM.test(arr)) problems.push('arr');
  if (dep && !HHMM.test(dep)) problems.push('dep');
  const date = q.get('date') || '';
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push('date');
  if (problems.length) return { status: 'bad', problems };

  // 参数里没写的，用演示航班表补上（找得到的话）
  const knownIn = ARRIVALS.find((f) => f.no === inNo);
  const knownOut = DEPARTURES.find((f) => f.no === outNo);
  const inF: InFlight = {
    no: inNo, fromCode: from || knownIn?.fromCode || '', from: from || knownIn?.from || '',
    arr: arr ? fmt(arr) : knownIn?.arr || '--:--', status: knownIn?.status || 'landed',
  };
  const outF: OutFlight = {
    no: outNo, toCode: to || knownOut?.toCode || '', to: to || knownOut?.to || '',
    dep: dep ? toMin(dep) : knownOut?.dep ?? 20 * 60, miles: knownOut?.miles ?? 0,
  };
  const gate = (q.get('gate') || '').replace(/\D/g, '') || undefined;
  const bv = (q.get('bag') || '').toLowerCase();
  const bag = bv === 'ok' ? 'ok' : bv === 'immig' || bv === 'hk' ? 'immig' : undefined;
  return { status: 'ok', inF, outF, gate, term: q.get('term')?.toUpperCase() || undefined, date: date || undefined, src: q.get('src') || undefined, bag, problems };
}

/** 进入主页后把参数从地址栏去掉，刷新不会重复识别 */
export const clearDeepLink = () => {
  try { window.history.replaceState(null, '', window.location.pathname); } catch { /* 沙盒里可能不允许 */ }
};
