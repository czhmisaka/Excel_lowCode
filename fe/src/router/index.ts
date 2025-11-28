/*
 * @Date: 2025-08-28 07:54:03
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-27 10:11:59
 * @FilePath: /打卡/fe/src/router/index.ts
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/components/Layout/MainLayout.vue'
import QueryOnlyLayout from '@/components/Layout/QueryOnlyLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/files',
          name: 'FileManagement',
          component: () => import('@/views/FileManagement.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/data',
          name: 'DataBrowser',
          component: () => import('@/views/DataBrowser.vue')
        },
        {
          path: '/editor',
          name: 'DataEditor',
          component: () => import('@/views/DataEditor.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/mappings',
          name: 'MappingRelations',
          component: () => import('@/views/MappingRelations.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/api-guide',
          name: 'ApiGuide',
          component: () => import('@/views/ApiGuide.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/users',
          name: 'UserManagement',
          component: () => import('@/views/UserManagement.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/logs',
          name: 'LogManagement',
          component: () => import('@/views/LogManagement.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/table-structure',
          name: 'TableStructureEditor',
          component: () => import('@/views/TableStructureEditorView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/profile',
          name: 'Profile',
          component: () => import('@/views/ProfileView.vue')
        },
        {
          path: '/checkin',
          name: 'Checkin',
          component: () => import('@/views/CheckinPage.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/companies',
          name: 'CompanyManagement',
          component: () => import('@/views/CompanyManagement.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: '/company-checkin-records/:id',
          name: 'CompanyCheckinRecords',
          component: () => import('@/views/CompanyCheckinRecords.vue'),
          meta: { requiresAdmin: true }
        }
      ]
    },
    {
      path: '/query',
      component: QueryOnlyLayout,
      children: [
        {
          path: '',
          name: 'QueryOnly',
          component: () => import('@/views/QueryOnlyView.vue')
        }
      ]
    },
    {
      path: '/checkin/:companyCode',
      name: 'CompanyCheckin',
      component: () => import('@/views/CheckinPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/checkout/:companyCode',
      name: 'CompanyCheckout',
      component: () => import('@/views/CheckoutPage.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 检查是否需要登录验证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 重定向到登录页面，并记录原页面路径
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  } else if (to.meta.requiresAuth && authStore.isAuthenticated) {
    // 检查用户角色权限
    const userRole = authStore.userInfo?.role
    const requiresAdmin = to.meta.requiresAdmin
    
    // 如果路由需要管理员权限，但用户不是管理员
    if (requiresAdmin && userRole !== 'admin') {
      // 普通用户只能访问数据浏览界面
      if (to.path === '/data') {
        next()
      } else {
        // 重定向到数据浏览界面
        next('/data')
      }
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
