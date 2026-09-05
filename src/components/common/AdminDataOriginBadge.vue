<template>
  <BaseBadge class="data-origin-badge" :variant="variant">
    {{ label }}
  </BaseBadge>
</template>

<script setup>
import { computed } from 'vue'
import BaseBadge from './BaseBadge.vue'

const props = defineProps({
  dataOrigin: {
    type: String,
    default: '',
  },
})

const normalizedDataOrigin = computed(() => String(props.dataOrigin ?? '').trim().toUpperCase())

const label = computed(() => {
  if (normalizedDataOrigin.value === 'MANUAL') return '수동'
  if (normalizedDataOrigin.value === 'BETS') return 'BETS'
  return '미지정'
})

const variant = computed(() => {
  if (normalizedDataOrigin.value === 'MANUAL') return 'yellow'
  if (normalizedDataOrigin.value === 'BETS') return 'blue'
  return 'gray'
})
</script>
