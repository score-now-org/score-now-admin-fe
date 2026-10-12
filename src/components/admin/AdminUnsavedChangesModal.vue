<template>
  <BaseModal :model-value="!!action" title="저장하지 않은 변경 사항" size="sm" @update:model-value="emit('cancel')">
    <div @keydown.esc.stop.prevent="emit('cancel')">
      <p>저장하지 않은 입력을 버리고 {{ labels[action]?.question }}</p>
    </div>
    <template #footer>
      <div ref="actions" class="actions" @keydown.esc.stop.prevent="emit('cancel')">
        <BaseButton variant="outline" @click="emit('cancel')">계속 편집</BaseButton>
        <BaseButton variant="primary" @click="emit('confirm')">{{ labels[action]?.button }}</BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
const props = defineProps({ action: { type: String, default: '' } })
const emit = defineEmits(['confirm', 'cancel'])
const actions = ref(null)
let previousFocus
function onKeydown(event) {
  if (!props.action) return
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopImmediatePropagation()
    emit('cancel')
  }
  if (event.key === 'Tab') {
    const dialog = actions.value?.closest('[role="dialog"]')
    const buttons = [...(dialog?.querySelectorAll('button:not(:disabled)') ?? [])]
    const index = buttons.indexOf(document.activeElement)
    if (buttons.length) {
      event.preventDefault()
      buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus()
    }
  }
}
watch(() => props.action, async (action) => {
  if (action) {
    previousFocus = document.activeElement
    document.addEventListener('keydown', onKeydown, true)
    await nextTick()
    actions.value?.querySelector('button')?.focus()
  } else {
    document.removeEventListener('keydown', onKeydown, true)
    if (previousFocus?.isConnected) previousFocus.focus()
  }
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown, true))
const labels = {
  close: { question: '닫을까요?', button: '버리고 닫기' },
  refresh: { question: '새로고침할까요?', button: '버리고 새로고침' },
  switch: { question: '다른 경기로 이동할까요?', button: '버리고 이동' },
}
</script>

<style scoped>
p { margin: 0; line-height: 1.6; }
.actions { display: flex; gap: 8px; }
</style>
