<template>
  <textarea
    class="base-textarea"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  rows: { type: [Number, String], default: 4 },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.base-textarea {
  width: 100%;
  min-height: 96px;
  box-sizing: border-box;
  padding: 9px var(--admin-control-padding-inline, 10px);
  color: var(--admin-color-text-control, #263248);
  font-family: inherit;
  font-size: var(--admin-font-size-description, 12px);
  line-height: 1.5;
  resize: vertical;
  background: var(--admin-color-surface-subtle, #fbfcfe);
  border: 1px solid var(--admin-color-control-border, #dce2eb);
  border-radius: var(--admin-control-radius, 6px);
  outline: none;
  transition:
    color 0.15s,
    background 0.15s,
    border-color 0.15s,
    box-shadow 0.15s;
}

.base-textarea:focus {
  background: var(--admin-color-surface, #fff);
  border-color: var(--admin-color-primary, #1c67ff);
  box-shadow: var(--admin-focus-ring, 0 0 0 3px rgb(28 103 255 / 8%));
}

.base-textarea:disabled {
  color: var(--admin-color-text-subtle, #8892a3);
  background: var(--admin-color-table-heading-surface, #f7f9fc);
  cursor: not-allowed;
  opacity: .65;
}

.base-textarea::placeholder {
  color: var(--admin-color-text-muted, #778195);
}
</style>
