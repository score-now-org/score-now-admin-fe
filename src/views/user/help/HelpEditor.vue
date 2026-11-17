<template>
  <BaseModal :model-value="modelValue" :title="item ? '도움말 수정' : '도움말 등록'" size="lg" :close-disabled="busy" @update:model-value="$emit('update:modelValue', $event)">
    <form id="help-editor" class="modal-form" @submit.prevent="submit">
      <div class="modal-field">
        <label class="modal-label" for="help-content">내용</label>
        <BaseTextarea id="help-content" v-model="content" :rows="8" maxlength="3000" placeholder="도움말 내용을 입력해 주세요." />
      </div>
      <div class="modal-field">
        <label class="modal-label" for="help-image">이미지</label>
        <input id="help-image" ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" @change="selectFile" />
        <span class="modal-help">JPG, PNG, WEBP · 최대 5MB</span>
        <img v-if="imageUrl" :src="imageUrl" alt="선택한 도움말 이미지" class="preview" />
        <BaseButton v-if="imageKey || file" variant="outline" size="sm" type="button" @click="removeImage">이미지 제거</BaseButton>
      </div>
      <p v-if="error || saveError" class="modal-error" role="alert">{{ error || saveError }}</p>
    </form>
    <template #footer>
      <BaseButton variant="outline" :disabled="busy" @click="$emit('update:modelValue', false)">취소</BaseButton>
      <BaseButton variant="primary" type="submit" form="help-editor" :disabled="busy">{{ busy ? '저장 중...' : '임시 저장' }}</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { uploadHelpImage } from '@/api/adminHelp.js'
const props = defineProps({ modelValue: Boolean, item: { type: Object, default: null }, saving: Boolean, saveError: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue', 'save'])
const content = ref(''), imageKey = ref(null), imageUrl = ref(null), file = ref(null), error = ref(''), uploading = ref(false)
const fileInput = ref(null)
const busy = ref(false)
let previewUrl = null
function releasePreview() { if (previewUrl) URL.revokeObjectURL(previewUrl); previewUrl = null }
watch(() => props.modelValue, visible => {
  if (!visible) { releasePreview(); return }
  content.value = props.item?.content || ''; imageKey.value = props.item?.imageKey || null
  imageUrl.value = props.item?.imageUrl || null; file.value = null; error.value = ''
})
watch(() => props.saving, value => { busy.value = value || uploading.value })
function selectFile(event) {
  const selected = event.target.files?.[0]
  if (!selected) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 5 * 1024 * 1024) {
    error.value = 'JPG, PNG, WEBP 이미지 5MB 이하만 첨부할 수 있습니다.'; event.target.value = ''; return
  }
  releasePreview(); previewUrl = URL.createObjectURL(selected); imageUrl.value = previewUrl; file.value = selected; error.value = ''
}
function removeImage() { releasePreview(); file.value = null; imageKey.value = null; imageUrl.value = null; if (fileInput.value) fileInput.value.value = '' }
async function submit() {
  if (busy.value) return
  if (!content.value.trim() && !imageKey.value && !file.value) { error.value = '내용이나 이미지를 입력해 주세요.'; return }
  error.value = ''
  try {
    if (file.value) {
      busy.value = true; uploading.value = true
      const result = (await uploadHelpImage(file.value)).data.data
      imageKey.value = result.key; imageUrl.value = result.url; file.value = null
    }
    emit('save', { id: props.item?.id || crypto.randomUUID(), content: content.value.trim(), imageKey: imageKey.value, imageUrl: imageUrl.value })
  } catch (e) { error.value = e.response?.data?.error?.message || '이미지를 업로드하지 못했습니다.' }
  finally { uploading.value = false; busy.value = props.saving }
}
onBeforeUnmount(releasePreview)
</script>

<style scoped>
.preview { display: block; max-width: 100%; max-height: 220px; object-fit: contain; }
</style>
