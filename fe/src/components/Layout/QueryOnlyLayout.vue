<!--
 * @Date: 2025-10-12 14:29:48
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-12 14:30:16
 * @FilePath: /lowCode_excel/fe/src/components/Layout/QueryOnlyLayout.vue
-->
<template>
    <div class="query-only-layout">
        <!-- 头部 -->
        <div class="query-header">
            <div class="header-content">
                <h1 class="title">数据查询系统</h1>
                <div class="subtitle">仅用于数据浏览和查询</div>
            </div>
        </div>

        <!-- 主要内容 -->
        <div class="query-main">
            <router-view />
        </div>

        <!-- 页脚 -->
        <div class="query-footer">
            <div class="footer-content">
                <span>© 2025 数据查询系统 - 仅限查询使用</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// 这个布局专门用于查询页面，不包含任何导航菜单
</script>

<style scoped>
.query-only-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f5f7fa;
}

.query-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    text-align: center;
}

.title {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 600;
}

.subtitle {
    margin: 0;
    font-size: 14px;
    opacity: 0.9;
}

.query-main {
    flex: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    width: 100%;
    box-sizing: border-box;
}

.query-footer {
    background-color: #304156;
    color: #bfcbd9;
    padding: 16px 0;
    text-align: center;
    border-top: 1px solid #1f2d3d;
}

.footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.footer-content span {
    font-size: 12px;
}
</style>
