import { L, Tri, tr } from './i18n';

export type Floor = 'L8' | 'L7' | 'L6' | 'L5' | 'L3' | 'L1';
export const FLOOR_ORDER: Floor[] = ['L1', 'L3', 'L5', 'L6', 'L7', 'L8'];
const FL: Record<Floor, Tri> = {
  L8: ['L8 Sky Bridge', 'L8 Sky Bridge', 'L8 Sky Bridge'], L7: ['L7 餐饮层', 'L7 餐飲層', 'L7 Dining'], L6: ['L6 离港大堂', 'L6 離港大堂', 'L6 Departures'],
  L5: ['L5 抵港 / 转机', 'L5 抵港 / 轉機', 'L5 Arrivals / Transfer'], L3: ['L3 北卫星', 'L3 北衛星', 'L3 North Satellite'], L1: ['L1 机场快线', 'L1 機場快綫', 'L1 Airport Express'],
};
export const floorLabel = (f: Floor) => tr(FL[f]);
export interface Kitchen { orders: number; perOrder: number; lanes: number }
export type Cat = '餐饮' | '贵宾室' | '购物' | '观光' | '设施' | '服务';
export const CAT_LABEL: Record<Cat | '全部', Tri> = {
  全部: ['全部', '全部', 'All'], 餐饮: ['餐饮', '食嘢', 'Dining'], 贵宾室: ['贵宾室', '貴賓室', 'Lounges'], 购物: ['购物', '買嘢', 'Shopping'],
  观光: ['观光', '行吓睇吓', 'Sights'], 设施: ['设施', '設施', 'Facilities'], 服务: ['服务', '服務', 'Services'],
};
export type Access = 'biz' | 'first' | 'paid';

export const FLIGHT = { inNo: 'CX959', from: '杭州', fromCode: 'HGH', arr: '14:05', outNo: 'CX715', to: '新加坡', toCode: 'SIN', dep: 20 * 60 + 15, flightMiles: 1250 };
export const DEMO_FLIGHT = { ...FLIGHT };
export interface InFlight { no: string; from: string; fromCode: string; arr: string; status: string }
export interface OutFlight { no: string; to: string; toCode: string; dep: number; miles: number }
const CITY: Record<string, Tri> = {
  HGH: ['杭州', '杭州', 'Hangzhou'], MNL: ['马尼拉', '馬尼拉', 'Manila'], NRT: ['东京', '東京', 'Tokyo'], PEK: ['北京', '北京', 'Beijing'], ICN: ['首尔', '首爾', 'Seoul'],
  SIN: ['新加坡', '新加坡', 'Singapore'], YVR: ['温哥华', '溫哥華', 'Vancouver'], LHR: ['伦敦', '倫敦', 'London'], SYD: ['悉尼', '悉尼', 'Sydney'], BKK: ['曼谷', '曼谷', 'Bangkok'],
};
export const city = (code: string) => (CITY[code] ? tr(CITY[code]) : code);
export const ARRIVALS: InFlight[] = [
  { no: 'CX959', from: '杭州', fromCode: 'HGH', arr: '14:05', status: 'landed' },
  { no: 'CX906', from: '马尼拉', fromCode: 'MNL', arr: '13:50', status: 'landed' },
  { no: 'CX561', from: '东京', fromCode: 'NRT', arr: '14:10', status: 'landed' },
  { no: 'CX347', from: '北京', fromCode: 'PEK', arr: '14:20', status: 'soon' },
  { no: 'CX419', from: '首尔', fromCode: 'ICN', arr: '13:35', status: 'landed' },
];
export const DEPARTURES: OutFlight[] = [
  { no: 'CX715', to: '新加坡', toCode: 'SIN', dep: 20 * 60 + 15, miles: 1250 },
  { no: 'CX838', to: '温哥华', toCode: 'YVR', dep: 19 * 60 + 50, miles: 5200 },
  { no: 'CX251', to: '伦敦', toCode: 'LHR', dep: 21 * 60 + 5, miles: 7200 },
  { no: 'CX101', to: '悉尼', toCode: 'SYD', dep: 20 * 60 + 40, miles: 5600 },
  { no: 'CX701', to: '曼谷', toCode: 'BKK', dep: 19 * 60 + 25, miles: 1050 },
];
export const setFlights = (a: InFlight, d: OutFlight) => {
  Object.assign(FLIGHT, { inNo: a.no, from: a.from, fromCode: a.fromCode, arr: a.arr, outNo: d.no, to: d.to, toCode: d.toCode, dep: d.dep, flightMiles: d.miles });
};
export const resetFlights = () => { Object.assign(FLIGHT, DEMO_FLIGHT); };
export const START_CLOCK = 14 * 60 + 11;
export const BUFFER = 45;

/** meal = sit-down meal, drink = coffee/tea/bar, snack = quick bite. */
export type Kind = 'meal' | 'drink' | 'snack';
export interface Place {
  id: string; n: Tri; cat: Cat; floor: Floor; x: number; y: number;
  mins: number; miles: number; free: boolean; d: Tri; quick?: boolean;
  /** Cathay partner: miles and in-app ordering. Non-partners can only be walked to. */
  partner?: boolean;
  order?: 'wx' | 'web'; kitchen?: Kitchen; dine?: boolean; kind?: Kind;
  access?: Access; shower?: boolean;
  tags: ('美食' | '购物' | '观光' | '休息')[];
}
export const pname = (p: { n: Tri }) => tr(p.n);
export const pnote = (p: { d: Tri }) => tr(p.d);

const P = (o: Omit<Place, 'free' | 'miles'> & { free?: boolean; miles?: number }): Place => ({ free: false, miles: 0, ...o });
const partnerNote = (m: number): Tri => [`国泰合作 · 每单 +${m} Asia Miles`, `國泰合作 · 每單 +${m} Asia Miles`, `Cathay partner · +${m} Asia Miles per order`];

export const PLACES: Place[] = [
  // ---- L6 departures
  P({ id: 'mcd', n: ['麦当劳', '麥當勞', "McDonald's"], cat: '餐饮', kind: 'snack', floor: 'L6', x: 30, y: 80, mins: 25, miles: 20, partner: true, d: partnerNote(20), quick: true, order: 'wx', kitchen: { orders: 9, perOrder: 2, lanes: 3 }, tags: ['美食'] }),
  P({ id: 'pc', n: ['Pacific Coffee', 'Pacific Coffee', 'Pacific Coffee'], cat: '餐饮', kind: 'drink', floor: 'L6', x: 56, y: 80, mins: 15, miles: 15, partner: true, d: partnerNote(15), quick: true, order: 'wx', kitchen: { orders: 4, perOrder: 2, lanes: 2 }, tags: ['美食', '休息'] }),
  P({ id: 'sbux', n: ['Starbucks', 'Starbucks', 'Starbucks'], cat: '餐饮', kind: 'drink', floor: 'L6', x: 70, y: 36, mins: 15, d: ['咖啡与轻食 · 非合作商户', '咖啡同輕食 · 非合作商戶', 'Coffee and light bites · not a partner'], tags: ['美食', '休息'] }),
  P({ id: 'kfc', n: ['肯德基', '肯德基', 'KFC'], cat: '餐饮', kind: 'snack', floor: 'L6', x: 14, y: 82, mins: 25, d: ['炸鸡快餐 · 非合作商户', '炸雞快餐 · 非合作商戶', 'Fried chicken · not a partner'], tags: ['美食'] }),
  P({ id: 'lady', n: ['Lady M', 'Lady M', 'Lady M'], cat: '餐饮', kind: 'snack', floor: 'L6', x: 86, y: 50, mins: 15, d: ['千层蛋糕外带 · 非合作商户', '千層蛋糕外賣 · 非合作商戶', 'Mille crêpes to go · not a partner'], tags: ['美食'] }),
  P({ id: 'charge', n: ['充电休息区', '叉電休息區', 'Charging lounge'], cat: '设施', floor: 'L6', x: 44, y: 80, mins: 20, free: true, d: ['免费 · 座位旁有插座', '免費 · 座位隔籬有插蘇', 'Free · sockets at every seat'], quick: true, tags: ['休息'] }),
  P({ id: 'wc6', n: ['洗手间 · L6', '洗手間 · L6', 'Restroom · L6'], cat: '设施', floor: 'L6', x: 62, y: 50, mins: 10, free: true, d: ['免费', '免費', 'Free'], quick: true, tags: [] }),
  P({ id: 'beauty', n: ['DFS 美妆香水', 'DFS 美妝香水', 'DFS Beauty & Fragrance'], cat: '购物', floor: 'L6', x: 25, y: 22, mins: 30, miles: 40, partner: true, d: ['国泰合作 · 每满 HK$500 +40 Asia Miles', '國泰合作 · 每滿 HK$500 +40 Asia Miles', 'Cathay partner · +40 Asia Miles per HK$500'], tags: ['购物'] }),
  P({ id: 'lv', n: ['Louis Vuitton', 'Louis Vuitton', 'Louis Vuitton'], cat: '购物', floor: 'L6', x: 37, y: 22, mins: 30, d: ['名品店', '名店', 'Luxury boutique'], tags: ['购物'] }),
  P({ id: 'gucci', n: ['Gucci', 'Gucci', 'Gucci'], cat: '购物', floor: 'L6', x: 49, y: 22, mins: 25, d: ['名品店', '名店', 'Luxury boutique'], tags: ['购物'] }),
  P({ id: 'chanel', n: ['Chanel', 'Chanel', 'Chanel'], cat: '购物', floor: 'L6', x: 61, y: 22, mins: 25, d: ['美妆与香水', '化妝品同香水', 'Beauty and fragrance'], tags: ['购物'] }),
  P({ id: 'hermes', n: ['Hermès', 'Hermès', 'Hermès'], cat: '购物', floor: 'L6', x: 82, y: 22, mins: 25, d: ['名品店', '名店', 'Luxury boutique'], tags: ['购物'] }),
  P({ id: 'cartier', n: ['Cartier', 'Cartier', 'Cartier'], cat: '购物', floor: 'L6', x: 80, y: 82, mins: 25, d: ['珠宝腕表', '珠寶手錶', 'Jewellery and watches'], tags: ['购物'] }),
  P({ id: 'ctf', n: ['周大福', '周大福', 'Chow Tai Fook'], cat: '购物', floor: 'L6', x: 12, y: 30, mins: 25, miles: 30, partner: true, d: partnerNote(30), tags: ['购物'] }),
  P({ id: 'liquor', n: ['DFS 烟酒', 'DFS 煙酒', 'DFS Liquor & Tobacco'], cat: '购物', floor: 'L6', x: 92, y: 36, mins: 15, miles: 20, partner: true, d: ['国泰合作 · 结账需出示登机证', '國泰合作 · 埋單要出示登機證', 'Cathay partner · boarding pass needed'], tags: ['购物'] }),
  P({ id: 'pen', n: ['The Peninsula Boutique', 'The Peninsula Boutique', 'The Peninsula Boutique'], cat: '购物', floor: 'L6', x: 70, y: 64, mins: 20, d: ['奶黄月饼、曲奇', '奶黃月餅、曲奇', 'Custard mooncakes, cookies'], tags: ['购物'] }),
  P({ id: 'muji', n: ['MUJI', 'MUJI', 'MUJI'], cat: '购物', floor: 'L6', x: 50, y: 64, mins: 20, d: ['旅行用品、零食', '旅行用品、零食', 'Travel goods and snacks'], tags: ['购物'] }),
  P({ id: 'books', n: ['商务印书馆', '商務印書館', 'Commercial Press'], cat: '购物', floor: 'L6', x: 26, y: 50, mins: 15, d: ['书籍与旅行读物', '書同旅遊讀物', 'Books and travel reads'], tags: ['购物', '休息'] }),
  P({ id: 'apron', n: ['停机坪观景窗', '停機坪觀景窗', 'Apron view windows'], cat: '观光', floor: 'L6', x: 8, y: 40, mins: 15, free: true, d: ['免费 · 落地窗看飞机起降', '免費 · 落地玻璃睇飛機升降', 'Free · watch planes take off'], quick: true, tags: ['观光', '休息'] }),
  P({ id: 'art', n: ['机场艺术展廊', '機場藝術展廊', 'Art gallery'], cat: '观光', floor: 'L6', x: 22, y: 64, mins: 20, free: true, d: ['免费 · 本地艺术展 · 打卡 +10 Asia Miles', '免費 · 本地藝術展 · 打卡 +10 Asia Miles', 'Free · local art · check in +10 Asia Miles'], tags: ['观光'] }),
  P({ id: 'prayer', n: ['祈祷室', '祈禱室', 'Prayer room'], cat: '设施', floor: 'L6', x: 38, y: 64, mins: 20, free: true, d: ['免费 · 安静空间', '免費 · 好靜', 'Free · quiet space'], tags: [] }),
  P({ id: 'lounge', n: ['The Pier', 'The Pier', 'The Pier'], cat: '贵宾室', floor: 'L6', x: 92, y: 72, mins: 60, free: true, d: ['国泰商务贵宾室 · 商务舱、头等舱或 Marco Polo Club Silver 以上', '國泰商務貴賓室 · 商務、頭等或 Marco Polo Club Silver 以上', 'Cathay business lounge · J/F or Marco Polo Club Silver+'], access: 'biz', shower: true, tags: ['休息', '美食'] }),
  P({ id: 'wing', n: ['The Wing, First', 'The Wing, First', 'The Wing, First'], cat: '贵宾室', floor: 'L6', x: 8, y: 72, mins: 60, free: true, d: ['国泰头等贵宾室 · 头等舱或 Marco Polo Club Diamond', '國泰頭等貴賓室 · 頭等或 Marco Polo Club Diamond', 'Cathay first lounge · F or Marco Polo Club Diamond'], access: 'first', shower: true, tags: ['休息', '美食'] }),
  // ---- L7 dining
  P({ id: 'tsui', n: ['翠华餐厅', '翠華餐廳', 'Tsui Wah'], cat: '餐饮', kind: 'meal', floor: 'L7', x: 62, y: 30, mins: 45, miles: 25, partner: true, d: partnerNote(25), order: 'wx', kitchen: { orders: 14, perOrder: 3, lanes: 3 }, tags: ['美食'] }),
  P({ id: 'hhk', n: ['何洪记', '何洪記', 'Ho Hung Kee'], cat: '餐饮', kind: 'meal', floor: 'L7', x: 35, y: 40, mins: 50, miles: 50, partner: true, dine: true, d: ['国泰合作 · 堂食送餐到座 · +50 Asia Miles', '國泰合作 · 堂食送餐到位 · +50 Asia Miles', 'Cathay partner · table service · +50 Asia Miles'], order: 'web', kitchen: { orders: 11, perOrder: 3, lanes: 2 }, tags: ['美食'] }),
  P({ id: 'jd', n: ['正斗粥面专家', '正斗粥麵專家', 'Tasty Congee & Noodle'], cat: '餐饮', kind: 'meal', floor: 'L7', x: 66, y: 62, mins: 45, miles: 30, partner: true, d: partnerNote(30), order: 'web', kitchen: { orders: 5, perOrder: 4, lanes: 2 }, tags: ['美食'] }),
  P({ id: 'cj', n: ['翡翠拉面小笼包', '翡翠拉麵小籠包', 'Crystal Jade La Mian Xiao Long Bao'], cat: '餐饮', kind: 'meal', floor: 'L7', x: 46, y: 72, mins: 45, d: ['小笼包、拉面 · 非合作商户', '小籠包、拉麵 · 非合作商戶', 'Dumplings, noodles · not a partner'], tags: ['美食'] }),
  P({ id: 'ajisen', n: ['味千拉面', '味千拉麵', 'Ajisen Ramen'], cat: '餐饮', kind: 'meal', floor: 'L7', x: 20, y: 62, mins: 35, d: ['猪骨汤拉面 · 非合作商户', '豬骨湯拉麵 · 非合作商戶', 'Tonkotsu ramen · not a partner'], tags: ['美食'] }),
  P({ id: 'tap', n: ['Tap + Brew', 'Tap + Brew', 'Tap + Brew'], cat: '餐饮', kind: 'drink', floor: 'L7', x: 84, y: 40, mins: 40, d: ['精酿啤酒、汉堡 · 非合作商户', '手工啤、漢堡 · 非合作商戶', 'Craft beer, burgers · not a partner'], tags: ['美食', '休息'] }),
  P({ id: 'sushi', n: ['Sushi Taka', 'Sushi Taka', 'Sushi Taka'], cat: '餐饮', kind: 'meal', floor: 'L7', x: 86, y: 70, mins: 50, d: ['寿司吧台 · 非合作商户', '壽司吧枱 · 非合作商戶', 'Sushi counter · not a partner'], tags: ['美食'] }),
  P({ id: 'oldtown', n: ['OLDTOWN White Coffee', 'OLDTOWN White Coffee', 'OLDTOWN White Coffee'], cat: '餐饮', kind: 'meal', floor: 'L7', x: 12, y: 30, mins: 35, miles: 15, partner: true, d: ['清真认证 · 国泰合作 · +15 Asia Miles', '清真認證 · 國泰合作 · +15 Asia Miles', 'Halal · Cathay partner · +15 Asia Miles'], order: 'web', kitchen: { orders: 5, perOrder: 2, lanes: 2 }, tags: ['美食'] }),
  P({ id: 'yoshi', n: ['吉野家', '吉野家', 'Yoshinoya'], cat: '餐饮', kind: 'snack', floor: 'L7', x: 28, y: 20, mins: 25, miles: 15, partner: true, d: partnerNote(15), order: 'wx', kitchen: { orders: 6, perOrder: 2, lanes: 2 }, tags: ['美食'] }),
  P({ id: 'teawood', n: ['Teawood', 'Teawood', 'Teawood'], cat: '餐饮', kind: 'drink', floor: 'L7', x: 54, y: 46, mins: 30, d: ['台式茶饮、简餐 · 非合作商户', '台式茶飲、簡餐 · 非合作商戶', 'Taiwanese tea and meals · not a partner'], tags: ['美食', '休息'] }),
  P({ id: 'plaza', n: ['Plaza Premium Lounge', 'Plaza Premium Lounge', 'Plaza Premium Lounge'], cat: '贵宾室', floor: 'L7', x: 76, y: 20, mins: 60, d: ['付费入内 · 所有旅客可用 · 淋浴另计', '俾錢入 · 所有旅客都用得 · 沖涼另計', 'Paid entry · open to all · shower extra'], access: 'paid', shower: true, tags: ['休息', '美食'] }),
  // ---- L5 transfer
  P({ id: 'mx', n: ['美心 MX', '美心 MX', 'Maxim\'s MX'], cat: '餐饮', kind: 'snack', floor: 'L5', x: 70, y: 30, mins: 30, miles: 15, partner: true, d: partnerNote(15), order: 'wx', kitchen: { orders: 6, perOrder: 2, lanes: 2 }, tags: ['美食'] }),
  P({ id: 'kee', n: ['奇华饼家', '奇華餅家', 'Kee Wah Bakery'], cat: '购物', floor: 'L5', x: 52, y: 28, mins: 15, miles: 15, partner: true, d: ['国泰合作 · 老婆饼、熊猫曲奇', '國泰合作 · 老婆餅、熊貓曲奇', 'Cathay partner · wife cakes, panda cookies'], tags: ['购物'] }),
  P({ id: 'wc5', n: ['洗手间 · L5', '洗手間 · L5', 'Restroom · L5'], cat: '设施', floor: 'L5', x: 28, y: 42, mins: 10, free: true, d: ['免费', '免費', 'Free'], tags: [] }),
  P({ id: 'desk', n: ['国泰转机柜台', '國泰轉機櫃位', 'Cathay transfer desk'], cat: '服务', floor: 'L5', x: 19, y: 75, mins: 15, free: true, d: ['行李、改签、特殊协助', '行李、改機票、特別協助', 'Baggage, rebooking, assistance'], tags: [] }),
  // ---- L8
  P({ id: 'cam', n: ['Sky Bridge', 'Sky Bridge', 'Sky Bridge'], cat: '观光', floor: 'L8', x: 50, y: 45, mins: 25, free: true, d: ['免费 · 离地 28 米，飞机从脚下滑过', '免費 · 離地 28 米，飛機喺腳底滑過', 'Free · 28 m up, planes taxi below you'], quick: true, tags: ['观光'] }),
];

export const waitMin = (k: Kitchen) => Math.max(3, Math.ceil((k.orders * k.perOrder) / k.lanes));
export function pickupEstimate(k: Kitchen, ahead?: number) {
  const n = ahead ?? k.orders;
  return Math.max(3, Math.ceil(((n + 1) * k.perOrder) / k.lanes) + 2);
}

interface Node { n: Tri; floor: Floor; x: number; y: number; extra?: number }
export const NODES: Record<string, Node> = {
  arr: { n: ['下机口', '落機位', 'Arrival gate'], floor: 'L5', x: 8, y: 22 },
  sec: { n: ['转机安检', '轉機安檢', 'Transfer security'], floor: 'L5', x: 40, y: 75 },
  immig: { n: ['入境检查', '入境檢查', 'Immigration'], floor: 'L5', x: 30, y: 40, extra: 250 },
  belt: { n: ['行李提取', '攞行李', 'Baggage reclaim'], floor: 'L5', x: 62, y: 60 },
  checkin: { n: ['离港值机', '離港登記', 'Departure check-in'], floor: 'L7', x: 40, y: 50, extra: 200 },
  dsec: { n: ['离港安检', '離港安檢', 'Departure security'], floor: 'L7', x: 70, y: 70 },
  g23: { n: ['23 号登机口', '23 號登機閘口', 'Gate 23'], floor: 'L6', x: 20, y: 51 },
  g512: { n: ['512 号登机口', '512 號登機閘口', 'Gate 512'], floor: 'L3', x: 90, y: 60, extra: 900 },
};
export const ALL: Record<string, Node> = { ...NODES, ...Object.fromEntries(PLACES.map((p) => [p.id, p])) };
export const placeOf = (id: string) => PLACES.find((p) => p.id === id);
export const nameOf = (id: string) => (ALL[id] ? tr(ALL[id].n) : '');

export const hm = (m: number) => {
  const t = ((Math.round(m) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
export const dur = (m: number) => {
  m = Math.round(m);
  if (m <= 0) return L('0 分', '0 分鐘', '0 min');
  if (m < 60) return L(`${m} 分`, `${m} 分鐘`, `${m} min`);
  const h = Math.floor(m / 60), r = String(m % 60).padStart(2, '0');
  return L(`${h} 小时 ${r} 分`, `${h} 個鐘 ${r} 分`, `${h} h ${r} min`);
};

export const LIFT = { x: 50, y: 50 };
export interface Leg { floor: Floor; pts: [number, number][]; text: string; meters: number; turn: 'straight' | 'left' | 'right' | 'up' | 'down' }

export function route(fromId: string, toId: string) {
  const a = ALL[fromId], b = ALL[toId];
  const legs: Leg[] = [];
  if (!a || !b) return { legs, meters: 0 };
  const m = (x1: number, y1: number, x2: number, y2: number) => Math.round(Math.abs(x2 - x1) * 8 + Math.abs(y2 - y1) * 4);
  const walk = (floor: Floor, x1: number, y1: number, x2: number, y2: number, dest: string, last: boolean) => {
    const corner: [number, number] = [x2, y1];
    const first = m(x1, y1, x2, y1), second = m(x2, y1, x2, y2);
    const arrive = (s: string) => (last ? L(`，到达${s}`, `，到${s}`, `, arrive at ${s}`) : L(`到${s}`, `去${s}`, ` to ${s}`));
    if (first > 0) {
      const side = x2 >= x1 ? L('右', '右', 'right') : L('左', '左', 'left');
      legs.push({ floor, pts: [[x1, y1], corner], text: L(`沿主廊向${side}直行 ${first} 米`, `沿主通道向${side}直行 ${first} 米`, `Walk ${side} along the concourse ${first} m`) + (second ? '' : arrive(dest)), meters: first, turn: 'straight' });
    }
    if (second > 0) {
      const down = y2 > y1;
      const turn = first === 0 ? 'straight' : (x2 >= x1 ? (down ? 'right' : 'left') : (down ? 'left' : 'right'));
      const verb = turn === 'straight' ? L('直行', '直行', 'Go straight') : turn === 'right' ? L('右转，再走', '轉右，再行', 'Turn right, then walk') : L('左转，再走', '轉左，再行', 'Turn left, then walk');
      legs.push({ floor, pts: [corner, [x2, y2]], text: `${verb} ${second} ${L('米', '米', 'm')}${arrive(dest)}`, meters: second, turn });
    }
  };
  if (a.floor === b.floor) walk(a.floor, a.x, a.y, b.x, b.y, tr(b.n), true);
  else {
    const up = FLOOR_ORDER.indexOf(b.floor) > FLOOR_ORDER.indexOf(a.floor);
    walk(a.floor, a.x, a.y, LIFT.x, LIFT.y, L('扶梯口', '扶手電梯', 'the escalator'), false);
    legs.push({ floor: a.floor, pts: [[LIFT.x, LIFT.y], [LIFT.x, LIFT.y]], text: up ? L(`乘扶梯上行至 ${floorLabel(b.floor)}`, `搭扶手電梯上 ${floorLabel(b.floor)}`, `Take the escalator up to ${floorLabel(b.floor)}`) : L(`乘扶梯下行至 ${floorLabel(b.floor)}`, `搭扶手電梯落 ${floorLabel(b.floor)}`, `Take the escalator down to ${floorLabel(b.floor)}`), meters: 30 * Math.abs(FLOOR_ORDER.indexOf(b.floor) - FLOOR_ORDER.indexOf(a.floor)), turn: up ? 'up' : 'down' });
    walk(b.floor, LIFT.x, LIFT.y, b.x, b.y, tr(b.n), true);
  }
  const meters = legs.reduce((s, l) => s + l.meters, 0) + (a.extra ?? 0) + (b.extra ?? 0);
  return { legs, meters };
}

export const RECENT_ARR = [
  { seats: 300, lf: 0.85, tr: 0.5, landed: START_CLOCK - 18 },
  { seats: 280, lf: 0.8, tr: 0.45, landed: START_CLOCK - 6 },
  { seats: 340, lf: 0.9, tr: 0.55, landed: START_CLOCK - 2 },
  { seats: 180, lf: 0.8, tr: 0.3, landed: START_CLOCK + 5 },
  { seats: 300, lf: 0.85, tr: 0.5, landed: START_CLOCK + 12 },
];
export function secQueue(clock: number) {
  let people = 0;
  for (const f of RECENT_ARR) {
    const since = clock - (f.landed + 8);
    if (since < 0 || since > 30) continue;
    people += f.seats * f.lf * f.tr * (1 - since / 30);
  }
  return { people: Math.round(people) };
}
export type ShowerLevel = 'calm' | 'busy' | 'peak';
export const SHOWER_LABEL: Record<ShowerLevel, Tri> = { calm: ['空间充裕', '幾鬆動', 'Quiet'], busy: ['较拥挤', '有啲迫', 'Busy'], peak: ['高峰', '繁忙時間', 'Peak'] };
export function showerWait(clock: number, forcedPeak: boolean) {
  const t = ((clock % 1440) + 1440) % 1440;
  const peak = forcedPeak || (t >= 21 * 60 + 30 && t <= 23 * 60 + 30);
  const busy = !peak && t >= 18 * 60 && t < 21 * 60 + 30;
  const level: ShowerLevel = peak ? 'peak' : busy ? 'busy' : 'calm';
  return { wait: peak ? 70 : busy ? 25 : 15, level };
}


// ===== 香港机场 T1 登机口（按真实分区的示意坐标，0–100 平面）=====
// 1–12 主楼东侧；13–21 卫星客运廊（经天际走廊）；23–36 中央大堂；40–50 西南廊；60–71 西北廊；
// 201–230 中场客运廊（搭捷运）；5xx 远机位（坐摆渡车）。正式上线将接入 HKIA 室内地图换成精确坐标。
const zoneOf = (n: number): { z: Tri; x: number; y: number; floor: Floor; extra?: number } =>
  n <= 12 ? { z: ['主楼东侧', '主樓東側', 'Main building east'], x: 10, y: n <= 4 ? 70 : 30, floor: 'L6' } :
  n <= 21 ? { z: ['卫星客运廊', '衛星客運廊', 'Satellite concourse'], x: 90, y: 20 + (n - 13) * 4, floor: 'L6', extra: 600 } :
  n <= 36 ? { z: ['中央大堂', '中央大堂', 'Central concourse'], x: 20 + (n - 23) * 2, y: n % 2 ? 60 : 45, floor: 'L6' } :
  n <= 50 ? { z: ['西南廊', '西南廊', 'South-west concourse'], x: 55 + (n - 40) * 2, y: n % 2 ? 85 : 70, floor: 'L6', extra: 300 } :
  n <= 71 ? { z: ['西北廊', '西北廊', 'North-west concourse'], x: 55 + (n - 60) * 2, y: n % 2 ? 30 : 15, floor: 'L6', extra: 300 } :
  n <= 230 ? { z: ['中场客运廊（搭捷运）', '中場客運廊（搭捷運）', 'Midfield concourse (train)'], x: 95, y: 50, floor: 'L6', extra: 1200 } :
  { z: ['远机位（坐摆渡车）', '遠機位（坐穿梭巴士）', 'Remote stand (bus)'], x: 90, y: 60, floor: 'L3', extra: 900 };
/** 实时登机口号 → 节点 id（如 '61' → 'g61'），没有的会按分区自动加入地图 */
export const ensureGate = (no: string): string | null => {
  const n = parseInt(no, 10);
  if (!n) return null;
  const id = 'g' + n;
  if (!ALL[id]) {
    const z = zoneOf(n);
    ALL[id] = { n: [`${n} 号登机口 · ${z.z[0]}`, `${n} 號登機閘口 · ${z.z[1]}`, `Gate ${n} · ${z.z[2]}`], floor: z.floor, x: z.x, y: z.y, extra: z.extra };
  }
  return id;
};
