import { dur, FLIGHT, hm, nameOf, PLACES, Place, pname, SHOWER_LABEL, showerWait, waitMin } from './data';
const nameOfStep = (id: string) => nameOf(id);
import { L, tr } from './i18n';
import { Trip } from './store';
import { generate, markShown, Pref, PREFS } from './routes';

export type Act = { label: string; run: () => void };
export type Msg = { who: 'vera' | 'me'; text: string; acts?: Act[]; fallback?: boolean };
export interface Ctx { t: Trip; openOrder: (id?: string) => void; goMap: () => void; openHelp: () => void; openMember: () => void; close: () => void }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Rule-based replies in the current UI language. Every number comes from the trip engine. */
export function reply(q: string, c: Ctx): Msg {
  const { t } = c;
  const s = q.toLowerCase();
  const has = (...k: string[]) => k.some((x) => s.includes(x));
  const left = Math.max(0, t.left);
  const fits = (id: string) => t.costOf(id) <= t.left;
  const addAct = (p: Place, label?: string): Act => ({ label: label ?? L(`加入${pname(p)}`, `加${pname(p)}`, `Add ${pname(p)}`), run: () => { t.add(p.id); t.note(L(`已加入 ${pname(p)}`, `加咗 ${pname(p)}`, `${pname(p)} added`)); c.close(); } });
  const P = (id: string) => PLACES.find((p) => p.id === id)!;
  const callAct: Act = { label: L('呼叫客服', '搵客服', 'Call support'), run: c.openHelp };

  if (has('你好', 'hi', 'hello', '在吗', '喺度', '嗨', '哈囉')) return { who: 'vera', text: pick([
    L(`在的。你现在还有 ${dur(left)} 可以自由安排，想吃点东西、逛逛，还是找个地方歇会儿？`, `喺度呀。你仲有 ${dur(left)} 自由時間，想食嘢、行吓定係搵個位抖吓？`, `Hi! You have ${dur(left)} to spare. Food, shopping, or somewhere to rest?`),
  ]) };
  if (has('谢谢', '感谢', '唔該', '多謝', 'thank')) return { who: 'vera', text: L('不客气，该出发的时候我会提醒你。', '唔使客氣，夠鐘出發我會提你。', 'You are welcome. I will tell you when it is time to go.') };

  // 准时登机第一：安全时间以外（安检前、返回缓冲、需立即登机、或剩不到 20 分钟）不推荐任何活动
  const recQ = has('推荐', '路线', '逛', '安排', '无聊', '推介', '路線', '好悶', 'recommend', 'route', 'bored', '饿', '吃', '餐', '饭', '肚餓', '食', '飯', 'hungry', 'eat', 'food', '咖啡', 'coffee', '淋浴', '洗澡', '冲凉', '沖涼', 'shower', '贵宾室', '休息室', '貴賓室', 'lounge', '手信', '礼物', '禮物', 'gift', 'souvenir', '买', '购物', '免税', '買', '免稅', 'shop', '看飞机', '拍照', '打卡', '睇飛機', 'plane', 'photo', '清真', 'halal');
  if (recQ && !(t.phase === 'free' && !t.atSec && t.left >= 20)) {
    if (t.atSec) return { who: 'vera', text: L(`先完成「${nameOfStep(t.preTarget)}」，之后我再帮你安排。`, `先搞掂「${nameOfStep(t.preTarget)}」，之後我再幫你安排。`, `Finish ${nameOfStep(t.preTarget)} first, then I will help you plan.`) };
    const gateAct: Act = { label: L('导航去登机口', '帶我去閘口', 'Guide me to the gate'), run: () => { c.goMap(); c.close(); } };
    return { who: 'vera', text: L(`为了确保你准时登机，现在不再推荐新的活动。请在 ${hm(t.leaveBy)} 前出发去 ${t.gateName} 号登机口。`, `為咗確保你準時登機，而家唔再推介新活動。請喺 ${hm(t.leaveBy)} 前出發去 ${t.gateName} 號閘口。`, `To make sure you board on time, I am not suggesting anything new. Leave for gate ${t.gateName} by ${hm(t.leaveBy)}.`), acts: [gateAct] };
  }

  if (has('推荐', '路线', '逛', '安排', '无聊', '推介', '路線', '好悶', 'recommend', 'route', 'bored')) {
    const prefs: Pref[] = has('吃', '食', 'food') ? ['food'] : has('买', '買', 'shop') ? ['shop'] : has('看', '睇', 'sight') ? ['see'] : ['mix', 'food', 'see'];
    const opts = prefs.map((p, i) => ({ p, ps: generate(t, p, i + 3) })).filter((o) => o.ps.length);
    opts.forEach((o) => markShown(o.ps));
    if (!opts.length) return { who: 'vera', text: L(`你只剩 ${dur(left)}，再安排就有点赶了，建议按时去 ${t.gateName} 号口。`, `淨返 ${dur(left)}，再排就趕喇，不如準時去 ${t.gateName} 號閘口。`, `Only ${dur(left)} left. Best to head to gate ${t.gateName} on time.`), acts: [{ label: L('带我去登机口', '帶我去閘口', 'Take me to the gate'), run: () => { c.close(); c.goMap(); } }] };
    return {
      who: 'vera',
      text: L(`按你剩下的 ${dur(left)}，我排了几条顺路的，都只用掉八成左右：`, `按你淨返嘅 ${dur(left)}，我排咗幾條順路嘅，都係用八成時間左右：`, `With ${dur(left)} to spare, here are a few walking-order routes, each using about 80%:`) + '\n' +
        opts.map((o, i) => `${i + 1}. ${tr(PREFS.find((x) => x.k === o.p)!.n)}：${o.ps.map(pname).join(' → ')}（${dur(t.costList(o.ps.map((p) => p.id)))}）`).join('\n'),
      acts: opts.map((o) => ({ label: `${L('就这条', '就揀呢條', 'Take')}：${tr(PREFS.find((x) => x.k === o.p)!.n)}`, run: () => { o.ps.forEach((p) => t.add(p.id)); t.setGenUsed(true); t.note(L(`已加入 ${o.ps.length} 站`, `加咗 ${o.ps.length} 個站`, `${o.ps.length} stops added`)); c.close(); } })),
    };
  }
  if (has('饿', '吃', '餐', '饭', '肚餓', '食', '飯', 'hungry', 'eat', 'food')) {
    const shops = PLACES.filter((p) => p.partner && p.order && fits(p.id)).sort((a, b) => waitMin(t.kitchens[a.id] ?? a.kitchen!) - waitMin(t.kitchens[b.id] ?? b.kitchen!));
    if (!shops.length) return { who: 'vera', text: L('时间排不下正经吃一顿了，机上会供餐。', '冇時間好好食一餐喇，機上會有餐。', 'Not enough time for a meal. There will be food on board.') };
    const a = shops[0];
    const local = shops.find((p) => ['tsui', 'hhk', 'jd', 'mx'].includes(p.id) && p !== a);
    const w = waitMin(t.kitchens[a.id] ?? a.kitchen!);
    return {
      who: 'vera',
      text: L(`最快的是 ${pname(a)}（${a.floor}），出餐约 ${w} 分，算上走过去预估占用 ${dur(t.costOf(a.id))}。${local ? `想吃香港味道的话，${pname(local)}也排得下。` : ''}提前下单，到了直接取。`,
        `最快係 ${pname(a)}（${a.floor}），等大約 ${w} 分鐘，連行過去預計用 ${dur(t.costOf(a.id))}。${local ? `想食地道啲，${pname(local)}都排得落。` : ''}預先落單，到咗直接攞。`,
        `Fastest is ${pname(a)} (${a.floor}), about ${w} min for food, ${dur(t.costOf(a.id))} in total with walking. ${local ? `For a taste of Hong Kong, ${pname(local)} also fits. ` : ''}Order ahead and just pick up.`),
      acts: [{ label: L(`去 ${pname(a)} 点餐`, `去 ${pname(a)} 落單`, `Order at ${pname(a)}`), run: () => c.openOrder(a.id) }, ...(local ? [{ label: L(`去 ${pname(local)}`, `去 ${pname(local)}`, pname(local)), run: () => c.openOrder(local.id) }] : []), { label: L('看全部合作餐厅', '睇晒合作餐廳', 'All partner restaurants'), run: () => c.openOrder() }],
    };
  }
  if (has('咖啡', '困', '提神', 'coffee', 'tired')) return { who: 'vera', text: L(`Pacific Coffee 在 L6，预估占用 ${dur(t.costOf('pc'))}，可以带上机。`, `Pacific Coffee 喺 L6，預計用 ${dur(t.costOf('pc'))}，可以帶上機。`, `Pacific Coffee on L6 takes about ${dur(t.costOf('pc'))}. You can take it on board.`), acts: [{ label: L('点咖啡', '叫杯咖啡', 'Order coffee'), run: () => c.openOrder('pc') }] };
  if (has('厕所', '洗手间', '卫生间', '洗手間', '廁所', 'toilet', 'restroom', 'wc')) return { who: 'vera', text: L('最近的洗手间在 L6 主廊中段，我按 10 分钟给你留时间。', '最近嘅洗手間喺 L6 主通道中間，我幫你留 10 分鐘。', 'The nearest restroom is mid-concourse on L6. I will allow 10 min.'), acts: [addAct(P('wc6'))] };
  if (has('淋浴', '洗澡', '冲凉', '沖涼', '沖個涼', 'shower')) {
    const ls = PLACES.filter((p) => p.shower && t.visible(p));
    const sw = showerWait(t.clock + 20, t.showerPeak);
    if (sw.wait >= 45 && left < 120) return { who: 'vera', text: L(`现在不太建议。淋浴正值${tr(SHOWER_LABEL[sw.level])}，排队大概 ${sw.wait} 分钟，你只剩 ${dur(left)}。`, `而家唔太建議。沖涼${tr(SHOWER_LABEL[sw.level])}，排隊大約 ${sw.wait} 分鐘，你淨返 ${dur(left)}。`, `Not a great idea right now. Showers are at ${tr(SHOWER_LABEL[sw.level])}, about ${sw.wait} min wait, and you have ${dur(left)}.`) };
    const p = ls.find((x) => x.access !== 'paid') ?? ls[0];
    return { who: 'vera', text: L(`${pname(p)}可以淋浴：到前台登记会拿到震动呼叫器，现在${tr(SHOWER_LABEL[sw.level])}，排队约 ${sw.wait} 分。连同休息预估占用 ${dur(t.costOf(p.id))}。`, `${pname(p)}可以沖涼：去前台登記會攞到震機，而家${tr(SHOWER_LABEL[sw.level])}，排大約 ${sw.wait} 分鐘。連休息預計用 ${dur(t.costOf(p.id))}。`, `${pname(p)} has showers. Check in for a buzzer; it is ${tr(SHOWER_LABEL[sw.level])}, ~${sw.wait} min wait. About ${dur(t.costOf(p.id))} in total.`), acts: fits(p.id) ? [addAct(p)] : undefined };
  }
  if (has('贵宾室', '休息室', '貴賓室', 'lounge', '累', '休息', '抖', 'rest')) {
    const own = PLACES.filter((p) => p.cat === '贵宾室' && p.access !== 'paid' && t.visible(p));
    if (!own.length) return { who: 'vera', text: L(`The Pier 需要商务舱、头等舱或 Marco Polo Club Silver 以上才能进。${t.member ? '' : '如果你是会员，登录后我帮你看看。'}人人都能用的是 L7 Plaza Premium Lounge，付费入内。`, `The Pier 要商務、頭等或者 Marco Polo Club Silver 以上先入得。${t.member ? '' : '如果你係會員，登入咗我幫你睇吓。'}人人都入得嘅係 L7 Plaza Premium Lounge，要俾錢。`, `The Pier needs Business, First or Marco Polo Club Silver+. ${t.member ? '' : 'If you are a member, log in and I will check. '}Plaza Premium Lounge on L7 is open to all for a fee.`), acts: [...(t.member ? [] : [{ label: L('登录会员', '登入會員', 'Log in'), run: c.openMember }]), addAct(P('plaza'))] };
    return { who: 'vera', text: L(`你可以进 ${own.map(pname).join('、')}，自由找座，餐饮都包含。`, `你入得 ${own.map(pname).join('、')}，自己搵位，飲食全包。`, `You can use ${own.map(pname).join(' and ')}. Free seating, food and drinks included.`), acts: own.filter((p) => fits(p.id)).map((p) => addAct(p)) };
  }
  if (has('充电', '没电', '叉電', '冇電', 'charge', 'battery')) return { who: 'vera', text: L('L6 主廊的充电休息区有插座和 USB。', 'L6 主通道嘅叉電休息區有插蘇同 USB。', 'The charging lounge on L6 has sockets and USB.'), acts: [addAct(P('charge'))] };
  if (has('手信', '礼物', '伴手礼', '禮物', 'gift', 'souvenir')) return { who: 'vera', text: L('首选奇华饼家（L5），老婆饼、熊猫曲奇都有；想体面一点，L6 The Peninsula Boutique 的奶黄月饼很受欢迎。', '首選奇華餅家（L5），老婆餅、熊貓曲奇都有；想體面啲，L6 The Peninsula Boutique 嘅奶黃月餅好受歡迎。', 'Kee Wah Bakery on L5 for wife cakes and panda cookies; for something special, custard mooncakes at The Peninsula Boutique on L6.'), acts: [addAct(P('kee')), addAct(P('pen'))] };
  if (has('买', '购物', '免税', '買', '免稅', 'shop', 'duty')) return { who: 'vera', text: L(`L6 有 DFS、Chanel、Louis Vuitton、Gucci、Hermès、Cartier。按你的 ${dur(left)}，挑两三家比较从容。`, `L6 有 DFS、Chanel、Louis Vuitton、Gucci、Hermès、Cartier。你有 ${dur(left)}，揀兩三間就夠鬆動。`, `L6 has DFS, Chanel, Louis Vuitton, Gucci, Hermès and Cartier. With ${dur(left)}, two or three is comfortable.`), acts: [{ label: L('按购物偏好排一条', '按買嘢排一條', 'Plan a shopping route'), run: () => { const ps = generate(t, 'shop'); ps.forEach((p) => t.add(p.id)); t.setGenUsed(true); c.close(); } }] };
  if (has('看飞机', '拍照', '打卡', '睇飛機', 'plane', 'photo', 'view')) return { who: 'vera', text: L('L8 Sky Bridge 离地 28 米，飞机从脚下滑过；不想走远，L6 停机坪观景窗也能看起降。', 'L8 Sky Bridge 離地 28 米，飛機喺腳底滑過；唔想行咁遠，L6 停機坪觀景窗都睇到升降。', 'Sky Bridge on L8 is 28 m up with planes passing below; the L6 apron windows are closer.'), acts: [addAct(P('cam')), addAct(P('apron'))] };
  if (has('时间', '多久', '来得及', '几点', '時間', '夠唔夠', '幾點', 'time', 'how long', 'enough')) return { who: 'vera', text: L(`${FLIGHT.outNo} ${hm(t.dep)} 起飞，${hm(t.dep - t.boardBuffer)} 开始登机。${t.pre ? `转机安检约 ${t.pre} 分，` : ''}走回 ${t.gateName} 号口约 ${t.walkGate} 分。${t.left >= 0 ? `还能自由用 ${dur(t.left)}。` : `现在超出了 ${dur(-t.left)}，建议删掉一两项。`}`,
    `${FLIGHT.outNo} ${hm(t.dep)} 起飛，${hm(t.dep - t.boardBuffer)} 開始登機。${t.pre ? `轉機安檢大約 ${t.pre} 分鐘，` : ''}行返 ${t.gateName} 號閘口大約 ${t.walkGate} 分鐘。${t.left >= 0 ? `仲有 ${dur(t.left)} 自由時間。` : `而家超咗 ${dur(-t.left)}，刪走一兩項好啲。`}`,
    `${FLIGHT.outNo} departs ${hm(t.dep)}, boarding ${hm(t.dep - t.boardBuffer)}. ${t.pre ? `Security takes ~${t.pre} min, ` : ''}the walk to gate ${t.gateName} ~${t.walkGate} min. ${t.left >= 0 ? `You still have ${dur(t.left)} free.` : `You are over by ${dur(-t.left)}; drop a stop or two.`}`) };
  if (has('行李', '直挂', '直掛', 'bag', 'luggage')) return t.bag === 'ok'
    ? { who: 'vera', text: L('你的行李已直挂到目的地，不用取，直接过转机安检。', '你啲行李已經直掛去目的地，唔使攞，直接過轉機安檢。', 'Your bags are checked through. Go straight to transfer security.') }
    : { who: 'vera', text: L('你的行李只挂到香港：先入境、到行李转盘取行李，再到离港层重新值机和安检，我会一步步带你走。', '你啲行李只係掛到香港：先入境、去行李轉盤攞行李，再去離港層登記同安檢，我會一步步帶你。', 'Your bags end in Hong Kong: clear immigration, collect them, then check in and clear security again. I will guide each step.'), acts: [{ label: L('看导航', '睇導航', 'Navigate'), run: () => { c.close(); c.goMap(); } }] };
  if (has('登机口', '闸口', '閘口', 'gate')) return { who: 'vera', text: L(`你的登机口是 ${t.gateName} 号，${hm(t.dep - t.boardBuffer)} 开始登机。`, `你嘅閘口係 ${t.gateName} 號，${hm(t.dep - t.boardBuffer)} 開始登機。`, `Your gate is ${t.gateName}, boarding at ${hm(t.dep - t.boardBuffer)}.`), acts: [{ label: L('看导航', '睇導航', 'Navigate'), run: () => { c.close(); c.goMap(); } }] };
  if (has('里数', '里程', '里數', '积分', '会员', '登录', '登入', 'mile', 'login', 'member')) return t.member
    ? { who: 'vera', text: L(`你这次中转已经累积了 ${t.miles} Asia Miles。`, `你今次轉機儲咗 ${t.miles} Asia Miles。`, `You have earned ${t.miles} Asia Miles this transfer.`) }
    : { who: 'vera', text: L(`你有 ${t.pending} Asia Miles 待领，点右上角头像登录就能入账。`, `你有 ${t.pending} Asia Miles 未攞，撳右上角頭像登入就入到數。`, `${t.pending} Asia Miles are waiting. Tap the avatar to log in.`), acts: [{ label: L('现在登录', '即刻登入', 'Log in'), run: c.openMember }] };
  if (has('粤语', '英语', '听不懂', '人工', '客服', '聽唔明', 'english', 'agent', 'human')) return { who: 'vera', text: L('我帮你接通国泰人工客服，普通话、粤语、English 都有。', '我幫你駁去國泰客服，普通話、廣東話、English 都有。', 'I can connect you to a Cathay agent in Mandarin, Cantonese or English.'), acts: [callAct] };
  if (has('改签', '误机', '错过', '赶不上', '趕唔切', 'miss', 'rebook')) return { who: 'vera', text: L('先别慌。国泰联程的话会帮你安排后续航班；分开买票就要联系那家航空公司。我帮你接人工最快。', '唔使驚。國泰聯程會幫你安排之後嘅航班；分開買飛就要搵返嗰間航空公司。我幫你駁人工最快。', 'Do not worry. On a Cathay through ticket you will be rebooked; separate tickets mean contacting that airline. An agent is fastest.'), acts: [callAct] };
  if (has('清真', 'halal')) return { who: 'vera', text: L('L7 的 OLDTOWN White Coffee 有清真认证。', 'L7 嘅 OLDTOWN White Coffee 有清真認證。', 'OLDTOWN White Coffee on L7 is halal-certified.'), acts: fits('oldtown') ? [{ label: L('去点餐', '去落單', 'Order'), run: () => c.openOrder('oldtown') }] : undefined };
  return { who: 'vera', text: L('这个我不太确定，不想给你错误的信息。可以问我吃什么、去哪逛、还剩多久，或者我帮你接人工。', '呢樣我唔太肯定，唔想講錯。你可以問我食咩、去邊行、仲有幾耐，或者我幫你駁人工。', 'I am not sure about that and do not want to guess. Ask me about food, places, or time left, or I can get you an agent.'), acts: [callAct], fallback: true };
}

export const quick = (t?: Trip) => (t && !(t.phase === 'free' && !t.atSec && t.left >= 20))
  ? [L('还剩多少时间', '仲有幾多時間', 'How much time is left'), L('登机口在哪', '閘口喺邊', 'Where is my gate'), L('洗手间在哪', '洗手間喺邊', 'Where is the restroom'), L('行李直挂了吗', '行李直掛咗未', 'Are my bags checked through')]
  : [L('推荐几条路线', '推介幾條路線', 'Recommend a route'), L('我有点饿', '我肚餓', 'I am hungry'), L('还剩多少时间', '仲有幾多時間', 'How much time is left'), L('想洗个澡', '想沖個涼', 'I want a shower'), L('洗手间在哪', '洗手間喺邊', 'Where is the restroom'), L('想买手信', '想買手信', 'Gift ideas'), L('能去贵宾室吗', '我入唔入到貴賓室', 'Can I use a lounge'), L('行李直挂了吗', '行李直掛咗未', 'Are my bags checked through')];
export const voiceSamples = () => [L('附近有什么好吃的', '附近有咩好食', 'Anything good to eat nearby'), L('我还来得及洗个澡吗', '我仲夠唔夠時間沖涼', 'Do I have time for a shower'), L('想去看飞机', '想去睇飛機', 'I want to see the planes')];
