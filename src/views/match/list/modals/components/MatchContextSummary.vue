<template>
  <div class="match-context-summary">
    <div class="match-context-summary__copy">
      <span>대상 경기</span>
      <strong>
        {{ match?.homeTeam?.name || '-' }}
        <em>vs</em>
        {{ match?.awayTeam?.name || '-' }}
      </strong>
      <small>{{ metaText }}</small>
    </div>

    <div class="match-context-summary__badges">
      <AdminSportBadge
        :sport-code="match?.sportCode"
        :sport-name="match?.sportName || match?.sport"
      />
      <slot name="badges" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AdminSportBadge from '@/components/common/AdminSportBadge.vue'

const props = defineProps({
  match: { type: Object, default: null },
})

const matchTime = computed(() => (
  [props.match?.startDate, props.match?.startTime].filter(Boolean).join(' ')
))

const metaText = computed(() => (
  [matchTime.value, `경기 ID ${props.match?.id || '-'}`].filter(Boolean).join(' · ')
))
</script>

<style scoped>
.match-context-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}

.match-context-summary__copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.match-context-summary__copy > span {
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-table-heading);
  font-weight: 800;
}

.match-context-summary__copy strong {
  overflow: hidden;
  color: var(--admin-color-text-body);
  font-size: var(--admin-font-size-description);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.match-context-summary__copy em {
  padding: 0 4px;
  color: var(--admin-color-text-subtle);
  font-size: var(--admin-font-size-table-heading);
  font-style: normal;
}

.match-context-summary__copy small {
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-table-heading);
}

.match-context-summary__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 600px) {
  .match-context-summary {
    align-items: start;
  }
}
</style>
