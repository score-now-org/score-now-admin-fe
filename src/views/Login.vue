<template>
  <div class="login-container">
    <div class="login-box">
      <h2>SCORENOW</h2>

      <input
        v-model="id"
        placeholder="아이디"
        class="input"
      />

      <input
        v-model="password"
        type="password"
        placeholder="비밀번호"
        class="input"
      />

      <button @click="login" class="btn">
        로그인
      </button>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script>
import { loginApi } from '../api/admin';
import { useAuthStore } from '../stores/auth';

export default {
  data() {
    return {
      id: '',
      password: '',
      error: ''
    }
  },
  methods: {
    async login() {
      try {
        const res = await loginApi({
          id: this.id,
          password: this.password
        });

        const authStore = useAuthStore();
        authStore.setToken(res.data.token);

        this.$router.push('/admin/test');

      } catch (e) {
        this.error = '아이디 또는 비밀번호가 올바르지 않습니다.';
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f6f8;
}

.login-box {
  width: 320px;
  padding: 30px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.input {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.btn {
  width: 100%;
  padding: 10px;
  background: #2c3e50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.error {
  color: red;
  margin-top: 10px;
  font-size: 14px;
}
</style>
<!-- <template>
  <div>
    로그인 페이지 테스트
  </div>
</template> -->