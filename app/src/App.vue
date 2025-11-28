<template>
  <ErrorBoundary>
    <AppLayout>
      <router-view />
    </AppLayout>
  </ErrorBoundary>
</template>

<script setup lang="ts">
import AppLayout from './components/layout/AppLayout.vue'
import ErrorBoundary from './components/common/ErrorBoundary.vue'
</script>

