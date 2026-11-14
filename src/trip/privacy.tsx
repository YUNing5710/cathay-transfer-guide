import React, { useState } from 'react';
import { L, useLang } from './i18n';
import { C } from './ui';

/** 隐私条款正文（简体 / 繁体 / 英文）。完整版见 docs/隐私条款.docx */
const SECTIONS: { h: [string, string, string]; p: [string, string, string] }[] = [
  {
    h: ['1. 关于本应用', '1. 關於本應用', '1. About this app'],
    p: ['WingWeave 是在香港国际机场使用的转机助手，提供航班状态、可支配时间（安全时间）计算、机场导航、活动推荐和 AI 助手 Vera。本应用目前为 Hackathon 演示项目，部分商户、排队、会员及里数信息为模拟数据，不代表国泰航空或香港机场的正式服务。',
      'WingWeave 係喺香港國際機場用嘅轉機助手，提供航班狀態、可用時間（安全時間）計算、機場導航、活動推介同 AI 助手 Vera。本應用而家係 Hackathon 示範項目，部分商戶、排隊、會員同里數資料係模擬數據，唔代表國泰航空或者香港機場嘅正式服務。',
      'WingWeave is a transfer assistant for Hong Kong International Airport offering flight status, free (safe) time, airport navigation, activity suggestions and the AI assistant Vera. It is a hackathon demo; some merchant, queue, membership and miles data is simulated and does not represent official Cathay Pacific or airport services.'],
  },
  {
    h: ['2. 我们收集的信息', '2. 我哋收集嘅資料', '2. Information we collect'],
    p: ['航班信息：到港和离港航班号、日期、登机口、航班状态。会员信息：登录时的会员号码、姓名、会员等级、里数（演示版使用示例账号）。行程与偏好：你选的偏好、加入的活动、模拟订单、完成状态。AI 对话：你输入或用语音说出的问题。设备信息：仅在你授权时使用设备方向（指南针）辅助箭头导航。位置信息：仅在你点“用定位校准步速”并授权后使用，用于估算步行速度和到登机口的时间；位置只在本机计算，不上传服务器，也不发送给 AI；只会把预估时间调长。',
      '航班資料：到港同離港航班號、日期、閘口、航班狀態。會員資料：登入時嘅會員號碼、姓名、會員級別、里數（示範版用示例戶口）。行程同喜好：你揀嘅喜好、加入嘅活動、模擬訂單、完成狀態。AI 對話：你打字或者講出嘅問題。裝置資料：只喺你授權時用裝置方向（指南針）幫箭咀導航。位置資料：只喺你撳「用定位校準速度」並授權之後先會用，用嚟估行路速度同去閘口嘅時間；位置只喺本機計算，唔會上傳伺服器，亦唔會傳畀 AI；只會將預計時間計長。',
      'Flights: inbound and outbound flight numbers, dates, gates and status. Membership: member number, name, tier and miles when you log in (the demo uses a sample account). Plan and preferences: chosen preferences, added activities, simulated orders and progress. AI chat: questions you type or speak. Device: device orientation (compass) only if you allow it, to point the arrow. Location: only after you tap “Use location to tune pace” and allow it, to estimate walking speed and time to your gate; it is processed on your device only, never uploaded or sent to the AI, and can only lengthen estimates.'],
  },
  {
    h: ['3. 使用目的', '3. 用途', '3. How we use it'],
    p: ['计算你的可支配时间和出发时间；在延误、登机口变更时重算并提醒；规划顺路路线和导航；按偏好推荐活动；回答你的转机问题；在登录后显示会员权益和里数。最高原则是保障你准时登机：返回缓冲开始后，系统不会再推荐任何活动。',
      '計你嘅可用時間同出發時間；延誤或者轉閘口時重新計同提你；排順路路線同導航；按喜好推介活動；答你嘅轉機問題；登入後顯示會員權益同里數。最重要係保障你準時登機：返程緩衝開始之後，系統唔會再推介任何活動。',
      'To work out your free time and when to leave; recalculate and alert you on delays or gate changes; plan routes and navigation; suggest activities by preference; answer transfer questions; and show member benefits and miles after login. Boarding on time comes first: once the return buffer starts, no activities are suggested.'],
  },
  {
    h: ['4. 第三方服务', '4. 第三方服務', '4. Third-party services'],
    p: ['航班数据来自 OAG，查询时会发送航班号和日期。Vera 无法用内置规则回答的问题，会连同航班号、当前时间、登机口和剩余时间发送给阿里云百炼（通义千问）生成回答。语音输入由你的浏览器转成文字，声音可能由浏览器厂商的云端处理。我们不会把你的姓名、会员号码或证件信息发送给 AI 服务。',
      '航班數據嚟自 OAG，查詢時會傳送航班號同日期。Vera 用內置規則答唔到嘅問題，會連同航班號、而家時間、閘口同剩餘時間傳送畀阿里雲百煉（通義千問）生成答案。語音輸入由你嘅瀏覽器轉做文字，聲音可能由瀏覽器廠商嘅雲端處理。我哋唔會將你嘅姓名、會員號碼或者證件資料傳送畀 AI 服務。',
      'Flight data comes from OAG; flight numbers and dates are sent when querying. Questions Vera cannot answer with built-in rules are sent, with flight number, current time, gate and time left, to Alibaba Cloud Model Studio (Qwen). Voice input is transcribed by your browser and audio may be processed by the browser vendor. Your name, member number and ID details are never sent to the AI service.'],
  },
  {
    h: ['5. 保存与删除', '5. 保存同刪除', '5. Storage and deletion'],
    p: ['行程、偏好和对话只保存在当前页面，关闭页面或点“重置演示”即清除，我们不会在服务器上长期保存。服务器只保留排查故障所需的短期运行日志。你可以随时退出登录。',
      '行程、喜好同對話只會留喺目前頁面，閂咗頁面或者撳「重置示範」就會清走，我哋唔會喺伺服器長期保存。伺服器只會留排查故障需要嘅短期運行記錄。你可以隨時登出。',
      'Your plan, preferences and chat stay in the current page and are cleared when you close it or reset the demo; nothing is kept long-term on our server, apart from short-lived logs needed to fix faults. You can log out at any time.'],
  },
  {
    h: ['6. AI 与模拟内容声明', '6. AI 同模擬內容聲明', '6. AI and simulated content'],
    p: ['AI 回答和推荐可能不准确，不能代替国泰航空或机场的正式通知。航班时间、登机口和登机截止时间请以登机证、机场广播和国泰官方信息为准。订单、排队、贵宾室和里数为模拟体验，不构成真实交易或里数入账。',
      'AI 答案同推介可能唔準確，唔可以代替國泰航空或者機場嘅正式通知。航班時間、閘口同登機截止時間請以登機證、機場廣播同國泰官方資料為準。訂單、排隊、貴賓室同里數係模擬體驗，唔係真實交易或者里數入賬。',
      'AI answers and suggestions may be wrong and do not replace official Cathay Pacific or airport notices. Always follow your boarding pass, airport announcements and official Cathay information for times, gates and boarding cut-off. Orders, queues, lounges and miles are simulated and are not real transactions or credited miles.'],
  },
  {
    h: ['7. 你的权利', '7. 你嘅權利', '7. Your rights'],
    p: ['你可以拒绝勾选同意；不同意时仍可使用航班信息、时间计算和导航，只是不能登录会员。你可以随时退出登录、拒绝设备方向、定位和麦克风权限，或要求我们删除与你相关的数据。如有疑问请联系项目团队。',
      '你可以唔剔同意；唔同意都照樣用到航班資料、時間計算同導航，只係登入唔到會員。你可以隨時登出、拒絕裝置方向、定位同咪高風權限，或者要求我哋刪除同你有關嘅資料。有疑問請聯絡項目團隊。',
      'You may decline; without consent you can still use flight info, time calculation and navigation, but cannot log in. You can log out, deny orientation, location and microphone permissions, or ask us to delete your data at any time. Contact the project team with questions.'],
  },
];

/** 登录前的隐私条款勾选框；未勾选时登录按钮不可用 */
export const PrivacyConsent = ({ agree, setAgree }: { agree: boolean; setAgree: (v: boolean) => void }) => {
  useLang();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
        {L('登录后，我们会使用你的会员信息、航班和行程来计算时间、推荐活动和累积里数，部分问题会发送给 AI 服务回答。',
           '登入之後，我哋會用你嘅會員資料、航班同行程嚟計時間、推介活動同儲里數，部分問題會傳送畀 AI 服務回答。',
           'After you log in, we use your membership, flights and plan to work out times, suggest activities and earn miles; some questions are sent to an AI service.')}
      </div>
      {open && (
        <div style={{ maxHeight: 220, overflowY: 'auto', background: C.bg, borderRadius: 10, padding: '10px 12px', fontSize: 12, lineHeight: 1.6, color: C.ink }}>
          {SECTIONS.map((s) => (
            <div key={s.h[0]} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{L(...s.h)}</div>
              <div>{L(...s.p)}</div>
            </div>
          ))}
        </div>
      )}
      <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5, cursor: 'pointer' }}>
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: C.jade, flexShrink: 0 }} />
        <span>
          {L('我已阅读并同意', '我已經讀咗並同意', 'I have read and agree to the')}{' '}
          <button type="button" onClick={(e) => { e.preventDefault(); setOpen(!open); }} style={{ border: 'none', background: 'none', padding: 0, color: C.jade, fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
            {L('《隐私条款》', '《私隱條款》', 'Privacy Policy')}
          </button>
        </span>
      </label>
    </div>
  );
};
