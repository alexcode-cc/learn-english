import { createI18n } from 'vue-i18n'
import zhTW from './locales/zh-TW.json'

export type SupportedLocale = 'zh-TW'

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: 'zh-TW', // 預設語言
  fallbackLocale: 'zh-TW', // 回退語言
  messages: {
    'zh-TW': zhTW
  },
  // 在模板中使用 $t 時啟用
  globalInjection: true
})

export default i18n

