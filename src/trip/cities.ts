// 机场代码 → 中文城市名（代替 Master Data API，不消耗额度）
export const CITY: Record<string, string> = {
  HKG: '香港', HGH: '杭州', PEK: '北京', PVG: '上海', CAN: '广州', SZX: '深圳',
  MNL: '马尼拉', NRT: '东京', HND: '东京', ICN: '首尔', TPE: '台北',
  SIN: '新加坡', BKK: '曼谷', SYD: '悉尼', YVR: '温哥华', LHR: '伦敦',
};
export const cityName = (code?: string) => (code && CITY[code]) || code || '';
