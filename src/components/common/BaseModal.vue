<template>
  <Teleport to="body">
    <div v-if="modelValue" class="base-modal-overlay">
      <div
        class="base-modal-box"
        :class="`base-modal-box--${size}`"
        :style="width ? { '--base-modal-width': width } : undefined"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? titleId : undefined"
        :aria-label="title ? undefined : '모달'"
      >
        <header class="base-modal-header">
          <h2 :id="titleId">{{ title }}</h2>
          <button
            type="button"
            class="base-modal-close"
            aria-label="모달 닫기"
            :disabled="closeDisabled"
            @click="close"
          >
            ✕
          </button>
        </header>

        <div class="base-modal-body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="base-modal-footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useId } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value),
  },
  width: {
    type: String,
    default: '',
  },
  closeDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const titleId = useId()

function close() {
  if (props.closeDisabled) return
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* 공통 모달 셸: 헤더와 푸터는 고정하고 본문만 스크롤한다. */
.base-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 24px;
  background: rgb(15 23 42 / 42%);
}

.base-modal-box {
  display: flex;
  width: min(var(--base-modal-width), 90vw);
  max-height: calc(100vh - 48px);
  max-height: calc(100dvh - 48px);
  flex-direction: column;
  overflow: hidden;
  background: var(--admin-color-surface, #fff);
  border: 1px solid var(--admin-color-border, #e3e8f0);
  border-radius: var(--admin-card-radius, 10px);
  box-shadow: 0 18px 48px rgb(15 23 42 / 22%);
}

.base-modal-box--sm { --base-modal-width: 460px; }
.base-modal-box--md { --base-modal-width: 560px; }
.base-modal-box--lg { --base-modal-width: 720px; }
.base-modal-box--xl { --base-modal-width: 880px; }

.base-modal-header {
  display: flex;
  min-height: 54px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 18px;
  border-bottom: 1px solid var(--admin-color-divider, #edf0f5);
}

.base-modal-header h2 {
  margin: 0;
  color: var(--admin-color-text-title, #111827);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
}

.base-modal-close {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  padding: 0;
  place-items: center;
  color: var(--admin-color-text-subtle, #8892a3);
  font: inherit;
  font-size: 14px;
  background: transparent;
  border: 0;
  border-radius: var(--admin-control-radius, 6px);
  cursor: pointer;
}

.base-modal-close:hover:not(:disabled) {
  color: var(--admin-color-text-title, #111827);
  background: var(--admin-color-table-heading-surface, #f7f9fc);
}

.base-modal-close:focus-visible {
  outline: 2px solid var(--admin-color-primary, #1c67ff);
  outline-offset: 1px;
}

.base-modal-close:disabled {
  cursor: not-allowed;
  opacity: .5;
}

.base-modal-body {
  min-height: 0;
  padding: 18px;
  overflow-y: auto;
  overscroll-behavior: contain;
  color: var(--admin-color-text-body, #172033);
  font-size: var(--admin-font-size-description, 12px);
}

.base-modal-footer {
  display: flex;
  min-height: 58px;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--admin-action-gap, 6px);
  padding: 10px 18px;
  border-top: 1px solid var(--admin-color-divider, #edf0f5);
}

/* 모달 내부 폼의 공통 구조 */
.base-modal-body :deep(.modal-form) {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.base-modal-body :deep(.modal-grid),
.base-modal-body :deep(.form-grid) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 12px;
}

.base-modal-body :deep(.modal-field),
.base-modal-body :deep(.form-row),
.base-modal-body :deep(.form-field) {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--admin-field-gap, 7px);
}

.base-modal-body :deep(.modal-field--wide),
.base-modal-body :deep(.form-row-wide) {
  grid-column: 1 / -1;
}

.base-modal-body :deep(.modal-label),
.base-modal-body :deep(.form-label),
.base-modal-body :deep(.form-field > label) {
  color: var(--admin-color-text-label, #4d586d);
  font-size: var(--admin-font-size-label, 11px);
  font-weight: 700;
}

.base-modal-body :deep(.modal-required),
.base-modal-body :deep(.form-field > label > span) {
  color: #e14d4d;
}

.base-modal-body :deep(.modal-control),
.base-modal-body :deep(.form-control),
.base-modal-body :deep(.form-input),
.base-modal-body :deep(.file-input) {
  width: 100%;
  min-height: var(--admin-control-height, 34px);
  box-sizing: border-box;
  padding: 0 var(--admin-control-padding-inline, 10px);
  color: var(--admin-color-text-control, #263248);
  font: inherit;
  font-size: var(--admin-font-size-description, 12px);
  background: var(--admin-color-surface-subtle, #fbfcfe);
  border: 1px solid var(--admin-color-control-border, #dce2eb);
  border-radius: var(--admin-control-radius, 6px);
  outline: none;
}

.base-modal-body :deep(textarea.modal-control) {
  min-height: 96px;
  padding-block: 9px;
  line-height: 1.5;
  resize: vertical;
}

.base-modal-body :deep(.modal-control:focus),
.base-modal-body :deep(.form-control:focus),
.base-modal-body :deep(.form-input:focus),
.base-modal-body :deep(.file-input:focus) {
  background: var(--admin-color-surface, #fff);
  border-color: var(--admin-color-primary, #1c67ff);
  box-shadow: var(--admin-focus-ring, 0 0 0 3px rgb(28 103 255 / 8%));
}

.base-modal-body :deep(.modal-control:disabled),
.base-modal-body :deep(.form-control:disabled),
.base-modal-body :deep(.form-input:disabled) {
  color: var(--admin-color-text-subtle, #8892a3);
  cursor: not-allowed;
  opacity: .65;
}

.base-modal-body :deep(.modal-help),
.base-modal-body :deep(.file-name),
.base-modal-body :deep(.modal-error),
.base-modal-body :deep(.error-msg) {
  margin: 0;
  font-size: var(--admin-font-size-label, 11px);
  line-height: 1.5;
}

.base-modal-body :deep(.modal-help),
.base-modal-body :deep(.file-name) {
  color: var(--admin-color-text-muted, #778195);
}

.base-modal-body :deep(.modal-error),
.base-modal-body :deep(.error-msg) {
  color: #c53c46;
}

@media (max-width: 600px) {
  .base-modal-overlay {
    padding: 12px;
  }

  .base-modal-box {
    width: 100%;
    max-height: calc(100vh - 24px);
    max-height: calc(100dvh - 24px);
  }

  .base-modal-header {
    min-height: 50px;
    padding-inline: 14px;
  }

  .base-modal-body {
    padding: 14px;
  }

  .base-modal-footer {
    min-height: 54px;
    padding: 9px 14px;
  }

  .base-modal-body :deep(.modal-grid),
  .base-modal-body :deep(.form-grid) {
    grid-template-columns: 1fr;
  }

  .base-modal-body :deep(.modal-field--wide),
  .base-modal-body :deep(.form-row-wide) {
    grid-column: auto;
  }
}
</style>
