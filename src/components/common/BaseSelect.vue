<template>
  <select
    class="base-select"
    :value="modelValue"
    :disabled="disabled"
    @change="$emit('update:modelValue', $event.target.value)"
  >
    <slot />
  </select>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  disabled:   { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.base-select {
  width: 100%;
  min-height: var(--admin-control-height, 34px);
  box-sizing: border-box;
  padding: 0 var(--admin-control-padding-inline, 10px);
  color: var(--admin-color-text-control, #263248);
  font-family: inherit;
  font-size: var(--admin-font-size-description, 12px);
  line-height: 1.4;
  background: var(--admin-color-surface-subtle, #fbfcfe);
  border: 1px solid var(--admin-color-control-border, #dce2eb);
  border-radius: var(--admin-control-radius, 6px);
  outline: none;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}

.base-select:focus {
  background: var(--admin-color-surface, #fff);
  border-color: var(--admin-color-primary, #1c67ff);
  box-shadow: var(--admin-focus-ring, 0 0 0 3px rgb(28 103 255 / 8%));
}

.base-select:disabled {
  color: var(--admin-color-text-subtle, #8892a3);
  background: var(--admin-color-table-heading-surface, #f7f9fc);
  cursor: not-allowed;
  opacity: 0.65;
}
</style>
