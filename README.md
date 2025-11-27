# Learn English - 背單字軟體

[![Spec-Kit](https://img.shields.io/badge/Spec--Kit-Spec--Driven%20Development-blue)](https://github.com/github/spec-kit)
[![Vue 3](https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

本專案是使用 [GitHub Spec-Kit](https://github.com/github/spec-kit) 規格驅動開發（Spec-Driven Development）工具套件，搭配 Cursor AI 從頭開始開發的英語單字學習應用程式。

## 📋 目錄

- [專案概述](#專案概述)
- [Spec-Kit 簡介](#spec-kit-簡介)
- [開發流程](#開發流程)
- [專案結構](#專案結構)
- [規格文件說明](#規格文件說明)
- [Spec-Kit 指令](#spec-kit-指令)
- [開發指南](#開發指南)
- [技術架構](#技術架構)

## 專案概述

「背單字軟體」是一個現代化的 PWA 應用程式，提供：

- 🎴 **單字卡片學習**：翻轉卡片查看詳細資訊、標記學習狀態
- 📥 **CSV 匯入**：批量匯入單字並自動從網路補足定義與發音
- 📚 **個人單字庫管理**：新增、編輯、刪除單字，支援標籤與筆記
- 📝 **複習與測驗**：基於遺忘曲線的複習提醒，多種測驗模式
- 📊 **學習進度追蹤**：視覺化統計圖表與學習熱力圖

## Spec-Kit 簡介

[Spec-Kit](https://github.com/github/spec-kit) 是 GitHub 開發的規格驅動開發（Spec-Driven Development）工具套件，旨在幫助開發者透過結構化的規格文件與 AI 代理協作，系統性地規劃與實作軟體專案。

### 核心理念

Spec-Kit 的核心理念是「先規格、後實作」：

1. **規格優先**：在撰寫任何程式碼之前，先定義清楚的功能規格
2. **AI 協作**：透過結構化的指令與 AI 代理（如 Cursor AI）協作
3. **品質閘門**：透過憲章（Constitution）確保程式碼品質標準
4. **增量交付**：按使用者故事獨立實作與測試

### 專案憲章（Constitution）

本專案的憲章定義於 `speckit.constitution`，包含以下核心原則：

| 原則 | 說明 |
|------|------|
| **程式碼品質** | 函數 ≤50 行、類別 ≤300 行、圈複雜度 ≤10 |
| **測試標準** | TDD 流程、覆蓋率 ≥80%、AAA 模式 |
| **UX 一致性** | WCAG 2.1 AA、響應式設計、i18n 支援 |
| **效能要求** | FCP ≤1.5s、LCP ≤2.5s、FID ≤100ms |
| **Git 規範** | AngularJS Commit Convention（繁體中文） |

## 開發流程

本專案遵循 Spec-Kit 的標準開發流程：

```
┌─────────────────┐
│  /speckit.specify  │ ─────► 功能規格 (spec.md)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /speckit.plan     │ ─────► 實作計劃 (plan.md, research.md, data-model.md)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /speckit.tasks    │ ─────► 任務分解 (tasks.md)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /speckit.implement│ ─────► 程式碼實作
└─────────────────┘
```

### 步驟 1：建立功能規格 (`/speckit.specify`)

從自然語言描述生成結構化的功能規格：

```
/speckit.specify 設計一個背單字軟體,畫面要美觀大方且富有現代感...
```

產出：
- `specs/001-vocabulary-app/spec.md` - 使用者故事、驗收標準、功能需求

### 步驟 2：建立實作計劃 (`/speckit.plan`)

根據規格生成技術計劃與設計文件：

```
/speckit.plan 使用 Vue 3 + TypeScript + Vuetify 3 建置...
```

產出：
- `plan.md` - 技術架構、專案結構
- `research.md` - 技術決策與研究
- `data-model.md` - 資料模型定義
- `quickstart.md` - 快速開始指南

### 步驟 3：生成任務分解 (`/speckit.tasks`)

將計劃分解為可執行的任務清單：

```
/speckit.tasks
```

產出：
- `tasks.md` - 按使用者故事組織的任務清單，包含 120 個任務

### 步驟 4：執行實作 (`/speckit.implement`)

按照任務清單逐步實作：

```
/speckit.implement
```

## 專案結構

```
learn-english/
├── app/                          # 應用程式原始碼
│   ├── src/
│   │   ├── components/           # Vue 組件
│   │   ├── composables/          # Composition API 組合式函數
│   │   ├── pages/                # 頁面組件
│   │   ├── services/             # 業務邏輯服務
│   │   ├── stores/               # Pinia stores
│   │   ├── types/                # TypeScript 類型定義
│   │   └── workers/              # Web Workers
│   ├── tests/                    # 測試檔案
│   └── public/                   # 靜態資源
│
├── spec-kit/                     # Spec-Kit 配置與範本
│   ├── commands/                 # Spec-Kit 指令定義
│   ├── rules/                    # 規則定義
│   ├── specify/                  # 憲章與配置
│   ├── templates/                # 文件範本
│   └── vocabulary-app/           # 功能特定文件
│
├── specs/                        # 規格文件
│   └── 001-vocabulary-app/
│       ├── spec.md               # 功能規格
│       ├── plan.md               # 實作計劃
│       ├── tasks.md              # 任務分解
│       ├── research.md           # 技術研究
│       ├── data-model.md         # 資料模型
│       ├── quickstart.md         # 快速開始
│       ├── contracts/            # API 合約
│       └── checklists/           # 檢查清單
│
├── logs/                         # 開發日誌
└── speckit.constitution          # 專案憲章
```

## 規格文件說明

### spec.md - 功能規格

定義 5 個使用者故事及其優先級：

| 優先級 | 使用者故事 | 說明 |
|--------|------------|------|
| P1 | 瀏覽與學習單字卡片 | 核心 MVP 功能 |
| P1 | CSV 匯入單字與自動補足資訊 | 資料輸入方式 |
| P2 | 管理個人單字庫 | 個人化功能 |
| P2 | 複習與測驗功能 | 學習效果驗證 |
| P3 | 學習進度追蹤與統計 | 數據分析 |

每個使用者故事包含：
- 目標描述
- 優先級說明
- 獨立測試標準
- 驗收場景（Given-When-Then）

### plan.md - 實作計劃

定義技術架構與專案結構：

- **技術堆疊**：Vue 3.4 + TypeScript 5.x + Vite 5 + Vuetify 3
- **狀態管理**：Pinia + IndexedDB
- **測試框架**：Vitest + Playwright
- **PWA 支援**：vite-plugin-pwa + Workbox

### tasks.md - 任務分解

120 個任務分為 8 個階段：

| 階段 | 內容 | 任務數 |
|------|------|--------|
| Phase 1 | 專案設定 | 13 |
| Phase 2 | 基礎建設 | 9 |
| Phase 3 | US1 - 單字卡片 | 15 |
| Phase 4 | US2 - CSV 匯入 | 18 |
| Phase 5 | US3 - 單字庫管理 | 17 |
| Phase 6 | US4 - 複習測驗 | 19 |
| Phase 7 | US5 - 進度追蹤 | 11 |
| Phase 8 | 完善與優化 | 18 |

### research.md - 技術研究

記錄所有技術決策及其理由：

- 建置工具與 UI 框架選擇
- 圖標系統
- CSV 解析方案
- 字典 API 整合
- 儲存策略
- 離線與 PWA 支援
- 測試策略

### data-model.md - 資料模型

定義 9 個核心實體：

- **Word**：單字實體
- **WordSet**：單字集合
- **Tag**：標籤
- **Note**：筆記
- **LearningSession**：學習階段
- **Quiz**：測驗
- **QuizQuestion**：測驗題目
- **UserProgress**：使用者進度
- **ImportJob**：匯入任務

## Spec-Kit 指令

本專案使用的 Spec-Kit 指令（中文版本）：

| 指令 | 說明 | 輸出 |
|------|------|------|
| `/speckit.specify` | 從自然語言生成功能規格 | spec.md |
| `/speckit.clarify` | 澄清規格中的不明確之處 | 更新 spec.md |
| `/speckit.plan` | 生成實作計劃與設計文件 | plan.md, research.md, data-model.md |
| `/speckit.tasks` | 將計劃分解為可執行任務 | tasks.md |
| `/speckit.implement` | 按任務清單執行實作 | 程式碼 |
| `/speckit.checklist` | 生成驗證檢查清單 | checklists/*.md |
| `/speckit.analyze` | 分析專案一致性 | 分析報告 |

### 指令配置

指令定義位於 `spec-kit/commands/` 目錄：

```
commands/
├── speckit.specify-cht.md      # 規格生成（繁體中文）
├── speckit.plan-cht.md         # 計劃生成
├── speckit.tasks-cht.md        # 任務分解
├── speckit.implement-cht.md    # 實作執行
├── speckit.checklist-cht.md    # 檢查清單
└── speckit.analyze-cht.md      # 一致性分析
```

## 開發指南

### 環境需求

- Node.js 20 LTS
- pnpm 9.x（推薦）或 npm 10+

### 安裝與啟動

```bash
# 進入應用程式目錄
cd app

# 安裝依賴
npm install

# 啟動開發伺服器
npm dev
```

### 測試

```bash
# 單元測試
npm test:unit

# 組件測試
npm test:component

# E2E 測試
npm test:e2e

# 測試覆蓋率
npm test:unit -- --coverage
```

### 建置

```bash
# 生產建置
npm build

# 預覽生產版本
npm preview
```

## 技術架構

### 前端架構

```
┌─────────────────────────────────────────┐
│                 Pages                    │
│  (StudyPage, ImportPage, ReviewPage...)  │
├─────────────────────────────────────────┤
│              Components                  │
│  (WordCard, ImportWizard, QuizBoard...)  │
├─────────────────────────────────────────┤
│              Composables                 │
│  (useCardFlip, useWordSearch...)         │
├─────────────────────────────────────────┤
│           Pinia Stores                   │
│  (useWordsStore, useProgressStore...)    │
├─────────────────────────────────────────┤
│              Services                    │
│  (DictionaryService, CSVService...)      │
├─────────────────────────────────────────┤
│           IndexedDB (idb)                │
│  (words, tags, quizzes, progress...)     │
└─────────────────────────────────────────┘
```

### 離線支援

- **Service Worker**：使用 Workbox 實作離線緩存
- **IndexedDB**：本地資料持久化
- **PWA**：支援安裝到主畫面

### 效能優化

- **代碼分割**：路由級別懶加載
- **Web Worker**：背景處理字典查詢
- **資源緩存**：Service Worker 緩存策略

## 參考資源

- [Spec-Kit GitHub](https://github.com/github/spec-kit) - 官方儲存庫
- [Spec-Driven Development](https://github.com/github/spec-kit#spec-driven-development) - 開發方法論
- [Vue 3 文檔](https://vuejs.org/) - 前端框架
- [Vuetify 3](https://vuetifyjs.com/) - UI 組件庫
- [Free Dictionary API](https://dictionaryapi.dev/) - 字典 API

## 授權

本專案採用 MIT 授權條款。

---

> 💡 **提示**：本專案展示了如何使用 Spec-Kit 工具套件搭配 AI 代理進行規格驅動開發。透過結構化的規格文件與任務分解，可以系統性地規劃與實作軟體專案，確保程式碼品質與一致性。

