<template>
  <BaseModal :model-value="true" :title="`${id}번 문의`" size="lg" :close-disabled="busy" @update:model-value="close">
    <p v-if="loading" role="status">문의를 불러오는 중입니다.</p>
    <div v-else-if="error && !item" role="alert">{{ error }} <BaseButton variant="outline" size="sm" @click="load">다시 조회</BaseButton></div>
    <template v-else-if="item">
      <section class="section">
        <h3>{{ item.nickname || '-' }} / {{ item.userId }}</h3>
        <label class="label" for="inquiry-title">제목</label><BaseInput id="inquiry-title" :model-value="item.title" disabled />
        <label class="label" for="inquiry-content">문의</label><BaseTextarea id="inquiry-content" :model-value="item.content" disabled :rows="5" />
        <p class="label">첨부파일</p>
        <div class="attachment">
          <span v-if="!item.hasAttachment && !item.hasImage">첨부파일 없음</span><span v-else-if="imageLoading">첨부파일을 불러오는 중입니다.</span>
          <div v-else-if="imageUrl"><img v-if="previewType" :src="imageUrl" alt="문의 첨부 이미지" /><p><a :href="imageUrl" :download="downloadName">{{ downloadName }} 내려받기</a></p></div>
          <span v-else role="alert">{{ imageError }} <BaseButton variant="outline" size="sm" @click="loadAttachment">다시 조회</BaseButton></span>
        </div>
      </section>
      <section class="section">
        <h3>답변</h3>
        <InquiryAnswerToolbar :editor="editor" :disabled="busy || unsupportedExistingFormat" :extended="formattingSupported" @change="onInput" @error="error = $event" />
        <div ref="editor" class="editor" :contenteditable="!unsupportedExistingFormat" role="textbox" aria-label="답변 내용" aria-multiline="true" :aria-disabled="busy" :aria-readonly="unsupportedExistingFormat" @input="onInput" @paste.prevent="pasteText" />
        <p class="help">서식을 적용할 텍스트를 선택해 주세요. {{ textLength }} / 10000자</p>
        <p v-if="!formattingSupported" class="help" role="status">서버에서 확장 서식을 지원하지 않아 기본 서식만 사용할 수 있습니다.</p>
        <p v-if="unsupportedExistingFormat" class="help" role="status">기존 확장 서식을 보존하기 위해 서버 업데이트 후 수정할 수 있습니다.</p>
        <p v-if="error" role="alert" class="error">{{ error }}</p>
      </section>
    </template>
    <template #footer><BaseButton variant="outline" :disabled="busy" @click="close">취소</BaseButton><BaseButton :disabled="loading || busy || unsupportedExistingFormat || !item || !dirty || !textLength || textLength > 10000" @click="save">{{ busy ? '저장 중...' : item?.status === 'ANSWERED' ? '수정' : '답변완료' }}</BaseButton></template>
  </BaseModal>
</template>
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import InquiryAnswerToolbar from './InquiryAnswerToolbar.vue'
import { getInquiry, getInquiryAttachment, getInquiryFormattingCapabilities, saveInquiryAnswer } from '@/api/adminInquiry.js'
import { attachmentName, imageContentType } from './inquiryFile.js'
const props = defineProps({ id: { type: Number, required: true } })
const emit = defineEmits(['close', 'saved'])
const item = ref(null), editor = ref(null), loading = ref(true), busy = ref(false), error = ref(''), dirty = ref(false), textLength = ref(0), formattingSupported = ref(false)
const imageLoading = ref(false), imageError = ref(''), imageUrl = ref(''), downloadName = ref(''), previewType = ref('')
const unsupportedExistingFormat = computed(() => !formattingSupported.value && /<(?:span|table|thead|tbody|tr|td|th)\b|\sstyle\s*=/i.test(item.value?.answerHtml || ''))
let initialHtml = '', active = true
async function load() {
  loading.value = true; error.value = ''
  try {
    const [response, capabilities] = await Promise.all([getInquiry(props.id), getInquiryFormattingCapabilities().catch(() => null)]); if (!active) return
    formattingSupported.value = capabilities?.data?.data?.richFormatting === true
    item.value = response.data.data; loading.value = false; await nextTick()
    if (!active || !editor.value) return
    if (item.value.answerHtml) editor.value.innerHTML = item.value.answerHtml
    else editor.value.textContent = item.value.answer || ''
    initialHtml = editor.value.innerHTML; onInput(); if (item.value.hasAttachment || item.value.hasImage) loadAttachment()
  } catch (e) { if (active) error.value = e.response?.status === 401 ? '관리자 로그인이 필요합니다.' : '문의 상세를 불러오지 못했습니다.' }
  finally { if (active) loading.value = false }
}
async function loadAttachment() {
  imageLoading.value = true; imageError.value = ''
  try {
    const response = await getInquiryAttachment(props.id); if (!active) return
    downloadName.value = attachmentName(response.headers['content-disposition'], `inquiry-${props.id}.bin`)
    previewType.value = imageContentType(downloadName.value)
    if (imageUrl.value) URL.revokeObjectURL(imageUrl.value)
    imageUrl.value = URL.createObjectURL(new Blob([response.data], { type: previewType.value || 'application/octet-stream' }))
  } catch { if (active) imageError.value = '첨부파일을 불러오지 못했습니다.' }
  finally { if (active) imageLoading.value = false }
}
function onInput() { if (!editor.value) return; dirty.value = editor.value.innerHTML !== initialHtml; textLength.value = (editor.value.innerText || '').trim().length }
function pasteText(event) { document.execCommand('insertText', false, event.clipboardData.getData('text/plain')); onInput() }
function close() { if (busy.value) return; if (dirty.value && !window.confirm('작성 중인 답변을 버리시겠습니까?')) return; emit('close') }
async function save() {
  if (!editor.value || busy.value || unsupportedExistingFormat.value) return
  const content = (editor.value.innerText || '').trim(), contentHtml = editor.value.innerHTML
  if (!content || content.length > 10000 || contentHtml.length > 10000) { error.value = '답변은 서식을 포함해 10,000자 이내로 입력해 주세요.'; return }
  busy.value = true; error.value = ''; editor.value.contentEditable = 'false'
  try { await saveInquiryAnswer(props.id, { content, contentHtml }); dirty.value = false; emit('saved') }
  catch (e) { error.value = e.response?.status === 401 ? '관리자 로그인이 필요합니다.' : '답변을 저장하지 못했습니다.' }
  finally { busy.value = false; if (editor.value) editor.value.contentEditable = 'true' }
}
function beforeUnload(event) { if (dirty.value || busy.value) { event.preventDefault(); event.returnValue = '' } }
onBeforeRouteLeave(() => !busy.value && (!dirty.value || window.confirm('작성 중인 답변을 버리시겠습니까?')))
onMounted(() => { window.addEventListener('beforeunload', beforeUnload); load() })
onBeforeUnmount(() => { active = false; window.removeEventListener('beforeunload', beforeUnload); if (imageUrl.value) URL.revokeObjectURL(imageUrl.value) })
</script>
<style scoped>
.section { padding: 14px; border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); margin-bottom: 12px; }
h3 { margin: 0 0 12px; font-size: 13px; }
.label { display: block; margin: 12px 0 6px; font-weight: 700; color: var(--admin-color-text-label); }
.attachment { min-height: 70px; padding: 12px; text-align: center; border: 1px dashed var(--admin-color-control-border); }
.attachment img { max-width: 100%; max-height: 260px; object-fit: contain; }
.editor { min-height: 200px; padding: 10px; overflow-wrap: anywhere; white-space: pre-wrap; border: 1px solid var(--admin-color-control-border); }
.editor:focus-visible { outline: 2px solid var(--admin-color-primary); }
.editor :deep(table) { border-collapse: collapse; width: 100%; }
.editor :deep(td), .editor :deep(th) { border: 1px solid var(--admin-color-control-border); min-width: 50px; padding: 4px; }
.help { color: var(--admin-color-text-muted); }
.error { color: #c53c46; }
</style>
