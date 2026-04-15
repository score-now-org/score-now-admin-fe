<template>
  <div>
    <h2>관리자 페이지</h2>

    <button @click="loadData">데이터 조회</button>
    <button @click="logout">로그아웃</button>

    <ul v-if="data.length">
      <li v-for="item in data" :key="item.id">
        {{ item.name }}
      </li>
    </ul>
  </div>
</template>

<script>
import { getAdminData } from '../api/admin';
import { useAuthStore } from '../stores/auth';

export default {
  data() {
    return {
      data: []
    }
  },
  methods: {
    async loadData() {
      try {
        const res = await getAdminData();
        this.data = res.data;
      } catch (e) {
        alert('인증 실패');
        this.$router.push('/');
      }
    },

    logout() {
      const authStore = useAuthStore();
      authStore.logout();
      this.$router.push('/');
    }
  }
}
</script>