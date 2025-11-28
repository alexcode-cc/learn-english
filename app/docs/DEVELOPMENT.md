# 開發指南

## 開發工作流程

### 1. 設置開發環境

```bash
# 克隆倉庫
git clone <repository-url>
cd learn-english/app

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

### 2. 代碼規範

#### ESLint

項目使用 ESLint 進行代碼檢查：

```bash
npm run lint
```

#### Prettier

代碼格式化：

```bash
npm run format
```

### 3. Git 提交規範

遵循 AngularJS Git Commit Message Conventions（繁體中文）：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 類型:**
- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文檔更新
- `style`: 代碼格式（不影響功能）
- `refactor`: 重構
- `test`: 測試相關
- `chore`: 構建/工具相關

**範例:**
```
feat(study): 新增單字卡片翻轉動畫

實作 WordCard 組件的 3D 翻轉效果，提升使用者體驗。
使用 CSS transform 和 transition 實現流暢動畫。

Closes #123
```

### 4. 組件開發

#### 創建新組件

1. 在適當的目錄創建 `.vue` 文件
2. 使用 `<script setup>` 語法
3. 定義 TypeScript 類型
4. 添加必要的測試

**範例:**

```vue
<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
}

const props = defineProps<Props>()
</script>

<style scoped>
.my-component {
  padding: 1rem;
}
</style>
```

### 5. 服務開發

服務應該：
- 位於 `src/services/` 目錄
- 使用 TypeScript
- 處理錯誤並記錄日誌
- 有對應的單元測試

**範例:**

```typescript
import { logger } from '@/utils/logger'
import { handleError } from '@/utils/error-handler'

export class MyService {
  async doSomething(): Promise<void> {
    try {
      // 業務邏輯
      logger.info('Operation completed')
    } catch (error) {
      throw handleError(error)
    }
  }
}

export const myService = new MyService()
```

### 6. Store 開發

使用 Pinia 進行狀態管理：

```typescript
import { defineStore } from 'pinia'

export const useMyStore = defineStore('my', () => {
  const state = ref<State>(initialState)
  
  const getter = computed(() => {
    return state.value.something
  })
  
  async function action() {
    // 異步操作
  }
  
  return {
    state,
    getter,
    action
  }
})
```

### 7. 測試開發

#### 單元測試

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '@/components/MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    })
    expect(wrapper.text()).toContain('Test')
  })
})
```

#### E2E 測試

```typescript
import { test, expect } from '@playwright/test'

test('user can navigate to study page', async ({ page }) => {
  await page.goto('/')
  await page.click('text=學習')
  await expect(page).toHaveURL('/study')
})
```

### 8. 調試

#### 開發工具

- Vue DevTools: 調試 Vue 組件和 Pinia stores
- Chrome DevTools: 調試 IndexedDB、Service Worker
- Vite DevTools: 查看構建和熱更新

#### 日誌

使用 `logger` 工具記錄日誌：

```typescript
import { logger } from '@/utils/logger'

logger.info('Info message', { context })
logger.error('Error message', { error })
```

### 9. 性能監控

#### Lighthouse

```bash
npm run test:perf
```

#### 開發時性能檢查

- 使用 Chrome DevTools Performance 面板
- 監控 Network 請求
- 檢查 Memory 使用

### 10. 常見問題

#### IndexedDB 數據重置

在開發時，可以在瀏覽器控制台執行：

```javascript
indexedDB.deleteDatabase('learn-english-db')
```

#### Service Worker 更新

清除 Service Worker 緩存：

1. Chrome DevTools → Application → Service Workers
2. 點擊 "Unregister"
3. 清除 Storage → Clear storage

#### 熱更新不工作

```bash
# 重啟開發服務器
npm run dev
```

## 最佳實踐

1. **組件設計**
   - 保持組件小而專注
   - 使用 props 和 events 進行通信
   - 避免過深的組件嵌套

2. **狀態管理**
   - 本地狀態使用 `ref`/`reactive`
   - 共享狀態使用 Pinia stores
   - 避免不必要的響應式數據

3. **性能**
   - 使用 `v-memo` 優化列表渲染
   - 懶加載大型組件
   - 避免在模板中進行複雜計算

4. **錯誤處理**
   - 使用 ErrorBoundary 捕獲錯誤
   - 提供友好的錯誤訊息
   - 記錄錯誤到日誌

5. **無障礙**
   - 添加 ARIA 標籤
   - 支持鍵盤導航
   - 確保顏色對比度

