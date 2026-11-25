<template>
  <div class="push-mngr">
    <header class="page-header">
      <h2>PUSH 관리</h2>
   
    </header>

    <!-- PUSH 발송 -->
    <section class="push-section">

      <!-- 랜딩 페이지 선택 -->
      <div class="form-group">
        <label for="landing-type">랜딩 페이지</label>

        <div class="landing-row">
          <select
            id="landing-type"
            v-model="form.landingType"
            :disabled="isSending"
          >
            <option value="LIVE">LIVE</option>
            <option value="MATCH">경기</option>
          </select>

          <input
            v-model="form.matchId"
            type="number"
            min="1"
            step="1"
            placeholder="경기 ID를 입력하세요"
            :disabled="form.landingType === 'LIVE' || isSending"
          />
        </div>
      </div>

      <!-- 제목 -->
      <div class="form-group">
        <label for="push-title">제목</label>
        <input
          id="push-title"
          v-model="form.title"
          type="text"
          placeholder="알림 제목을 입력하세요"
          maxlength="255"
          :disabled="isSending"
        />
      </div>

      <!-- 내용 -->
      <div class="form-group">
        <label for="push-content">내용</label>
        <textarea
          id="push-content"
          v-model="form.content"
          rows="4"
          placeholder="발송할 PUSH 메시지를 입력하세요"
          :disabled="isSending"
        />
      </div>

      <!-- PUSH 이미지 업로드 -->
<div class="form-group">
  <label for="push-image">이미지</label>

  <input
    id="push-image"
    ref="imageInput"
    type="file"
    accept=".jpg,.jpeg,.png,.webp"
    :disabled="isSending"
    @change="onImageChange"
  />

  <p class="image-guide">
    JPG, JPEG, PNG, WEBP / 최대 5MB
  </p>

    <!-- 이미지 미리보기 -->
    <div v-if="imagePreviewUrl" class="image-preview">
        <img
            :src="imagePreviewUrl"
            alt="PUSH 이미지 미리보기"
        />

        <button
            type="button"
            class="image-remove-btn"
            :disabled="isSending"
            @click="removeImage"
        >
            이미지 삭제
        </button>
        </div>
    </div>

      <!-- 발송 버튼 -->
      <div class="send-actions">
        <button
          class="btn btn-primary"
          :disabled="isSending"
          @click="sendPush('COMMON')"
        >
          공통 발송
        </button>

        <button
          class="btn btn-secondary"
          :disabled="isSending"
          @click="sendPush('AOS')"
        >
          ANDROID 발송
        </button>

        <button
          class="btn btn-secondary"
          :disabled="isSending"
          @click="sendPush('IOS')"
        >
          iOS 발송
        </button>
      </div>

      <p
        v-if="notice"
        class="notice"
        :class="notice.type === 'error' ? 'notice-error' : 'notice-success'"
        role="status"
      >
        {{ notice.message }}
      </p>
    </section>

    <!-- PUSH 이력 -->
    <section class="push-section">

      <div class="history-tabs">
        <button
          :class="{ active: activePlatform === 'AOS' }"
          @click="changePlatform('AOS')"
        >
          ANDROID 리스트
        </button>

        <button
          :class="{ active: activePlatform === 'IOS' }"
          @click="changePlatform('IOS')"
        >
          iOS 리스트
        </button>
      </div>

      <p v-if="historyError" class="history-error" role="alert">
        {{ historyError }}
      </p>

      <div class="table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th>번호</th>
              <th>내용</th>
              <th>타입</th>
              <th>이미지</th>
              <th>상태</th>
              <th>발송시간</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loadingHistories">
              <td colspan="6" class="empty-row">
                발송 이력을 불러오는 중입니다.
              </td>
            </tr>

            <tr v-else-if="histories.length === 0">
              <td colspan="6" class="empty-row">
                발송 이력이 없습니다.
              </td>
            </tr>

            <tr
              v-for="history in histories"
              v-else
              :key="history.id"
            >
              <td>{{ history.id }}</td>

              <td class="content-cell">
                <strong>{{ history.title }}</strong>
                <p>{{ history.content }}</p>
              </td>

              <td>
                {{ history.landingType === 'LIVE' ? 'LIVE' : '경기' }}
                <small v-if="history.matchId">
                  #{{ history.matchId }}
                </small>
              </td>

              <td>
                <img
                  v-if="history.imageUrl"
                  :src="history.imageUrl"
                  class="history-image"
                  alt="알림 이미지"
                  loading="lazy"
                />
                <span v-else>-</span>
              </td>

              <td>
                <span
                  class="status-badge"
                  :class="statusClass(history.status)"
                >
                  {{ statusLabel(history.status) }}
                </span>
              </td>

              <td>{{ formatDate(history.sentAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 페이지네이션 -->
      <div class="pagination">
        <span>전체 {{ totalElements }}건</span>

        <div class="page-buttons">
          <button
            :disabled="currentPage === 0 || loadingHistories"
            @click="loadHistories(currentPage - 1)"
          >
            이전
          </button>

          <span>
            {{ totalPages === 0 ? 0 : currentPage + 1 }}
            / {{ totalPages }}
          </span>

          <button
            :disabled="currentPage + 1 >= totalPages || loadingHistories"
            @click="loadHistories(currentPage + 1)"
          >
            다음
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  sendCommonPush,
  sendPlatformPush,
  getPushHistories,
  uploadPushImage,
} from '@/api/push'

// PUSH 입력값
const form = reactive({
  landingType: 'LIVE',
  matchId: '',
  title: '',
  content: '',
})

// 발송 상태
const sendingTarget = ref(null)
const isSending = computed(() => sendingTarget.value !== null)
const notice = ref(null)

// 이력 조회 상태
const activePlatform = ref('AOS')
const histories = ref([])
const loadingHistories = ref(false)
const historyError = ref('')

const currentPage = ref(0)
const totalPages = ref(0)
const totalElements = ref(0)

let historyRequestId = 0

// LIVE 선택 시 경기 ID 초기화
watch(
  () => form.landingType,
  (type) => {
    if (type === 'LIVE') {
      form.matchId = ''
    }
  }
)

// 발송 요청 검증
function validateForm() {
  if (!form.title.trim()) {
    return 'PUSH 제목을 입력해 주세요.'
  }

  if (!form.content.trim()) {
    return 'PUSH 내용을 입력해 주세요.'
  }

  if (form.landingType === 'MATCH') {
    const matchId = Number(form.matchId)

    if (!Number.isSafeInteger(matchId) || matchId <= 0) {
      return '올바른 경기 ID를 입력해 주세요.'
    }
  }

  return null
}

// PUSH 발송
async function sendPush(target) {
  if (isSending.value) return

  notice.value = null

  const validationError = validateForm()

  if (validationError) {
    notice.value = {
      type: 'error',
      message: validationError,
    }
    return
  }

  const targetName = {
    COMMON: 'Android 및 iOS 전체',
    AOS: 'Android',
    IOS: 'iOS',
  }[target]

  const confirmed = window.confirm(
    `${targetName} 사용자에게 PUSH 알림을 발송하시겠습니까?`
  )

  if (!confirmed) return

  // PUSH 발송 데이터
  const payload = {
    title: form.title.trim(),
    content: form.content.trim(),
    landingType: form.landingType,
    matchId: form.landingType === 'MATCH'
      ? Number(form.matchId)
      : null,
    imageUrl: null,
  }

  sendingTarget.value = target

  let sendAttempted = false

  try {
    // 1. 이미지가 선택되어 있으면 GCS 업로드
    if (selectedImage.value) {
      payload.imageUrl = await uploadPushImage(
        selectedImage.value
      )
    }

    // 2. PUSH 발송
    sendAttempted = true

    if (target === 'COMMON') {
      await sendCommonPush(payload)
    } else {
      await sendPlatformPush(target, payload)
    }

    // 3. 성공 메시지
    notice.value = {
      type: 'success',
      message: `${targetName} PUSH 발송 요청이 성공적으로 처리되었습니다.`,
    }

  } catch (error) {
    console.error('PUSH 처리 실패:', error)

    const errorMessage = getErrorMessage(error)

    // 이미지 업로드 실패와 PUSH 발송 실패 구분
    if (!sendAttempted) {
      notice.value = {
        type: 'error',
        message: `이미지 업로드에 실패했습니다. ${errorMessage}`,
      }
    } else {
      notice.value = {
        type: 'error',
        message: target === 'COMMON'
          ? `${errorMessage} 일부 플랫폼은 발송되었을 수 있으므로 이력을 확인해 주세요.`
          : errorMessage,
      }
    }

  } finally {
    sendingTarget.value = null

    // 실제 발송을 시도한 경우에만 이력 갱신
    if (sendAttempted) {
      if (target !== 'COMMON') {
        activePlatform.value = target
      }

      await loadHistories(0)
    }
  }
}

// 플랫폼 변경
function changePlatform(platform) {
  if (activePlatform.value === platform) return

  activePlatform.value = platform
  currentPage.value = 0
  loadHistories(0)
}

// 발송 이력 조회
async function loadHistories(page = 0) {
  const requestId = ++historyRequestId

  loadingHistories.value = true
  historyError.value = ''
  histories.value = []

  try {
    const data = await getPushHistories(
      activePlatform.value,
      page,
      20
    )

    // 늦게 도착한 이전 조회 응답은 반영하지 않음
    if (requestId !== historyRequestId) return

    histories.value = data.content ?? []
    currentPage.value = data.number ?? page
    totalPages.value = data.totalPages ?? 0
    totalElements.value = data.totalElements ?? 0
  } catch (error) {
    if (requestId !== historyRequestId) return

    console.error('PUSH 발송 이력 조회 실패:', error)
    historyError.value = getErrorMessage(error)
  } finally {
    if (requestId === historyRequestId) {
      loadingHistories.value = false
    }
  }
}

// 발송 상태 표시
function statusLabel(status) {
  const labels = {
    PROCESSING: '진행중',
    SUCCESS: '발송완료',
    FAILED: '오류',
  }

  return labels[status] ?? status ?? '-'
}

function statusClass(status) {
  return {
    SUCCESS: 'status-success',
    PROCESSING: 'status-processing',
    FAILED: 'status-failed',
  }[status] ?? ''
}

// 날짜 표시
function formatDate(value) {
  if (!value) return '-'

  return value.replace('T', ' ').slice(0, 19)
}

// API 오류 메시지
function getErrorMessage(error) {
  const status = error.response?.status
  const data = error.response?.data

  // 백엔드에서 전달한 오류 메시지 우선 표시
  const serverMessage = data?.error?.message || data?.message

  if (serverMessage) {
    return serverMessage
  }

  if (status === 404) {
    return '요청한 API를 찾을 수 없습니다.'
  }

  if (status === 400) {
    return '입력한 내용을 확인해 주세요.'
  }

  return 'PUSH 요청 처리 중 오류가 발생했습니다.'
}

onMounted(() => {
  loadHistories(0)
})

// 이미지 상태
const imageInput = ref(null)
const selectedImage = ref(null)
const imagePreviewUrl = ref('')

// 이미지 선택
function onImageChange(event) {
  const file = event.target.files?.[0]

  notice.value = null

  clearImageSelection()

  if (!file) return

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ]

  // 이미지 형식 검사
  if (!allowedTypes.includes(file.type)) {
    notice.value = {
      type: 'error',
      message: 'JPG, JPEG, PNG, WEBP 이미지만 업로드할 수 있습니다.',
    }

    event.target.value = ''
    return
  }

  // 5MB 제한
  if (file.size > 5 * 1024 * 1024) {
    notice.value = {
      type: 'error',
      message: '이미지는 최대 5MB까지 업로드할 수 있습니다.',
    }

    event.target.value = ''
    return
  }

  selectedImage.value = file
  imagePreviewUrl.value = URL.createObjectURL(file)
}

// 이전 이미지 미리보기 메모리 해제
function clearImageSelection() {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }

  imagePreviewUrl.value = ''
  selectedImage.value = null
}

// 이미지 선택 취소
function removeImage() {
  clearImageSelection()

  if (imageInput.value) {
    imageInput.value.value = ''
  }
}

// 컴포넌트 종료 시 메모리 해제
onBeforeUnmount(() => {
  clearImageSelection()
})
</script>

<style scoped>
.push-mngr {
  flex: 1;
  min-width: 0;
  padding: 24px;
  background: #f9fafb;
  color: #1f2937;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.page-header p {
  margin: 0;
  color: #6b7280;
}

.push-section {
  padding: 24px;
  margin-bottom: 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.push-section h3 {
  margin: 0 0 22px;
  font-size: 16px;
  font-weight: 700;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #1f2937;
  font: inherit;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-group input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
}

.landing-row {
  display: flex;
  gap: 12px;
}

.landing-row select {
  width: 180px;
  flex-shrink: 0;
}

.landing-row input {
  flex: 1;
  min-width: 0;
}

.image-preview {
  margin-top: 12px;
}

.image-preview img {
  max-width: 200px;
  max-height: 120px;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.send-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 4px;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  color: white;
  background: #2563eb;
}

.btn-secondary {
  color: #374151;
  background: #e5e7eb;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  filter: brightness(0.95);
}

.notice {
  margin: 16px 0 0;
  padding: 12px;
  border-radius: 6px;
}

.notice-success {
  color: #166534;
  background: #dcfce7;
}

.notice-error,
.history-error {
  color: #b91c1c;
  background: #fee2e2;
}

.history-error {
  padding: 12px;
  border-radius: 6px;
}

.history-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.history-tabs button {
  padding: 9px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
}

.history-tabs button.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.history-table {
  width: 100%;
  min-width: 700px;
  border-collapse: collapse;
}

.history-table th,
.history-table td {
  padding: 12px;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid #e5e7eb;
}

.history-table th {
  background: #f3f4f6;
  font-weight: 600;
  white-space: nowrap;
}

.content-cell {
  min-width: 220px;
}

.content-cell strong {
  display: block;
  margin-bottom: 5px;
}

.content-cell p {
  margin: 0;
  color: #6b7280;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.history-table td small {
  display: block;
  margin-top: 4px;
  color: #6b7280;
}

.history-image {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 4px;
}

.status-badge {
  display: inline-block;
  padding: 5px 8px;
  border-radius: 5px;
  font-size: 12px;
  white-space: nowrap;
}

.status-success {
  color: #166534;
  background: #dcfce7;
}

.status-processing {
  color: #92400e;
  background: #fef3c7;
}

.status-failed {
  color: #b91c1c;
  background: #fee2e2;
}

.empty-row {
  padding: 30px !important;
  text-align: center !important;
  color: #9ca3af;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  color: #6b7280;
}

.page-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-buttons button {
  padding: 7px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  cursor: pointer;
}

.page-buttons button:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .push-mngr {
    padding: 14px;
  }

  .push-section {
    padding: 16px;
  }

  .landing-row {
    flex-direction: column;
  }

  .landing-row select {
    width: 100%;
  }

  .pagination {
    flex-wrap: wrap;
  }
}

/* 이미지 안내 문구 */
.image-guide {
  margin: 6px 0 0;
  font-size: 12px;
  color: #6b7280;
}

/* 이미지 미리보기 */
.image-preview {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-top: 12px;
}

.image-preview img {
  max-width: 240px;
  max-height: 160px;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

/* 이미지 삭제 버튼 */
.image-remove-btn {
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  color: #374151;
  font-size: 12px;
  cursor: pointer;
}

.image-remove-btn:hover:not(:disabled) {
  background: #f3f4f6;
}

.image-remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

</style>