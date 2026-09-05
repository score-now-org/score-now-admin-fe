<template>
  <BaseBadge class="sport-badge" :variant="variant">
    {{ label }}
  </BaseBadge>
</template>

<script setup>
import { computed } from 'vue'
import BaseBadge from './BaseBadge.vue'

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
  ) return 'green'

  if (
    normalizedSportCode.value === 'BASEBALL'
    || includesAny(normalizedSportName.value, ['야구', 'baseball'])
  ) return 'blue'

  if (
    normalizedSportCode.value === 'BASKETBALL'
    || includesAny(normalizedSportName.value, ['농구', 'basketball'])
  ) return 'yellow'

  return 'gray'
})

function includesAny(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword))
}
</script>

<style scoped>
.sport-badge {
  min-width: 42px;
}
</style>
