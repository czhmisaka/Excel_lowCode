<!--
 * @Date: 2025-08-28 07:54:03
 * @LastEditors: CZH
 * @LastEditTime: 2025-09-28 01:29:47
 * @FilePath: /fe/src/App.vue
-->
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
/* 基础样式重置，确保与main.css一致 */
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>
