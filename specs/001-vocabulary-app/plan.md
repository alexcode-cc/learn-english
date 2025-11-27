# Implementation Plan: 背單字軟體

**Branch**: `001-vocabulary-app` | **Date**: 2025-01-27 | **Spec**: `specs/001-vocabulary-app/spec.md`
**Input**: Feature specification from `/specs/001-vocabulary-app/spec.md`

## Summary

Build a modern, PWA-capable Vue 3 + TypeScript application managed by Vite that delivers a beautiful flashcard experience, supports CSV-driven vocabulary ingestion, auto-enriches each word with bilingual definitions and pronunciation pulled from online dictionary APIs, and stores all learning data inside IndexedDB for offline continuity. Vuetify establishes a cohesive visual language, Pinia manages application state with IndexedDB persistence, and service modules orchestrate study sessions, review scheduling, and progress tracking. ESLint + Prettier enforce code quality standards, while Vitest + Playwright enforce the constitution's testing rigor.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x + Vue 3.4 (Composition API + `<script setup>`)  
**Primary Dependencies**: Vite 5, Vuetify 3, Pinia (狀態管理), Vue Router, `@mdi/font`, `papaparse` (CSV), `idb` (IndexedDB helper), `vite-plugin-pwa`, `axios` for dictionary lookups, Web Speech / dictionary audio endpoints  
**Code Quality**: ESLint (Vue 3 + TypeScript rules) + Prettier (自動格式化), 整合到 Vite 開發流程和 Git hooks  
**Storage**: IndexedDB via `idb`, 透過 Pinia stores 管理狀態並提供背景同步；localStorage 僅用於輕量級功能標記  
**Testing**: Vitest + Vue Test Utils + Testing Library for unit/component tests; Playwright for E2E/PWA/CSV import smoke flows; Mock Service Worker for dictionary API stubs  
**Target Platform**: Modern Chromium, Firefox, Safari, Edge (latest 2 versions) with installable PWA on desktop + mobile; offline-first expectations  
**Project Type**: Single-page web application (frontend only) with service worker + IndexedDB persistence  
**Performance Goals**: Initial content within 3s on cold load, 30s max for 100-word CSV enrichment, <300 ms card flip animation, search/filter responses <1 s for 10k words  
**Constraints**: Offline-capable core flows, responsive across 320–2560 px, memory budget ≤100 MB per session, dictionary lookups must gracefully degrade on network failure  
**Scale/Scope**: Single-user datasets up to 10k words, 5 quiz templates, dual-language definitions per word, concurrent CSV import jobs limited to one active job

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle (from `speckit.constitution`) | Plan Alignment | Status |
| --- | --- | --- |
| 程式碼品質：可讀性、模組化、錯誤處理 | ESLint (Vue 3 + TypeScript 規則) + Prettier (自動格式化) 強制執行，嚴格 TypeScript 模式，元件抽象化 (`WordCard`, `ImportWizard`, `ReviewBoard`)，repository/services 層級使用型別化錯誤和結構化日誌，Git hooks 確保提交前通過檢查 | ✅ |
| 測試標準（Vitest/Playwright、≥80% coverage） | Vitest suites per store/service, CSV parser + dictionary fetch mocked, Playwright covers onboarding, CSV import, study, quiz, and progress dashboards; CI gate fails if coverage <80% | ✅ |
| 使用者體驗一致性（Vuetify + design tokens） | Vuetify theme + typography scale, shared animation tokens, responsive grid, skeleton states, localization-ready copy, WCAG 2.1 AA focus styles | ✅ |
| 效能要求（p95, LCP, FCP） | Vite code-splitting, IndexedDB caching, background worker for dictionary enrichment, streaming CSV parsing, request batching, perf budgets tracked via Lighthouse in CI | ✅ |
| 品質閘門（提交前檢查 +審查） | Git hooks 執行 ESLint + Prettier + 測試，PR 模板包含憲章檢查清單，提交前自動格式化程式碼，CI 流程驗證程式碼品質和測試覆蓋率 | ✅ |

## Project Structure

### Documentation (this feature)

```text
specs/001-vocabulary-app/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── word-service.md
└── tasks.md              # generated later by /speckit.tasks
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── index.html
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── .prettierignore
├── public/
│   ├── icons/
│   └── manifest.webmanifest
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── cards/
│   │   ├── import/
│   │   ├── review/
│   │   └── progress/
│   ├── composables/
│   ├── pages/
│   │   ├── DashboardPage.vue
│   │   ├── ImportPage.vue
│   │   ├── StudyPage.vue
│   │   └── ReviewPage.vue
│   ├── router/
│   ├── services/
│   │   ├── csv-service.ts
│   │   ├── dictionary-service.ts
│   │   ├── word-repository.ts
│   │   ├── audio-service.ts
│   │   └── review-engine.ts
│   ├── stores/
│   │   ├── useWordsStore.ts
│   │   ├── useImportStore.ts
│   │   └── useProgressStore.ts
│   ├── workers/
│   │   └── definition-worker.ts
│   ├── styles/
│   └── main.ts
└── tests/
    ├── unit/
    ├── component/
    └── e2e/ (Playwright)
```

**Structure Decision**: Single Vite-managed SPA located under `app/`, emphasizing feature directories (pages/components) plus service modules and Pinia stores for separation of concerns. Tests live beside Vite project with dedicated `tests/` folders aligned to Vitest and Playwright requirements.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _None_ | — | — |
