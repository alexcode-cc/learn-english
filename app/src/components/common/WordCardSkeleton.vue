<template>
  <v-card class="word-card-skeleton" :class="{ 'skeleton-animated': animated }">
    <v-card-text>
      <div class="skeleton-card-content">
        <!-- 單字標題 -->
        <div class="skeleton-word-title"></div>
        
        <!-- 發音和狀態 -->
        <div class="skeleton-meta">
          <div class="skeleton-pronunciation"></div>
          <div class="skeleton-status"></div>
        </div>
        
        <!-- 定義 -->
        <div class="skeleton-definition">
          <div class="skeleton-line"></div>
          <div class="skeleton-line" style="width: 80%"></div>
        </div>
        
        <!-- 例句 -->
        <div class="skeleton-example">
          <div class="skeleton-line"></div>
          <div class="skeleton-line" style="width: 70%"></div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  animated?: boolean
}

withDefaults(defineProps<Props>(), {
  animated: true
})
</script>

<style scoped>
.word-card-skeleton {
  height: 300px;
  margin-bottom: 1rem;
}

.skeleton-animated {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.skeleton-card-content {
  padding: 0.5rem;
}

.skeleton-word-title {
  height: 2rem;
  width: 40%;
  background: linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 1rem;
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.skeleton-pronunciation {
  height: 1.2rem;
  width: 30%;
  background: linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-status {
  height: 1.5rem;
  width: 4rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: 12px;
  animation: skeleton-shimmer 1.5s infinite;
}

.skeleton-definition,
.skeleton-example {
  margin-bottom: 1.5rem;
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(90deg, #e0e0e0 25%, #d0d0d0 50%, #e0e0e0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  animation: skeleton-shimmer 1.5s infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .skeleton-word-title,
  .skeleton-pronunciation,
  .skeleton-status,
  .skeleton-line {
    background: linear-gradient(90deg, #2a2a2a 25%, #1a1a1a 50%, #2a2a2a 75%);
    background-size: 200% 100%;
  }
}
</style>

