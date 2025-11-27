import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    redirect: '/study'
  },
  {
    path: '/study',
    name: 'study',
    component: () => import('../pages/StudyPage.vue')
  },
  {
    path: '/import',
    name: 'import',
    component: () => import('../pages/ImportPage.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../pages/DashboardPage.vue')
  },
  {
    path: '/review',
    name: 'review',
    component: () => import('../pages/ReviewPage.vue')
  },
  {
    path: '/progress',
    name: 'progress',
    component: () => import('../pages/ProgressPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

