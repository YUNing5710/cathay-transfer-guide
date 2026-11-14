import { useEffect, useState } from 'react';

/** UI language. zh = 简体普通话, hk = 繁體粵語口語, en = English. Proper nouns are never translated. */
export type Lang = 'zh' | 'hk' | 'en';
export type Tri = [string, string, string];
let cur: Lang = 'zh';
const subs = new Set<() => void>();
export const getLang = () => cur;
export const setLang = (l: Lang) => { cur = l; subs.forEach((f) => f()); };
export const L = (zh: string, hk: string, en: string) => (cur === 'zh' ? zh : cur === 'hk' ? hk : en);
export const tr = (x: Tri) => L(x[0], x[1], x[2]);
export function useLang() {
  const [, f] = useState(0);
  useEffect(() => { const g = () => f((n) => n + 1); subs.add(g); return () => { subs.delete(g); }; }, []);
  return cur;
}
