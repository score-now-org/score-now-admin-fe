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
    // primary | secondary | success | outline | danger | warn
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  color: inherit;
  font-family: inherit;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  appearance: none;
  border: 1px solid transparent;
  border-radius: var(--admin-control-radius, 6px);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s, box-shadow 0.15s;
}

.base-btn:focus-visible {
  outline: 2px solid var(--admin-color-primary, #1c67ff);
  outline-offset: 2px;
}

.base-btn.disabled,
.base-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── 크기 ── */
.sm { height: 28px; padding: 0 10px; font-size: 11px; }
.md { height: 34px; padding: 0 16px; font-size: 12px; }
.lg { height: 40px; padding: 0 24px; font-size: 14px; }

/* ── 종류 ── */
.primary   { background: #1C67FF; color: #fff; }
.primary:hover:not(.disabled)   { background: #1450cc; }

.secondary { background: #666666; color: #fff; }
.secondary:hover:not(.disabled) { background: #232323; }

.success { background: #0f9f6e; color: #fff; box-shadow: 0 4px 10px rgba(15, 159, 110, .18); }
.success:hover:not(.disabled) { background: #0b8059; }

.outline   { background: #fff; color: #4b5563; border-color: #d1d5db; }
.outline:hover:not(.disabled)   { background: #f3f4f6; }

.danger    { background: #fff; color: #ef4444; border-color: #f87171; }
.danger:hover:not(.disabled)    { background: #fef2f2; }

.warn      { background: #fff; color: #f97316; border-color: #fb923c; }
.warn:hover:not(.disabled)      { background: #fff7ed; }


</style>
