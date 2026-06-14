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

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminData } from '../api/admin'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const data = ref([])

async function loadData() {
  try {
    const res = await getAdminData()
    data.value = res.data
  } catch (e) {
    alert('인증 실패')
    router.push('/')
  }
}

function logout() {
  authStore.logout()
  router.push('/')
}
</script>