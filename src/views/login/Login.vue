<template>
  <div class="login-wrap">

    <div class="login-card">

      <!-- Logo -->
      <div class="logo">SCORE NOW</div>

      <!-- Form -->
      <form class="form" @submit.prevent="handleLogin">

        <!-- BaseInput 적용 -->
        <BaseInput
          v-model="form.id"
          type="text"
          placeholder="아이디를 입력하세요."
          autocomplete="username"
          aria-label="아이디"
        />

        <BaseInput
          v-model="form.password"
          type="password"
          placeholder="비밀번호를 입력하세요."
          autocomplete="current-password"
          aria-label="비밀번호"
        />

        <!-- BaseButton 적용 -->
        <BaseButton
          variant="secondary"
          :disabled="loading"
          class="login-btn"
          type="submit"
        >
          {{ loading ? '로그인 중...' : '로그인' }}
        </BaseButton>

        <p v-if="errorMsg" class="error-msg" role="alert">{{ errorMsg }}</p>

      </form>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loginApi } from '@/api/admin'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form    = ref({ id: '', password: '' })
const loading = ref(false)
const errorMsg = ref(route.query.reason === 'unavailable' ? '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.' : '')

async function handleLogin() {
  errorMsg.value = ''

  if (loading.value) return

  if (!form.value.id.trim() || !form.value.password) {
    errorMsg.value = '아이디와 비밀번호를 입력해주세요.'
    return
  }

  loading.value = true

  try {
    const response = await loginApi({ id: form.value.id.trim(), password: form.value.password })
    const token = response.data?.token
    if (typeof token !== 'string' || !token) throw new Error('Invalid login response')
    auth.setToken(token, { id: form.value.id.trim() })
    form.value.password = ''
    await router.replace({ name: 'admin-match-list' })
  } catch (e) {
    if (e.response?.status === 401) errorMsg.value = '아이디 또는 비밀번호가 올바르지 않습니다.'
    else if (e.response?.status === 400) errorMsg.value = '아이디와 비밀번호 입력값을 확인해주세요.'
    else errorMsg.value = '로그인할 수 없습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #F3F3F3;
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: #fff;
  border: 1px solid #E9E9E9;
  border-radius: 12px;
  padding: 40px 36px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.logo {
  text-align: center;
  font-size: 28px;
  font-weight: 900;
  font-style: italic;
  letter-spacing: 0.12em;
  color: #1C67FF;
  font-family: 'Arial Black', 'Impact', sans-serif;
  margin-bottom: 32px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.login-btn {
  width: 100%;
  padding: 10px;
  font-size: 13px;
  margin-top: 4px;
}

.error-msg {
  text-align: center;
  font-size: 12px;
  color: #ef4444;
  margin: 0;
}
</style>
