<template>
  <BaseModal :model-value="modelValue" :title="item ? '버전 수정' : '버전 추가'" size="md" :close-disabled="saving" @update:model-value="$emit('update:modelValue', $event)">
    <form id="version-editor" class="modal-form" @submit.prevent="submit">
      <div class="modal-field">
        <label class="modal-label" for="version-name">버전 정보</label>
        <BaseInput id="version-name" v-model="form.versionName" maxlength="40" required placeholder="예: 51.0.4" />
      </div>
      <div class="modal-field">
        <label class="modal-label" for="version-platform">OS</label>
        <BaseSelect id="version-platform" v-model="form.platform">
          <option value="ALL">공통</option><option value="IOS">iOS</option><option value="ANDROID">Android</option>
        </BaseSelect>
      </div>
      <div class="modal-field">
        <label class="modal-label" for="version-date">업데이트 날짜</label>
        <BaseInput id="version-date" v-model="form.releaseDate" type="date" required />
      </div>
      <div class="modal-field">
        <label class="modal-label" for="version-content">업데이트 내용</label>
        <BaseTextarea id="version-content" v-model="form.content" rows="4" maxlength="3000" required />
      </div>
      <p v-if="error" class="modal-error" role="alert">{{ error }}</p>
    </form>
    <template #footer>
      <BaseButton variant="outline" :disabled="saving" @click="$emit('update:modelValue', false)">취소</BaseButton>
      <BaseButton variant="primary" type="submit" form="version-editor" :disabled="saving">{{ saving ? '저장 중...' : '저장' }}</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { createAppVersion, updateAppVersion } from '@/api/adminVersions.js'
const props = defineProps({ modelValue: Boolean, item: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'saved'])
const emptyForm = () => ({ versionName: '', platform: 'ALL', releaseDate: '', content: '' })
const form = ref(emptyForm()), saving = ref(false), error = ref('')
watch(() => props.modelValue, visible => {
  if (visible) { form.value = props.item ? { versionName: props.item.versionName, platform: props.item.platform, releaseDate: props.item.releaseDate, content: props.item.content } : emptyForm(); error.value = '' }
})
async function submit() {
  if (saving.value) return
  const data = { ...form.value, versionName: form.value.versionName.trim(), content: form.value.content.trim() }
  if (!data.versionName || !data.content || !data.releaseDate) { error.value = '버전 정보, 날짜와 내용을 입력해 주세요.'; return }
  saving.value = true; error.value = ''
  try {
    if (props.item) await updateAppVersion(props.item.id, data)
    else await createAppVersion(data)
    emit('update:modelValue', false); emit('saved')
  } catch (e) { error.value = e.response?.data?.error?.message || '버전을 저장하지 못했습니다.' }
  finally { saving.value = false }
}
</script>
