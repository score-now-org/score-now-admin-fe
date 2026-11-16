<template>
  <header class="app-header">
    <div class="header-main">
      <RouterLink class="header-logo" :to="{ name: 'admin-match-list' }" aria-label="경기 리스트로 이동">
        <span class="header-logo-full">SCORE NOW</span>
        <span class="header-logo-compact" aria-hidden="true">SN</span>
      </RouterLink>

      <nav class="header-nav" aria-label="관리 영역">
        <RouterLink
          class="header-nav-link"
          :class="{ active: route.meta.adminSection === 'match' }"
          :to="{ name: 'admin-match-list' }"
          :aria-current="route.meta.adminSection === 'match' ? 'page' : undefined"
        >
          경기 관리
        </RouterLink>
        <RouterLink
          class="header-nav-link"
          :class="{ active: route.meta.adminSection === 'user' }"
          :to="{ name: 'admin-user' }"
          :aria-current="route.meta.adminSection === 'user' ? 'page' : undefined"
        >
          사용자 관리
        </RouterLink>
      </nav>
    </div>

    <!-- 우측 유저 영역 -->
    <div class="header-right">
      <span class="header-user">
        👤 {{ userInfo?.name || userInfo?.id || '관리자' }}
      </span>
      <span v-if="logoutError" class="logout-error" role="alert">{{ logoutError }}</span>
      <BaseButton variant="primary" size="md" :disabled="loggingOut" @click="handleLogout">
        로그아웃
      </BaseButton>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logoutApi } from '@/api/admin'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const loggingOut = ref(false)
const logoutError = ref('')

async function handleLogout() {
  if (loggingOut.value) return
  loggingOut.value = true
  logoutError.value = ''
  try {
    await logoutApi()
    authStore.logout()
    await router.replace({ name: 'login' })
  } catch (error) {
    if (error.response?.status !== 401) logoutError.value = '로그아웃에 실패했습니다. 다시 시도해주세요.'
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  height: 52px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-main {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 24px;
}

.header-logo {
  flex: 0 0 auto;
  font-size: 20px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 0.12em;
  color: #1C67FF;
  font-family: 'Arial Black', 'Impact', sans-serif;
  text-decoration: none;
}

.header-logo-compact {
  display: none;
}

.header-nav {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 4px;
}

.header-nav-link {
  display: inline-flex;
  height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  color: var(--admin-color-text-muted, #778195);
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
  border-radius: var(--admin-control-radius, 6px);
  transition: color .15s, background .15s;
}

.header-nav-link:hover {
  color: var(--admin-color-primary, #1c67ff);
  background: var(--admin-color-table-heading-surface, #f7f9fc);
}

.header-nav-link:focus-visible {
  outline: 2px solid var(--admin-color-primary, #1c67ff);
  outline-offset: 1px;
}

.header-nav-link.active {
  color: var(--admin-color-primary, #1c67ff);
  background: #edf3ff;
}

.header-right {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
}

.logout-error { color: #ef4444; font-size: 12px; }

.header-user {
  color: #333;
  font-size: 13px;
  font-weight: 500;
}

@media (max-width: 720px) {
  .app-header {
    gap: 10px;
    padding-inline: 12px;
  }

  .header-main {
    gap: 10px;
  }

  .header-logo {
    font-size: 16px;
  }

  .header-logo-full,
  .logout-error { color: #ef4444; font-size: 12px; }

.header-user {
    display: none;
  }

  .header-logo-compact {
    display: inline;
  }

  .header-nav-link {
    padding-inline: 9px;
    font-size: 11px;
  }
}

@media (max-width: 420px) {
  .header-nav-link {
    padding-inline: 7px;
  }

  .header-right :deep(.base-btn) {
    padding-inline: 10px;
  }
}

</style>
