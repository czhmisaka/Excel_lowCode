/*
 * @Date: 2025-08-28 07:54:03
 * @LastEditors: CZH
 * @LastEditTime: 2025-09-28 01:08:01
 * @FilePath: /fe/src/router/index.ts
 */
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '@/components/Layout/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout,
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
        }
      ]
    }
  ]
})

export default router
