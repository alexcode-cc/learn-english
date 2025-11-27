<template>
  <v-card class="pa-8 text-center" variant="outlined">
    <v-icon size="64" color="grey-lighten-1" class="mb-4">
      mdi-book-open-blank-variant
    </v-icon>
    <v-card-title class="text-h6 mb-2">還沒有單字</v-card-title>
    <v-card-text>
      <p class="text-body-2 mb-4">
        開始建立你的單字庫吧！你可以匯入 CSV 檔案或手動新增單字。
      </p>
      <v-btn
        color="primary"
        variant="flat"
        :to="{ name: 'import' }"
      >
        <v-icon start>mdi-file-import</v-icon>
        匯入 CSV
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
// EmptyState component for when no words are available
</script>

