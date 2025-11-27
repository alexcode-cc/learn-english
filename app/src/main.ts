import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import '@mdi/font/css/materialdesignicons.css'
import './styles/main.css'
import { seedSampleWords } from './services/seed-data'
import { initDB } from './services/db'

// Initialize database and seed sample words
async function initApp() {
  try {
    // Initialize IndexedDB
    await initDB()
    
    // Seed sample words if database is empty
    await seedSampleWords()
    
    // Create and mount Vue app
    const app = createApp(App)
    const pinia = createPinia()
    
    app.use(pinia)
    app.use(router)
    app.use(vuetify)
    
    app.mount('#app')
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
}

initApp()

