# Quickstart: 背單字軟體

## 1. 系統需求
- Node.js 20 LTS
- pnpm 9.x（推薦）或 npm 10+/yarn 4+
- 現代瀏覽器（Chrome/Edge 120+, Firefox 120+, Safari 17+）

## 2. 安裝
```bash
# 使用 npm
npm install

# 或使用 pnpm（推薦）
pnpm install
```

## 3. 開發伺服器
```bash
# 使用 npm
npm run dev

# 或使用 pnpm
pnpm dev
```
- 預設埠：`http://localhost:5173` 或根據配置的 host（如 `https://learn.english.org:5173`）
- Dev server 已啟用 HTTPS 以支援 PWA/Service Worker（如果 SSL 證書存在）

## 4. 重要腳本
| 指令 | 作用 |
| --- | --- |
| `npm run lint` | ESLint + Prettier 檢查 |
| `npm run format` | Prettier 自動格式化 |
| `npm run test:unit` | Vitest + Vue Test Utils |
| `npm run test:component` | Vitest 元件測試 |
| `npm run test:e2e` | Playwright（headless，多瀏覽器矩陣） |
| `npm run test:perf` | Lighthouse CI 性能測試 |
| `npm run build` | Vite PWA 生產建置 |
| `npm run preview` | 檢視生產版並驗證離線能力 |
| `npm run generate:icons` | 從 logo.svg 生成 PWA 圖標 |

## 5. CSV 匯入流程（本機驗證）
1. 建立 `sample.csv`，第一欄標題為 `word`，列出單字。
2. 啟動開發伺服器並在 UI 進入「匯入」頁。
3. 上傳 CSV，確認進度指示器運作且自動補足資訊。
4. 斷線（關閉 Wi-Fi）後再次打開應用程式，確認已匯入的單字仍在（IndexedDB）。

## 6. 字典 API 配置
- 預設使用 Free Dictionary API：`https://api.dictionaryapi.dev/api/v2/entries/en`
- 需自訂 API 時，設定 `.env`：`VITE_DICTIONARY_BASE_URL=https://api.dictionaryapi.dev/api/v2/entries/en`
- API 請求失敗時會自動重試（最多 3 次）
- Service Worker 會緩存 API 響應（7 天）

## 7. 測試策略
- **Unit**：Pinia stores、CSV parser、dictionary service、各種業務邏輯服務
- **Component**：`WordCard`, `ImportWizard`, `ReviewBoard`, `ErrorBoundary`, `LoadingSkeleton` 等
- **Integration**：CSV 匯入流程、單字管理流程、複習測驗流程
- **E2E**：`tests/e2e/csv-import.spec.ts`, `word-card.spec.ts`, `word-management.spec.ts`, `quiz.spec.ts`, `progress-dashboard.spec.ts`
- **性能**：`npm run test:perf`（Lighthouse CI）驗證 LCP/FCP、PWA 安裝、離線能力
- **目標覆蓋率**：≥80%

## 8. IndexedDB 偵錯
- 使用瀏覽器 DevTools → Application → IndexedDB → `learn-english-db`.
- `word` store：檢視 enrichment 結果。
- `importJobs` store：追蹤 CSV 任務狀態。

## 9. PWA 驗證
1. `npm run build && npm run preview`
2. 開啟 Chrome DevTools → Application → Service Workers 確認 SW 已註冊
3. 在 Network 介面勾選「Offline」，重新整理並確認 UI 依舊可瀏覽與學習既有單字
4. 檢查 Application → Manifest 確認所有圖標和配置正確
5. 測試安裝到主畫面功能（Chrome → 更多工具 → 建立捷徑）

## 10. 發布前檢查
1. `npm run lint && npm run format` - 確保代碼格式正確
2. `npm run test:unit && npm run test:component && npm run test:e2e` - 所有測試通過
3. `npm run build` - 構建成功且無錯誤
4. `npm run preview` 並跑 Lighthouse（目標：≥90 Performance, ≥95 Accessibility, ≥90 Best Practices, ≥90 SEO）
5. 上傳新的 CSV smoke 測試檔並確認自動補足流程
6. 驗證 PWA 功能（離線、安裝、Service Worker）
7. 檢查所有頁面的響應式設計（移動端、平板、桌面）
8. 驗證無障礙功能（鍵盤導航、ARIA 標籤、螢幕閱讀器）

## 11. 新增功能
- **i18n 支持**：已配置 vue-i18n，目前支持繁體中文，可擴展其他語言
- **錯誤邊界**：ErrorBoundary 組件自動捕獲並處理錯誤
- **載入骨架屏**：提升感知性能的骨架屏組件
- **性能優化**：代碼分割、懶加載、資源緩存
- **無障礙改進**：ARIA 標籤、鍵盤導航、焦點管理

