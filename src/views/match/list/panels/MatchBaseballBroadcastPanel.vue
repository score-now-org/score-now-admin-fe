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
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-border);
  border-right: none;
  border-radius: var(--admin-card-radius) 0 0 var(--admin-card-radius);
  box-shadow: -8px 0 24px rgb(15 23 42 / 14%);
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
  background: var(--admin-color-surface-subtle);
  border-bottom: 1px solid var(--admin-color-divider);
  border-radius: var(--admin-card-radius) 0 0 0;
}

.panel-kicker {
  margin: 0 0 3px;
  color: var(--admin-color-text-muted);
  font-size: 11px;
  font-weight: 600;
}

.panel-title {
  margin: 0;
  color: var(--admin-color-text-title);
  font-size: 17px;
  font-weight: 700;
}

.panel-close {
  width: 28px;
  height: 28px;
  color: var(--admin-color-text-muted);
  font-size: 18px;
  line-height: 1;
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
  cursor: pointer;
}

.panel-close:hover {
  color: var(--admin-color-text-title);
  background: var(--admin-color-table-heading-surface);
}

.panel-body {
  flex: 1;
  background: var(--admin-color-surface);
}

@media (max-width: 960px) {
  .broadcast-panel {
    top: 52px;
    width: 100vw;
    max-width: 100vw;
  }
}
</style>
