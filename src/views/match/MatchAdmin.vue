<template>
  <div class="page-wrap">
    <div class="body-wrap">
      <AppSidebar
        v-model="activeSidebar"
        title="경기"
        :items="sidebarItems"
      />

      <main class="main-content">
        <MatchListMngr v-if="activeSidebar === '경기 리스트'" />

        <div v-else class="coming-soon">
          {{ activeSidebar }} 준비 중입니다.
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MatchListMngr from './list/MatchListMngr.vue'

const activeSidebar = ref('경기 리스트')

const sidebarItems = [
  { label: '경기 리스트' },
  { label: '상단고정/핫매치' },
  { label: '순위' },
  { label: '리그' },
  { label: '팀' },
  { label: '선수' },
  { label: '스쿼드/결장자' },
  { label: '경기장' },
]
</script>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 52px);
  min-height: 0;
  background-color: #f9fafb;
  font-size: 13px;
  color: #1f2937;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
}

.body-wrap {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.coming-soon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  font-size: 14px;
  color: #9ca3af;
}
</style>
