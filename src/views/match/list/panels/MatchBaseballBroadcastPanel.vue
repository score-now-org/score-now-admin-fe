<template>
  <aside class="broadcast-panel">
    <div class="panel-header">
      <div>
        <p class="panel-kicker">{{ matchLeague }}</p>
        <h3 class="panel-title">{{ homeTeamName }} vs {{ awayTeamName }}</h3>
      </div>
      <button class="panel-close" type="button" @click="$emit('close')">×</button>
    </div>

    <div class="panel-body"></div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  match: { type: Object, default: null },
})

defineEmits(['close'])

const homeTeamName = computed(() => props.match?.homeTeam?.name || '홈팀')
const awayTeamName = computed(() => props.match?.awayTeam?.name || '원정팀')
const matchLeague = computed(() => props.match?.leagueName || props.match?.leagueId || '-')
</script>

<style scoped>
.broadcast-panel {
  position: fixed;
  top: 52px;
  right: 0;
  bottom: 0;
  z-index: 180;
  display: flex;
  width: clamp(560px, 48vw, 760px);
  max-width: calc(100vw - 220px);
  flex-direction: column;
  background: #fff;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 12px 0 0 12px;
  box-shadow: -8px 0 24px rgba(15, 23, 42, 0.16);
  animation: panel-slide-in 0.18s ease-out;
}

@keyframes panel-slide-in {
  from {
    transform: translateX(24px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.panel-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #dbe3ec;
  border-radius: 12px 0 0 0;
}

.panel-kicker {
  margin: 0 0 3px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
}

.panel-title {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 700;
}

.panel-close {
  width: 28px;
  height: 28px;
  color: #6b7280;
  font-size: 18px;
  line-height: 1;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
}

.panel-close:hover {
  background: #f3f4f6;
}

.panel-body {
  flex: 1;
  background: #fff;
}

@media (max-width: 960px) {
  .broadcast-panel {
    top: 52px;
    width: 100vw;
    max-width: 100vw;
  }
}
</style>
