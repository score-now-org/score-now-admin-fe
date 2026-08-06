<template>
  <BaseModal v-model="visible" :title="modalTitle" width="560px">
    <div class="modal-content">
      <div class="summary-row">
        <div class="team-box">
          <img
            v-if="match?.homeTeam?.emblemUrl"
            class="team-emblem"
            :src="match.homeTeam.emblemUrl"
            :alt="`${match.homeTeam.name} 엠블럼`"
          />
          <span>{{ match?.homeTeam?.name || '-' }}</span>
        </div>
        <span class="versus">VS</span>
        <div class="team-box">
          <img
            v-if="match?.awayTeam?.emblemUrl"
            class="team-emblem"
            :src="match.awayTeam.emblemUrl"
            :alt="`${match.awayTeam.name} 엠블럼`"
          />
          <span>{{ match?.awayTeam?.name || '-' }}</span>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">경기 ID</span>
          <span class="info-value">{{ match?.id || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">경기 시간</span>
          <span class="info-value">{{ matchTime }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">홈 스코어</span>
          <input class="mini-input" value="0" type="number" min="0" />
        </div>
        <div class="info-item">
          <span class="info-label">원정 스코어</span>
          <input class="mini-input" value="0" type="number" min="0" />
        </div>
        <div class="info-item">
          <span class="info-label">진행 시간</span>
          <input class="mini-input" value="00:00" type="text" />
        </div>
        <div class="info-item">
          <span class="info-label">상태</span>
          <BaseBadge variant="blue">중계 관리</BaseBadge>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="outline" @click="visible = false">닫기</BaseButton>
      <BaseButton variant="primary" @click="visible = false">저장</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  match: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)

const modalTitle = computed(() => (
  props.match ? `중계 정보 관리 #${props.match.id}` : '중계 정보 관리'
))

const matchTime = computed(() => {
  if (!props.match) return '-'
  return `${props.match.startDate} ${props.match.startTime}`
})

watch(
  () => props.modelValue,
  (value) => {
    visible.value = value
  },
)

watch(visible, (value) => emit('update:modelValue', value))
</script>

<style scoped>
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-row {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.team-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 0;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
}

.team-emblem {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 50%;
}

.versus {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.info-item {
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.info-label {
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
}

.info-value {
  color: #374151;
  font-size: 12px;
}

.mini-input {
  width: 86px;
  box-sizing: border-box;
  padding: 5px 8px;
  color: #232323;
  font-family: inherit;
  font-size: 12px;
  background: #f3f3f3;
  border: 1px solid #e9e9e9;
  border-radius: 4px;
  outline: none;
}

.mini-input:focus {
  background: #fff;
  border-color: #1c67ff;
}

@media (max-width: 640px) {
  .summary-row,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .versus {
    display: none;
  }
}
</style>
