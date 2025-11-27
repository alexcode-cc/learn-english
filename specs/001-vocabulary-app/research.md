# Research: 背單字軟體

All outstanding questions from the specification and constitution gates have been resolved through the investigations below.

## 1. Build tooling & UI stack
- **Decision**: Use Vite 5 + Vue 3.4 + Vuetify 3 with Composition API and `<script setup>` patterns.
- **Rationale**: Provides fast HMR, tree-shaking, official Vuetify support, and a proven design system that satisfies the UX consistency principle (color, spacing, typography tokens). Composition API simplifies reuse between study/review flows.
- **Alternatives considered**: Nuxt 3 (adds routing/server overhead not required for SPA), Quasar (excellent UI kit but Vuetify has richer enterprise theming + MDI alignment), Create-React-App (slower builds, would fight constitution’s TypeScript strictness defaults).

## 2. Iconography
- **Decision**: Use Material Design Icons (MDI) via `@mdi/font` together with Vuetify’s `<v-icon>` integration.
- **Rationale**: Native support, consistent stroke weight, large coverage for education-themed icons, and zero custom SVG pipeline required.
- **Alternatives considered**: Heroicons (inconsistent with Vuetify styling), Font Awesome (additional licensing steps), custom SVG set (high maintenance).

## 3. CSV import pipeline
- **Decision**: Use `papaparse` streaming mode executed inside a Web Worker to parse user-provided CSV files.
- **Rationale**: Handles large (1k+) word lists without freezing UI, reports progress, supports encoding detection, and easily integrates with Pinia stores.
- **Alternatives considered**: Native `FileReader` + manual parsing (error-prone, less feature rich), `csv-parse` (Node-first, lacks browser streaming support).

## 4. Dictionary & pronunciation enrichment
- **Decision**: Primary lookup via [Free Dictionary API](https://dictionaryapi.dev/) for bilingual definitions and phonetics, with fallback to Glosbe API. Pronunciation audio pulled from `https://api.dictionaryapi.dev/media/pronunciations/...` and cached inside IndexedDB.
- **Rationale**: Both APIs are public, support HTTPS, and allow multi-language responses needed for Chinese + English definitions. Audio URLs can be cached for offline playback.
- **Alternatives considered**: Oxford Dictionary API (paid), Cambridge (scraping violates ToS), Web Speech API TTS (good fallback but lacks lexical metadata).

## 5. Storage strategy
- **Decision**: Store all vocabulary entities inside IndexedDB using the `idb` helper, with repositories per entity (words, tags, sessions, quizzes, import jobs).
- **Rationale**: Meets offline requirement, supports >10k records, transactional updates, and integrates with service workers for background sync.
- **Alternatives considered**: localStorage (size/structure limits), WebSQL (deprecated), remote backend (unnecessary complexity for single-user app).

## 6. Background processing
- **Decision**: Offload dictionary enrichment + audio caching to a dedicated Web Worker (`definition-worker.ts`) triggered by the import store.
- **Rationale**: Keeps UI responsive during potentially long-running enrichment tasks, enables concurrency control, and simplifies retry logic.
- **Alternatives considered**: Main-thread async loops (risk of jank), Service Worker only (less direct access to UI state/pinia).

## 7. Offline & PWA baseline
- **Decision**: Use `vite-plugin-pwa` with `workbox` strategies (`StaleWhileRevalidate` for APIs, `CacheFirst` for audio), precache UI shell, and add background sync for deferred dictionary lookups.
- **Rationale**: Provides installability, offline shell, and consistent caching policies required by constitution’s performance gate.
- **Alternatives considered**: Manual service worker (more boilerplate), Workbox CLI (less integrated with Vite pipeline).

## 8. Testing approach
- **Decision**: Vitest + Vue Test Utils for component/service tests, Testing Library for accessibility assertions, Playwright for E2E (CSV import, study, review, PWA install prompts), plus Lighthouse CI for performance budgets.
- **Rationale**: Aligns with constitution’s ≥80% coverage, ensures UX gates (focus management, responsive layout), and validates offline scenarios.
- **Alternatives considered**: Jest (slower, duplicate tooling), Cypress (great but heavier for PWA/offline, Playwright handles multi-browser matrix better).

## 9. Accessibility & internationalization
- **Decision**: Adopt Vuetify's i18n bridge with community Chinese pack, maintain copy in localization JSON, enforce accessible keyboard shortcuts and focus indicators per constitution.
- **Rationale**: Ensures Traditional Chinese UI readiness, satisfies WCAG AA guidelines when paired with Testing Library assertions.
- **Alternatives considered**: Custom i18n solution (reinventing), leaving untranslated copy (would violate UX principle).

## 10. Code quality tooling
- **Decision**: Use ESLint with Vue 3 + TypeScript rules (`@typescript-eslint/eslint-plugin`, `eslint-plugin-vue`) and Prettier for automatic code formatting, integrated into Vite dev workflow and Git hooks (pre-commit).
- **Rationale**: Enforces code quality standards from constitution (readability, consistency, maintainability), prevents style drift, and ensures all commits meet quality gates before review. TypeScript strict mode + ESLint catches common errors early.
- **Alternatives considered**: StandardJS (less flexible for Vue/TypeScript), Biome (newer but less ecosystem support), manual formatting (inconsistent, violates constitution's automation principle).

No further clarifications remain; all constraints from `speckit.constitution` are backed by concrete tooling or processes described above.

