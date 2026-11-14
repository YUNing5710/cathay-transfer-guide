import { FLOOR_ORDER, PLACES, Place } from './data';
import { Tri } from './i18n';
import { PlanItem, Trip } from './store';

export type Pref = 'mix' | 'food' | 'shop' | 'see' | 'rest';
export const PREFS: { k: Pref; n: Tri; d: Tri }[] = [
  { k: 'mix', n: ['均衡', '樣樣都試', 'Balanced'], d: ['吃一点、逛一点、看一点', '食少少、行少少、睇少少', 'A bit of food, shopping and sights'] },
  { k: 'food', n: ['美食', '搵食', 'Food'], d: ['以吃为主，顺路逛逛', '主力搵食，順路行吓', 'Mostly food, shopping on the way'] },
  { k: 'shop', n: ['购物', '買嘢', 'Shopping'], d: ['以免税和手信为主，配一顿简餐', '主力免稅同手信，加個簡餐', 'Duty free and gifts, plus a light bite'] },
  { k: 'see', n: ['观光', '行吓睇吓', 'Sights'], d: ['看飞机、看展，配咖啡', '睇飛機、睇展覽，飲杯咖啡', 'Planes, art, and a coffee'] },
  { k: 'rest', n: ['休息', '抖吓', 'Rest'], d: ['充电、贵宾室、淋浴，少走路', '叉電、貴賓室、沖涼，少行路', 'Charge, lounge, shower, less walking'] },
];
const W: Record<Pref, Record<string, number>> = {
  mix: { 美食: 3, 购物: 2.5, 观光: 2.5, 休息: 1.5 },
  food: { 美食: 5, 购物: 1.5, 观光: 1.5, 休息: 1 },
  shop: { 美食: 1.5, 购物: 5, 观光: 1, 休息: 1 },
  see: { 美食: 1.5, 购物: 1, 观光: 5, 休息: 1.5 },
  rest: { 美食: 1.5, 购物: 0.5, 观光: 1, 休息: 5 },
};

const sortWalk = (ps: Place[]) => [...ps].sort((a, b) => FLOOR_ORDER.indexOf(a.floor) - FLOOR_ORDER.indexOf(b.floor) || a.x - b.x);
/** How often each place has been suggested this session; used to spread recommendations evenly. */
const shown: Record<string, number> = {};

/**
 * Fill about 80% of the free time. Rules:
 * - cost of each stop = detour + stay given what is already chosen;
 * - Cathay partners are preferred, each place's suggestion count is balanced across runs;
 * - at most one sit-down meal and one lounge; never two meals or two drink shops next to each other on the walk.
 */
export function generate(t: Trip, pref: Pref, seed = 0): Place[] {
  const target = Math.floor(Math.max(0, t.left) * 0.8);
  if (target < 15 || !t.canAdd) return [];
  const open = t.plan.filter((p) => !p.done);
  const base = t.timeline(open);
  const baseEnd = base.end + base.toGate;
  const pool = PLACES.filter((p) => p.tags.length && !t.has(p.id) && !t.visited(p.id) && t.visible(p) && !(p.access && p.access !== 'paid' && t.loungeFull));
  const picks: Place[] = [];
  const items = (ps: Place[]): PlanItem[] => [...open, ...sortWalk(ps).map((p, i) => ({ uid: -10 - i, id: p.id, done: false }))];
  const cost = (ps: Place[]) => { const tl = t.timeline(items(ps)); return tl.end + tl.toGate - baseEnd; };
  const clash = (ps: Place[]) => {
    // Include the last open stop already in the plan, so a new meal never follows a planned meal.
    const lastOpen = open.length ? PLACES.find((x) => x.id === open[open.length - 1].id) : undefined;
    const s = [...(lastOpen ? [lastOpen] : []), ...sortWalk(ps)];
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1].kind, b = s[i].kind;
      if (a && b && a === b && a !== 'snack') return true;
    }
    return false;
  };
  for (let guard = 0; guard < 12; guard++) {
    const spent = cost(picks);
    const meals = picks.filter((p) => p.kind === 'meal').length + open.filter((o) => PLACES.find((x) => x.id === o.id)?.kind === 'meal').length;
    const lounges = picks.filter((p) => p.cat === '贵宾室').length;
    const cats = new Set(picks.map((p) => p.cat));
    let best: { p: Place; score: number } | null = null;
    for (const p of pool) {
      if (picks.includes(p)) continue;
      if (p.kind === 'meal' && meals >= 1) continue;
      if (p.cat === '贵宾室' && lounges >= 1) continue;
      const next = [...picks, p];
      if (clash(next)) continue;
      const c = cost(next) - spent;
      if (spent + c > target) continue;
      const fit = Math.max(...p.tags.map((g) => W[pref][g] ?? 0));
      const variety = cats.has(p.cat) ? 0.55 : 1;
      const partner = p.cat === '餐饮' ? (p.partner ? 1.6 : 0.7) : p.partner ? 1.2 : 1;
      const balance = 1 / (1 + (shown[p.id] ?? 0) * 0.6);
      const jitter = 1 + (((p.id.charCodeAt(0) * 31 + seed * 17) % 13) / 100);
      const score = (fit * variety * partner * balance * jitter) / Math.max(10, c) * 10;
      if (!best || score > best.score) best = { p, score };
    }
    if (!best) break;
    picks.push(best.p);
  }
  return sortWalk(picks);
}
/** Record that a set of places was shown to the user, so the next suggestion spreads elsewhere. */
export const markShown = (ps: Place[]) => ps.forEach((p) => { shown[p.id] = (shown[p.id] ?? 0) + 1; });
