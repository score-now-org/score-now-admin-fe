<template>
  <span class="base-badge" :class="`base-badge--${variant}`">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'gray',
    validator: (value) => ['blue', 'red', 'yellow', 'green', 'gray'].includes(value),
  },
})
</script>

<style scoped>
/* 모든 전문 배지가 공유하는 크기·간격·알약 형태 */
.base-badge {
  display: inline-flex;
  min-height: 23px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  box-sizing: border-box;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.base-badge--blue {
  color: #3864bd;
  background: #edf3ff;
}

.base-badge--red {
  color: #c53c46;
  background: #fff0f0;
}

.base-badge--yellow {
  color: #9a6511;
  background: #fff5d9;
}

.base-badge--green {
  color: #18734b;
  background: #eaf8f1;
}

.base-badge--gray {
  color: #5f6878;
  background: #eef1f5;
}
</style>
