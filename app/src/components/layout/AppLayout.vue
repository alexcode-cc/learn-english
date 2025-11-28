<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <!-- 移動端：顯示抽屜按鈕 -->
      <v-app-bar-nav-icon
        v-if="$vuetify.display.mobile"
        @click="drawer = !drawer"
        aria-label="開啟導航選單"
      />
      <v-app-bar-title>{{ appName }}</v-app-bar-title>
      <v-spacer />
      <!-- 桌面端：顯示圖標按鈕 -->
      <template v-if="!$vuetify.display.mobile">
        <v-btn
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          icon
          variant="text"
          :aria-label="item.title"
          :aria-current="$route.path === item.path ? 'page' : undefined"
        >
          <v-icon>{{ item.icon }}</v-icon>
          <v-tooltip activator="parent">{{ item.title }}</v-tooltip>
        </v-btn>
      </template>
    </v-app-bar>

    <!-- 移動端導航抽屜 -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      location="left"
      :touchless="$vuetify.display.mobile"
    >
      <v-list nav density="comfortable">
        <v-list-item
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          :active="$route.path === item.path"
          @click="drawer = false"
        />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <!-- Render header slot if provided, otherwise use default layout -->
      <slot name="header" />
      <v-container fluid :class="{ 'px-2': $vuetify.display.xs }">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import config from '@/config'

const route = useRoute()
const display = useDisplay()
const { t } = useI18n()
const drawer = ref(false)

const appName = computed(() => config.app.name)

const navItems = computed(() => [
  { path: '/study', title: t('nav.study'), icon: 'mdi-book-open-variant' },
  { path: '/import', title: t('nav.import'), icon: 'mdi-file-import' },
  { path: '/dashboard', title: t('nav.dashboard'), icon: 'mdi-view-dashboard' },
  { path: '/review', title: t('nav.review'), icon: 'mdi-refresh' },
  { path: '/progress', title: t('nav.progress'), icon: 'mdi-chart-line' }
])

// 路由變化時關閉抽屜（移動端）
watch(() => route.path, () => {
  if (display.mobile.value) {
    drawer.value = false
  }
})
</script>

<style scoped>
/* 確保觸控目標至少 44x44px */
:deep(.v-btn) {
  min-width: 44px;
  min-height: 44px;
}

/* 移動端優化間距 */
@media (max-width: 600px) {
  :deep(.v-container) {
    padding-left: 8px;
    padding-right: 8px;
  }
}
</style>

