<template>
  <header class="app-header">

    <!-- 로고 -->
    <div class="header-logo">SCORE NOW</div>

    <!-- 우측 유저 영역 -->
    <div class="header-right">
      <span class="header-user">
        👤 {{ userInfo?.name || userInfo?.id || '관리자' }}
      </span>
      <BaseButton variant="primary" size="md" @click="handleLogout">
        로그아웃
      </BaseButton>
    </div>

  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const router = useRouter()
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

function handleLogout() {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 52px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-logo {
  font-size: 20px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 0.12em;
  color: #1C67FF;
  font-family: 'Arial Black', 'Impact', sans-serif;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-user {
  color: #333;
  font-size: 13px;
  font-weight: 500;
}


</style>