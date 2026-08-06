<template>
  <input
    class="base-input"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    @keyup.enter="$emit('enter')"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  type:        { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  disabled:    { type: Boolean, default: false },
})
defineEmits(['update:modelValue', 'enter'])
</script>

<style scoped>
.base-input {
  border: 1px solid #E9E9E9;
  border-radius: 4px;
  padding: 7px 12px;
  font-size: 12px;
  color: #232323;
  background: #F3F3F3;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.base-input:focus {
  border-color: #1C67FF;
  background: #fff;
}
.base-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.base-input::placeholder {
  color: #9A9A9A;
}
</style>