<template>
  <span class="sport-badge" :class="`sport-badge--${variant}`">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sportCode: {
    type: String,
    default: '',
  },
  sportName: {
    type: String,
    default: '',
  },
})

const normalizedSportCode = computed(() => String(props.sportCode ?? '').trim().toUpperCase())
const normalizedSportName = computed(() => String(props.sportName ?? '').trim().toLowerCase())

const label = computed(() => {
  const sportName = String(props.sportName ?? '').trim()
  const sportCode = String(props.sportCode ?? '').trim()
  return sportName || sportCode || '-'
})

const variant = computed(() => {
  if (
    ['FOOTBALL', 'SOCCER'].includes(normalizedSportCode.value)
    || includesAny(normalizedSportName.value, ['축구', 'football', 'soccer'])
  ) return 'football'

  if (
    normalizedSportCode.value === 'BASEBALL'
    || includesAny(normalizedSportName.value, ['야구', 'baseball'])
  ) return 'baseball'

  if (
    normalizedSportCode.value === 'BASKETBALL'
    || includesAny(normalizedSportName.value, ['농구', 'basketball'])
  ) return 'basketball'

  return 'other'
})

function includesAny(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword))
}
</script>

<style scoped>
.sport-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 23px;
  padding: 0 8px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.sport-badge--football {
  color: #18734b;
  background: #eaf8f1;
}

.sport-badge--baseball {
  color: #3864bd;
  background: #edf3ff;
}

.sport-badge--basketball {
  color: #b85a19;
  background: #fff3e7;
}

.sport-badge--other {
  color: #5f6878;
  background: #eef1f5;
}
</style>
