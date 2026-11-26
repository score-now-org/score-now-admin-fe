<template>
  <div class="app-layout">
    <!-- 로그인 페이지에서는 GNB 숨김 -->
    <AppHeader v-if="showHeader" />
    <RouterView />
    <AdminConfirmModal
      :model-value="!!confirmation"
      v-bind="confirmation"
      @confirm="confirm"
      @cancel="cancel"
    />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute, RouterView } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import AdminConfirmModal from '@/components/admin/AdminConfirmModal.vue'
import { provideAdminConfirm } from '@/composables/useAdminConfirm'

const route = useRoute()
const { confirmation, confirm, cancel } = provideAdminConfirm()
watch(() => route.fullPath, cancel)

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
