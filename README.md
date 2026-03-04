# 運輸管理系統 - 前端

## 專案說明

運輸管理系統前端，使用 Vue 3 + Vite 開發，UI 框架為 Element Plus。

開發日期：2026-03-04

---

## 技術棧

| 套件 | 版本 | 用途 |
|------|------|------|
| Vue 3 | latest | 前端框架 |
| Vite | latest | 建置工具 |
| Vue Router | latest | 前端路由 |
| Pinia | latest | 狀態管理 |
| Element Plus | latest | UI 元件庫 |
| Axios | latest | HTTP 請求 |
| Leaflet | latest | 地圖顯示 |
| ECharts | latest | 圖表 |

---

## 啟動方式

```bash
# 安裝套件
npm install

# 開發模式
npm run dev
# 開啟 http://localhost:5173

# 打包
npm run build
```

---

## 專案結構

```
src/
├── api/                     # API 封裝
│   ├── http.js              # Axios 實例
│   │                        # - baseURL 設定
│   │                        # - 請求攔截器（自動帶入 JWT Token）
│   │                        # - 回應攔截器（401 自動跳登入頁）
│   ├── authApi.js           # 登入 API
│   ├── orderApi.js          # 訂單 CRUD API
│   ├── vehicleApi.js        # 車輛 CRUD API
│   ├── driverApi.js         # 司機 CRUD API
│   └── customerApi.js       # 客戶 CRUD API
│
├── stores/
│   └── auth.js              # Pinia 登入狀態
│                            # - token / userInfo 存入 localStorage
│                            # - login() / logout()
│
├── router/
│   └── index.js             # 路由設定
│                            # - 路由守衛：未登入自動跳 /login
│                            # - 已登入訪問 /login 自動跳 /dashboard
│
├── views/                   # 頁面
│   ├── LoginView.vue        # 登入頁
│   ├── DashboardView.vue    # 儀表板
│   ├── OrderView.vue        # 訂單管理
│   ├── VehicleView.vue      # 車輛管理
│   ├── DriverView.vue       # 司機管理
│   ├── CustomerView.vue     # 客戶管理
│   ├── RouteView.vue        # 路線規劃
│   ├── TrackingView.vue     # 即時追蹤
│   └── ReportView.vue       # 報表統計
│
├── assets/
│   └── main.css             # 全域樣式
│
├── App.vue                  # 主版型
│                            # - 側邊導覽列
│                            # - Header（顯示名稱 + 登出）
│                            # - router-view 內容區
└── main.js                  # 進入點
                             # - 註冊 Element Plus
                             # - 註冊所有 Element Plus Icons
```

---

## 頁面說明

### LoginView.vue
- 帳號密碼表單
- 登入成功後 Token 存入 localStorage
- 跳轉至儀表板

### DashboardView.vue
- 統計卡片（今日訂單、運送中、今日完成、可用車輛）
- 本週訂單趨勢長條圖
- 車輛狀態進度條（可用 / 運送中 / 維修中）
- 最新訂單列表

### OrderView.vue
- 關鍵字搜尋（訂單編號 / 客戶名稱）
- 狀態篩選（待派車 / 運送中 / 已完成 / 已取消）
- 分頁（預設 10 筆/頁）
- 新增訂單（訂單編號格式：ORD-YYYYMMDD-XXX）
- 編輯、刪除（含確認 Dialog）

### VehicleView.vue
- 搜尋（車牌 / 廠牌）
- 狀態篩選
- 新增、編輯、刪除
- 送修 / 完修快速切換按鈕

### DriverView.vue
- 搜尋（姓名 / 身分證 / 電話）
- 狀態篩選（在職 / 休假 / 離職）
- 身分證格式驗證：`/^[A-Z][0-9]{9}$/`
- 離職時額外顯示離職日期欄位（動態表單驗證）

### CustomerView.vue
- 搜尋（名稱 / 統編 / 聯絡人）
- 等級篩選（VIP / 一般 / 停用）
- 統一編號驗證：`/^\d{8}$/`
- Email 格式驗證

### RouteView.vue
- 左側路線列表
- 右側 Leaflet 地圖
- 點選路線：地圖顯示路徑與停靠點 Marker
- 新增路線可動態增減停靠點

### TrackingView.vue
- 左側運送中訂單列表（含進度條）
- 右側 Leaflet 地圖
- 點選訂單：地圖聚焦車輛位置
- 開始追蹤：每 3 秒模擬位置更新（實際串接時改為 GPS API 或 SignalR）

### ReportView.vue
- 日期範圍篩選
- 訂單趨勢折線圖（ECharts）
- 訂單狀態環形圓餅圖（ECharts）
- 司機績效橫條排行圖（ECharts）
- 車輛使用率儀表圖（ECharts）

---

## 路由結構

| 路徑 | 元件 | 說明 | 需要登入 |
|------|------|------|---------|
| /login | LoginView | 登入頁 | 否 |
| / | 導向 /dashboard | | |
| /dashboard | DashboardView | 儀表板 | 是 |
| /orders | OrderView | 訂單管理 | 是 |
| /vehicles | VehicleView | 車輛管理 | 是 |
| /drivers | DriverView | 司機管理 | 是 |
| /customers | CustomerView | 客戶管理 | 是 |
| /routes | RouteView | 路線規劃 | 是 |
| /tracking | TrackingView | 即時追蹤 | 是 |
| /reports | ReportView | 報表統計 | 是 |

---

## API 串接設定

**`src/api/http.js`**

```javascript
// 後端 API 位址，依環境修改
baseURL: 'http://localhost:5107/api'
```

Token 存放位置：`localStorage.getItem('token')`

每次請求自動帶入 Header：
```
Authorization: Bearer <token>
```

---

## 注意事項

- 目前各模組資料為**模擬資料**，尚未串接後端 API
- 已完成登入驗證串接（`/api/auth/login`）
- 即時追蹤目前為模擬位置移動，正式環境需串接 GPS 裝置或 SignalR
- Leaflet 地圖使用 OpenStreetMap 免費圖層，無需 API Key

---

## 待完成項目

- [ ] 訂單管理串接後端 API
- [ ] 車輛管理串接後端 API
- [ ] 司機管理串接後端 API
- [ ] 客戶管理串接後端 API
- [ ] 儀表板數據改為 API 即時取得
- [ ] 報表統計改為 API 動態資料
- [ ] 即時追蹤串接 GPS / SignalR
- [ ] 路線規劃整合 Google Maps API
- [ ] 角色權限控制（Admin / Operator）
