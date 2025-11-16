/*
 * @Date: 2025-08-28 07:54:03
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-11 09:57:32
 * @FilePath: /lowCode_excel/fe/src/router/index.ts
 */
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MainLayout from '@/components/Layout/MainLayout.vue'
import QueryOnlyLayout from '@/components/Layout/QueryOnlyLayout.vue'
import FormFillLayout from '@/components/Layout/FormFillLayout.vue'

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
          component: () => import('@/views/Dashboard.vue')
        },
        {
          path: '/files',
          name: 'FileManagement',
          component: () => import('@/views/FileManagement.vue')
        },
        {
          path: '/data',
          name: 'DataBrowser',
          component: () => import('@/views/DataBrowser.vue')
        },
        {
          path: '/editor',
          name: 'DataEditor',
          component: () => import('@/views/DataEditor.vue')
        },
        {
          path: '/mappings',
          name: 'MappingRelations',
          component: () => import('@/views/MappingRelations.vue')
        },
        {
          path: '/api-guide',
          name: 'ApiGuide',
          component: () => import('@/views/ApiGuide.vue')
        },
        {
          path: '/users',
          name: 'UserManagement',
          component: () => import('@/views/UserManagement.vue')
        },
        {
          path: '/logs',
          name: 'LogManagement',
          component: () => import('@/views/LogManagement.vue')
        },
        {
          path: '/table-structure',
          name: 'TableStructureEditor',
          component: () => import('@/views/TableStructureEditorView.vue')
        },
        {
          path: '/forms',
          name: 'FormManagement',
          component: () => import('@/views/FormManagement.vue')
        },
        {
          path: '/forms/:id',
          name: 'FormDetail',
          component: () => import('@/views/FormDetail.vue')
        }
      ]
    },
    {
      path: '/form',
      component: FormFillLayout,
      children: [
        {
          path: '',
          name: 'FormFill',
          component: () => import('@/views/FormFillView.vue')
        },
        {
          path: ':formId',
          name: 'PublicForm',
          component: () => import('@/views/PublicFormView.vue')
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
  } else {
    next()
  }
})

export default router
