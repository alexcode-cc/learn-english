import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 使用 webpackChunkName 註釋來優化代碼分割
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    redirect: '/study'
  },
  {
    path: '/study',
    name: 'study',
    component: () => import(/* webpackChunkName: "study" */ '../pages/StudyPage.vue'),
    meta: {
      title: '學習',
      preload: true // 優先預載入
    }
  },
  {
    path: '/import',
    name: 'import',
    component: () => import(/* webpackChunkName: "import" */ '../pages/ImportPage.vue'),
    meta: {
      title: '匯入'
    }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ '../pages/DashboardPage.vue'),
    meta: {
      title: '儀表板'
    }
  },
  {
    path: '/review',
    name: 'review',
    component: () => import(/* webpackChunkName: "review" */ '../pages/ReviewPage.vue'),
    meta: {
      title: '複習'
    }
  },
  {
    path: '/progress',
    name: 'progress',
    component: () => import(/* webpackChunkName: "progress" */ '../pages/ProgressPage.vue'),
    meta: {
      title: '進度'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 滾動行為優化
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// 路由預載入優化：預載入優先級高的路由
router.beforeEach((to, _from, next) => {
  // 設置頁面標題
  if (to.meta.title) {
    document.title = `${to.meta.title} - Learn English`
  }
  
  // 預載入優先級高的路由
  if (to.meta.preload) {
    const preloadRoutes = routes.filter(r => r.meta?.preload && r.name !== to.name)
    preloadRoutes.forEach(route => {
      if (route.component && typeof route.component === 'function') {
        const componentLoader = route.component as () => Promise<any>
        // 使用 requestIdleCallback 在空閒時預載入
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            componentLoader()
          })
        } else {
          setTimeout(() => {
            componentLoader()
          }, 2000)
        }
      }
    })
  }
  
  next()
})

export default router

