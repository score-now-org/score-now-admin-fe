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
          :disabled="isWorking('detail') || isWorking('refresh')"
          @click="refreshMatch"
        >
          {{ isWorking('refresh') ? '새로고침중' : '새로고침' }}
        </BaseButton>
        <button class="panel-close" type="button" @click="$emit('close')">×</button>
      </div>
    </div>

    <div class="panel-body">
      <p v-if="detailError" class="panel-error">{{ detailError }}</p>

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
            <p class="section-desc">중계 멘트를 등록하고 현재 등록된 멘트를 확인합니다.</p>
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
          class="current-comment-summary"
          :class="{
            empty: !currentComment,
            highlighted: currentComment?.highlight,
          }"
        >
          <div class="current-comment-meta-row">
            <span class="current-comment-label">최근 멘트</span>
          </div>
          <p
            v-if="currentComment"
            class="current-comment-message"
          >
              {{ currentComment.message }}
          </p>
          <p v-else class="current-comment-message muted">
            등록된 멘트가 없습니다.
          </p>
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
            <button
              class="upload-btn"
              type="button"
              @click="notifyUnsupportedFeature('사진 추가')"
            >
              사진 추가
            </button>
            <span class="upload-summary">이미지 서버 구축 후 제공됩니다.</span>
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
            @click="notifyUnsupportedFeature('푸시 발송')"
          >
            멘트 저장 & 푸시 발송
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
      <p v-if="commentHistoryLoading" class="modal-empty">
        중계글 모음을 불러오는 중입니다.
      </p>
      <p v-else-if="commentHistoryError" class="modal-empty error">
        {{ commentHistoryError }}
      </p>
      <ul v-else-if="visibleCommentHistory.length" class="modal-list">
        <li v-for="comment in visibleCommentHistory" :key="comment.id" class="comment-history-item">
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
import {
  createMatchCommentary,
  getAdminMatchDetail,
  getMatchCommentaries,
  updateFootballMatchDetail,
} from '../../../../api/match'

const props = defineProps({
  match: { type: Object, default: null },
})

const emit = defineEmits(['close', 'match-updated'])

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
  { value: 'EXTRA_TIME_WAITING', label: '연장 대기' },
  { value: 'EXTRA_FIRST_HALF', label: '연장 전반' },
  { value: 'EXTRA_SECOND_HALF', label: '연장 후반' },
  { value: 'PENALTY_SHOOTOUT', label: '승부차기' },
  { value: 'EXTRA_TIME_ENDED', label: '연장 종료' },
  { value: 'FULL_TIME', label: '경기 종료' },
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
const chatModalVisible = ref(false)
const commentHistoryModalVisible = ref(false)
const confirmModal = ref(defaultConfirmModal())
const chats = ref([])
const currentCommentary = ref(null)
const commentHistory = ref([])
const commentHistoryLoading = ref(false)
const commentHistoryError = ref('')
const commentHistoryRequestId = ref(0)
const detailError = ref('')
const detailRequestId = ref(0)

const homeTeamName = computed(() => props.match?.homeTeam?.name || '홈팀')
const awayTeamName = computed(() => props.match?.awayTeam?.name || '원정팀')
const matchLeague = computed(() => props.match?.leagueName || props.match?.leagueId || '-')
const clockStatePreview = computed(() => {
  return soccerClockStateOptions.find((item) => item.value === timeForm.value.clockState)?.label || '선택된 문구 없음'
})
const currentComment = computed(() => currentCommentary.value)
const visibleCommentHistory = computed(() => commentHistory.value)

watch(
  () => props.match?.id,
  () => {
    resetPanelState()
    fetchMatchDetail('detail')
  },
  { immediate: true },
)

function resetPanelState() {
  timeForm.value = defaultTimeForm()
  scoreForm.value = defaultScoreForm()
  commentForm.value = defaultCommentForm()
  statsForm.value = defaultStatsForm()
  loading.value = {}
  chats.value = makeMockChats()
  currentCommentary.value = null
  commentHistory.value = []
  commentHistoryLoading.value = false
  commentHistoryError.value = ''
  detailError.value = ''
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
    homeScore: Number(props.match?.homeScore ?? 0),
    awayScore: Number(props.match?.awayScore ?? 0),
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
    home: defaultFootballStats(),
    away: defaultFootballStats(),
  }
}

function defaultFootballStats() {
  return {
    shots: 0,
    shotsOnTarget: 0,
    possession: 0,
    corners: 0,
    freeKicks: 0,
    offsides: 0,
    fouls: 0,
    yellowCards: 0,
    redCards: 0,
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

async function openCommentHistoryModal() {
  commentHistoryModalVisible.value = true
  await fetchCommentHistory()
}

async function fetchCommentHistory() {
  if (!props.match?.id) return

  const requestId = commentHistoryRequestId.value + 1
  commentHistoryRequestId.value = requestId
  commentHistoryError.value = ''
  commentHistoryLoading.value = true

  try {
    const comments = await getMatchCommentaries(props.match.id)

    if (requestId !== commentHistoryRequestId.value) return

    commentHistory.value = normalizeCommentaries(comments)
  } catch (error) {
    if (requestId !== commentHistoryRequestId.value) return

    console.error('중계글 모음 조회에 실패했습니다.', error)
    commentHistory.value = []
    commentHistoryError.value = extractApiErrorMessage(error, '중계글 모음을 불러오지 못했습니다.')
  } finally {
    if (requestId === commentHistoryRequestId.value) {
      commentHistoryLoading.value = false
    }
  }
}

async function refreshMatch() {
  await fetchMatchDetail('refresh', true)
}

async function fetchMatchDetail(loadingKey = 'detail', showAlert = false) {
  if (!props.match?.id) return

  const requestId = detailRequestId.value + 1
  detailRequestId.value = requestId
  detailError.value = ''
  setLoading(loadingKey, true)

  try {
    const detail = await getAdminMatchDetail(props.match.id)

    if (requestId !== detailRequestId.value) return

    applyMatchDetail(detail)
  } catch (error) {
    if (requestId !== detailRequestId.value) return

    console.error('중계 패널 상세 조회에 실패했습니다.', error)
    detailError.value = '중계 상세 정보를 불러오지 못했습니다.'
    if (showAlert) {
      alert(extractApiErrorMessage(error, '중계 상세 정보를 불러오지 못했습니다.'))
    }
  } finally {
    if (requestId === detailRequestId.value) {
      setLoading(loadingKey, false)
    }
  }
}

function applyMatchDetail(detail = {}) {
  const startAt = splitDateTime(detail.startAt)
  const footballDetail = detail.footballDetail || {}
  const nextStatus = detail.statusCode || timeForm.value.status
  const nextHomeScore = Number(detail.homeScore ?? scoreForm.value.homeScore ?? 0)
  const nextAwayScore = Number(detail.awayScore ?? scoreForm.value.awayScore ?? 0)
  const nextClockState = resolveFootballPhaseCode(footballDetail, detail)
  const nextExtraTime = mergeExtraTime(timeForm.value.extraTime, footballDetail.additionalTime)
  const nextPenaltyScore = pickPenaltyScore(footballDetail.shootOutScore)
  const nextHomeStats = mergeStats(statsForm.value.home, footballDetail.homeStats)
  const nextAwayStats = mergeStats(statsForm.value.away, footballDetail.awayStats)

  timeForm.value = {
    ...timeForm.value,
    startDate: startAt.date || timeForm.value.startDate,
    startTime: startAt.time || timeForm.value.startTime,
    status: nextStatus,
    clockState: nextClockState || '',
    extraTime: nextExtraTime,
  }

  scoreForm.value = {
    ...scoreForm.value,
    homeScore: nextHomeScore,
    awayScore: nextAwayScore,
    penaltyVisible: scoreForm.value.penaltyVisible || nextPenaltyScore.visible,
    homePenaltyScore: nextPenaltyScore.homeScore ?? scoreForm.value.homePenaltyScore,
    awayPenaltyScore: nextPenaltyScore.awayScore ?? scoreForm.value.awayPenaltyScore,
  }

  statsForm.value = {
    home: nextHomeStats,
    away: nextAwayStats,
  }

  currentCommentary.value = normalizeCurrentComment(detail)

  emit('match-updated', {
    matchId: props.match?.id,
    patch: {
      startDate: startAt.date,
      startTime: startAt.time,
      status: nextStatus,
      statusName: detail.statusName || statusLabel(nextStatus),
      homeScore: nextHomeScore,
      awayScore: nextAwayScore,
    },
  })
}

function normalizeCurrentComment(detail = {}) {
  if (!detail.currentCommentary) return null

  return {
    id: `current-${props.match?.id}`,
    message: detail.currentCommentary,
    highlight: Boolean(detail.currentCommentaryHighlighted),
    recorded: true,
  }
}

function normalizeSavedCommentary(commentary = {}, fallback = {}) {
  const content = commentary.content
    || commentary.commentary
    || commentary.currentCommentary
    || fallback.content

  return {
    id: commentary.id || commentary.commentaryId || `saved-${Date.now()}`,
    time: formatHistoryDateTime(commentary.createdAt),
    message: content,
    highlight: commentary.highlighted ?? commentary.highlight ?? fallback.highlighted ?? false,
    recorded: commentary.recordEnabled ?? commentary.recorded ?? fallback.recordEnabled ?? true,
  }
}

function normalizeCommentaries(comments) {
  return ensureArray(comments).map((comment, index) => ({
    id: comment.id || comment.commentaryId || `${comment.createdAt || 'comment'}-${index}`,
    time: formatHistoryDateTime(comment.createdAt),
    message: comment.content || '',
    highlight: Boolean(comment.highlighted),
  }))
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

  try {
    if (action === 'comment') {
      await saveCommentary()
      return
    }

    await saveFootballDetail(action)
  } catch (error) {
    console.error('중계 패널 작업 처리에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '작업 처리에 실패했습니다.'))
  } finally {
    setLoading(action, false)
  }
}

async function saveFootballDetail(action) {
  const payload = buildFootballDetailUpdatePayload(action)
  if (!payload) return

  await updateFootballMatchDetail(props.match.id, payload)
  applyFootballDetailUpdatePayload(payload)
}

async function saveCommentary() {
  const requestPayload = {
    content: commentForm.value.message.trim(),
    recordEnabled: commentForm.value.recordEnabled,
    highlighted: commentForm.value.highlight,
  }

  const response = await createMatchCommentary(props.match.id, requestPayload)
  const savedComment = normalizeSavedCommentary(response, requestPayload)

  currentCommentary.value = savedComment
  if (savedComment.recorded !== false) {
    commentHistory.value = [
      savedComment,
      ...commentHistory.value.filter((comment) => String(comment.id) !== String(savedComment.id)),
    ]
  }
  commentForm.value.message = ''
}

function buildFootballDetailUpdatePayload(action) {
  if (action === 'currentTime') {
    const kstNow = getKstNowDateTime()

    return {
      startAt: `${kstNow.date}T${kstNow.time}:00`,
    }
  }

  if (action === 'manualTime') {
    return {
      startAt: buildStartAt(timeForm.value.startDate, timeForm.value.startTime),
    }
  }

  if (action === 'status') {
    return {
      status: timeForm.value.status,
    }
  }

  if (action === 'clockState') {
    return {
      phase: timeForm.value.clockState || null,
    }
  }

  if (action === 'extraTime') {
    return {
      firstHalf: toNonNegativeInteger(timeForm.value.extraTime.firstHalf),
      secondHalf: toNonNegativeInteger(timeForm.value.extraTime.secondHalf),
      extraFirstHalf: toNonNegativeInteger(timeForm.value.extraTime.extraFirstHalf),
      extraSecondHalf: toNonNegativeInteger(timeForm.value.extraTime.extraSecondHalf),
    }
  }

  if (action === 'score') {
    const payload = {
      homeScore: toNonNegativeInteger(scoreForm.value.homeScore),
      awayScore: toNonNegativeInteger(scoreForm.value.awayScore),
    }

    if (scoreForm.value.penaltyVisible) {
      payload.homeShootOutScore = toNonNegativeInteger(scoreForm.value.homePenaltyScore)
      payload.awayShootOutScore = toNonNegativeInteger(scoreForm.value.awayPenaltyScore)
    }

    return payload
  }

  if (action === 'stats') {
    return {
      homeStats: buildStatsPayload(statsForm.value.home),
      awayStats: buildStatsPayload(statsForm.value.away),
    }
  }

  return null
}

function applyFootballDetailUpdatePayload(payload) {
  const listPatch = {}

  if (payload.startAt) {
    const startAt = splitDateTime(payload.startAt)
    timeForm.value.startDate = startAt.date
    timeForm.value.startTime = startAt.time
    listPatch.startDate = startAt.date
    listPatch.startTime = startAt.time
  }

  if (payload.status) {
    timeForm.value.status = payload.status
    listPatch.status = payload.status
    listPatch.statusName = statusLabel(payload.status)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'phase')) {
    timeForm.value.clockState = payload.phase || timeForm.value.clockState
  }

  extraTimeFields.forEach((field) => {
    if (payload[field.key] != null) {
      timeForm.value.extraTime[field.key] = payload[field.key]
    }
  })

  if (payload.homeScore != null) {
    scoreForm.value.homeScore = payload.homeScore
    listPatch.homeScore = payload.homeScore
  }

  if (payload.awayScore != null) {
    scoreForm.value.awayScore = payload.awayScore
    listPatch.awayScore = payload.awayScore
  }

  if (payload.homeShootOutScore != null) {
    scoreForm.value.homePenaltyScore = payload.homeShootOutScore
  }

  if (payload.awayShootOutScore != null) {
    scoreForm.value.awayPenaltyScore = payload.awayShootOutScore
  }

  if (payload.homeStats) {
    statsForm.value.home = {
      ...statsForm.value.home,
      ...payload.homeStats,
    }
  }

  if (payload.awayStats) {
    statsForm.value.away = {
      ...statsForm.value.away,
      ...payload.awayStats,
    }
  }

  if (Object.keys(listPatch).length) {
    emit('match-updated', {
      matchId: props.match?.id,
      patch: listPatch,
    })
  }
}

function closeConfirmModal() {
  confirmModal.value = defaultConfirmModal()
}

function validateAction(action) {
  if (!props.match?.id) {
    alert('경기 정보를 확인할 수 없습니다.')
    return false
  }

  if (action === 'manualTime' && !timeForm.value.startDate) {
    alert('경기 시작 예정일자를 입력해주세요.')
    return false
  }

  if (action === 'manualTime' && !timeForm.value.startTime) {
    alert('경기 시작 예정시각을 입력해주세요.')
    return false
  }

  if (action === 'manualTime' && !buildStartAt(timeForm.value.startDate, timeForm.value.startTime)) {
    alert('경기 시작 날짜와 시간 형식을 확인해주세요.')
    return false
  }

  if (action === 'comment') {
    if (!commentForm.value.message.trim()) {
      alert('중계 멘트를 입력해주세요.')
      return false
    }
  }

  if (action === 'extraTime' && !isValidExtraTime()) {
    alert('추가시간은 0 이상의 숫자로 입력해주세요.')
    return false
  }

  if (action === 'score' && !isValidScore()) {
    alert('점수는 0 이상의 숫자로 입력해주세요.')
    return false
  }

  if (action === 'stats' && !isValidStats()) {
    alert('경기 스탯은 0 이상의 숫자로 입력해주세요.')
    return false
  }

  return true
}

function actionConfig(action) {
  return {
    currentTime: {
      title: '현재 시간 저장',
      message: '확인 시점의 KST 현재 시간으로 경기 시작 예정 시간을 저장합니다.',
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
    stats: {
      title: '스탯 저장',
      message: '입력한 경기 스탯으로 수동 저장합니다.',
      variant: 'primary',
    },
  }[action]
}

function clockStateSaveMessage() {
  if (clockStatePreview.value === '선택된 문구 없음') {
    return '선택된 중계 상태 문구가 없으면 현재 서버 값이 유지됩니다.'
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
  return extraTimeFields.every((field) => isNonNegativeIntegerValue(timeForm.value.extraTime[field.key]))
}

function isValidScore() {
  const regularScoreValid = isNonNegativeIntegerValue(scoreForm.value.homeScore)
    && isNonNegativeIntegerValue(scoreForm.value.awayScore)

  if (!regularScoreValid) return false
  if (!scoreForm.value.penaltyVisible) return true

  return isNonNegativeIntegerValue(scoreForm.value.homePenaltyScore)
    && isNonNegativeIntegerValue(scoreForm.value.awayPenaltyScore)
}

function isValidStats() {
  return statFields.every((stat) => (
    isNonNegativeIntegerValue(statsForm.value.home[stat.key])
      && isNonNegativeIntegerValue(statsForm.value.away[stat.key])
  ))
}

function buildStartAt(date, time) {
  const normalizedDate = normalizeDateInput(date)
  const normalizedTime = normalizeTimeInput(time)

  if (!normalizedDate || !normalizedTime) return ''

  return `${normalizedDate}T${normalizedTime}:00`
}

function getKstNowDateTime() {
  const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000)
  const isoString = kstDate.toISOString()

  return {
    date: isoString.slice(0, 10),
    time: isoString.slice(11, 16),
  }
}

function buildStatsPayload(stats) {
  return statFields.reduce((payload, stat) => {
    payload[stat.key] = toNonNegativeInteger(stats[stat.key])
    return payload
  }, {})
}

function resolveFootballPhaseCode(footballDetail, detail) {
  const phaseCode = normalizeFootballPhaseCode(
    footballDetail.phaseCode
      || footballDetail.phase
      || footballDetail.clockState
      || footballDetail.clock?.phaseCode
      || footballDetail.clock?.phase
      || detail.phaseCode
      || detail.phase
      || detail.clockState,
  )

  if (phaseCode) return phaseCode

  return findFootballPhaseCodeByName(footballDetail.phaseName)
    || timeForm.value.clockState
}

function normalizeFootballPhaseCode(value) {
  if (!value) return ''

  const normalizedValue = String(value).trim().toUpperCase()

  return soccerClockStateOptions.some((option) => option.value === normalizedValue)
    ? normalizedValue
    : ''
}

function findFootballPhaseCodeByName(value) {
  if (!value) return ''

  const normalizedName = String(value).trim().replaceAll(' ', '')

  return soccerClockStateOptions.find((option) => (
    option.label.replaceAll(' ', '') === normalizedName
  ))?.value || ''
}

function mergeExtraTime(currentExtraTime, additionalTime) {
  if (!additionalTime) return { ...currentExtraTime }

  return extraTimeFields.reduce((nextExtraTime, field) => {
    if (additionalTime[field.key] != null) {
      nextExtraTime[field.key] = Number(additionalTime[field.key])
    }

    return nextExtraTime
  }, { ...currentExtraTime })
}

function pickPenaltyScore(shootOutScore) {
  if (!shootOutScore) {
    return {
      visible: false,
      homeScore: null,
      awayScore: null,
    }
  }

  const homeScore = firstDefined(
    shootOutScore.homeScore,
    shootOutScore.homeShootOutScore,
    shootOutScore.homeShootoutScore,
    shootOutScore.homePenaltyScore,
  )
  const awayScore = firstDefined(
    shootOutScore.awayScore,
    shootOutScore.awayShootOutScore,
    shootOutScore.awayShootoutScore,
    shootOutScore.awayPenaltyScore,
  )

  return {
    visible: homeScore != null || awayScore != null,
    homeScore: homeScore == null ? null : Number(homeScore),
    awayScore: awayScore == null ? null : Number(awayScore),
  }
}

function mergeStats(currentStats, nextStats) {
  if (!nextStats) return { ...currentStats }

  return statFields.reduce((mergedStats, stat) => {
    if (nextStats[stat.key] != null) {
      mergedStats[stat.key] = Number(nextStats[stat.key])
    }

    return mergedStats
  }, { ...currentStats })
}

function firstDefined(...values) {
  return values.find((value) => value != null)
}

function normalizeDateInput(value) {
  const date = String(value || '').trim()

  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : ''
}

function normalizeTimeInput(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{1,2})$/)
  if (!match) return ''

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (hour > 23 || minute > 59) return ''

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function isNonNegativeIntegerValue(value) {
  if (value === '' || value == null) return false

  const numberValue = Number(value)

  return Number.isInteger(numberValue) && numberValue >= 0
}

function toNonNegativeInteger(value) {
  return Number(value)
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

function notifyUnsupportedFeature(featureName) {
  alert(`${featureName} 기능은 아직 지원하지 않습니다.`)
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

function formatHistoryDateTime(value) {
  if (!value) return ''

  return String(value).replace('T', ' ').slice(0, 16)
}

function splitDateTime(value) {
  if (!value) {
    return { date: '', time: '' }
  }

  const normalized = String(value).replace(' ', 'T')
  const [date = '', time = ''] = normalized.split('T')

  return {
    date,
    time: time.slice(0, 5),
  }
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
  if (Array.isArray(value)) {
    return value.map(toErrorMessage).filter(Boolean).join('\n')
  }
  if (typeof value === 'object') {
    return Object.values(value).map(toErrorMessage).filter(Boolean).join('\n')
  }

  return String(value)
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function makeMockChats() {
  return [
    { id: 1, time: '19:01', user: 'user142', message: '오늘 선발 라인업 좋네요.' },
    { id: 2, time: '19:03', user: 'goal9', message: '맨시티 압박이 강합니다.' },
    { id: 3, time: '19:04', user: 'admin-check', message: '중계 지연 없는지 확인 부탁드립니다.' },
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

.panel-error {
  margin: 0 0 12px;
  padding: 9px 10px;
  color: #b91c1c;
  font-size: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
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
  font-family: inherit;
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

.upload-summary {
  color: #9ca3af;
  font-size: 12px;
}

.current-comment-summary {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.current-comment-summary.highlighted {
  background: #fff7ed;
  border-color: #fed7aa;
}

.current-comment-summary.empty {
  background: #f9fafb;
}

.current-comment-meta-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.current-comment-label {
  flex: 0 0 auto;
  color: #374151;
  font-size: 11px;
  font-weight: 800;
}

.current-comment-message {
  width: 100%;
  margin: 0;
  color: #374151;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.current-comment-message.muted {
  color: #9ca3af;
  font-weight: 500;
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

.modal-empty {
  margin: 0;
  padding: 28px 0;
  color: #9ca3af;
  font-size: 12px;
  text-align: center;
}

.modal-empty.error {
  color: #dc2626;
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
