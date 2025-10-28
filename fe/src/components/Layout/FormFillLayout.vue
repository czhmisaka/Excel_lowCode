<!--
 * @Date: 2025-10-29 00:53:22
 * @LastEditors: CZH
 * @LastEditTime: 2025-10-29 00:53:41
 * @FilePath: /lowCode_excel/fe/src/components/Layout/FormFillLayout.vue
-->
<template>
    <div class="form-fill-layout">
        <!-- 主要内容 -->
        <div class="form-main">
            <router-view />
        </div>
    </div>
</template>

<script setup lang="ts">
// 这个布局专门用于表单填写页面，不包含任何导航菜单和头部信息
</script>

<style scoped>
.form-fill-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f5f7fa;
}

.form-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
}
</style>
