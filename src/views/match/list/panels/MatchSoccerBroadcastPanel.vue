<template>
  <aside class="broadcast-panel" tabindex="-1" @keydown.esc.stop="closePanel">
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
          :disabled="panelBusy"
          @click="refreshMatch"
        >
          {{ isWorking('refresh') ? '새로고침중' : '새로고침' }}
        </BaseButton>
        <button class="panel-close" type="button" :disabled="panelBusy" aria-label="축구 중계 패널 닫기" @click="closePanel">×</button>
      </div>
    </div>

    <fieldset class="panel-body" :disabled="panelBusy || !panelLoaded">
      <p v-if="detailError" class="panel-error">{{ detailError }}</p>

      <section class="work-section">
        <div class="section-head">
          <div>
            <h4 class="section-title">경기 예정 시각</h4>
            <p class="section-desc">경기 시작 예정 일자와 시각을 관리합니다.</p>
          </div>
        </div>

        <div class="time-grid">
          <label class="form-row">
            <span class="form-label">경기 시작 예정일자</span>
            <BaseInput v-model="timeForm.startDate" type="date" />
          </label>
          <label class="form-row">
            <span class="form-label">경기 시작 예정시각</span>
            <BaseInput v-model="timeForm.startTime" type="time" />
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
        </div>
      </section>

      <section class="work-section">
        <div class="section-head">
          <div>
            <h4 class="section-title">경기 상태</h4>
            <p class="section-desc">경기의 진행 상태를 별도로 변경합니다.</p>
          </div>
          <BaseBadge :variant="statusBadgeVariant(timeForm.status)">
            {{ statusLabel(timeForm.status) }}
          </BaseBadge>
        </div>

        <div class="status-editor">
          <label class="form-row">
            <span class="form-label">변경할 경기 상태</span>
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
            :disabled="isWorking('status')"
            @click="requestAction('status')"
          >
            {{ buttonLabel('status', '경기 상태 저장') }}
          </BaseButton>
        </div>
      </section>

      <section class="work-section">
        <div class="section-head">
          <div>
            <h4 class="section-title">경기 시계</h4>
            <p class="section-desc">경기 Phase, 경과시간과 추가시간을 관리합니다.</p>
          </div>
        </div>

        <div class="time-subsection first-time-subsection">
          <div class="subsection-head">
            <div>
              <h5 class="subsection-title">현재 경기 시계</h5>
              <p class="section-desc">현재 Phase의 경과시간을 확인하고 보정하거나 타이머를 제어합니다.</p>
            </div>
            <BaseBadge :variant="footballClock.running ? 'green' : 'gray'">
              {{ clockRunningLabel }}
            </BaseBadge>
          </div>

          <div class="clock-overview" :class="{ running: footballClock.running }">
            <div
              class="clock-phase-summary"
              :class="{ ended: footballClock.phaseCode === 'FULL_TIME' }"
            >
              <span>현재 Phase</span>
              <strong>{{ currentPhaseLabel }}</strong>
            </div>
            <div class="clock-elapsed-summary">
              <span>현재 경과시간</span>
              <strong>{{ formattedClockElapsed }}</strong>
            </div>
          </div>

          <div class="clock-meta-grid">
            <div>
              <span>기준 경과시간</span>
              <strong>{{ formattedClockBaseElapsed }}</strong>
            </div>
            <div>
              <span>기준시각</span>
              <strong>{{ clockReferenceText }}</strong>
            </div>
          </div>

          <div class="clock-correction-card">
            <div>
              <strong>Phase 경과시간 보정</strong>
              <p>입력한 시간으로 기준 경과시간을 다시 설정합니다.</p>
            </div>
            <div class="clock-correction-controls">
              <label class="clock-correction-field">
                <input
                  v-model.number="clockCorrectionForm.elapsedMinutes"
                  type="number"
                  min="0"
                  step="1"
                  :disabled="!clockInitialized"
                />
                <span>분</span>
              </label>
              <label class="clock-correction-field">
                <input
                  v-model.number="clockCorrectionForm.elapsedSeconds"
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  :disabled="!clockInitialized"
                />
                <span>초</span>
              </label>
              <BaseButton
                variant="primary"
                size="sm"
                :disabled="!clockInitialized || clockActionWorking"
                @click="requestAction('clockCorrection')"
              >
                {{ isWorking('clockCorrection') ? '보정중' : '시간 보정' }}
              </BaseButton>
            </div>
          </div>

          <div class="action-row compact-action-row">
            <BaseButton
              v-if="footballClock.running"
              variant="warn"
              size="sm"
              :disabled="!clockInitialized || clockActionWorking"
              @click="requestAction('clockPause')"
            >
              {{ isWorking('clockPause') ? '처리중' : '타이머 일시정지' }}
            </BaseButton>
            <BaseButton
              v-else
              variant="secondary"
              size="sm"
              class="panel-action-btn"
              :disabled="!canResumeClock || clockActionWorking"
              @click="requestAction('clockResume')"
            >
              {{ isWorking('clockResume') ? '처리중' : '타이머 재개' }}
            </BaseButton>
            <span v-if="!clockInitialized" class="clock-action-hint">
              먼저 아래에서 경기 Phase를 시작해주세요.
            </span>
            <span v-else-if="!footballClock.running && !canResumeClock" class="clock-action-hint">
              현재 Phase 또는 경기 상태에서는 타이머를 재개할 수 없습니다.
            </span>
          </div>
        </div>

        <div class="time-subsection">
          <div class="subsection-head">
            <div>
              <h5 class="subsection-title">경기 Phase 전환</h5>
              <p class="section-desc">Phase 전환 시 기준시각은 현재 시각, 경과시간은 0초로 초기화됩니다.</p>
            </div>
          </div>

          <div class="option-card clock-state-card">
            <div class="option-card-head">
              <strong>전환할 Phase</strong>
              <span
                class="current-phase-caption"
                :class="{ ended: footballClock.phaseCode === 'FULL_TIME' }"
              >현재 {{ currentPhaseLabel }}</span>
            </div>
            <div class="radio-grid clock-state-radio-grid">
              <label
                v-for="clockState in soccerClockStateOptions"
                :key="clockState.value"
                class="radio-option"
                :class="{
                  selected: timeForm.clockState === clockState.value,
                  'ending-phase': clockState.value === 'FULL_TIME',
                }"
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
              :disabled="!canTransitionPhase || clockActionWorking"
              @click="requestAction('clockState')"
            >
              {{ isWorking('clockState') ? '전환중' : '선택 Phase 시작/전환' }}
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

        </div>

        <div class="action-row">
          <BaseButton
            variant="primary"
            size="sm"
            :disabled="isWorking('score')"
            @click="requestAction('score')"
          >
            {{ buttonLabel('score', '일반 점수 저장') }}
          </BaseButton>
        </div>

        <div v-if="isPenaltyShootoutPhase" class="penalty-score-section">
          <div class="subsection-head">
            <div>
              <h5 class="subsection-title">승부차기 점수</h5>
              <p class="section-desc">승부차기 Phase에서 기록된 점수를 별도로 저장합니다.</p>
            </div>
          </div>

          <div class="penalty-row">
            <span class="penalty-team-name">{{ homeTeamName }}</span>
            <input v-model.number="scoreForm.homePenaltyScore" class="penalty-inline-input" type="number" min="0" />
            <span class="penalty-sep">:</span>
            <input v-model.number="scoreForm.awayPenaltyScore" class="penalty-inline-input" type="number" min="0" />
            <span class="penalty-team-name away">{{ awayTeamName }}</span>
          </div>

          <div class="action-row compact-action-row">
            <BaseButton
              variant="primary"
              size="sm"
              :disabled="isWorking('shootOutScore')"
              @click="requestAction('shootOutScore')"
            >
              {{ buttonLabel('shootOutScore', '승부차기 점수 저장') }}
            </BaseButton>
          </div>
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
          <BaseTextarea
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
              :max="stat.max"
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
              :max="stat.max"
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
    </fieldset>

    <BaseModal v-model="chatModalVisible" title="채팅 보기" size="lg">
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

    <BaseModal v-model="commentHistoryModalVisible" title="중계글 모음" size="lg">
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

    <BaseModal v-model="confirmModal.visible" :title="confirmModal.title" size="sm">
      <p class="confirm-message">{{ confirmModal.message }}</p>
      <template #footer>
        <BaseButton variant="outline" @click="closeConfirmModal">취소</BaseButton>
        <BaseButton :variant="confirmModal.variant" @click="confirmAction">확인</BaseButton>
      </template>
    </BaseModal>
    <AdminUnsavedChangesModal :action="pendingAction" @confirm="confirmDiscard" @cancel="cancelDiscard" />
  </aside>
</template>

<script setup>
import AdminUnsavedChangesModal from '@/components/admin/AdminUnsavedChangesModal.vue'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import {
  correctFootballClock,
  createMatchCommentary,
  getAdminMatchDetail,
  getMatchCommentaries,
  pauseFootballClock,
  resumeFootballClock,
  transitionFootballPhase,
  updateAdminMatchScheduledStartAt,
  updateAdminMatchScore,
  updateAdminMatchStatus,
  updateFootballAdditionalTime,
  updateFootballShootOutScore,
  updateFootballStatistics,
} from '../../../../api/match'

const props = defineProps({
  match: { type: Object, default: null },
})

const emit = defineEmits(['close', 'match-updated'])

const statusOptions = ref([])
const soccerClockStateOptions = ref([])

const extraTimeFields = [
  { key: 'firstHalf', label: '전반' },
  { key: 'secondHalf', label: '후반' },
  { key: 'extraFirstHalf', label: '연장 전반' },
  { key: 'extraSecondHalf', label: '연장 후반' },
]

const statFields = [
  { key: 'shots', label: '슈팅' },
  { key: 'shotsOnTarget', label: '유효슛' },
  { key: 'possession', label: '점유율', max: 100 },
  { key: 'corners', label: '코너킥' },
  { key: 'freeKicks', label: '프리킥' },
  { key: 'offsides', label: '오프사이드' },
  { key: 'fouls', label: '파울' },
  { key: 'yellowCards', label: '경고' },
  { key: 'redCards', label: '퇴장' },
]

const timeForm = ref(defaultTimeForm())
const persistedMatchStatus = ref(props.match?.status || 'NOT_STARTED')
const footballClock = ref(defaultFootballClock())
const clockCorrectionForm = ref(defaultClockCorrectionForm())
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
const clockNow = ref(Date.now())
let clockTickTimer = null

const clone = (value) => JSON.parse(JSON.stringify(value))
const persisted = ref({})
const panelLoaded = ref(false)
const panelBusy = computed(() => Object.values(loading.value).some(Boolean))
const editorGroups = {
  schedule: { get: () => ({ startDate: timeForm.value.startDate, startTime: timeForm.value.startTime }), set: (v) => Object.assign(timeForm.value, v) },
  status: { get: () => timeForm.value.status, set: (v) => { timeForm.value.status = v } },
  clockState: { get: () => timeForm.value.clockState, set: (v) => { timeForm.value.clockState = v } },
  clockCorrection: { get: () => clockCorrectionForm.value, set: (v) => { clockCorrectionForm.value = v } },
  extraTime: { get: () => timeForm.value.extraTime, set: (v) => { timeForm.value.extraTime = v } },
  score: { get: () => ({ homeScore: scoreForm.value.homeScore, awayScore: scoreForm.value.awayScore }), set: (v) => Object.assign(scoreForm.value, v) },
  shootOutScore: { get: () => ({ homePenaltyScore: scoreForm.value.homePenaltyScore, awayPenaltyScore: scoreForm.value.awayPenaltyScore }), set: (v) => Object.assign(scoreForm.value, v) },
  stats: { get: () => statsForm.value, set: (v) => { statsForm.value = v } },
  comment: { get: () => commentForm.value, set: (v) => { commentForm.value = v } },
}
const snapshot = () => clone(Object.fromEntries(Object.entries(editorGroups).map(([key, group]) => [key, group.get()])))
const hasUnsavedChanges = computed(() => panelLoaded.value && JSON.stringify(snapshot()) !== JSON.stringify(persisted.value))
const { pendingAction, requestDiscard, confirmDiscard, cancelDiscard } = useUnsavedChangesGuard(hasUnsavedChanges, panelBusy)
function closePanel() {
  if (pendingAction.value) return cancelDiscard()
  if (confirmModal.value.visible || chatModalVisible.value || commentHistoryModalVisible.value) return
  return requestDiscard('close', () => emit('close'))
}
defineExpose({ requestSwitch: (work) => {
  if (confirmModal.value.visible || chatModalVisible.value || commentHistoryModalVisible.value) return
  return requestDiscard('switch', work)
} })

const homeTeamName = computed(() => props.match?.homeTeam?.name || '홈팀')
const awayTeamName = computed(() => props.match?.awayTeam?.name || '원정팀')
const matchLeague = computed(() => props.match?.leagueName || props.match?.leagueId || '-')
const clockStatePreview = computed(() => {
  return soccerClockStateOptions.value.find((item) => item.value === timeForm.value.clockState)?.label || '선택된 문구 없음'
})
const clockInitialized = computed(() => (
  Boolean(footballClock.value.phaseCode)
    && footballClock.value.phaseElapsedSeconds != null
    && Number.isInteger(Number(footballClock.value.phaseElapsedSeconds))
    && Boolean(footballClock.value.clockSyncedAt)
    && typeof footballClock.value.running === 'boolean'
))
const currentPhaseLabel = computed(() => {
  if (footballClock.value.phaseName) return footballClock.value.phaseName

  return soccerClockStateOptions.value.find((item) => (
    item.value === footballClock.value.phaseCode
  ))?.label || '미설정'
})
const resolvedClockElapsedSeconds = computed(() => {
  if (!clockInitialized.value) return null

  const baseSeconds = Math.max(Number(footballClock.value.phaseElapsedSeconds), 0)
  if (!footballClock.value.running) return baseSeconds

  const syncedAt = Date.parse(footballClock.value.clockSyncedAt)
  if (!Number.isFinite(syncedAt)) return baseSeconds

  const elapsedSinceSync = Math.max(Math.floor((clockNow.value - syncedAt) / 1000), 0)
  return baseSeconds + elapsedSinceSync
})
const formattedClockElapsed = computed(() => formatClockDuration(resolvedClockElapsedSeconds.value))
const formattedClockBaseElapsed = computed(() => (
  formatClockDuration(clockInitialized.value ? footballClock.value.phaseElapsedSeconds : null)
))
const clockReferenceText = computed(() => formatClockReferenceTime(footballClock.value.clockSyncedAt))
const clockRunningLabel = computed(() => {
  if (!clockInitialized.value) return '미설정'
  return footballClock.value.running ? '타이머 진행중' : '타이머 정지'
})
const clockActionWorking = computed(() => (
  ['clockState', 'clockCorrection', 'clockPause', 'clockResume'].some(isWorking)
))
const canResumeClock = computed(() => (
  clockInitialized.value
    && !footballClock.value.running
    && isClockRunningPhase(footballClock.value.phaseCode)
    && persistedMatchStatus.value === 'IN_PLAY'
))
const canTransitionPhase = computed(() => (
  Boolean(timeForm.value.clockState)
    && timeForm.value.clockState !== footballClock.value.phaseCode
))
const isPenaltyShootoutPhase = computed(() => (
  footballClock.value.phaseCode === 'PENALTY_SHOOTOUT'
))
const currentComment = computed(() => currentCommentary.value)
const visibleCommentHistory = computed(() => commentHistory.value)

onMounted(() => {
  clockTickTimer = window.setInterval(() => {
    clockNow.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  detailRequestId.value += 1
  commentHistoryRequestId.value += 1
  if (clockTickTimer != null) {
    window.clearInterval(clockTickTimer)
  }
})

watch(
  () => props.match?.id,
  () => {
    resetPanelState()
    fetchMatchDetail('detail')
  },
  { immediate: true },
)

function resetPanelState() {
  panelLoaded.value = false
  persisted.value = {}
  cancelDiscard()
  statusOptions.value = []
  soccerClockStateOptions.value = []
  timeForm.value = defaultTimeForm()
  persistedMatchStatus.value = props.match?.status || 'NOT_STARTED'
  footballClock.value = defaultFootballClock()
  clockCorrectionForm.value = defaultClockCorrectionForm()
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

function defaultFootballClock() {
  return {
    phaseCode: '',
    phaseName: '',
    clockSyncedAt: null,
    phaseElapsedSeconds: null,
    running: null,
  }
}

function defaultClockCorrectionForm() {
  return {
    elapsedMinutes: 0,
    elapsedSeconds: 0,
  }
}

function defaultScoreForm() {
  return {
    homeScore: Number(props.match?.homeScore ?? 0),
    awayScore: Number(props.match?.awayScore ?? 0),
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

function refreshMatch() {
  return requestDiscard('refresh', () => fetchMatchDetail('refresh', true))
}

async function fetchMatchDetail(loadingKey = 'detail', showAlert = false, preserveEdits = false, affectedGroups = []) {
  if (!props.match?.id) return

  const requestId = detailRequestId.value + 1
  detailRequestId.value = requestId
  detailError.value = ''
  setLoading(loadingKey, true)

  try {
    const detail = await getAdminMatchDetail(props.match.id)

    if (requestId !== detailRequestId.value) return

    applyMatchDetail(detail, preserveEdits, affectedGroups)
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

function applyMatchDetail(detail = {}, preserveEdits = false, affectedGroups = []) {
  const drafts = snapshot()
  const dirtyGroups = preserveEdits ? Object.keys(editorGroups).filter((key) =>
    !affectedGroups.includes(key) && JSON.stringify(drafts[key]) !== JSON.stringify(persisted.value[key])) : []
  // 누락된 서버 필드의 기본값에 미저장 입력이 섞이지 않도록 저장 기준으로 변환한다.
  if (preserveEdits) {
    for (const [key, group] of Object.entries(editorGroups)) group.set(clone(persisted.value[key]))
  } else {
    timeForm.value = defaultTimeForm()
    scoreForm.value = defaultScoreForm()
    statsForm.value = defaultStatsForm()
    clockCorrectionForm.value = defaultClockCorrectionForm()
  }
  statusOptions.value = detail.statusOptions ?? []
  soccerClockStateOptions.value = detail.phaseOptions ?? []
  const startAt = splitDateTime(detail.startAt)
  const footballDetail = detail.footballDetail || {}
  const nextStatus = detail.statusCode || timeForm.value.status
  const nextHomeScore = Number(detail.homeScore ?? scoreForm.value.homeScore ?? 0)
  const nextAwayScore = Number(detail.awayScore ?? scoreForm.value.awayScore ?? 0)
  const nextClockState = resolveFootballPhaseCode(footballDetail, detail)
  const nextFootballClock = normalizeFootballClock(footballDetail, nextClockState)
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
  persistedMatchStatus.value = nextStatus

  footballClock.value = nextFootballClock
  clockCorrectionForm.value = correctionFormFromSeconds(nextFootballClock.phaseElapsedSeconds)
  clockNow.value = Date.now()

  scoreForm.value = {
    ...scoreForm.value,
    homeScore: nextHomeScore,
    awayScore: nextAwayScore,
    homePenaltyScore: nextPenaltyScore.homeScore ?? scoreForm.value.homePenaltyScore,
    awayPenaltyScore: nextPenaltyScore.awayScore ?? scoreForm.value.awayPenaltyScore,
  }

  statsForm.value = {
    home: nextHomeStats,
    away: nextAwayStats,
  }

  currentCommentary.value = normalizeCurrentComment(detail)
  if (!preserveEdits) commentForm.value = defaultCommentForm()
  const serverValues = snapshot()
  // 멘트 입력은 상세 응답에 포함되지 않는 새 글 초안이다.
  if (preserveEdits) serverValues.comment = clone(persisted.value.comment)
  persisted.value = serverValues
  for (const key of dirtyGroups) editorGroups[key].set(clone(drafts[key]))
  panelLoaded.value = true


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
  if (panelBusy.value || pendingAction.value) return
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
  if (panelBusy.value) return
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

  await executeFootballDetailUpdate(action, payload)
  applyFootballDetailUpdatePayload(payload)
  const group = ['currentTime', 'manualTime'].includes(action) ? 'schedule' : action
  if (editorGroups[group]) persisted.value[group] = clone(editorGroups[group].get())
  // Phase 전환은 시계와 경기 상태도 변경할 수 있으므로 함께 갱신한다.
  const affectedGroups = action === 'clockState' ? ['clockState', 'clockCorrection'] : [group]
  if (action === 'clockState' && ['FIRST_HALF', 'FULL_TIME'].includes(payload.footballPhase)) affectedGroups.push('status')
  await fetchMatchDetail('detail', false, true, affectedGroups)
}

async function executeFootballDetailUpdate(action, payload) {
  const matchId = props.match.id

  if (action === 'currentTime' || action === 'manualTime') {
    await updateAdminMatchScheduledStartAt(matchId, payload)
    return
  }

  if (action === 'status') {
    await updateAdminMatchStatus(matchId, payload)
    return
  }

  if (action === 'clockState') {
    await transitionFootballPhase(matchId, payload)
    return
  }

  if (action === 'clockCorrection') {
    await correctFootballClock(matchId, payload)
    return
  }

  if (action === 'clockPause') {
    await pauseFootballClock(matchId)
    return
  }

  if (action === 'clockResume') {
    await resumeFootballClock(matchId)
    return
  }

  if (action === 'extraTime') {
    await updateFootballAdditionalTime(matchId, payload)
    return
  }

  if (action === 'score') {
    await updateAdminMatchScore(matchId, payload)
    return
  }

  if (action === 'shootOutScore') {
    await updateFootballShootOutScore(matchId, payload)
    return
  }

  if (action === 'stats') {
    await updateFootballStatistics(matchId, payload)
  }
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
  persisted.value.comment = clone(commentForm.value)
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
      footballPhase: timeForm.value.clockState || null,
    }
  }

  if (action === 'clockCorrection') {
    return {
      elapsedMinutes: toNonNegativeInteger(clockCorrectionForm.value.elapsedMinutes),
      elapsedSeconds: toNonNegativeInteger(clockCorrectionForm.value.elapsedSeconds),
    }
  }

  if (action === 'clockPause' || action === 'clockResume') return {}

  if (action === 'extraTime') {
    return {
      firstHalf: toNonNegativeInteger(timeForm.value.extraTime.firstHalf),
      secondHalf: toNonNegativeInteger(timeForm.value.extraTime.secondHalf),
      extraFirstHalf: toNonNegativeInteger(timeForm.value.extraTime.extraFirstHalf),
      extraSecondHalf: toNonNegativeInteger(timeForm.value.extraTime.extraSecondHalf),
    }
  }

  if (action === 'score') {
    return {
      homeScore: toNonNegativeInteger(scoreForm.value.homeScore),
      awayScore: toNonNegativeInteger(scoreForm.value.awayScore),
    }
  }

  if (action === 'shootOutScore') {
    return {
      homeShootOutScore: toNonNegativeInteger(scoreForm.value.homePenaltyScore),
      awayShootOutScore: toNonNegativeInteger(scoreForm.value.awayPenaltyScore),
    }
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
    persistedMatchStatus.value = payload.status
    listPatch.status = payload.status
    listPatch.statusName = statusLabel(payload.status)
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'footballPhase')) {
    timeForm.value.clockState = payload.footballPhase || timeForm.value.clockState
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

  if (action === 'clockState' && !timeForm.value.clockState) {
    alert('전환할 경기 Phase를 선택해주세요.')
    return false
  }

  if (action === 'clockState' && timeForm.value.clockState === footballClock.value.phaseCode) {
    alert('현재 Phase와 다른 Phase를 선택해주세요.')
    return false
  }

  if (['clockCorrection', 'clockPause', 'clockResume'].includes(action) && !clockInitialized.value) {
    alert('경기 Phase를 먼저 시작해주세요.')
    return false
  }

  if (action === 'clockCorrection' && !isValidClockCorrection()) {
    alert('경과시간은 0분 이상, 초는 0~59 사이의 정수로 입력해주세요.')
    return false
  }

  if (action === 'clockResume' && !canResumeClock.value) {
    alert('현재 Phase 또는 경기 상태에서는 타이머를 재개할 수 없습니다.')
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

  if (action === 'shootOutScore' && !isPenaltyShootoutPhase.value) {
    alert('승부차기 Phase에서만 승부차기 점수를 저장할 수 있습니다.')
    return false
  }

  if (action === 'shootOutScore' && !isValidShootOutScore()) {
    alert('승부차기 점수는 0 이상의 숫자로 입력해주세요.')
    return false
  }

  if (action === 'stats' && !isValidStats()) {
    alert('경기 스탯은 0 이상의 정수로 입력하고, 점유율은 100 이하로 입력해주세요.')
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
      title: '경기 Phase 전환',
      message: clockStateSaveMessage(),
      variant: 'primary',
    },
    clockCorrection: {
      title: '경과시간 보정',
      message: `${clockCorrectionForm.value.elapsedMinutes}분 ${clockCorrectionForm.value.elapsedSeconds}초로 현재 Phase 경과시간을 보정합니다.`,
      variant: 'primary',
    },
    clockPause: {
      title: '타이머 일시정지',
      message: `${currentPhaseLabel.value} 타이머를 현재 경과시간에서 일시정지합니다.`,
      variant: 'warn',
    },
    clockResume: {
      title: '타이머 재개',
      message: `${currentPhaseLabel.value} 타이머를 현재 경과시간부터 다시 진행합니다.`,
      variant: 'primary',
    },
    extraTime: {
      title: '추가시간 저장',
      message: extraTimeSaveMessage(),
      variant: 'primary',
    },
    score: {
      title: '일반 점수 저장',
      message: scoreSaveMessage(),
      variant: 'primary',
    },
    shootOutScore: {
      title: '승부차기 점수 저장',
      message: shootOutScoreSaveMessage(),
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
    return '전환할 경기 Phase를 선택해주세요.'
  }

  return `경기 Phase를 "${clockStatePreview.value}" 상태로 전환하고 경과시간을 0초로 초기화합니다.`
}

function extraTimeSaveMessage() {
  return extraTimeFields
    .map((field) => `${field.label} ${Number(timeForm.value.extraTime[field.key] || 0)}분`)
    .join(', ')
    .concat('으로 추가시간을 저장합니다.')
}

function scoreSaveMessage() {
  const baseScore = `${homeTeamName.value} ${scoreForm.value.homeScore} : ${scoreForm.value.awayScore} ${awayTeamName.value}`

  return `${baseScore} 점수로 저장합니다.`
}

function shootOutScoreSaveMessage() {
  return `${homeTeamName.value} ${scoreForm.value.homePenaltyScore} : ${scoreForm.value.awayPenaltyScore} ${awayTeamName.value} 승부차기 점수로 저장합니다.`
}

function isValidExtraTime() {
  return extraTimeFields.every((field) => isNonNegativeIntegerValue(timeForm.value.extraTime[field.key]))
}

function isValidClockCorrection() {
  return isNonNegativeIntegerValue(clockCorrectionForm.value.elapsedMinutes)
    && isNonNegativeIntegerValue(clockCorrectionForm.value.elapsedSeconds)
    && Number(clockCorrectionForm.value.elapsedSeconds) <= 59
}

function isValidScore() {
  return isNonNegativeIntegerValue(scoreForm.value.homeScore)
    && isNonNegativeIntegerValue(scoreForm.value.awayScore)
}

function isValidShootOutScore() {
  return isNonNegativeIntegerValue(scoreForm.value.homePenaltyScore)
    && isNonNegativeIntegerValue(scoreForm.value.awayPenaltyScore)
}

function isValidStats() {
  return statFields.every((stat) => (
    isNonNegativeIntegerValue(statsForm.value.home[stat.key])
      && isNonNegativeIntegerValue(statsForm.value.away[stat.key])
      && (stat.max == null || Number(statsForm.value.home[stat.key]) <= stat.max)
      && (stat.max == null || Number(statsForm.value.away[stat.key]) <= stat.max)
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

function normalizeFootballClock(footballDetail, phaseCode) {
  const elapsedSeconds = footballDetail.phaseElapsedSeconds == null
    ? Number.NaN
    : Number(footballDetail.phaseElapsedSeconds)

  return {
    phaseCode: phaseCode || '',
    phaseName: footballDetail.phaseName || '',
    clockSyncedAt: footballDetail.clockSyncedAt || null,
    phaseElapsedSeconds: Number.isInteger(elapsedSeconds) && elapsedSeconds >= 0
      ? elapsedSeconds
      : null,
    running: typeof footballDetail.running === 'boolean'
      ? footballDetail.running
      : null,
  }
}

function correctionFormFromSeconds(value) {
  const elapsedSeconds = Number(value)
  if (!Number.isInteger(elapsedSeconds) || elapsedSeconds < 0) {
    return defaultClockCorrectionForm()
  }

  return {
    elapsedMinutes: Math.floor(elapsedSeconds / 60),
    elapsedSeconds: elapsedSeconds % 60,
  }
}

function isClockRunningPhase(phaseCode) {
  return soccerClockStateOptions.value.find((option) => option.value === phaseCode)?.clockRunningPhase === true
}

function formatClockDuration(value) {
  if (value == null || !Number.isFinite(Number(value))) return '--:--'

  const elapsedSeconds = Math.max(Math.floor(Number(value)), 0)
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatClockReferenceTime(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
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

  return soccerClockStateOptions.value.some((option) => option.value === normalizedValue)
    ? normalizedValue
    : ''
}

function findFootballPhaseCodeByName(value) {
  if (!value) return ''

  const normalizedName = String(value).trim().replaceAll(' ', '')

  return soccerClockStateOptions.value.find((option) => (
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
  return statusOptions.value.find((item) => item.value === status)?.label || status
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
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-border);
  border-right: none;
  border-radius: var(--admin-card-radius) 0 0 var(--admin-card-radius);
  box-shadow: -8px 0 24px rgb(15 23 42 / 14%);
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

.panel-header {
  flex-shrink: 0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: var(--admin-color-surface-subtle);
  border-bottom: 1px solid var(--admin-color-divider);
  border-radius: var(--admin-card-radius) 0 0 0;
}

.panel-kicker {
  margin: 0 0 3px;
  color: var(--admin-color-text-muted);
  font-size: 11px;
  font-weight: 600;
}

.panel-title {
  margin: 0;
  color: var(--admin-color-text-title);
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
  color: var(--admin-color-text-muted);
  font-size: 18px;
  line-height: 1;
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
  cursor: pointer;
}

.panel-close:hover {
  color: var(--admin-color-text-title);
  background: var(--admin-color-table-heading-surface);
}

.score-input-lg {
  color: var(--admin-color-text-title);
  font-weight: 800;
  text-align: center;
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
}

.score-vs {
  color: #9ca3af;
  font-weight: 800;
}

.panel-body {
  margin: 0;
  border: 0;
  min-width: 0;
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
  border-bottom: 1px solid var(--admin-color-divider);
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
  color: var(--admin-color-text-title);
  font-size: 13px;
  font-weight: 700;
}

.section-desc {
  margin: 0;
  color: var(--admin-color-text-subtle);
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

.time-subsection.first-time-subsection {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.status-editor {
  padding: 12px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
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
  color: var(--admin-color-text-title);
  font-size: 13px;
  font-weight: 800;
}

.clock-overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(180px, 0.8fr);
  gap: 1px;
  overflow: hidden;
  background: var(--admin-color-divider);
  border: 1px solid var(--admin-color-divider);
  border-radius: 8px;
}

.clock-overview.running {
  background: #bbf7d0;
  border-color: #bbf7d0;
}

.clock-phase-summary,
.clock-elapsed-summary {
  display: flex;
  min-height: 78px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: var(--admin-color-surface);
}

.clock-phase-summary span,
.clock-elapsed-summary span,
.clock-meta-grid span {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
}

.clock-phase-summary strong {
  color: #1e293b;
  font-size: 18px;
}

.clock-phase-summary.ended strong {
  color: #dc2626;
}

.clock-elapsed-summary strong {
  color: #1d4ed8;
  font-size: 28px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
}

.clock-overview.running .clock-elapsed-summary strong {
  color: #15803d;
}

.clock-meta-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.clock-meta-grid > div {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}

.clock-meta-grid strong {
  overflow: hidden;
  color: #475569;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.clock-correction-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 10px;
  padding: 10px 12px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}

.clock-correction-card strong {
  color: #334155;
  font-size: 12px;
}

.clock-correction-card p {
  margin: 3px 0 0;
  color: #94a3b8;
  font-size: 10px;
}

.clock-correction-controls {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}

.clock-correction-field {
  display: flex;
  height: 32px;
  align-items: center;
  overflow: hidden;
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
}

.clock-correction-field:focus-within {
  border-color: var(--admin-color-primary);
  box-shadow: var(--admin-focus-ring);
}

.clock-correction-field input {
  width: 54px;
  height: 100%;
  box-sizing: border-box;
  padding: 0 4px 0 8px;
  color: #1e293b;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  background: transparent;
  border: none;
  outline: none;
}

.clock-correction-field input:disabled {
  color: #94a3b8;
  background: #f1f5f9;
}

.clock-correction-field span {
  padding-right: 8px;
  color: #94a3b8;
  font-size: 11px;
}

.clock-action-hint {
  align-self: center;
  color: #94a3b8;
  font-size: 11px;
}

.current-phase-caption {
  color: #64748b;
  font-size: 11px;
  font-weight: 600;
}

.current-phase-caption.ended {
  color: #dc2626;
}

.option-card {
  min-width: 0;
  padding: 12px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
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
  color: var(--admin-color-text-body);
  font-size: 12px;
  font-weight: 600;
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
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
  color: var(--admin-color-primary);
  background: #f6f9ff;
  border-color: #4281ec;
  box-shadow: 0 0 0 2px rgb(28 103 255 / 7%);
}

.radio-option.ending-phase {
  color: #b91c1c;
}

.radio-option.ending-phase.selected {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fca5a5;
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
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
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
  border-color: var(--admin-color-primary);
  box-shadow: var(--admin-focus-ring);
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  color: var(--admin-color-text-label);
  font-size: var(--admin-font-size-label);
  font-weight: 700;
}

.stat-input {
  box-sizing: border-box;
  color: var(--admin-color-text-control);
  font-family: inherit;
  font-size: 12px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
  outline: none;
}

.score-input:focus,
.score-input-lg:focus {
  background: var(--admin-color-surface);
  border-color: var(--admin-color-primary);
  box-shadow: var(--admin-focus-ring);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

:deep(.base-btn.panel-action-btn) {
  color: #4b5563;
  background: var(--admin-color-surface);
  border-color: #d1d5db;
}

:deep(.base-btn.panel-action-btn:hover:not(.disabled)) {
  background: #f3f4f6;
}

.score-editor {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 46px minmax(0, 1fr);
  align-items: end;
  gap: 12px;
  padding: 12px;
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}

.score-team {
  display: grid;
  grid-template-rows: 48px 42px;
  min-width: 0;
  gap: 10px;
  align-items: center;
  padding: 10px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}

.home-score-team {
  background: var(--admin-color-surface-subtle);
  border-color: var(--admin-color-border);
}

.away-score-team {
  background: var(--admin-color-surface-subtle);
  border-color: var(--admin-color-border);
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
  color: #5f6878;
  background: #eef1f5;
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
  grid-template-columns: 1fr 80px 24px 80px 1fr;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}

.penalty-score-section {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #eef2f7;
}

.penalty-team-name {
  overflow: hidden;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.penalty-team-name.away {
  color: #c2410c;
  text-align: left;
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
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
  outline: none;
}

.penalty-inline-input:focus {
  border-color: var(--admin-color-primary);
  box-shadow: var(--admin-focus-ring);
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
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}

.stats-row {
  display: grid;
  grid-template-columns: 92px repeat(9, minmax(68px, 1fr));
  min-width: 760px;
}

.stats-row + .stats-row {
  border-top: 1px solid var(--admin-color-divider);
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
  background: var(--admin-color-table-heading-surface);
}

.stats-team-name {
  color: #374151;
  font-size: 12px;
  font-weight: 700;
  background: var(--admin-color-surface-subtle);
}

.stat-input {
  width: 100%;
  background: #fff;
}

.stat-input:focus {
  background: #f6f9ff;
  border-color: transparent #e5e7eb transparent transparent;
  box-shadow: inset 0 0 0 1px #93c5fd;
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
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
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
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
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
  .time-grid,
  .clock-overview,
  .clock-meta-grid {
    grid-template-columns: 1fr;
  }

  .clock-correction-card {
    align-items: stretch;
    flex-direction: column;
  }

  .clock-correction-controls {
    flex-wrap: wrap;
  }

  .extra-time-grid,
  .clock-state-radio-grid,
  .radio-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .subsection-head {
    flex-direction: column;
  }
}
</style>
