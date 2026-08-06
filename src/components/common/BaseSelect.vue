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
  modelValue: { type: String, default: '' },
  disabled:   { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.base-select {
  border: 1px solid #E9E9E9;
  border-radius: 4px;
  padding: 6px 10px;
  font-size: 12px;
  color: #232323;
  background: #F3F3F3;
  outline: none;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s;
}
.base-select:focus { border-color: #1C67FF; background: #fff; }
.base-select:disabled { opacity: 0.5; cursor: not-allowed; }
</style>