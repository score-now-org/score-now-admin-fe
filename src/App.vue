<template>
  <div class="app-layout">
    <!-- 로그인 페이지에서는 GNB 숨김 -->
    <AppHeader v-if="showHeader" />
    <RouterView />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'

const route = useRoute()

// 로그인 페이지(/)에서는 헤더 숨김
const showHeader = computed(() => route.path !== '/')
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>