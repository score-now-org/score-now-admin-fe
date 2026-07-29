<template>
  <aside class="broadcast-panel">
    <div class="panel-header">
      <div>
        <p class="panel-kicker">{{ matchLeague }}</p>
        <h3 class="panel-title">{{ homeTeamName }} vs {{ awayTeamName }}</h3>
      </div>
      <div class="panel-header-actions">
        <BaseButton variant="outline" size="sm" @click="openChatModal">
          채팅 보기
        </BaseButton>
        <BaseButton
          variant="outline"
          size="sm"
          :disabled="loading.refresh"
          @click="refreshMatch"
        >
          {{ loading.refresh ? '새로고침중' : '새로고침' }}
        </BaseButton>
        <button class="panel-close" type="button" @click="$emit('close')">×</button>
      </div>
    </div>

    <div class="panel-body">
      <section class="work-section">
        <div class="section-head">
          <div>
            <h4 class="section-title">시간 / 상태</h4>
            <p class="section-desc">경기 시작 예정 시간과 현재 경기 상태를 관리합니다.</p>
          </div>
          <BaseBadge :variant="statusBadgeVariant(timeForm.status)">
            {{ statusLabel(timeForm.status) }}
          </BaseBadge>
        </div>

        <div class="time-grid">
          <label class="form-row">
            <span class="form-label">경기 시작 예정일자</span>
            <input v-model="timeForm.startDate" class="form-input" type="date" />
          </label>
          <label class="form-row">
            <span class="form-label">경기 시작 예정시각</span>
            <input v-model="timeForm.startTime" class="form-input" type="time" />
          </label>
          <label class="form-row span-2">
            <span class="form-label">경기 상태</span>
            <BaseSelect v-model="timeForm.status">
              <option
                v-for="status in statusOptions"
                :key="status.value"
                :value="status.value"
              >
                {{ status.label }}
              </option>
            </BaseSelect>
          </label>
        </div>

        <div class="action-row">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="isWorking('currentTime')"
            @click="requestAction('currentTime')"
          >
            {{ buttonLabel('currentTime', '현재 시간 저장') }}
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="sm"
            class="panel-action-btn"
            :disabled="isWorking('manualTime')"
            @click="requestAction('manualTime')"
          >
            {{ buttonLabel('manualTime', '수동시간 저장') }}
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="sm"
            class="panel-action-btn"
            :disabled="isWorking('status')"
            @click="requestAction('status')"
          >
            {{ buttonLabel('status', '경기 상태 저장') }}
          </BaseButton>
        </div>

        <div class="time-subsection">
          <div class="subsection-head">
            <div>
              <h5 class="subsection-title">중계 상태 문구</h5>
              <p class="section-desc">앱 화면에 노출되는 축구 경기 진행 상태 문구를 관리합니다.</p>
            </div>
          </div>

          <div class="option-card clock-state-card">
            <div class="option-card-head">
              <strong>상태 문구</strong>
              <button
                class="clear-choice-btn"
                type="button"
                :disabled="!timeForm.clockState"
                @click="timeForm.clockState = ''"
              >
                선택 해제
              </button>
            </div>
            <div class="radio-grid clock-state-radio-grid">
              <label
                v-for="clockState in soccerClockStateOptions"
                :key="clockState.value"
                class="radio-option"
                :class="{ selected: timeForm.clockState === clockState.value }"
              >
                <input
                  v-model="timeForm.clockState"
                  name="soccer-clock-state"
                  type="radio"
                  :value="clockState.value"
                />
                <span>{{ clockState.label }}</span>
              </label>
            </div>
          </div>

          <div class="action-row compact-action-row">
            <BaseButton
              variant="primary"
              size="sm"
              :disabled="isWorking('clockState')"
              @click="requestAction('clockState')"
            >
              {{ buttonLabel('clockState', '중계 상태 문구 저장') }}
            </BaseButton>
          </div>
        </div>

        <div class="time-subsection">
          <div class="subsection-head">
            <div>
              <h5 class="subsection-title">추가시간</h5>
              <p class="section-desc">각 구간의 추가시간을 분 단위로 수동 보정합니다.</p>
            </div>
          </div>

          <div class="extra-time-grid">
            <label
              v-for="field in extraTimeFields"
              :key="field.key"
              class="extra-time-field"
            >
              <span>{{ field.label }}</span>
              <div class="extra-time-input-wrap">
                <input
                  v-model.number="timeForm.extraTime[field.key]"
                  class="extra-time-input"
                  type="number"
                  min="0"
                />
                <span>분</span>
              </div>
            </label>
          </div>

          <div class="action-row compact-action-row">
            <BaseButton
              variant="primary"
              size="sm"
              :disabled="isWorking('extraTime')"
              @click="requestAction('extraTime')"
            >
              {{ buttonLabel('extraTime', '추가시간 저장') }}
            </BaseButton>
          </div>
        </div>
      </section>

      <section class="work-section">
        <div class="section-head">
          <div>
            <h4 class="section-title">점수</h4>
            <p class="section-desc">클라이언트에 노출되는 경기 점수를 수동으로 보정합니다.</p>
          </div>
          <BaseButton variant="outline" size="sm" @click="scoreForm.penaltyVisible = !scoreForm.penaltyVisible">
            {{ scoreForm.penaltyVisible ? '승부차기 숨김' : '승부차기 입력' }}
          </BaseButton>
        </div>

        <div class="score-editor">
          <label class="score-team home-score-team">
            <span class="team-title-stack">
              <span class="side-label home-label">홈</span>
              <span class="score-team-name">{{ homeTeamName }}</span>
            </span>
            <input v-model.number="scoreForm.homeScore" class="score-input-lg" type="number" min="0" />
          </label>
          <div class="score-vs">VS</div>
          <label class="score-team away-score-team">
            <span class="team-title-stack">
              <span class="side-label away-label">어웨이</span>
              <span class="score-team-name">{{ awayTeamName }}</span>
            </span>
            <input v-model.number="scoreForm.awayScore" class="score-input-lg" type="number" min="0" />
          </label>

          <div v-if="scoreForm.penaltyVisible" class="penalty-row">
            <div class="penalty-title">PK</div>
            <input v-model.number="scoreForm.homePenaltyScore" class="penalty-inline-input" type="number" min="0" />
            <span class="penalty-sep">:</span>
            <input v-model.number="scoreForm.awayPenaltyScore" class="penalty-inline-input" type="number" min="0" />
          </div>
        </div>

        <div class="action-row">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="isWorking('score')"
            @click="requestAction('score')"
          >
            {{ buttonLabel('score', '점수 저장') }}
          </BaseButton>
        </div>
      </section>

      <section class="work-section">
        <div class="section-head">
          <div>
            <h4 class="section-title">중계 멘트</h4>
            <p class="section-desc">텍스트와 이미지를 등록하고 필요 시 푸시를 발송합니다.</p>
          </div>
          <div class="section-actions">
            <BaseButton
              variant="outline"
              size="sm"
              :class="{ 'highlight-toggle-active': commentForm.highlight }"
              @click="commentForm.highlight = !commentForm.highlight"
            >
              강조
            </BaseButton>
            <BaseButton variant="outline" size="sm" @click="openCommentHistoryModal">
              중계글 모음
            </BaseButton>
            <BaseButton
              variant="outline"
              size="sm"
              :class="commentForm.recordEnabled ? 'record-toggle-on' : 'record-toggle-off'"
              @click="commentForm.recordEnabled = !commentForm.recordEnabled"
            >
              기록 저장 {{ commentForm.recordEnabled ? 'ON' : 'OFF' }}
            </BaseButton>
          </div>
        </div>

        <div
          class="comment-box"
          :class="{ highlighted: commentForm.highlight }"
        >
          <textarea
            v-model="commentForm.message"
            class="comment-textarea"
            placeholder="중계 멘트를 입력하세요."
            rows="4"
          />
          <div class="comment-tools">
            <label class="upload-btn">
              사진 추가
              <input
                class="file-input"
                type="file"
                accept="image/*"
                multiple
                @change="handleImageUpload"
              />
            </label>
            <span class="upload-summary">{{ uploadSummary }}</span>
          </div>
        </div>

        <div class="action-row">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="isWorking('comment')"
            @click="requestAction('comment')"
          >
            {{ buttonLabel('comment', '멘트 저장') }}
          </BaseButton>
          <BaseButton
            variant="warn"
            size="sm"
            :disabled="isWorking('commentPush')"
            @click="requestAction('commentPush')"
          >
            {{ buttonLabel('commentPush', '멘트 저장 & 푸시 발송') }}
          </BaseButton>
        </div>
      </section>

      <section class="work-section">
        <div class="section-head">
          <div>
            <h4 class="section-title">경기 스탯</h4>
            <p class="section-desc">축구 기준 주요 스탯을 수동으로 보정합니다.</p>
          </div>
        </div>

        <div class="stats-table">
          <div class="stats-row stats-header">
            <span>구분</span>
            <span
              v-for="stat in statFields"
              :key="stat.key"
            >
              {{ stat.label }}
            </span>
          </div>
          <div class="stats-row">
            <span class="stats-team-name">{{ homeTeamName }}</span>
            <input
              v-for="stat in statFields"
              :key="`home-${stat.key}`"
              v-model.number="statsForm.home[stat.key]"
              class="stat-input"
              type="number"
              min="0"
            />
          </div>
          <div class="stats-row">
            <span class="stats-team-name">{{ awayTeamName }}</span>
            <input
              v-for="stat in statFields"
              :key="`away-${stat.key}`"
              v-model.number="statsForm.away[stat.key]"
              class="stat-input"
              type="number"
              min="0"
            />
          </div>
        </div>

        <div class="action-row">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="isWorking('stats')"
            @click="requestAction('stats')"
          >
            {{ buttonLabel('stats', '스탯 저장') }}
          </BaseButton>
        </div>
      </section>
    </div>

    <BaseModal v-model="chatModalVisible" title="채팅 보기" width="620px">
      <ul class="modal-list">
        <li v-for="chat in chats" :key="chat.id" class="chat-item">
          <span class="chat-time">{{ chat.time }}</span>
          <strong class="chat-user">{{ chat.user }}</strong>
          <span class="chat-message">{{ chat.message }}</span>
        </li>
      </ul>
      <template #footer>
        <BaseButton variant="outline" @click="chatModalVisible = false">닫기</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="commentHistoryModalVisible" title="중계글 모음" width="680px">
      <ul class="modal-list">
        <li v-for="comment in commentHistory" :key="comment.id" class="comment-history-item">
          <div class="history-meta">
            <span>{{ comment.time }}</span>
            <BaseBadge :variant="comment.highlight ? 'red' : 'gray'">
              {{ comment.highlight ? '강조' : '일반' }}
            </BaseBadge>
            <BaseBadge :variant="comment.pushed ? 'blue' : 'gray'">
              {{ comment.pushed ? '푸시' : '미발송' }}
            </BaseBadge>
          </div>
          <p>{{ comment.message }}</p>
        </li>
      </ul>
      <template #footer>
        <BaseButton variant="outline" @click="commentHistoryModalVisible = false">닫기</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="confirmModal.visible" :title="confirmModal.title" width="420px">
      <p class="confirm-message">{{ confirmModal.message }}</p>
      <template #footer>
        <BaseButton variant="outline" @click="closeConfirmModal">취소</BaseButton>
        <BaseButton :variant="confirmModal.variant" @click="confirmAction">확인</BaseButton>
      </template>
    </BaseModal>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  match: { type: Object, default: null },
})

defineEmits(['close'])

const statusOptions = [
  { value: 'NOT_STARTED', label: '경기전' },
  { value: 'IN_PLAY', label: '진행중' },
  { value: 'TO_BE_FIXED', label: '수정예정' },
  { value: 'ENDED', label: '종료' },
  { value: 'POSTPONED', label: '연기' },
  { value: 'CANCELLED', label: '취소' },
  { value: 'WALKOVER', label: '부전승' },
  { value: 'INTERRUPTED', label: '중지' },
  { value: 'ABANDONED', label: '취소' },
  { value: 'RETIRED', label: '기권' },
  { value: 'REMOVED', label: '삭제' },
]

const soccerClockStateOptions = [
  { value: 'FIRST_HALF', label: '전반' },
  { value: 'HALF_TIME', label: '하프타임' },
  { value: 'SECOND_HALF', label: '후반' },
  { value: 'EXTRA_TIME_PENDING', label: '연장대기' },
  { value: 'EXTRA_FIRST_HALF', label: '연장 전반' },
  { value: 'EXTRA_SECOND_HALF', label: '연장 후반' },
  { value: 'PENALTY_SHOOTOUT', label: '승부차기' },
  { value: 'EXTRA_TIME_ENDED', label: '연장종료' },
  { value: 'MATCH_ENDED', label: '경기종료' },
]

const extraTimeFields = [
  { key: 'firstHalf', label: '전반' },
  { key: 'secondHalf', label: '후반' },
  { key: 'extraFirstHalf', label: '연장 전반' },
  { key: 'extraSecondHalf', label: '연장 후반' },
]

const statFields = [
  { key: 'shots', label: '슈팅' },
  { key: 'shotsOnTarget', label: '유효슛' },
  { key: 'possession', label: '점유율' },
  { key: 'corners', label: '코너킥' },
  { key: 'freeKicks', label: '프리킥' },
  { key: 'offsides', label: '오프사이드' },
  { key: 'fouls', label: '파울' },
  { key: 'yellowCards', label: '경고' },
  { key: 'redCards', label: '퇴장' },
]

const timeForm = ref(defaultTimeForm())
const scoreForm = ref(defaultScoreForm())
const commentForm = ref(defaultCommentForm())
const statsForm = ref(defaultStatsForm())
const loading = ref({})
const uploadedImages = ref([])
const chatModalVisible = ref(false)
const commentHistoryModalVisible = ref(false)
const confirmModal = ref(defaultConfirmModal())
const chats = ref([])
const commentHistory = ref([])

const homeTeamName = computed(() => props.match?.homeTeam?.name || '홈팀')
const awayTeamName = computed(() => props.match?.awayTeam?.name || '원정팀')
const matchLeague = computed(() => props.match?.leagueId?.toUpperCase?.() || '-')
const uploadSummary = computed(() => {
  if (!uploadedImages.value.length) return '첨부된 사진 없음'
  return `${uploadedImages.value.length}개 첨부됨`
})
const clockStatePreview = computed(() => {
  return soccerClockStateOptions.find((item) => item.value === timeForm.value.clockState)?.label || '선택된 문구 없음'
})

watch(
  () => props.match?.id,
  () => {
    resetPanelState()
  },
  { immediate: true },
)

function resetPanelState() {
  timeForm.value = defaultTimeForm()
  scoreForm.value = defaultScoreForm()
  commentForm.value = defaultCommentForm()
  statsForm.value = defaultStatsForm()
  uploadedImages.value = []
  loading.value = {}
  chats.value = makeMockChats()
  commentHistory.value = makeMockCommentHistory()
  closeConfirmModal()
}

function defaultTimeForm() {
  return {
    startDate: props.match?.startDate || '',
    startTime: props.match?.startTime || '',
    status: props.match?.status || 'NOT_STARTED',
    clockState: props.match?.soccerClockState || '',
    extraTime: {
      firstHalf: 0,
      secondHalf: 0,
      extraFirstHalf: 0,
      extraSecondHalf: 0,
    },
  }
}

function defaultScoreForm() {
  return {
    homeScore: 0,
    awayScore: 0,
    penaltyVisible: false,
    homePenaltyScore: 0,
    awayPenaltyScore: 0,
  }
}

function defaultCommentForm() {
  return {
    highlight: false,
    recordEnabled: true,
    message: '',
  }
}

function defaultStatsForm() {
  return {
    home: {
      shots: 3,
      shotsOnTarget: 1,
      possession: 47,
      corners: 4,
      freeKicks: 15,
      offsides: 0,
      fouls: 7,
      yellowCards: 0,
      redCards: 0,
    },
    away: {
      shots: 5,
      shotsOnTarget: 2,
      possession: 53,
      corners: 2,
      freeKicks: 14,
      offsides: 1,
      fouls: 9,
      yellowCards: 1,
      redCards: 0,
    },
  }
}

function defaultConfirmModal() {
  return {
    visible: false,
    action: null,
    title: '',
    message: '',
    variant: 'primary',
  }
}

function openChatModal() {
  chatModalVisible.value = true
}

function openCommentHistoryModal() {
  commentHistoryModalVisible.value = true
}

async function refreshMatch() {
  setLoading('refresh', true)
  // TODO: 실제 경기 상세 재조회 API 연결
  await delay(500)
  timeForm.value = defaultTimeForm()
  setLoading('refresh', false)
}

function requestAction(action) {
  const config = actionConfig(action)
  if (!config) return

  if (!validateAction(action)) return

  confirmModal.value = {
    visible: true,
    action,
    title: config.title,
    message: config.message,
    variant: config.variant,
  }
}

async function confirmAction() {
  const action = confirmModal.value.action
  if (!action) return

  closeConfirmModal()
  setLoading(action, true)
  await delay(500)

  if (action === 'currentTime') {
    const serverNow = getMockServerNow()
    timeForm.value.startDate = serverNow.date
    timeForm.value.startTime = serverNow.time
  }

  if (action === 'comment' || action === 'commentPush') {
    commentHistory.value.unshift({
      id: Date.now(),
      time: formatPanelDateTime(new Date()),
      message: commentForm.value.message,
      highlight: commentForm.value.highlight,
      pushed: action === 'commentPush',
    })
    commentForm.value.message = ''
    uploadedImages.value = []
  }

  setLoading(action, false)
}

function closeConfirmModal() {
  confirmModal.value = defaultConfirmModal()
}

function validateAction(action) {
  if ((action === 'manualTime' || action === 'currentTime') && !timeForm.value.startDate) {
    alert('경기 시작 예정일자를 입력해주세요.')
    return false
  }

  if ((action === 'manualTime' || action === 'currentTime') && !timeForm.value.startTime) {
    alert('경기 시작 예정시각을 입력해주세요.')
    return false
  }

  if (action === 'comment' || action === 'commentPush') {
    if (!commentForm.value.message.trim() && uploadedImages.value.length === 0) {
      alert('중계 멘트 또는 사진을 입력해주세요.')
      return false
    }
  }

  if (action === 'extraTime' && !isValidExtraTime()) {
    alert('추가시간은 0 이상의 숫자로 입력해주세요.')
    return false
  }

  return true
}

function actionConfig(action) {
  return {
    currentTime: {
      title: '현재 시간 저장',
      message: '서버 기준 현재 시간으로 경기 시작 예정 시간을 저장합니다.',
      variant: 'primary',
    },
    manualTime: {
      title: '수동시간 저장',
      message: `${timeForm.value.startDate} ${timeForm.value.startTime} 기준으로 경기 시작 예정 시간을 저장합니다.`,
      variant: 'primary',
    },
    status: {
      title: '경기 상태 저장',
      message: `경기 상태를 "${statusLabel(timeForm.value.status)}" 상태로 변경합니다.`,
      variant: 'primary',
    },
    clockState: {
      title: '중계 상태 문구 저장',
      message: clockStateSaveMessage(),
      variant: 'primary',
    },
    extraTime: {
      title: '추가시간 저장',
      message: extraTimeSaveMessage(),
      variant: 'primary',
    },
    score: {
      title: '점수 저장',
      message: scoreSaveMessage(),
      variant: 'primary',
    },
    comment: {
      title: '멘트 저장',
      message: '작성한 중계 멘트를 저장합니다.',
      variant: 'primary',
    },
    commentPush: {
      title: '멘트 저장 및 푸시 발송',
      message: '중계 멘트를 저장하고 관심 경기 유저에게 푸시를 발송합니다.',
      variant: 'warn',
    },
    stats: {
      title: '스탯 저장',
      message: '입력한 경기 스탯으로 수동 저장합니다.',
      variant: 'primary',
    },
  }[action]
}

function clockStateSaveMessage() {
  if (clockStatePreview.value === '선택된 문구 없음') {
    return '앱에 노출되는 중계 상태 문구를 비운 상태로 저장합니다.'
  }

  return `앱에 노출되는 중계 상태 문구를 "${clockStatePreview.value}" 상태로 저장합니다.`
}

function extraTimeSaveMessage() {
  return extraTimeFields
    .map((field) => `${field.label} ${Number(timeForm.value.extraTime[field.key] || 0)}분`)
    .join(', ')
    .concat('으로 추가시간을 저장합니다.')
}

function scoreSaveMessage() {
  const baseScore = `${homeTeamName.value} ${scoreForm.value.homeScore} : ${scoreForm.value.awayScore} ${awayTeamName.value}`

  if (!scoreForm.value.penaltyVisible) {
    return `${baseScore} 점수로 저장합니다.`
  }

  return `${baseScore}, 승부차기 ${scoreForm.value.homePenaltyScore} : ${scoreForm.value.awayPenaltyScore} 점수로 저장합니다.`
}

function isValidExtraTime() {
  return extraTimeFields.every((field) => {
    const value = Number(timeForm.value.extraTime[field.key])

    return Number.isFinite(value) && value >= 0
  })
}

function setLoading(key, value) {
  loading.value = {
    ...loading.value,
    [key]: value,
  }
}

function isWorking(key) {
  return Boolean(loading.value[key])
}

function buttonLabel(key, label) {
  return isWorking(key) ? '저장중' : label
}

function handleImageUpload(event) {
  uploadedImages.value = Array.from(event.target.files || []).map((file) => ({
    name: file.name,
    size: file.size,
  }))
}

function statusLabel(status) {
  return statusOptions.find((item) => item.value === status)?.label || status
}

function statusBadgeVariant(status) {
  return {
    NOT_STARTED: 'gray',
    IN_PLAY: 'green',
    TO_BE_FIXED: 'yellow',
    ENDED: 'blue',
    POSTPONED: 'yellow',
    CANCELLED: 'red',
    WALKOVER: 'blue',
    INTERRUPTED: 'red',
    ABANDONED: 'red',
    RETIRED: 'red',
    REMOVED: 'gray',
  }[status] || 'gray'
}

function getMockServerNow() {
  const now = new Date()
  return {
    date: formatDateInput(now),
    time: formatTimeInput(now),
  }
}

function formatDateInput(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatTimeInput(date) {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
  ].join(':')
}

function formatPanelDateTime(date) {
  return `${formatDateInput(date)} ${formatTimeInput(date)}`
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function makeMockChats() {
  return [
    { id: 1, time: '19:01', user: 'user142', message: '오늘 선발 라인업 좋네요.' },
    { id: 2, time: '19:03', user: 'goal9', message: '맨시티 압박이 강합니다.' },
    { id: 3, time: '19:04', user: 'admin-check', message: '중계 지연 없는지 확인 부탁드립니다.' },
  ]
}

function makeMockCommentHistory() {
  return [
    { id: 1, time: '2026-07-27 18:55', message: '양 팀 선수들이 입장했습니다.', highlight: false, pushed: false },
    { id: 2, time: '2026-07-27 19:02', message: '전반전이 시작됐습니다.', highlight: true, pushed: true },
  ]
}
</script>

<style scoped>
.broadcast-panel {
  position: fixed;
  top: 52px;
  right: 0;
  bottom: 0;
  z-index: 180;
  display: flex;
  width: clamp(560px, 48vw, 760px);
  max-width: calc(100vw - 220px);
  flex-direction: column;
  background: #fff;
  border: 1px solid #d1d5db;
  border-right: none;
  border-radius: 12px 0 0 12px;
  box-shadow: -8px 0 24px rgba(15, 23, 42, 0.16);
  animation: panel-slide-in 0.18s ease-out;
}

@keyframes panel-slide-in {
  from {
    transform: translateX(24px);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.panel-header,
.panel-footer {
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #dbe3ec;
  border-radius: 12px 0 0 0;
}

.panel-kicker {
  margin: 0 0 3px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
}

.panel-title {
  margin: 0;
  color: #111827;
  font-size: 17px;
  font-weight: 700;
}

.panel-header-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}

.panel-close {
  width: 28px;
  height: 28px;
  color: #6b7280;
  font-size: 18px;
  line-height: 1;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
}

.panel-close:hover {
  background: #f3f4f6;
}

.score-input-lg {
  color: #111827;
  font-weight: 800;
  text-align: center;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.score-vs {
  color: #9ca3af;
  font-weight: 800;
}

.panel-body {
  flex: 1;
  overflow: auto;
  padding: 14px 16px 18px;
}

.work-section {
  padding: 14px 0;
  border-bottom: 1px solid #e5e7eb;
}

.work-section:first-child {
  padding-top: 0;
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
  color: #111827;
  font-size: 13px;
  font-weight: 700;
}

.section-desc {
  margin: 0;
  color: #9ca3af;
  font-size: 11px;
}

.section-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.time-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.time-subsection {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #eef2f7;
}

.subsection-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.subsection-title {
  margin: 0 0 4px;
  color: #111827;
  font-size: 13px;
  font-weight: 800;
}

.option-card {
  min-width: 0;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.option-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  color: #374151;
  font-size: 12px;
}

.clear-choice-btn {
  height: 24px;
  padding: 0 8px;
  color: #6b7280;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
}

.clear-choice-btn:disabled {
  color: #cbd5e1;
  cursor: not-allowed;
  background: #f8fafc;
  border-color: #e5e7eb;
}

.radio-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.clock-state-radio-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.radio-option {
  display: flex;
  min-width: 0;
  height: 34px;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  padding: 0 9px;
  color: #4b5563;
  font-size: 12px;
  font-weight: 600;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
}

.radio-option input {
  flex: 0 0 auto;
  margin: 0;
  accent-color: #2563eb;
}

.radio-option span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.radio-option.selected {
  color: #1d4ed8;
  background: #eff6ff;
  border-color: #93c5fd;
}

.compact-action-row {
  margin-top: 10px;
}

.extra-time-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.extra-time-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.extra-time-field > span {
  text-align: center;
}

.extra-time-input-wrap {
  display: flex;
  height: 34px;
  align-items: center;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.extra-time-input-wrap span {
  flex: 0 0 auto;
  padding: 0 9px 0 4px;
  color: #9ca3af;
  font-size: 11px;
}

.extra-time-input {
  min-width: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0 4px 0 10px;
  color: #111827;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  background: transparent;
  border: none;
  outline: none;
}

.extra-time-input-wrap:focus-within {
  border-color: #93c5fd;
  box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.22);
}

.span-2 {
  grid-column: span 2;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
}

.form-input,
.stat-input {
  box-sizing: border-box;
  color: #232323;
  font-family: inherit;
  font-size: 12px;
  background: #f3f3f3;
  border: 1px solid #e9e9e9;
  border-radius: 4px;
  outline: none;
}

.form-input {
  width: 100%;
  padding: 7px 12px;
}

.form-input:focus,
.score-input:focus,
.score-input-lg:focus,
.comment-textarea:focus {
  background: #fff;
  border-color: #1c67ff;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

:deep(.base-btn.panel-action-btn) {
  background: #64748b;
}

:deep(.base-btn.panel-action-btn:hover:not(.disabled)) {
  background: #475569;
}

.score-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 46px minmax(0, 1fr);
  align-items: end;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #dbe3ec;
  border-radius: 8px;
}

.score-team {
  display: grid;
  grid-template-rows: 48px 42px;
  min-width: 0;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.home-score-team {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.away-score-team {
  background: #fff7ed;
  border-color: #fed7aa;
}

.team-title-stack {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
}

.side-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 20px;
  padding: 0 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
}

.home-label {
  color: #1d4ed8;
  background: #dbeafe;
}

.away-label {
  color: #c2410c;
  background: #ffedd5;
}

.score-team-name {
  overflow: hidden;
  width: 100%;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-input-lg {
  width: 100%;
  height: 42px;
  font-size: 18px;
}

.score-vs {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
  text-align: center;
}

.penalty-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: 1fr 80px 24px 80px 1fr;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.penalty-title {
  grid-column: 1 / -1;
  justify-self: center;
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.penalty-inline-input {
  grid-column: 2;
  width: 100%;
  box-sizing: border-box;
  padding: 7px 8px;
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  outline: none;
}

.penalty-inline-input:focus {
  border-color: #1c67ff;
}

.penalty-sep {
  grid-column: 3;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 800;
  text-align: center;
}

.penalty-sep + .penalty-inline-input {
  grid-column: 4;
}

.comment-box {
  background: #f9fafb;
  border: 1px solid #d1d5db;
  border-radius: 6px;
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
  color: #fff;
  background: #16a34a;
  border: none;
  font-weight: 700;
}

:deep(.base-btn.record-toggle-on:hover:not(.disabled)) {
  background: #15803d;
}

:deep(.base-btn.record-toggle-off) {
  color: #fff;
  background: #64748b;
  border: none;
  font-weight: 700;
}

:deep(.base-btn.record-toggle-off:hover:not(.disabled)) {
  background: #475569;
}

.comment-textarea {
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

.comment-textarea:focus {
  background: transparent;
  border-color: transparent;
}

.comment-box:focus-within {
  border-color: #fb923c;
  box-shadow: 0 0 0 2px rgba(251, 146, 60, 0.16);
}

.comment-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid #e5e7eb;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 26px;
  padding: 0 10px;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
}

.upload-btn:hover {
  background: #f3f4f6;
}

.file-input {
  display: none;
}

.upload-summary {
  color: #9ca3af;
  font-size: 12px;
}

.stats-table {
  overflow-x: auto;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.stats-row {
  display: grid;
  grid-template-columns: 92px repeat(9, minmax(68px, 1fr));
  min-width: 760px;
}

.stats-row + .stats-row {
  border-top: 1px solid #e5e7eb;
}

.stats-row > span,
.stats-row > input {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 36px;
  min-width: 0;
  padding: 8px 6px;
  text-align: center;
  border: none;
  border-right: 1px solid #e5e7eb;
  border-radius: 0;
  outline: none;
}

.stats-row > span:last-child,
.stats-row > input:last-child {
  border-right: none;
}

.stats-header {
  color: #374151;
  font-size: 11px;
  font-weight: 700;
  background: #f3f4f6;
}

.stats-team-name {
  color: #374151;
  font-size: 12px;
  font-weight: 700;
  background: #f9fafb;
}

.stat-input {
  width: 100%;
  background: #fff;
}

.stat-input:focus {
  background: #eff6ff;
  border-color: transparent #e5e7eb transparent transparent;
  box-shadow: inset 0 0 0 1px #93c5fd;
}

.panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.modal-list {
  display: flex;
  max-height: 420px;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  overflow: auto;
  padding: 0;
  list-style: none;
}

.chat-item {
  display: grid;
  grid-template-columns: 48px 90px 1fr;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.chat-time,
.history-meta {
  color: #9ca3af;
  font-size: 12px;
}

.chat-user {
  color: #374151;
  font-size: 12px;
}

.chat-message {
  color: #374151;
  font-size: 12px;
}

.comment-history-item {
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

.comment-history-item p {
  margin: 8px 0 0;
  color: #374151;
  font-size: 13px;
  line-height: 1.5;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.confirm-message {
  margin: 0;
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .broadcast-panel {
    top: 52px;
    width: 100vw;
    max-width: 100vw;
  }

  .score-editor,
  .time-grid {
    grid-template-columns: 1fr;
  }

  .extra-time-grid,
  .clock-state-radio-grid,
  .radio-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .subsection-head {
    flex-direction: column;
  }

  .span-2 {
    grid-column: auto;
  }
}
</style>
