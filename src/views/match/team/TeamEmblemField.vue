<template>
  <div class="modal-field" role="group" :aria-labelledby="labelId">
    <p :id="labelId" class="modal-label">{{ label }}</p>
    <div class="emblem-editor">
      <div class="emblem-preview">
        <img v-if="displayUrl" :src="displayUrl" alt="팀 이미지 미리보기" />
        <span v-else>{{ removeEmblem ? '저장 시 제거' : '이미지 없음' }}</span>
      </div>
      <div class="emblem-controls">
        <input
          ref="fileInput"
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          :disabled="disabled"
          hidden
          @change="selectFile"
        />
        <p v-if="file" class="modal-help emblem-file-name">{{ file.name }}</p>
        <div class="emblem-actions">
          <template v-if="removeEmblem">
            <BaseButton type="button" variant="outline" size="sm" :disabled="disabled" @click="cancelRemoval">
              제거 취소
            </BaseButton>
          </template>
          <template v-else>
            <BaseButton
              type="button"
              variant="outline"
              size="sm"
              :disabled="disabled"
              :aria-describedby="helpId"
              @click="fileInput?.click()"
            >
              {{ pickerLabel }}
            </BaseButton>
            <BaseButton v-if="file" type="button" variant="outline" size="sm" :disabled="disabled" @click="clearFile">
              선택 취소
            </BaseButton>
            <BaseButton v-else-if="currentImageUrl" type="button" variant="danger" size="sm" :disabled="disabled" @click="markForRemoval">
              이미지 제거
            </BaseButton>
          </template>
        </div>
        <p :id="helpId" class="modal-help">JPG, PNG, WEBP · 최대 5MB</p>
        <p v-if="fileError" class="modal-error" role="alert">{{ fileError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, useId, watch } from 'vue'

const props = defineProps({
  label: { type: String, default: '팀 이미지' },
  currentImageUrl: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const file = defineModel('file', { default: null })
const removeEmblem = defineModel('removeEmblem', { type: Boolean, default: false })
const labelId = useId()
const helpId = useId()
const fileInput = ref(null)
const fileError = ref('')
const previewUrl = ref('')
const displayUrl = computed(() => removeEmblem.value ? '' : previewUrl.value || props.currentImageUrl)
const pickerLabel = computed(() => {
  if (file.value) return '다른 이미지 선택'
  return props.currentImageUrl ? '이미지 변경' : '이미지 등록'
})

const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxImageSize = 5 * 1024 * 1024

watch(file, (image, _, onCleanup) => {
  const url = image ? URL.createObjectURL(image) : ''
  previewUrl.value = url
  if (url) onCleanup(() => URL.revokeObjectURL(url))
}, { immediate: true })

function selectFile(event) {
  const input = event.target
  const image = input.files?.[0]
  input.value = ''
  if (!image) return

  if (!allowedImageTypes.includes(image.type) || !/\.(jpe?g|png|webp)$/i.test(image.name)) {
    fileError.value = 'JPG, PNG, WEBP 이미지만 등록할 수 있습니다.'
    return
  }
  if (image.size === 0 || image.size > maxImageSize) {
    fileError.value = '비어 있지 않은 5MB 이하 이미지를 선택해 주세요.'
    return
  }

  fileError.value = ''
  file.value = image
}

function clearFile() {
  fileError.value = ''
  file.value = null
}

function markForRemoval() {
  fileError.value = ''
  removeEmblem.value = true
}

function cancelRemoval() {
  removeEmblem.value = false
}
</script>

<style scoped>
.emblem-editor {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.emblem-preview {
  display: grid;
  width: 96px;
  height: 80px;
  flex: 0 0 96px;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
  background: var(--admin-color-surface-subtle);
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-label);
}

.emblem-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.emblem-controls {
  display: grid;
  flex: 1 1 220px;
  min-width: 0;
  gap: var(--admin-field-gap);
}

.emblem-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--admin-action-gap);
}

.emblem-file-name {
  overflow-wrap: anywhere;
}
</style>
