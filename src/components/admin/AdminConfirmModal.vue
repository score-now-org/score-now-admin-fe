<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    keyboard
    :return-focus="returnFocus"
    :described-by="message ? messageId : undefined"
    @update:model-value="$emit('cancel')"
  >
    <p v-if="message" :id="messageId" class="confirm-message">{{ message }}</p>
    <template #footer>
      <BaseButton
        v-if="cancelLabel"
        type="button"
        variant="outline"
        :autofocus="initialFocus === 'cancel'"
        @click="$emit('cancel')"
      >{{ cancelLabel }}</BaseButton>
      <BaseButton
        type="button"
        :variant="confirmVariant"
        :autofocus="initialFocus === 'confirm' || !cancelLabel"
        @click="$emit('confirm')"
      >{{ confirmLabel }}</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { useId } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  cancelLabel: { type: String, default: '취소' },
  confirmLabel: { type: String, default: '확인' },
  confirmVariant: { type: String, default: 'primary' },
  initialFocus: { type: String, default: 'cancel' },
  returnFocus: { type: Object, default: null },
})
defineEmits(['cancel', 'confirm'])
const messageId = useId()
</script>

<style scoped>
.confirm-message {
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
}
</style>
