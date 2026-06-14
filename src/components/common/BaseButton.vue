<template>
  <button
    class="base-btn"
    :class="[variant, size, { disabled: disabled }]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    // primary | secondary | outline | danger | warn
  },
  size: {
    type: String,
    default: 'md',
    // sm | md | lg
  },
  disabled: {
    type: Boolean,
    default: false,
  }
})
defineEmits(['click'])
</script>

<style scoped>
.base-btn {
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.base-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── 크기 ── */
.sm { padding: 3px 10px; font-size: 11px; }
.md { padding: 6px 16px; font-size: 12px; }
.lg { padding: 10px 24px; font-size: 14px; }

/* ── 종류 ── */
.primary   { background: #1C67FF; color: #fff; }
.primary:hover:not(.disabled)   { background: #1450cc; }

.secondary { background: #666666; color: #fff; }
.secondary:hover:not(.disabled) { background: #232323; }

.outline   { background: #fff; color: #4b5563; border: 1px solid #d1d5db; }
.outline:hover:not(.disabled)   { background: #f3f4f6; }

.danger    { background: #fff; color: #ef4444; border: 1px solid #f87171; }
.danger:hover:not(.disabled)    { background: #fef2f2; }

.warn      { background: #fff; color: #f97316; border: 1px solid #fb923c; }
.warn:hover:not(.disabled)      { background: #fff7ed; }


</style>