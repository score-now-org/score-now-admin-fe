<template>
  <BaseModal :model-value="modelValue" :title="item ? '공지 수정' : '공지 등록'" size="lg" :close-disabled="saving" @update:model-value="$emit('update:modelValue', $event)">
    <form id="notice-editor" class="modal-form" @submit.prevent="submit">
      <div class="modal-field"><label class="modal-label" for="notice-title">제목</label><BaseInput id="notice-title" v-model="form.title" maxlength="200" required /></div>
      <div class="modal-field"><label class="modal-label" for="notice-content">내용</label><BaseTextarea id="notice-content" v-model="form.content" maxlength="10000" rows="8" required /></div>
      <div class="modal-grid">
        <div class="modal-field"><label class="modal-label" for="notice-platform">OS</label><BaseSelect id="notice-platform" v-model="form.platform"><option value="ALL">공통</option><option value="ANDROID">Android</option><option value="IOS">iOS</option></BaseSelect></div>
        <div class="modal-field"><label class="modal-label" for="notice-visible">앱 노출 설정</label><BaseSelect id="notice-visible" v-model="form.visibility"><option value="visible">노출</option><option value="hidden">미노출</option></BaseSelect></div>
      </div>
      <div class="modal-field"><label class="modal-label" for="notice-url">연결 링크 (선택)</label><BaseInput id="notice-url" v-model="form.url" type="url" maxlength="2048" placeholder="https://..." /></div>
      <label class="ticker"><input v-model="form.ticker" type="checkbox" /> 공지 티커에도 표시</label>
      <p class="modal-help">저장한 변경사항은 목록의 등록하기 버튼을 눌러야 앱에 반영됩니다.</p>
      <p v-if="error" class="modal-error" role="alert">{{ error }}</p>
    </form>
    <template #footer><BaseButton variant="outline" :disabled="saving" @click="$emit('update:modelValue', false)">취소</BaseButton><BaseButton variant="primary" type="submit" form="notice-editor" :disabled="saving">{{ saving ? '저장 중...' : '임시 저장' }}</BaseButton></template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { createNotice, updateNotice } from '@/api/adminNotices.js'
const props = defineProps({ modelValue: Boolean, item: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'saved'])
const empty = () => ({ title: '', content: '', platform: 'ALL', visibility: 'visible', ticker: false, url: '' })
const form = ref(empty()), saving = ref(false), error = ref('')
watch(() => props.modelValue, visible => {
  if (visible) { const n = props.item; form.value = n ? { title: n.title, content: n.content, platform: n.platform, visibility: n.visible ? 'visible' : 'hidden', ticker: n.ticker, url: n.url || '' } : empty(); error.value = '' }
})
async function submit() {
  if (saving.value) return
  const data = { title: form.value.title.trim(), content: form.value.content.trim(), platform: form.value.platform, visible: form.value.visibility === 'visible', ticker: form.value.ticker, url: form.value.url.trim() || null }
  if (!data.title || !data.content) { error.value = '제목과 내용을 입력해 주세요.'; return }
  saving.value = true; error.value = ''
  try {
    if (props.item) await updateNotice(props.item.id, data); else await createNotice(data)
    emit('update:modelValue', false); emit('saved')
  } catch (e) { error.value = e.response?.data?.error?.message || '공지를 저장하지 못했습니다.' }
  finally { saving.value = false }
}
</script>

<style scoped>
.ticker { display: flex; align-items: center; gap: 6px; }
</style>
