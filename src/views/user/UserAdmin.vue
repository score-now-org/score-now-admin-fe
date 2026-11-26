<template>
  <div class="page-wrap">
    <div class="body-wrap">

      <AppSidebar v-model="activeSidebar" />

      <main class="main-content">

        <!-- 회원 -->
        <MemberSection   v-if="activeSidebar === '회원'" />

        <div v-else-if="activeSidebar === '채팅'" class="chat-content"><ChatSection /></div>

        <div v-else-if="activeSidebar === '금칙어'" class="chat-content"><ForbiddenWordSection /></div>

        <div v-else-if="activeSidebar === '게시판/댓글'" class="chat-content"><CommunitySection /></div>

        <div v-else-if="activeSidebar === '도움말'" class="chat-content"><HelpSection /></div>

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
import { defineAsyncComponent, h, ref, watch } from 'vue'
import MemberSection  from './base/UserMngr.vue'
import VersionSection from './version/VersionMngr.vue'
import ChatSection from './chat/ChatMngr.vue'
import ForbiddenWordSection from './forbidden-word/ForbiddenWordMngr.vue'
import HelpSection from './help/HelpMngr.vue'
import InquirySection from './inquiry/InquiryMngr.vue'
const CommunitySection = defineAsyncComponent({
  loader: () => import('./community/CommunityMngr.vue'),
  loadingComponent: { render: () => h('div', { class: 'coming-soon', role: 'status' }, '게시판을 불러오는 중입니다.') },
  errorComponent: { render: () => h('div', { class: 'coming-soon', role: 'alert' }, '게시판을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.') },
})

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
