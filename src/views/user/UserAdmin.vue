<template>
  <div class="page-wrap">
    <div class="body-wrap">

      <AppSidebar v-model="activeSidebar" />

      <main class="main-content">

        <!-- 회원 -->
        <MemberSection   v-if="activeSidebar === '회원'" />

        <div v-else-if="activeSidebar === '채팅'" class="chat-content"><ChatSection /></div>

        <!-- 버전 관리 -->
        <VersionSection  v-else-if="activeSidebar === '버전 관리'" />

        <!-- 준비중 -->
        <div v-else-if="activeSidebar !== '문의하기'" class="coming-soon">
          🚧 {{ activeSidebar }} 준비 중입니다.
        </div>
        <div v-if="inquiryOpened" v-show="activeSidebar === '문의하기'" class="inquiry-content"><InquirySection /></div>

      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import MemberSection  from './base/UserMngr.vue'
import VersionSection from './version/VersionMngr.vue'
import ChatSection from './chat/ChatMngr.vue'
import InquirySection from './inquiry/InquiryMngr.vue'

const activeSidebar = ref('회원')
const inquiryOpened = ref(false)
watch(activeSidebar, value => { if (value === '문의하기') inquiryOpened.value = true }, { flush: 'sync' })
</script>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f9fafb;
  font-size: 13px;
  color: #1f2937;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
}
.body-wrap {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}
.chat-content, .inquiry-content { container-name: admin-content; container-type: inline-size; }
.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 14px;
  color: #9ca3af;
}
</style>
