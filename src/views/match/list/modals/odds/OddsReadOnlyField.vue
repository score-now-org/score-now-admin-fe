<template>
  <div class="readonly-odds-field">
    <span>{{ label }}</span>
    <output>{{ displayValue }}</output>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: null },
  notApplicable: { type: Boolean, default: false },
})

const displayValue = computed(() => {
  if (props.notApplicable) return '해당 없음'
  if (props.value == null || props.value === '') return '-'

  const number = Number(props.value)
  return Number.isFinite(number) ? number.toFixed(2) : '-'
})
</script>

<style scoped>
.readonly-odds-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.readonly-odds-field > span {
  color: var(--admin-color-text-muted);
  font-size: 10px;
  font-weight: 700;
}

.readonly-odds-field output {
  display: flex;
  min-height: var(--admin-control-height);
  align-items: center;
  box-sizing: border-box;
  padding: 0 var(--admin-control-padding-inline);
  color: var(--admin-color-text-control);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  background: var(--admin-color-table-heading-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
}
</style>
