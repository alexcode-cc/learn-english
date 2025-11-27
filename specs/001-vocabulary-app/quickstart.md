# Quickstart: 背單字軟體

## 1. 系統需求
- Node.js 20 LTS
- pnpm 9.x（推薦）或 npm 10+/yarn 4+
- 現代瀏覽器（Chrome/Edge 120+, Firefox 120+, Safari 17+）

## 2. 安裝
```bash
pnpm install
```

## 3. 開發伺服器
```bash
pnpm dev
```
- 預設埠：`http://localhost:5173`
- Dev server 已啟用 HTTPS 以支援 PWA/Service Worker

## 4. 重要腳本
| 指令 | 作用 |
| --- | --- |
| `pnpm lint` | ESLint + Prettier 檢查 |
| `pnpm test:unit` | Vitest + Vue Test Utils |
| `pnpm test:component` | Vitest 元件快照 |
| `pnpm test:e2e` | Playwright（headless，多瀏覽器矩陣） |
| `pnpm build` | Vite PWA 生產建置 |
| `pnpm preview` | 檢視生產版並驗證離線能力 |

## 5. CSV 匯入流程（本機驗證）
1. 建立 `sample.csv`，第一欄標題為 `word`，列出單字。
2. 啟動開發伺服器並在 UI 進入「匯入」頁。
3. 上傳 CSV，確認進度指示器運作且自動補足資訊。
4. 斷線（關閉 Wi-Fi）後再次打開應用程式，確認已匯入的單字仍在（IndexedDB）。

## 6. 字典 API 模擬
- 啟動 Mock Service Worker：開發環境自動註冊。
- 需測試實際 API 時，設定 `.env`：`VITE_DICTIONARY_BASE_URL=https://api.dictionaryapi.dev`
- 失敗案例：`pnpm test:e2e --grep "@dictionary-failure"` 會模擬 API 超時。

## 7. 測試策略
- **Unit**：Pinia stores、CSV parser、dictionary service。
- **Component**：`WordCard`, `ImportWizard`, `ReviewBoard`。
- **E2E**：`tests/e2e/import.spec.ts`, `study.spec.ts`, `pwa.spec.ts`。
- **性能**：`pnpm test:perf`（Lighthouse CI）驗證 LCP/FCP、PWA 安裝、離線。

## 8. IndexedDB 偵錯
- 使用瀏覽器 DevTools → Application → IndexedDB → `learn-english-db`.
- `word` store：檢視 enrichment 結果。
- `importJobs` store：追蹤 CSV 任務狀態。

## 9. PWA 驗證
1. `pnpm build && pnpm preview`.
2. 開啟 `chrome://inspect/#service-workers` 確認 SW 已註冊。
3. 在 Network 介面勾選「Offline」，重新整理並確認 UI 依舊可瀏覽與學習既有單字。

## 10. 發布前檢查
1. `pnpm lint && pnpm test:unit && pnpm test:e2e`.
2. `pnpm build`.
3. `pnpm preview` 並跑 Lighthouse（≥90 Performance, ≥95 Accessibility）。
4. 上傳新的 CSV smoke 測試檔並確認自動補足流程。

