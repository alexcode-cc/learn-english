# Learn English - 背單字軟體 文檔

## 目錄

- [架構概述](#架構概述)
- [開發指南](#開發指南)
- [API 文檔](#api-文檔)
- [組件文檔](#組件文檔)
- [測試指南](#測試指南)
- [部署指南](#部署指南)

## 架構概述

### 技術棧

- **前端框架**: Vue 3.4 (Composition API + `<script setup>`)
- **構建工具**: Vite 5
- **UI 框架**: Vuetify 3
- **狀態管理**: Pinia
- **路由**: Vue Router 4
- **國際化**: Vue I18n 9
- **數據存儲**: IndexedDB (via idb)
- **測試**: Vitest + Playwright
- **PWA**: vite-plugin-pwa

### 項目結構

```
app/
├── public/              # 靜態資源
│   ├── icons/          # PWA 圖標
│   ├── manifest.webmanifest
│   └── logo.svg
├── src/
│   ├── components/     # Vue 組件
│   │   ├── cards/      # 單字卡片相關組件
│   │   ├── common/     # 通用組件（ErrorBoundary, LoadingSkeleton）
│   │   ├── import/     # 匯入相關組件
│   │   ├── layout/     # 布局組件
│   │   ├── progress/   # 進度相關組件
│   │   └── review/     # 複習測驗組件
│   ├── composables/    # Composition API 組合式函數
│   ├── config/        # 配置文件
│   ├── i18n/          # 國際化配置
│   ├── pages/         # 頁面組件
│   ├── router/        # 路由配置
│   ├── services/      # 業務邏輯服務
│   ├── stores/        # Pinia stores
│   ├── styles/        # 樣式文件
│   ├── types/         # TypeScript 類型定義
│   ├── utils/         # 工具函數
│   └── workers/       # Web Workers
├── tests/             # 測試文件
│   ├── unit/          # 單元測試
│   ├── component/     # 組件測試
│   ├── integration/   # 集成測試
│   └── e2e/           # E2E 測試
└── docs/              # 文檔
```

## 開發指南

### 環境要求

- Node.js 20 LTS
- npm 10+ 或 pnpm 9+

### 安裝依賴

```bash
npm install
# 或
pnpm install
```

### 開發服務器

```bash
npm run dev
```

開發服務器會在 `http://localhost:5173` 啟動（或根據配置的 host/port）。

### 構建

```bash
npm run build
```

構建產物會輸出到 `dist/` 目錄。

### 預覽生產構建

```bash
npm run preview
```

## API 文檔

### 服務層

#### WordRepository

管理單字的 IndexedDB 操作。

- `getAll()`: 獲取所有單字
- `getById(id)`: 根據 ID 獲取單字
- `create(word)`: 創建新單字
- `update(id, word)`: 更新單字
- `delete(id)`: 刪除單字
- `getPaginated(offset, limit)`: 分頁獲取單字

#### DictionaryService

從 Free Dictionary API 獲取單字定義。

- `lookup(word)`: 查詢單字定義
- `enrichWord(word)`: 補足單字資訊

#### CSVService

處理 CSV 檔案匯入。

- `parseCSV(file)`: 解析 CSV 檔案
- `validateCSV(data)`: 驗證 CSV 數據

### Stores

#### useWordsStore

管理單字狀態。

- `words`: 單字列表
- `loading`: 載入狀態
- `loadWords()`: 載入單字
- `markAsMastered(id)`: 標記為已學會
- `markAsNeedsReview(id)`: 標記為需要複習

## 組件文檔

### WordCard

單字卡片組件，支持翻轉顯示詳細資訊。

**Props:**
- `word: Word` - 單字對象

**Events:**
- `flip` - 卡片翻轉時觸發

### ErrorBoundary

錯誤邊界組件，捕獲並優雅處理錯誤。

**Props:**
- `fallback?: string` - 錯誤提示訊息
- `onError?: (error, instance, info) => void` - 錯誤處理回調

### LoadingSkeleton

載入骨架屏組件。

**Props:**
- `variant?: 'card' | 'list' | 'table' | 'text' | 'default'` - 骨架屏類型
- `lines?: number` - 行數（text 變體）
- `animated?: boolean` - 是否顯示動畫

## 測試指南

### 運行測試

```bash
# 所有測試
npm test

# 單元測試
npm run test:unit

# 組件測試
npm run test:component

# E2E 測試
npm run test:e2e
```

### 測試覆蓋率

目標覆蓋率：≥80%

```bash
npm run test:unit -- --coverage
```

## 部署指南

### 構建生產版本

```bash
npm run build
```

### PWA 配置

應用已配置為 PWA，支持：
- 離線使用
- 安裝到主畫面
- Service Worker 緩存

### 環境變量

創建 `.env` 文件：

```env
VITE_DICTIONARY_BASE_URL=https://api.dictionaryapi.dev/api/v2/entries/en
VITE_HOST=localhost
VITE_E2E_TEST=false
```

## 性能優化

### 已實施的優化

1. **代碼分割**: 路由級別和組件級別的懶加載
2. **資源緩存**: Service Worker 緩存策略
3. **圖片優化**: 懶加載和適當的格式
4. **構建優化**: Terser 壓縮、tree-shaking

### 性能指標

- FCP (First Contentful Paint): < 1.5s
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms

## 無障礙支持

應用遵循 WCAG 2.1 AA 標準：

- ARIA 標籤和角色
- 鍵盤導航支持
- 焦點管理
- 觸控目標大小 ≥ 44x44px

## 國際化

目前支持：
- 繁體中文 (zh-TW)

未來可擴展支持其他語言。

## 許可證

[根據項目許可證]

