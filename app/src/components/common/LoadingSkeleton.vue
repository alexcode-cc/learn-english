<template>
  <div class="loading-skeleton" :class="[`skeleton-${variant}`, { 'skeleton-animated': animated }]">
    <div v-if="variant === 'card'" class="skeleton-card">
      <div class="skeleton-header">
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line skeleton-subtitle"></div>
      </div>
      <div class="skeleton-body">
        <div class="skeleton-line" v-for="i in lines" :key="i" :style="{ width: getLineWidth(i) }"></div>
      </div>
      <div v-if="showActions" class="skeleton-actions">
        <div class="skeleton-button"></div>
        <div class="skeleton-button"></div>
      </div>
    </div>

    <div v-else-if="variant === 'list'" class="skeleton-list">
      <div class="skeleton-list-item" v-for="i in items" :key="i">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line skeleton-title"></div>
          <div class="skeleton-line" :style="{ width: '60%' }"></div>
        </div>
      </div>
    </div>

    <div v-else-if="variant === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div class="skeleton-line" v-for="i in columns" :key="i"></div>
      </div>
      <div class="skeleton-table-row" v-for="i in rows" :key="i">
        <div class="skeleton-line" v-for="j in columns" :key="j" :style="{ width: getTableCellWidth(j) }"></div>
      </div>
    </div>

    <div v-else-if="variant === 'text'" class="skeleton-text">
      <div class="skeleton-line" v-for="i in lines" :key="i" :style="{ width: getLineWidth(i) }"></div>
    </div>

    <div v-else class="skeleton-default">
      <div class="skeleton-line" :style="{ width: width }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'card' | 'list' | 'table' | 'text' | 'default'
  lines?: number
  items?: number
  rows?: number
  columns?: number
  width?: string
  animated?: boolean
  showActions?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  lines: 3,
  items: 3,
  rows: 5,
  columns: 3,
  width: '100%',
  animated: true,
  showActions: false
})

function getLineWidth(index: number): string {
  const widths = ['100%', '90%', '75%', '85%', '95%']
  return widths[(index - 1) % widths.length]
}

function getTableCellWidth(column: number): string {
  const widths = ['30%', '40%', '20%', '25%', '35%']
  return widths[(column - 1) % widths.length] || '30%'
}
</script>

<style scoped>
.loading-skeleton {
  width: 100%;
}

.skeleton-animated .skeleton-line,
.skeleton-animated .skeleton-avatar,
.skeleton-animated .skeleton-button {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton-line {
  height: 1em;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 0.5em;
}

.skeleton-title {
  height: 1.5em;
  margin-bottom: 0.75em;
}

.skeleton-subtitle {
  height: 1.2em;
  width: 60%;
  margin-bottom: 1em;
}

/* Card variant */
.skeleton-card {
  padding: 1.5rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.skeleton-header {
  margin-bottom: 1rem;
}

.skeleton-body {
  margin-bottom: 1rem;
}

.skeleton-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.skeleton-button {
  width: 80px;
  height: 36px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
}

/* List variant */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-list-item {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
}

/* Table variant */
.skeleton-table {
  width: 100%;
}

.skeleton-table-header,
.skeleton-table-row {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid #e0e0e0;
}

.skeleton-table-header {
  background: #f5f5f5;
  font-weight: 600;
}

.skeleton-table-row {
  background: white;
}

.skeleton-table-header .skeleton-line,
.skeleton-table-row .skeleton-line {
  flex: 1;
  margin-bottom: 0;
}

/* Text variant */
.skeleton-text {
  width: 100%;
}

.skeleton-text .skeleton-line:last-child {
  margin-bottom: 0;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .skeleton-line,
  .skeleton-avatar,
  .skeleton-button {
    background: linear-gradient(90deg, #2a2a2a 25%, #1a1a1a 50%, #2a2a2a 75%);
    background-size: 200% 100%;
  }

  .skeleton-card,
  .skeleton-list-item {
    background: #1e1e1e;
  }

  .skeleton-table-header {
    background: #2a2a2a;
  }

  .skeleton-table-row {
    background: #1e1e1e;
  }
}
</style>

