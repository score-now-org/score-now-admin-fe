<template>
  <section class="work-section">
    <div class="section-head">
      <div>
        <h4 class="section-title">중계 멘트</h4>
        <p class="section-desc">중계 멘트를 등록하고 현재 등록된 멘트를 확인합니다.</p>
      </div>
      <div class="section-actions">
        <BaseButton
          variant="outline"
          size="sm"
          :class="{ 'highlight-toggle-active': form.highlight }"
          :aria-pressed="form.highlight"
          @click="form.highlight = !form.highlight"
        >
          강조
        </BaseButton>
        <BaseButton variant="outline" size="sm" @click="openHistoryModal">
          중계글 모음
        </BaseButton>
        <BaseButton
          variant="outline"
          size="sm"
          :class="form.recordEnabled ? 'record-toggle-on' : 'record-toggle-off'"
          :aria-pressed="form.recordEnabled"
          @click="form.recordEnabled = !form.recordEnabled"
        >
          기록 저장 {{ form.recordEnabled ? 'ON' : 'OFF' }}
        </BaseButton>
      </div>
    </div>

    <div
      class="current-comment-summary"
      :class="{
        empty: !currentComment,
        highlighted: currentComment?.highlight,
      }"
    >
      <div class="current-comment-meta-row">
        <span class="current-comment-label">최근 멘트</span>
        <BaseBadge v-if="currentComment?.highlight" variant="red">강조</BaseBadge>
      </div>
      <p v-if="currentComment" class="current-comment-message">
        {{ currentComment.message }}
      </p>
      <p v-else class="current-comment-message muted">
        등록된 멘트가 없습니다.
      </p>
    </div>

    <div class="comment-box" :class="{ highlighted: form.highlight }">
      <BaseTextarea
        v-model="form.message"
        class="comment-textarea"
        placeholder="중계 멘트를 입력하세요."
        aria-label="중계 멘트"
        rows="4"
      />
      <div class="comment-tools">
        <button class="upload-btn" type="button" @click="notifyUnsupportedFeature('사진 추가')">
          사진 추가
        </button>
        <span class="upload-summary">이미지 서버 구축 후 제공됩니다.</span>
      </div>
    </div>

    <p v-if="saveError" class="comment-error" role="alert">{{ saveError }}</p>

    <div class="action-row">
      <BaseButton variant="primary" size="sm" :disabled="saving" @click="requestSave">
        {{ saving ? '저장 중…' : '멘트 저장' }}
      </BaseButton>
      <BaseButton variant="warn" size="sm" @click="notifyUnsupportedFeature('푸시 발송')">
        멘트 저장 &amp; 푸시 발송
      </BaseButton>
    </div>
  </section>

  <BaseModal v-model="historyModalVisible" title="중계글 모음" size="lg">
    <p v-if="historyLoading" class="modal-empty">
      중계글 모음을 불러오는 중입니다.
    </p>
    <p v-else-if="historyError" class="modal-empty error">
      {{ historyError }}
    </p>
    <ul v-else-if="commentHistory.length" class="modal-list">
      <li v-for="comment in commentHistory" :key="comment.id" class="comment-history-item">
        <div class="history-meta">
          <span v-if="comment.time">{{ comment.time }}</span>
          <BaseBadge :variant="comment.highlight ? 'red' : 'gray'">
            {{ comment.highlight ? '강조' : '일반' }}
          </BaseBadge>
        </div>
        <p>{{ comment.message }}</p>
      </li>
    </ul>
    <p v-else class="modal-empty">
      중계글 모음에 표시할 멘트가 없습니다.
    </p>
    <template #footer>
      <BaseButton variant="outline" @click="historyModalVisible = false">닫기</BaseButton>
    </template>
  </BaseModal>

  <BaseModal v-model="confirmModalVisible" title="멘트 저장" size="sm" :close-disabled="saving">
    <p class="confirm-message">작성한 중계 멘트를 저장합니다.</p>
    <template #footer>
      <BaseButton variant="outline" :disabled="saving" @click="confirmModalVisible = false">취소</BaseButton>
      <BaseButton variant="primary" :disabled="saving" @click="saveCommentary">
        {{ saving ? '저장 중…' : '확인' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { createMatchCommentary, getMatchCommentaries } from '@/api/match'

const props = defineProps({
  matchId: { type: [Number, String], default: null },
  currentComment: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'dirty-change', 'busy-change', 'modal-change'])

const form = ref(defaultForm())
const persistedForm = ref(defaultForm())
const saving = ref(false)
const saveError = ref('')
const historyModalVisible = ref(false)
const confirmModalVisible = ref(false)
const historyLoading = ref(false)
const historyError = ref('')
const commentHistory = ref([])
let historyRequestId = 0

const hasUnsavedChanges = computed(() => (
  JSON.stringify(form.value) !== JSON.stringify(persistedForm.value)
))
const modalVisible = computed(() => historyModalVisible.value || confirmModalVisible.value)

watch(hasUnsavedChanges, (value) => emit('dirty-change', value), { immediate: true })
watch(saving, (value) => emit('busy-change', value), { immediate: true })
watch(modalVisible, (value) => emit('modal-change', value), { immediate: true })
watch(() => props.matchId, resetState, { immediate: true })

onBeforeUnmount(() => {
  historyRequestId += 1
})

function defaultForm() {
  return {
    highlight: false,
    recordEnabled: true,
    message: '',
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function resetDraft() {
  form.value = defaultForm()
  persistedForm.value = clone(form.value)
  saveError.value = ''
  confirmModalVisible.value = false
}

function resetState() {
  historyRequestId += 1
  resetDraft()
  historyModalVisible.value = false
  historyLoading.value = false
  historyError.value = ''
  commentHistory.value = []
}

function requestSave() {
  if (!props.matchId) {
    alert('경기 정보를 확인할 수 없습니다.')
    return
  }
  if (!form.value.message.trim()) {
    alert('중계 멘트를 입력해주세요.')
    return
  }
  saveError.value = ''
  confirmModalVisible.value = true
}

async function saveCommentary() {
  if (saving.value || !props.matchId) return

  const requestPayload = {
    content: form.value.message.trim(),
    recordEnabled: form.value.recordEnabled,
    highlighted: form.value.highlight,
  }

  saving.value = true
  saveError.value = ''
  try {
    const response = await createMatchCommentary(props.matchId, requestPayload)
    const savedComment = normalizeSavedCommentary(response, requestPayload)

    emit('saved', savedComment)
    if (savedComment.recorded !== false) {
      commentHistory.value = [
        savedComment,
        ...commentHistory.value.filter((comment) => String(comment.id) !== String(savedComment.id)),
      ]
    }
    form.value.message = ''
    persistedForm.value = clone(form.value)
    confirmModalVisible.value = false
  } catch (error) {
    console.error('중계 멘트 저장에 실패했습니다.', error)
    saveError.value = extractApiErrorMessage(error, '중계 멘트를 저장하지 못했습니다.')
    confirmModalVisible.value = false
  } finally {
    saving.value = false
  }
}

async function openHistoryModal() {
  historyModalVisible.value = true
  await fetchCommentHistory()
}

async function fetchCommentHistory() {
  if (!props.matchId) return

  const requestId = historyRequestId + 1
  historyRequestId = requestId
  historyError.value = ''
  historyLoading.value = true

  try {
    const comments = await getMatchCommentaries(props.matchId)
    if (requestId !== historyRequestId) return
    commentHistory.value = normalizeCommentaries(comments)
  } catch (error) {
    if (requestId !== historyRequestId) return
    console.error('중계글 모음 조회에 실패했습니다.', error)
    commentHistory.value = []
    historyError.value = extractApiErrorMessage(error, '중계글 모음을 불러오지 못했습니다.')
  } finally {
    if (requestId === historyRequestId) historyLoading.value = false
  }
}

function normalizeSavedCommentary(commentary = {}, fallback = {}) {
  const content = commentary?.content
    || commentary?.commentary
    || commentary?.currentCommentary
    || fallback.content

  return {
    id: commentary?.id || commentary?.commentaryId || `saved-${Date.now()}`,
    time: formatHistoryDateTime(commentary?.createdAt),
    message: content,
    highlight: commentary?.highlighted ?? commentary?.highlight ?? fallback.highlighted ?? false,
    recorded: commentary?.recordEnabled ?? commentary?.recorded ?? fallback.recordEnabled ?? true,
  }
}

function normalizeCommentaries(comments) {
  return (Array.isArray(comments) ? comments : []).map((comment, index) => ({
    id: comment.id || comment.commentaryId || `${comment.createdAt || 'comment'}-${index}`,
    time: formatHistoryDateTime(comment.createdAt),
    message: comment.content || '',
    highlight: Boolean(comment.highlighted),
  }))
}

function formatHistoryDateTime(value) {
  if (!value) return ''
  return String(value).replace('T', ' ').slice(0, 16)
}

function extractApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data
  return toErrorMessage(responseData?.message)
    || toErrorMessage(responseData?.error?.message)
    || toErrorMessage(responseData?.error?.details)
    || toErrorMessage(responseData?.error)
    || toErrorMessage(error?.message)
    || fallbackMessage
}

function toErrorMessage(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(toErrorMessage).filter(Boolean).join('\n')
  if (typeof value === 'object') return Object.values(value).map(toErrorMessage).filter(Boolean).join('\n')
  return String(value)
}

function notifyUnsupportedFeature(featureName) {
  alert(`${featureName} 기능은 아직 지원하지 않습니다.`)
}

defineExpose({ resetDraft })
</script>

<style scoped>
.work-section {
  min-width: 0;
  margin: 0;
  padding: 14px 0;
  border-bottom: 1px solid var(--admin-color-divider);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.section-title {
  margin: 0 0 4px;
  color: var(--admin-color-text-title);
  font-size: 13px;
  font-weight: 700;
}

.section-desc {
  margin: 0;
  color: var(--admin-color-text-subtle);
  font-size: 11px;
}

.section-actions,
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.section-actions {
  justify-content: flex-end;
}

.action-row {
  margin-top: 12px;
}

.comment-box {
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
}

.comment-box.highlighted {
  background: #fff7ed;
  border-color: #fb923c;
}

:deep(.base-btn.highlight-toggle-active) {
  color: #9a3412;
  background: #ffedd5;
  border: 1px solid #fb923c;
  font-weight: 700;
}

:deep(.base-btn.highlight-toggle-active:hover:not(.disabled)) {
  background: #fed7aa;
}

:deep(.base-btn.record-toggle-on) {
  color: #18734b;
  background: #eaf8f1;
  border-color: #bfe7d2;
  font-weight: 700;
}

:deep(.base-btn.record-toggle-on:hover:not(.disabled)) {
  background: #ddf3e8;
}

:deep(.base-btn.record-toggle-off) {
  color: #5f6878;
  background: #eef1f5;
  border-color: #dce2eb;
  font-weight: 700;
}

:deep(.base-btn.record-toggle-off:hover:not(.disabled)) {
  background: #e4e8ee;
}

:deep(.base-textarea.comment-textarea) {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  color: #232323;
  font-family: inherit;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  background: transparent;
  border: none;
  outline: none;
}

:deep(.base-textarea.comment-textarea:focus) {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.comment-box:focus-within {
  border-color: #fb923c;
  box-shadow: 0 0 0 2px rgb(251 146 60 / 16%);
}

.comment-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid var(--admin-color-divider);
}

.upload-btn {
  display: inline-flex;
  height: 26px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  color: var(--admin-color-text-control);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: 4px;
  cursor: pointer;
}

.upload-btn:hover {
  background: var(--admin-color-table-heading-surface);
}

.upload-summary {
  color: var(--admin-color-text-subtle);
  font-size: 12px;
}

.current-comment-summary {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: var(--admin-color-table-heading-surface);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}

.current-comment-summary.highlighted {
  background: #fff7ed;
  border-color: #fed7aa;
}

.current-comment-summary.empty {
  background: var(--admin-color-surface-subtle);
}

.current-comment-meta-row {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.current-comment-label {
  flex: 0 0 auto;
  color: var(--admin-color-text-label);
  font-size: 11px;
  font-weight: 800;
}

.current-comment-message {
  width: 100%;
  margin: 0;
  color: var(--admin-color-text-label);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.current-comment-message.muted,
.upload-summary,
.modal-empty,
.history-meta {
  color: var(--admin-color-text-subtle);
}

.current-comment-message.muted {
  font-weight: 500;
}

.comment-error {
  margin: 8px 0 0;
  color: #dc2626;
  font-size: 11px;
}

.modal-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.history-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.comment-history-item {
  padding: 10px;
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}

.comment-history-item p {
  margin: 8px 0 0;
  color: var(--admin-color-text-label);
  font-size: 13px;
  line-height: 1.5;
}

.modal-empty {
  margin: 0;
  padding: 28px 0;
  font-size: 12px;
  text-align: center;
}

.modal-empty.error {
  color: #dc2626;
}

.confirm-message {
  margin: 0;
  line-height: 1.6;
}

@container admin-content (max-width: 600px) {
  .section-head {
    flex-direction: column;
  }

  .section-actions {
    justify-content: flex-start;
  }
}
</style>
