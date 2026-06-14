<template>
  <span class="base-badge" :class="variant">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'gray',
    // blue | red | yellow | green | gray
  }
})
</script>

<style scoped>
.base-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.blue   { background: #dbeafe; color: #1d4ed8; }
.red    { background: #fee2e2; color: #dc2626; }
.yellow { background: #fef9c3; color: #a16207; }
.green  { background: #dcfce7; color: #16a34a; }
.gray   { background: #f3f4f6; color: #6b7280; }
</style>