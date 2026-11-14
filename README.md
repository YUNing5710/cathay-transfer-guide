# WingWeave · 国泰个性化转机指引

Cathay Hackathon 2026。帮助在香港国际机场（HKG）转机的旅客，算出**真正可以自由支配的时间**，并安排餐饮、贵宾室、打卡点和导航，确保准时登机。

## 演示版与正式版
| | 位置 | 数据 |
|---|---|---|
| 演示 Demo | `../网页上线版/index.html`（双击打开） | 演示数据，不需要后端 |
| 正式版代码 | 本文件夹（前端 `src/` + 后端 `backend/`） | 接入 OAG 实时航班数据 |

## 技术架构
```
浏览器（React + Vite）  ──/api──▶  backend（Node.js + Express）  ──▶  OAG API
                                    API Key 只存在后端 .env
```
- API Key 不会出现在前端代码里，`.env` 已被 `.gitignore` 排除
- 后端或接口失败时，前端会自动切回演示数据，控制台按钮照常可用

## 接入的数据
| 来源 | 用途 |
|---|---|
| OAG Flight Info API | 到港、离港航班的实时状态：预计时间、延误、航站楼、登机口、值机柜台、行李转盘 |
| OAG Connections API | 衔接航班资料：转机时间、MCT 状态、同一航司衔接 / 跨航司联运 / 分开购票 |
| 城市对照表 `src/trip/cities.ts` | 机场代码 → 中文城市名（代替 Master Data API，不消耗额度） |

**仍为模拟数据**：安检排队、贵宾室满员、餐厅出餐时间（需机场和商户数据）、行李直挂（需订座系统）、会员与里数（需国泰会员接口）。

## 地图说明
地图为**示意布局**。登机口按 HKIA 真实分区自动定位（`src/trip/data.ts` 的 `gateInfo()`）：
- 1–12：T1 主楼东侧
- 13–21：卫星客运廊（经天际走廊）
- 23–36：中央大堂；40–50：西南廊；60–71：西北廊
- 201–230：中场客运廊（搭捷运）；5xx：远机位（坐摆渡车）

OAG 返回的实时登机口会自动更新导航目标和步行时间。正式上线将接入 HKIA 室内地图服务，换成精确坐标。

## 运行
需要 Node.js 18 以上。

**1. 后端**
```bash
cd backend
cp .env.example .env     # 填入 OAG 各 API 的 Subscription Key
npm install
npm start                # http://localhost:8787/api/health
```

**2. 前端**（另开一个终端）
```bash
npm install
npm run dev              # 打开 http://localhost:5173
```

## 后端接口
| 接口 | 说明 |
|---|---|
| `GET /api/hkg-transfer?in=CX959&out=CX715&date=YYYY-MM-DD` | 香港转机：两段航班实时状态 + 可用转机分钟数（前端每 3 分钟查询一次） |
| `GET /api/flight?no=CX715&date=YYYY-MM-DD` | 单个航班实时状态 |
| `GET /api/board?type=arr\|dep&date=YYYY-MM-DD` | 国泰在香港的到港 / 离港航班 |
| `GET /api/transfer?from=HGH&to=SIN&date=YYYY-MM-DD` | 衔接航班（Connections API），结果会缓存 |
| `GET /api/health` | 检查各 API 是否已配置 |

## 额度
OAG 免费版：Flight Info、Connections 每月各 1,000 次。前端只在页面可见时轮询，每次查询消耗 2 次 Flight Info；Connections 的结果会缓存。

## 目录
```
├── backend/          后端：server.js、.env.example
├── src/
│   ├── App.tsx
│   └── trip/
│       ├── data.ts       地图、登机口分区、店铺、演示航班
│       ├── live.ts       实时航班轮询
│       ├── store.ts      状态与可支配时间计算
│       ├── cities.ts     城市对照表
│       └── ...           页面组件
├── index.html
└── package.json
```
