<template>
  <span class="data-origin-badge" :class="`data-origin-badge--${variant}`">
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

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
  if (normalizedDataOrigin.value === 'MANUAL') return 'manual'
  if (normalizedDataOrigin.value === 'BETS') return 'bets'
  return 'unknown'
})
</script>

<style scoped>
.data-origin-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 8px;
  border-radius: 999px;
  color: #6b7280;
  background: #f1f3f5;
  font-size: 9px;
  font-weight: 700;
  white-space: nowrap;
}

.data-origin-badge--manual {
  color: #8b5e14;
  background: #fff5d9;
}

.data-origin-badge--bets {
  color: #3972c5;
  background: #edf4ff;
}
</style>
