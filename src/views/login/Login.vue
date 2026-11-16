<template>
  <div class="login-wrap">

    <div class="login-card">

      <!-- Logo -->
      <div class="logo">SCORE NOW</div>

      <!-- Form -->
      <div class="form">

        <!-- BaseInput 적용 -->
        <BaseInput
          v-model="form.id"
          type="text"
          placeholder="아이디를 입력하세요."
          @enter="handleLogin"
        />

        <BaseInput
          v-model="form.password"
          type="password"
          placeholder="비밀번호를 입력하세요."
          @enter="handleLogin"
        />

        <!-- BaseButton 적용 -->
        <BaseButton
          variant="secondary"
          :disabled="loading"
          class="login-btn"
          @click="handleLogin"
        >
          {{ loading ? '로그인 중...' : '로그인' }}
        </BaseButton>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

      </div>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form    = ref({ id: '', password: '' })
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  errorMsg.value = ''

  if (!form.value.id || !form.value.password) {
    errorMsg.value = '아이디와 비밀번호를 입력해주세요.'
    return
  }

  loading.value = true

  try {
    // TODO: 실제 API 연결 시 교체
    // const res = await api.post('/auth/login', form.value)
    await new Promise(resolve => setTimeout(resolve, 800))
    router.replace({ name: 'admin-match-list' })
  } catch (e) {
    errorMsg.value = '아이디 또는 비밀번호가 올바르지 않습니다.'
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
