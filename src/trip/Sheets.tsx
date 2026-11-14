import { PrivacyConsent } from './privacy';
import React, { useEffect, useState } from 'react';
import { dur, floorLabel, PLACES, pickupEstimate, pname, waitMin } from './data';
import { L, useLang } from './i18n';
import { Trip } from './store';
import { btn, C, Icon, MilesTag, mono, Sheet } from './ui';

/** Only Cathay partners take orders in-app. */
export const OrderPicker = ({ t, onPick, onClose }: { t: Trip; onPick: (id: string) => void; onClose: () => void }) => {
  useLang();
  const shops = PLACES.filter((p) => p.partner && p.order);
  return (
    <Sheet title={L('合作商户 · 提前点餐', '合作商戶 · 預先落單', 'Partner ordering')} onClose={onClose}>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{L('出餐时间按商户实时订单量估算', '等餐時間按商戶即時單量估', 'Wait times use live order volume')}</div>
      <div style={{ display: 'grid', gap: 8 }}>
        {shops.map((s) => {
          const k = t.kitchens[s.id] ?? s.kitchen!;
          const cost = t.costOf(s.id);
          return (
            <button key={s.id} onClick={() => onPick(s.id)} style={{ textAlign: 'left', display: 'flex', gap: 10, alignItems: 'center', border: `1px solid ${C.line}`, background: C.paper, borderRadius: 12, padding: 10, cursor: 'pointer', color: C.ink }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.jadeSoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n="dine" c={C.jade} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>{pname(s)} <MilesTag t={t} n={s.miles} /></div>
                <div style={{ fontSize: 12, color: C.muted }}>{floorLabel(s.floor)} · {L(`前方 ${k.orders} 单 · 出餐约 ${waitMin(k)} 分`, `前面 ${k.orders} 張單 · 等大約 ${waitMin(k)} 分鐘`, `${k.orders} ahead · ~${waitMin(k)} min`)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: C.muted }}>{L('预估占用', '預計用', 'Est.')}</div>
                <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: cost <= t.left ? C.jade : C.red }}>{dur(cost)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
};

export const OrderSheet = ({ t, shopId, onClose, onDone }: { t: Trip; shopId: string; onClose: () => void; onDone: () => void }) => {
  useLang();
  const shop = PLACES.find((p) => p.id === shopId)!;
  const k = t.kitchens[shopId] ?? shop.kitchen!;
  const ch = shop.order === 'web' ? L('商户网页', '商戶網頁', 'the merchant site') : L('微信小程序', 'WeChat 小程式', 'the WeChat Mini Program');
  const [stage, setStage] = useState<'intro' | 'confirm' | 'jump' | 'done'>('intro');
  const [code, setCode] = useState('');
  const [eta, setEta] = useState(0);
  useEffect(() => {
    if (stage !== 'jump') return;
    const id = setTimeout(() => {
      const c = String(200 + Math.floor(Math.random() * 700));
      const e = shop.dine ? 0 : pickupEstimate(k);
      setCode(c); setEta(e);
      // Miles are credited when the stop is completed, not at payment.
      t.add(shopId, shop.dine ? { orderText: `${L('桌号', '枱號', 'Table')} ${c}`, miles: shop.miles } : { readyAt: t.clock + e, orderText: `${L('取餐码', '攞餐號碼', 'Pickup')} ${c}`, code: c, miles: shop.miles });
      setStage('done');
    }, 1200);
    return () => clearTimeout(id);
  }, [stage]);
  return (
    <Sheet title={`${pname(shop)} · ${floorLabel(shop.floor)}`} onClose={onClose}>
      {stage === 'intro' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', background: C.bg, borderRadius: 10, padding: '8px 10px', fontSize: 12, gap: 8 }}>
            <span>{L(`前方约 ${k.orders} 单`, `前面大約 ${k.orders} 張單`, `~${k.orders} orders ahead`)}</span>
            <strong style={{ color: C.jade }}>{L('预估占用', '預計用', 'Est.')} {dur(t.costOf(shopId))}</strong>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>{L(`${pname(shop)}用${ch}点餐${shop.dine ? '，堂食送餐到座' : ''}。付款后自动回到这里，${shop.dine ? '桌号' : '取餐码'}直接排进行程。`, `${pname(shop)}用${ch}落單${shop.dine ? '，堂食送餐到位' : ''}。俾完錢自動返嚟，${shop.dine ? '枱號' : '攞餐號碼'}直接排入行程。`, `${pname(shop)} takes orders via ${ch}${shop.dine ? ', with table service' : ''}. After paying you come straight back and the ${shop.dine ? 'table number' : 'pickup number'} goes into your plan.`)}</div>
          <button disabled={t.costOf(shopId) > t.left || !t.canAdd} style={{ ...btn(), width: '100%', opacity: t.costOf(shopId) > t.left || !t.canAdd ? 0.5 : 1 }} onClick={() => setStage('confirm')}>{L(`去${ch}点餐`, `去${ch}落單`, `Order on ${ch}`)}</button>
          {t.costOf(shopId) > t.left && <div style={{ fontSize: 12, color: C.red }}>{L(`预估占用 ${dur(t.costOf(shopId))}，超出剩余时间，无法加入`, `預計用 ${dur(t.costOf(shopId))}，超過淨返嘅時間，加唔到`, `Needs ${dur(t.costOf(shopId))}, more than you have left`)}</div>}
          <button disabled={t.costOf(shopId) > t.left || !t.canAdd} style={{ ...btn('ghost'), width: '100%' }} onClick={() => { t.add(shopId, { miles: shop.miles }); t.note(L(`已加入 ${pname(shop)}`, `加咗 ${pname(shop)}`, `${pname(shop)} added`)); onDone(); }}>{L('不提前点，直接去店里', '唔預先落單，直接去', 'Just walk there')}</button>
        </div>
      )}
      {stage === 'confirm' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{L(`即将打开${ch}`, `就嚟打開${ch}`, `Open ${ch}?`)}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...btn('ghost'), flex: 1 }} onClick={() => setStage('intro')}>{L('取消', '取消', 'Cancel')}</button>
            <button style={{ ...btn(), flex: 1 }} onClick={() => setStage('jump')}>{L('打开', '打開', 'Open')}</button>
          </div>
        </div>
      )}
      {stage === 'jump' && <div style={{ textAlign: 'center', padding: '26px 0', fontSize: 15, fontWeight: 700 }}>{L('正在打开…', '打開緊…', 'Opening…')}</div>}
      {stage === 'done' && (
        <div style={{ textAlign: 'center', padding: '14px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, background: C.jadeSoft, margin: '0 auto 10px', display: 'grid', placeItems: 'center' }}><Icon n="check" s={30} c={C.jade} w={2.6} /></div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{shop.dine ? L(`桌号 ${code} 已排进行程`, `枱號 ${code} 已排入行程`, `Table ${code} is in your plan`) : L(`取餐码 ${code} 已排进行程`, `攞餐號碼 ${code} 已排入行程`, `Pickup ${code} is in your plan`)}</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{shop.dine ? L('入座即可，餐会送到桌上', '坐低就得，餐會送到枱', 'Take a seat, food comes to you') : L(`约 ${eta} 分钟后可取，到时会提醒你`, `大約 ${eta} 分鐘後攞得，到時提你`, `Ready in ~${eta} min, we will remind you`)}</div>
          {shop.miles > 0 && <div style={{ fontSize: 13, color: C.gold, marginTop: 8 }}>{t.member ? L(`完成取餐后 +${shop.miles} Asia Miles`, `攞完餐就 +${shop.miles} Asia Miles`, `+${shop.miles} Asia Miles once you pick up`) : L(`完成后登录可领取 ${shop.miles} Asia Miles`, `完成之後登入可以攞 ${shop.miles} Asia Miles`, `Complete it and log in to claim ${shop.miles} Asia Miles`)}</div>}
          <button style={{ ...btn(), marginTop: 14, width: '100%' }} onClick={onDone}>{L('回到指引', '返去指引', 'Back to guide')}</button>
        </div>
      )}
    </Sheet>
  );
};

export const HelpSheet = ({ onClose }: { onClose: () => void }) => {
  useLang();
  const [stage, setStage] = useState<'ask' | 'calling' | 'on'>('ask');
  const [sec, setSec] = useState(0);
  useEffect(() => {
    if (stage === 'calling') { const id = setTimeout(() => setStage('on'), 1400); return () => clearTimeout(id); }
    if (stage === 'on') { const id = setInterval(() => setSec((s) => s + 1), 1000); return () => clearInterval(id); }
  }, [stage]);
  return (
    <Sheet title={L('呼叫客服', '搵客服', 'Call support')} onClose={onClose}>
      {stage === 'ask' && (<>
        <p style={{ fontSize: 14, margin: '0 0 12px' }}>{L('是否拨通国泰人工客服？可选普通话、粤语或 English。', '要唔要打俾國泰客服？有普通話、廣東話同 English。', 'Call a Cathay agent? Mandarin, Cantonese or English.')}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...btn('ghost'), flex: 1 }} onClick={onClose}>{L('取消', '取消', 'Cancel')}</button>
          <button style={{ ...btn(), flex: 1 }} onClick={() => setStage('calling')}>{L('拨通', '打過去', 'Call')}</button>
        </div>
      </>)}
      {stage === 'calling' && (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <Icon n="phone" s={30} c={C.jade} />
          <div style={{ fontWeight: 700, marginTop: 6 }}>{L('正在接通国泰客服…', '接駁緊國泰客服…', 'Connecting to Cathay…')}</div>
          <button style={{ ...btn('ghost'), marginTop: 12 }} onClick={onClose}>{L('取消', '取消', 'Cancel')}</button>
        </div>
      )}
      {stage === 'on' && (<div style={{ textAlign: 'center' }}>
        <Icon n="phone" s={30} c={C.jade} />
        <div style={{ fontWeight: 700, marginTop: 6 }}>{L('已接通 · 国泰客服', '接通咗 · 國泰客服', 'Connected · Cathay')}</div>
        <div style={{ fontFamily: mono, fontSize: 22, margin: '6px 0 12px' }}>{String(Math.floor(sec / 60)).padStart(2, '0')}:{String(sec % 60).padStart(2, '0')}</div>
        <button style={{ ...btn('danger'), width: '100%' }} onClick={onClose}>{L('挂断', '收線', 'Hang up')}</button>
      </div>)}
    </Sheet>
  );
};

/** Short login: pitch → fields fill in one quick pass → success. */
export const MemberSheet = ({ t, onClose }: { t: Trip; onClose: () => void }) => {
  useLang();
  const [stage, setStage] = useState<'pitch' | 'loading' | 'ok'>(t.member ? 'ok' : 'pitch');
  const [agree, setAgree] = useState(false);
  useEffect(() => {
    if (stage !== 'loading') return;
    const id = setTimeout(() => { t.login(); setStage('ok'); }, 700);
    return () => clearTimeout(id);
  }, [stage]);
  const fld: React.CSSProperties = { display: 'block', width: '100%', marginTop: 4, height: 40, borderRadius: 10, border: `1px solid ${C.line}`, padding: '0 12px', fontSize: 15, fontFamily: mono, background: C.bg, color: C.ink };
  return (
    <Sheet title={t.member && stage === 'ok' ? 'Marco Polo Club' : L('登录国泰会员', '登入國泰會員', 'Log in to Cathay')} onClose={onClose}>
      {stage === 'pitch' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{L('登录后，合作商户消费、打卡和分流补偿都能累积 Asia Miles，并按会员等级解锁可进入的贵宾室。', '登入之後，合作商戶消費、打卡同分流補償都儲到 Asia Miles，仲會按會員級別解鎖貴賓室。', 'Log in to earn Asia Miles on partner spend, check-ins and diversions, and unlock lounges for your tier.')}</div>
          {t.pending > 0 && <div style={{ background: C.goldSoft, color: C.gold, borderRadius: 10, padding: '8px 10px', fontSize: 13, fontWeight: 600 }}>{L(`本次中转已累积 ${t.pending} Asia Miles，登录即可领取`, `今次轉機儲咗 ${t.pending} Asia Miles，登入就攞得`, `${t.pending} Asia Miles waiting, log in to claim`)}</div>}
          <PrivacyConsent agree={agree} setAgree={setAgree} />
          <button disabled={!agree} style={{ ...btn(), width: '100%', opacity: agree ? 1 : 0.5, cursor: agree ? 'pointer' : 'not-allowed' }} onClick={() => { if (agree) setStage('loading'); }}>{L('立即登录', '即刻登入', 'Log in now')}</button>
          <button style={{ ...btn('ghost'), width: '100%' }} onClick={onClose}>{L('稍后再说', '遲啲先', 'Later')}</button>
        </div>
      )}
      {stage === 'loading' && (
        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 12, color: C.muted }}>{L('会员号码', '會員號碼', 'Member number')}<input readOnly value="1702 3389 46" style={{ ...fld, animation: 'fillin .25s ease' }} /></label>
          <label style={{ fontSize: 12, color: C.muted }}>{L('密码', '密碼', 'Password')}<input readOnly value="••••••••" style={{ ...fld, animation: 'fillin .25s ease .1s both' }} /></label>
          <div style={{ ...btn(), width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.85 }}>
            <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />{L('正在登录…', '登入緊…', 'Logging in…')}
          </div>
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}@keyframes fillin{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}'}</style>
        </div>
      )}
      {stage === 'ok' && t.member && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 20, background: C.jadeSoft, display: 'grid', placeItems: 'center' }}><Icon n="check" s={22} c={C.jade} w={2.6} /></div>
            <div><div style={{ fontSize: 16, fontWeight: 700 }}>{L('登录成功', '登入成功', 'Logged in')} · {t.member.name}</div><div style={{ fontSize: 13, color: C.gold }}>Marco Polo Club {t.member.tier}</div></div>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: C.goldSoft, borderRadius: 12 }}>
            <div style={{ fontSize: 12, color: C.gold }}>{L('本次中转已累积', '今次轉機已經儲咗', 'Earned this transfer')}</div>
            <div style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: C.gold }}>{t.miles} Asia Miles</div>
          </div>
          <button style={{ ...btn(), marginTop: 12, width: '100%' }} onClick={onClose}>{L('完成', '搞掂', 'Done')}</button>
          <button style={{ ...btn('ghost'), marginTop: 8, width: '100%' }} onClick={() => { t.logout(); onClose(); }}>{L('退出登录', '登出', 'Log out')}</button>
        </div>
      )}
    </Sheet>
  );
};
