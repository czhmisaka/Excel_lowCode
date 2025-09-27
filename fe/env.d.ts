/*
 * @Date: 2025-08-28 07:54:03
 * @LastEditors: CZH
 * @LastEditTime: 2025-09-28 01:22:23
 * @FilePath: /fe/env.d.ts
 */
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly BASE_URL: string
    // 更多环境变量可以在这里添加
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}
