<template>
  <AdminConfirmModal
    :model-value="!!action"
    title="저장하지 않은 변경 사항"
    :message="'저장하지 않은 입력을 버리고 ' + labels[action]?.question"
    cancel-label="계속 편집"
    :confirm-label="labels[action]?.button"
    :return-focus="returnFocus"
    @cancel="$emit('cancel')"
    @confirm="$emit('confirm')"
  />
</template>

<script setup>
import AdminConfirmModal from './AdminConfirmModal.vue'

defineProps({
  action: { type: String, default: '' },
  returnFocus: { type: Object, default: null },
})
defineEmits(['confirm', 'cancel'])

const labels = {
  close: { question: '닫을까요?', button: '버리고 닫기' },
  refresh: { question: '새로고침할까요?', button: '버리고 새로고침' },
  switch: { question: '다른 경기로 이동할까요?', button: '버리고 이동' },
}
</script>
