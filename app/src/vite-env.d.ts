/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DICTIONARY_BASE_URL?: string
  readonly VITE_HOST?: string
  readonly VITE_E2E_TEST?: string
  // 可以在這裡添加更多環境變數
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

