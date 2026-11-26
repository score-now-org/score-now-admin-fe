<template>
  <BaseModal :model-value="modelValue" title="금칙어 등록" size="sm" :close-disabled="saving" @update:model-value="$emit('update:modelValue', $event)">
    <form id="forbidden-word-form" class="modal-form" @submit.prevent="submit">
      <div class="modal-field"><label class="modal-label" for="forbidden-word">금칙어</label><BaseInput id="forbidden-word" v-model="word" maxlength="100" required /></div>
      <div class="modal-field"><label class="modal-label" for="replacement">변환 문구</label><BaseInput id="replacement" v-model="replacement" maxlength="100" placeholder="???" /><span class="modal-help">비워두면 ???로 변환합니다.</span></div>
      <p v-if="error" class="modal-error" role="alert">{{ error }}</p>
    </form>
    <template #footer><BaseButton variant="outline" :disabled="saving" @click="$emit('update:modelValue', false)">취소</BaseButton><BaseButton variant="success" type="submit" form="forbidden-word-form" :disabled="saving">{{ saving ? '등록 중...' : '등록' }}</BaseButton></template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { createForbiddenWord } from '@/api/forbiddenWord.js'
const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'created'])
const word = ref(''), replacement = ref(''), error = ref(''), saving = ref(false)
watch(() => props.modelValue, visible => { if (visible) { word.value = ''; replacement.value = ''; error.value = '' } })
async function submit() {
  if (saving.value) return
  if (!word.value.trim()) { error.value = '금칙어를 입력해 주세요.'; return }
  saving.value = true; error.value = ''
  try {
    await createForbiddenWord({ word: word.value.trim(), replacement: replacement.value })
    emit('update:modelValue', false); emit('created')
  } catch (err) { error.value = err.response?.data?.error?.message || '금칙어를 등록하지 못했습니다.' }
  finally { saving.value = false }
}
</script>
