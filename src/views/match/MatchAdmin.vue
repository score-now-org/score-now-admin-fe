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
        <PlayerMngr v-else-if="activeSidebar === '선수'" />
        <StadiumMngr v-else-if="activeSidebar === '경기장'" />
        <PushMngr v-else-if="activeSidebar === 'PUSH'" />
        <CasterMngr v-else-if="activeSidebar === '캐스터'" />

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
import PlayerMngr from './player/PlayerMngr.vue'
import StadiumMngr from './stadium/StadiumMngr.vue'
import PushMngr from './push/PushMngr.vue'
import CasterMngr from './caster/CasterMngr.vue'

const route = useRoute()
const router = useRouter()

const sidebarItems = [
  { label: '경기 리스트', path: '/admin/match/list' },
  { label: '상단고정/핫매치', path: '/admin/match/featured' },
  { label: '순위', path: '/admin/match/standings' },
  { label: '리그', path: '/admin/match/leagues' },
  { label: '팀', path: '/admin/match/teams' },
  { label: '선수', path: '/admin/match/players' },
  { label: '스쿼드/결장자', path: '/admin/match/squads' },
  { label: '경기장', path: '/admin/match/stadiums' },
  { label: 'PUSH', path: '/admin/match/pushes' },
  { label: '캐스터', path: '/admin/match/casters' },
]

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
