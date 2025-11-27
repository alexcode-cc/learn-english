<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-title>{{ appName }}</v-app-bar-title>
      <v-spacer />
      <v-btn
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        icon
        variant="text"
      >
        <v-icon>{{ item.icon }}</v-icon>
        <v-tooltip activator="parent">{{ item.title }}</v-tooltip>
      </v-btn>
    </v-app-bar>
    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import config from '@/config'

const appName = computed(() => config.app.name)

const navItems = [
  { path: '/study', title: '學習', icon: 'mdi-book-open-variant' },
  { path: '/import', title: '匯入', icon: 'mdi-file-import' },
  { path: '/dashboard', title: '儀表板', icon: 'mdi-view-dashboard' },
  { path: '/review', title: '複習', icon: 'mdi-refresh' },
  { path: '/progress', title: '進度', icon: 'mdi-chart-line' }
]
</script>

