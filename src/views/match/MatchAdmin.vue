<template>
  <div class="page-wrap">
    <div class="body-wrap">
      <AppSidebar
        v-model="activeSidebar"
        title="메뉴"
        :items="sidebarItems"
      />

      <main class="main-content">
        <MatchListMngr v-if="activeSidebar === '경기 리스트'" />
        <FeaturedMatchMngr v-else-if="activeSidebar === '상단고정/핫매치'" />
        <LeagueMngr v-else-if="activeSidebar === '리그'" />
        <TeamMngr v-else-if="activeSidebar === '팀'" />
        <StadiumMngr v-else-if="activeSidebar === '경기장'" />

        <div v-else class="coming-soon">
          {{ activeSidebar }} 준비 중입니다.
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MatchListMngr from './list/MatchListMngr.vue'
import LeagueMngr from './league/LeagueMngr.vue'
import FeaturedMatchMngr from './featured/FeaturedMatchMngr.vue'
import TeamMngr from './team/TeamMngr.vue'
import StadiumMngr from './stadium/StadiumMngr.vue'

const route = useRoute()
const router = useRouter()

const sidebarItems = [
  { label: '경기 리스트', path: '/admin/menu/match-list' },
  { label: '상단고정/핫매치', path: '/admin/menu/featured-matches' },
  { label: '순위', path: '/admin/menu/standings' },
  { label: '리그', path: '/admin/menu/leagues' },
  { label: '팀', path: '/admin/menu/teams' },
  { label: '선수', path: '/admin/menu/players' },
  { label: '스쿼드/결장자', path: '/admin/menu/squads' },
  { label: '경기장', path: '/admin/menu/stadiums' },
]

const legacyPathMap = {
  '/admin/match': '경기 리스트',
  '/admin/match/list': '경기 리스트',
  '/admin/match/league': '리그',
}

const activeSidebar = ref(resolveActiveSidebar(route.path))

watch(
  () => route.path,
  (path) => {
    activeSidebar.value = resolveActiveSidebar(path)
  },
)

watch(activeSidebar, (label) => {
  const targetPath = sidebarItems.find((item) => item.label === label)?.path

  if (targetPath && route.path !== targetPath) {
    router.push(targetPath)
  }
})

function resolveActiveSidebar(path) {
  return sidebarItems.find((item) => item.path === path)?.label
    || legacyPathMap[path]
    || '경기 리스트'
}
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
  container-name: admin-content;
  container-type: inline-size;
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
