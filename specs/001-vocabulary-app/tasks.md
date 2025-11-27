# Tasks: 背單字軟體

**Input**: Design documents from `/specs/001-vocabulary-app/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included per constitution requirements (≥80% coverage, TDD approach)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `app/src/`, `app/tests/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan in app/
- [x] T002 Initialize Vite project with Vue 3 + TypeScript template in app/
- [x] T003 [P] Configure ESLint with Vue 3 + TypeScript rules in app/.eslintrc.cjs
- [x] T004 [P] Configure Prettier for code formatting in app/.prettierrc
- [ ] T005 [P] Setup Git hooks for pre-commit linting and formatting
- [x] T006 Install and configure Vuetify 3 in app/src/main.ts
- [x] T007 Install and configure Pinia store in app/src/main.ts
- [x] T008 Install and configure Vue Router in app/src/router/
- [x] T009 [P] Install @mdi/font and configure icon system
- [x] T010 [P] Install and configure vite-plugin-pwa in app/vite.config.ts
- [x] T011 [P] Setup Vitest configuration in app/vitest.config.ts
- [x] T012 [P] Setup Playwright configuration in app/tests/e2e/
- [x] T013 Install dependencies: papaparse, idb, axios

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T014 Setup IndexedDB database schema and initialization in app/src/services/db.ts
- [x] T015 [P] Create Word repository with IndexedDB operations in app/src/services/word-repository.ts
- [x] T016 [P] Create base Pinia store structure in app/src/stores/index.ts
- [x] T017 [P] Create error handling infrastructure in app/src/utils/error-handler.ts
- [x] T018 [P] Create logging utility with structured format in app/src/utils/logger.ts
- [x] T019 Setup environment configuration management in app/src/config/
- [x] T020 Create base Vuetify theme configuration in app/src/styles/theme.ts
- [x] T021 Create responsive layout components in app/src/components/layout/
- [x] T022 Setup service worker for PWA offline support in app/public/sw.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 瀏覽與學習單字卡片 (Priority: P1) 🎯 MVP

**Goal**: 使用者可以開啟應用程式，瀏覽單字卡片並進行學習。系統會顯示單字、發音、中文解釋、例句等資訊，使用者可以翻轉卡片查看詳細內容，並標記已學會或需要複習的單字。

**Independent Test**: 使用者開啟應用程式後能夠看到單字卡片，點擊卡片可以翻轉查看詳細資訊，並能夠標記學習狀態。這個功能可以獨立提供價值，即使沒有其他功能也能讓使用者開始背單字。

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T023 [P] [US1] Unit test for WordCard component flip animation in app/tests/component/WordCard.spec.ts
- [ ] T024 [P] [US1] Unit test for word status update functionality in app/tests/unit/word-status.spec.ts
- [ ] T025 [P] [US1] Integration test for word card browsing flow in app/tests/integration/word-browsing.spec.ts
- [ ] T026 [P] [US1] E2E test for card flip and status marking in app/tests/e2e/word-card.spec.ts

### Implementation for User Story 1

- [x] T027 [P] [US1] Create Word entity type definition in app/src/types/word.ts
- [x] T028 [P] [US1] Create WordSet entity type definition in app/src/types/word-set.ts
- [x] T029 [US1] Implement useWordsStore Pinia store in app/src/stores/useWordsStore.ts (depends on T015, T016)
- [x] T030 [US1] Create WordCard component with flip animation in app/src/components/cards/WordCard.vue
- [x] T031 [US1] Create word card list component in app/src/components/cards/WordCardList.vue
- [x] T032 [US1] Implement card flip interaction logic in app/src/composables/useCardFlip.ts
- [x] T033 [US1] Create StudyPage with word card grid in app/src/pages/StudyPage.vue
- [x] T034 [US1] Implement word status update (mastered/needs review) in app/src/services/word-status-service.ts
- [x] T035 [US1] Add routing for StudyPage in app/src/router/index.ts
- [x] T036 [US1] Implement audio playback service for pronunciation in app/src/services/audio-service.ts
- [x] T037 [US1] Add empty state component for no words scenario in app/src/components/cards/EmptyState.vue

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - CSV 匯入單字與自動補足資訊 (Priority: P1)

**Goal**: 使用者可以透過 CSV 檔案匯入單字清單，系統會自動從網路資源搜尋並補足每個單字的詳細資訊。CSV 檔案僅包含單字字彙，系統會自動取得中文解釋、英文解釋和發音等完整資訊。

**Independent Test**: 使用者上傳包含單字字彙的 CSV 檔案後，系統自動解析檔案、搜尋網路資源補足每個單字的資訊（中文解釋、英文解釋、發音），並顯示匯入進度和結果。這個功能可以獨立運作，不依賴其他功能。

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T038 [P] [US2] Unit test for CSV parsing service in app/tests/unit/csv-service.spec.ts
- [ ] T039 [P] [US2] Unit test for dictionary enrichment service in app/tests/unit/dictionary-service.spec.ts
- [ ] T040 [P] [US2] Integration test for CSV import flow in app/tests/integration/csv-import.spec.ts
- [ ] T041 [P] [US2] E2E test for CSV import with progress tracking in app/tests/e2e/csv-import.spec.ts

### Implementation for User Story 2

- [ ] T042 [P] [US2] Create ImportJob entity type definition in app/src/types/import-job.ts
- [ ] T043 [US2] Implement CSV parsing service with papaparse in app/src/services/csv-service.ts
- [ ] T044 [US2] Implement dictionary enrichment service with Free Dictionary API in app/src/services/dictionary-service.ts
- [ ] T045 [US2] Create Web Worker for background dictionary enrichment in app/src/workers/definition-worker.ts
- [ ] T046 [US2] Create useImportStore Pinia store in app/src/stores/useImportStore.ts
- [ ] T047 [US2] Create ImportPage with file upload UI in app/src/pages/ImportPage.vue
- [ ] T048 [US2] Create CSV import wizard component in app/src/components/import/ImportWizard.vue
- [ ] T049 [US2] Create progress indicator component for import status in app/src/components/import/ImportProgress.vue
- [ ] T050 [US2] Implement duplicate word detection and handling in app/src/services/import-service.ts
- [ ] T051 [US2] Implement error handling for network failures and missing data in app/src/services/dictionary-service.ts
- [ ] T052 [US2] Create import job repository for tracking import status in app/src/services/import-job-repository.ts
- [ ] T053 [US2] Add routing for ImportPage in app/src/router/index.ts
- [ ] T054 [US2] Implement retry mechanism for failed dictionary lookups in app/src/services/dictionary-service.ts
- [ ] T055 [US2] Create import result summary component in app/src/components/import/ImportResult.vue

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 管理個人單字庫 (Priority: P2)

**Goal**: 使用者可以新增、編輯、刪除自己的單字，建立個人化的單字庫。使用者可以為單字添加自訂標籤、筆記，並組織成不同的單字集。

**Independent Test**: 使用者能夠新增單字（輸入英文、中文解釋、例句等），編輯現有單字內容，刪除不需要的單字，並為單字添加標籤和筆記。這個功能可以獨立運作，不依賴其他功能。

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T056 [P] [US3] Unit test for word CRUD operations in app/tests/unit/word-repository.spec.ts
- [ ] T057 [P] [US3] Unit test for tag management in app/tests/unit/tag-service.spec.ts
- [ ] T058 [P] [US3] Integration test for word editing flow in app/tests/integration/word-management.spec.ts
- [ ] T059 [P] [US3] E2E test for add/edit/delete word workflow in app/tests/e2e/word-management.spec.ts

### Implementation for User Story 3

- [ ] T060 [P] [US3] Create Tag entity type definition in app/src/types/tag.ts
- [ ] T061 [P] [US3] Create Note entity type definition in app/src/types/note.ts
- [ ] T062 [US3] Implement tag repository with IndexedDB operations in app/src/services/tag-repository.ts
- [ ] T063 [US3] Implement note repository with IndexedDB operations in app/src/services/note-repository.ts
- [ ] T064 [US3] Create word form component for add/edit in app/src/components/cards/WordForm.vue
- [ ] T065 [US3] Create tag selector component in app/src/components/cards/TagSelector.vue
- [ ] T066 [US3] Create note editor component in app/src/components/cards/NoteEditor.vue
- [ ] T067 [US3] Implement word filtering by tags and status in app/src/services/word-filter-service.ts
- [ ] T068 [US3] Create DashboardPage with word list and filters in app/src/pages/DashboardPage.vue
- [ ] T069 [US3] Implement word search functionality in app/src/composables/useWordSearch.ts
- [ ] T070 [US3] Add routing for DashboardPage in app/src/router/index.ts
- [ ] T071 [US3] Create word detail dialog/modal component in app/src/components/cards/WordDetailDialog.vue
- [ ] T072 [US3] Implement word deletion with confirmation in app/src/services/word-deletion-service.ts

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - 複習與測驗功能 (Priority: P2)

**Goal**: 使用者可以根據學習進度進行複習，系統會根據遺忘曲線或使用者標記的複習需求，主動提醒使用者複習特定單字。使用者可以進行測驗來檢驗學習成果。

**Independent Test**: 系統根據單字的學習狀態和時間，顯示需要複習的單字列表。使用者可以進行測驗（選擇題、填空等），系統記錄測驗結果。這個功能可以獨立運作，提供複習和測驗的完整流程。

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T073 [P] [US4] Unit test for spaced repetition engine in app/tests/unit/review-engine.spec.ts
- [ ] T074 [P] [US4] Unit test for quiz generation service in app/tests/unit/quiz-service.spec.ts
- [ ] T075 [P] [US4] Integration test for review flow in app/tests/integration/review-flow.spec.ts
- [ ] T076 [P] [US4] E2E test for quiz completion workflow in app/tests/e2e/quiz.spec.ts

### Implementation for User Story 4

- [ ] T077 [P] [US4] Create Quiz entity type definition in app/src/types/quiz.ts
- [ ] T078 [P] [US4] Create QuizQuestion entity type definition in app/src/types/quiz-question.ts
- [ ] T079 [P] [US4] Create LearningSession entity type definition in app/src/types/learning-session.ts
- [ ] T080 [US4] Implement spaced repetition review engine in app/src/services/review-engine.ts
- [ ] T081 [US4] Implement quiz generation service with multiple modes in app/src/services/quiz-service.ts
- [ ] T082 [US4] Create quiz repository with IndexedDB operations in app/src/services/quiz-repository.ts
- [ ] T083 [US4] Create ReviewPage with review word list in app/src/pages/ReviewPage.vue
- [ ] T084 [US4] Create quiz component for multiple-choice mode in app/src/components/review/QuizMultipleChoice.vue
- [ ] T085 [US4] Create quiz component for fill-in mode in app/src/components/review/QuizFillIn.vue
- [ ] T086 [US4] Create quiz component for spelling mode in app/src/components/review/QuizSpelling.vue
- [ ] T087 [US4] Create quiz result component with score display in app/src/components/review/QuizResult.vue
- [ ] T088 [US4] Implement quiz answer submission and scoring in app/src/services/quiz-scoring-service.ts
- [ ] T089 [US4] Add routing for ReviewPage in app/src/router/index.ts
- [ ] T090 [US4] Create review reminder notification system in app/src/composables/useReviewReminder.ts
- [ ] T091 [US4] Implement learning session tracking in app/src/services/learning-session-service.ts

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 7: User Story 5 - 學習進度追蹤與統計 (Priority: P3)

**Goal**: 使用者可以查看自己的學習進度，包括已學會的單字數量、學習天數、每日學習時間、測驗成績趨勢等統計資訊。系統提供視覺化的進度圖表。

**Independent Test**: 系統收集使用者的學習活動數據（學習時間、學會的單字數、測驗成績等），並以圖表或列表形式展示統計資訊。使用者可以查看不同時間段的學習進度。

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T092 [P] [US5] Unit test for progress calculation service in app/tests/unit/progress-service.spec.ts
- [ ] T093 [P] [US5] Unit test for statistics aggregation in app/tests/unit/statistics-service.spec.ts
- [ ] T094 [P] [US5] Integration test for progress tracking flow in app/tests/integration/progress-tracking.spec.ts
- [ ] T095 [P] [US5] E2E test for progress dashboard in app/tests/e2e/progress-dashboard.spec.ts

### Implementation for User Story 5

- [ ] T096 [P] [US5] Create UserProgress entity type definition in app/src/types/user-progress.ts
- [ ] T097 [US5] Implement progress calculation service in app/src/services/progress-service.ts
- [ ] T098 [US5] Create useProgressStore Pinia store in app/src/stores/useProgressStore.ts
- [ ] T099 [US5] Create progress summary component with key metrics in app/src/components/progress/ProgressSummary.vue
- [ ] T100 [US5] Create learning trend chart component in app/src/components/progress/LearningTrendChart.vue
- [ ] T101 [US5] Create quiz score trend chart component in app/src/components/progress/QuizScoreChart.vue
- [ ] T102 [US5] Create learning heatmap calendar component in app/src/components/progress/HeatmapCalendar.vue
- [ ] T103 [US5] Create ProgressPage with all statistics components in app/src/pages/ProgressPage.vue
- [ ] T104 [US5] Implement progress data aggregation from learning sessions in app/src/services/statistics-service.ts
- [ ] T105 [US5] Add routing for ProgressPage in app/src/router/index.ts
- [ ] T106 [US5] Implement streak calculation logic in app/src/services/streak-service.ts

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T107 [P] Implement PWA manifest and icons in app/public/manifest.webmanifest
- [ ] T108 [P] Add service worker caching strategies for offline support
- [ ] T109 [P] Implement responsive design improvements across all pages
- [ ] T110 [P] Add loading skeletons for better perceived performance
- [ ] T111 [P] Implement error boundary components for graceful error handling
- [ ] T112 [P] Add internationalization (i18n) support for Traditional Chinese
- [ ] T113 [P] Implement accessibility improvements (ARIA labels, keyboard navigation)
- [ ] T114 [P] Add performance optimizations (lazy loading, code splitting)
- [ ] T115 [P] Create comprehensive documentation in app/docs/
- [ ] T116 [P] Run quickstart.md validation and update if needed
- [ ] T117 [P] Add unit tests to reach ≥80% coverage requirement
- [ ] T118 [P] Performance audit and optimization (Lighthouse CI)
- [ ] T119 [P] Security audit and hardening
- [ ] T120 [P] Code cleanup and refactoring for maintainability

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Independent, but shares Word entity with US1
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) - Depends on Word entity from US1
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - Depends on LearningSession from US4

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Type definitions before repositories
- Repositories before services
- Services before components
- Components before pages
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Type definitions within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for WordCard component flip animation in app/tests/component/WordCard.spec.ts"
Task: "Unit test for word status update functionality in app/tests/unit/word-status.spec.ts"
Task: "Integration test for word card browsing flow in app/tests/integration/word-browsing.spec.ts"
Task: "E2E test for card flip and status marking in app/tests/e2e/word-card.spec.ts"

# Launch all type definitions for User Story 1 together:
Task: "Create Word entity type definition in app/src/types/word.ts"
Task: "Create WordSet entity type definition in app/src/types/word-set.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (瀏覽與學習單字卡片)
4. Complete Phase 4: User Story 2 (CSV 匯入單字與自動補足資訊)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo (MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
3. After P1 stories complete:
   - Developer A: User Story 3
   - Developer B: User Story 4
4. Developer C: User Story 5
5. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group (following AngularJS commit conventions in 繁體中文)
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- All commit messages must follow AngularJS Git Commit Message Conventions in 繁體中文

---

## Task Summary

- **Total Tasks**: 120
- **Phase 1 (Setup)**: 13 tasks
- **Phase 2 (Foundational)**: 9 tasks
- **Phase 3 (US1)**: 15 tasks (4 tests + 11 implementation)
- **Phase 4 (US2)**: 18 tasks (4 tests + 14 implementation)
- **Phase 5 (US3)**: 17 tasks (4 tests + 13 implementation)
- **Phase 6 (US4)**: 19 tasks (4 tests + 15 implementation)
- **Phase 7 (US5)**: 11 tasks (4 tests + 7 implementation)
- **Phase 8 (Polish)**: 18 tasks

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 + Phase 4 (User Stories 1 & 2)

