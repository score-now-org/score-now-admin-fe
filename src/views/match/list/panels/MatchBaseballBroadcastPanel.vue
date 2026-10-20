<template>
  <aside ref="panel" class="broadcast-panel" role="dialog" aria-labelledby="baseball-panel-title" tabindex="-1" @keydown.esc.stop="closePanel">
    <header class="panel-header">
      <div class="heading-copy">
        <p class="panel-kicker">{{ matchLeague }}</p>
        <h3 id="baseball-panel-title" class="panel-title">{{ awayTeamName }} vs {{ homeTeamName }}</h3>
      </div>
      <div class="panel-header-actions">
        <BaseButton variant="outline" size="sm" disabled title="채팅 기능은 준비 중입니다.">채팅 보기</BaseButton>
        <BaseButton variant="outline" size="sm" :disabled="panelBusy" @click="refreshMatch">{{ busy === 'load' ? '조회 중…' : '새로고침' }}</BaseButton>
        <button class="panel-close" type="button" :disabled="panelBusy" aria-label="야구 중계 패널 닫기" @click="closePanel">×</button>
      </div>
    </header>
    <!-- <p class="feedback" role="status" aria-live="polite">{{ busy ? (busy === 'load' ? '중계 정보를 불러오는 중입니다.' : '변경 사항을 저장하는 중입니다.') : feedback }}</p> -->
    <div v-if="errorMessage" class="panel-error" role="alert">
      {{ errorMessage }}
      <BaseButton v-if="!loaded" variant="outline" size="sm" :disabled="panelBusy" @click="fetchDetail">다시 시도</BaseButton>
    </div>
    <fieldset class="panel-body" :disabled="panelBusy || !loaded" :aria-busy="panelBusy">
      <legend class="sr-only">야구 중계 편집</legend>
      <section class="work-section" aria-labelledby="detail-toggle-title">
        <div class="section-head">
          <div>
            <h4 id="detail-toggle-title" class="section-title">상세 중계</h4>
            <p class="section-desc">카운트, 주자, 투수·타자와 H/E/B 정보를 관리합니다.</p>
          </div>
          <label class="toggle-label">
            <input :checked="detailedBroadcastEnabled" type="checkbox" role="switch" aria-label="상세 중계" aria-controls="baseball-detail-editors" @change="changeDetailedBroadcast($event)" />
            <span class="toggle-track" aria-hidden="true"></span>
            <span>{{ detailedBroadcastEnabled ? 'ON' : 'OFF' }}</span>
          </label>
        </div>
      </section>
      <form class="work-section" @submit.prevent="saveSchedule">
        <div class="section-head">
          <div>
            <h4 class="section-title">경기 예정 시각</h4>
            <p class="section-desc">경기 시작 예정 일자와 시각을 관리합니다.</p>
          </div>
        </div>
        <div class="time-grid">
          <label class="field">
            <span>경기 시작 예정일자</span>
            <BaseInput v-model="schedule.date" type="date" required />
          </label>
          <label class="field">
            <span>경기 시작 예정시각</span>
            <BaseInput v-model="schedule.time" type="time" required />
          </label>
        </div>
        <div class="action-row">
          <BaseButton type="submit" size="sm">예정 시각 저장</BaseButton>
        </div>
      </form>
      <form class="work-section" @submit.prevent="saveStatus">
        <div class="section-head">
          <div>
            <h4 class="section-title">경기 상태</h4>
            <p class="section-desc">경기의 진행 상태를 별도로 변경합니다.</p>
          </div>
          <BaseBadge :variant="savedProgress.statusCode === 'IN_PLAY' ? 'green' : 'gray'">{{ statusLabel(savedProgress.statusCode) }}</BaseBadge>
        </div>
        <div class="status-editor">
          <label class="field">
            <span>변경할 경기 상태</span>
            <BaseSelect v-model="progress.statusCode" required>
              <option value="" disabled>경기 상태 선택</option>
              <option v-for="status in statuses" :key="status.value" :value="status.value">{{ status.label }}</option>
            </BaseSelect>
          </label>
        </div>
        <div class="action-row">
          <BaseButton type="submit" size="sm">경기 상태 저장</BaseButton>
        </div>
      </form>
      <form class="work-section" @submit.prevent="saveProgress">
        <div class="section-head">
          <div>
            <h4 class="section-title">현재 이닝</h4>
            <p class="section-desc">이닝 또는 초·말을 변경하면 볼·스트라이크·아웃이 모두 0으로 초기화됩니다.</p>
          </div>
          <BaseBadge variant="blue">{{ currentInningLabel }}</BaseBadge>
        </div>
        <label class="field">
          <span>변경할 이닝</span>
          <BaseSelect v-model="selectedHalfInning" required>
            <option value="" disabled>이닝 선택</option>
            <option v-for="option in halfInningOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </BaseSelect>
        </label>
        <div class="action-row">
          <BaseButton type="submit" size="sm">이닝 저장</BaseButton>
        </div>
      </form>
      <form class="work-section" @submit.prevent="saveScores">
        <div class="section-head">
          <div>
            <h4 class="section-title">이닝별 점수</h4>
            <p class="section-desc">1–20이닝의 점수를 편집합니다. 빈칸은 미입력, 0은 무득점입니다.</p>
          </div>
        </div>
        <div class="score-overview" aria-label="현재 경기 요약">
          <div class="summary-team">
            <span>원정 · 선공</span>
            <strong>{{ awayTeamName }}</strong>
          </div>
          <div class="summary-score">
            <b>{{ savedTotals.awayScore ?? '–' }}</b>
            <span>:</span>
            <b>{{ savedTotals.homeScore ?? '–' }}</b>
          </div>
          <div class="summary-team">
            <span>홈 · 후공</span>
            <strong>{{ homeTeamName }}</strong>
          </div>
        </div>
        <div class="score-table-scroll" role="region" aria-label="이닝별 점수 편집, 가로 스크롤 가능" tabindex="0">
          <table class="score-table">
            <colgroup>
              <col class="team-column" />
              <col class="total-column" />
              <col v-for="inning in 20" :key="inning" class="inning-column" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" class="team-cell">팀</th>
                <th scope="col" class="total-cell">R</th>
                <th v-for="inning in 20" :key="inning" scope="col" :class="{ current: inning === Number(savedProgress.currentInningNumber) }" :aria-current="inning === Number(savedProgress.currentInningNumber) ? 'true' : undefined">
                  {{ inning }}
                  <span v-if="inning === Number(savedProgress.currentInningNumber)" class="sr-only">(현재 이닝)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="team in teams" :key="team.side">
                <th scope="row" class="team-cell">
                  <span>{{ team.side === 'away' ? '원정' : '홈' }}</span>
                  <strong :title="team.name">{{ team.name }}</strong>
                </th>
                <td class="total-cell">{{ total(team.side, inningScores) }}</td>
                <td v-for="inning in 20" :key="inning" :class="{ current: inning === Number(savedProgress.currentInningNumber) }">
                  <input v-model="inningScores[inning - 1][team.scoreField]" class="number-input score-input" type="number" min="0" step="1" placeholder="–" :aria-label="`${team.name} ${inning}회 점수`" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="action-row">
          <BaseButton type="submit" size="sm">이닝 점수 저장</BaseButton>
        </div>
      </form>
      <MatchCommentarySection
        ref="commentarySection"
        :match-id="match?.id"
        :current-comment="currentCommentary"
        @saved="currentCommentary = $event"
        @dirty-change="commentaryDirty = $event"
        @busy-change="commentaryBusy = $event"
        @modal-change="commentaryModalOpen = $event"
      />
      <div v-if="detailedBroadcastEnabled && !detailsReady" class="detail-load-error" role="alert">
        상세 정보를 불러오지 못했습니다. 다시 조회한 뒤 편집할 수 있습니다.
        <BaseButton variant="outline" size="sm" @click="retryDetailed">상세 다시 조회</BaseButton>
      </div>
      <fieldset v-show="detailedBroadcastEnabled" id="baseball-detail-editors" class="detail-editors" :disabled="!detailsReady">
        <legend class="sr-only">상세 중계 편집</legend>
        <form class="work-section" @submit.prevent="saveCounts">
          <div class="section-head">
            <div>
              <h4 class="section-title">볼 · 스트라이크 · 아웃</h4>
              <p class="section-desc">램프를 눌러 카운트를 조정합니다. 켜진 램프를 누르면 해당 위치부터 꺼집니다.</p>
            </div>
          </div>
          <div class="count-board">
            <div v-for="item in countFields" :key="item.key" class="count-row" role="group" :aria-label="`${item.label} 카운트`" :style="{ '--lamp-color': item.color }">
              <div class="count-label">
                <strong>{{ item.code }}</strong>
                <span>{{ item.label }}</span>
              </div>
              <div class="count-lamps">
                <button v-for="value in item.max" :key="value" type="button" class="count-lamp" :class="{ lit: counts[item.key] >= value }" :aria-label="`${item.label} ${value}번째 램프`" :aria-pressed="counts[item.key] >= value" @click="toggleCount(item.key, value)">
                  <span class="lamp-core" aria-hidden="true">
                  </span>
                </button>
              </div>
              <output class="count-value" :aria-label="`${item.label} 현재 카운트`">{{ counts[item.key] ?? '–' }}</output>
            </div>
          </div>
          <div class="action-row">
            <BaseButton type="submit" size="sm">카운트 저장</BaseButton>
            <BaseButton type="button" variant="outline" size="sm" @click="counts = zeroCounts()">카운트 초기화</BaseButton>
          </div>
        </form>
        <form class="work-section" @submit.prevent="saveBases">
          <div class="section-head">
            <div>
              <h4 class="section-title">베이스별 주자</h4>
              <p class="section-desc">베이스를 누르면 빨간색으로 진루를 표시합니다. 주자명은 선택 입력입니다.</p>
            </div>
          </div>
          <div class="runner-editor">
            <div class="base-diamond" role="group" aria-label="야구 베이스 배치">
              <svg class="base-path" viewBox="0 0 240 240" aria-hidden="true">
                <path d="M120 34 L206 120 L120 206 L34 120 Z" />
              </svg>
              <button v-for="(base, index) in baseStates" :key="index" type="button" class="base-marker" :class="[`base-${index + 1}`, { occupied: base.runnerOnBase }]" :aria-label="`${index + 1}루 주자 유무`" :aria-pressed="base.runnerOnBase" :aria-controls="`baseball-runner-${index + 1}`" @click="toggleBase(index)">
                <span>{{ index + 1 }}루</span>
              </button>
              <div class="home-marker">
                <span>홈</span>
              </div>
              <span class="diamond-caption">{{ occupiedBases }}명 진루</span>
            </div>
            <div class="runner-fields">
              <div v-for="(base, index) in baseStates" :key="index" class="runner-field">
                <div class="runner-label">
                  <label :for="`baseball-runner-${index + 1}`">{{ index + 1 }}루 주자명</label>
                  <span :class="{ occupied: base.runnerOnBase }">{{ base.runnerOnBase ? '진루' : '비어 있음' }}</span>
                </div>
                <BaseInput :id="`baseball-runner-${index + 1}`" v-model="base.runnerName" :disabled="!base.runnerOnBase" :placeholder="base.runnerOnBase ? '주자명 (선택)' : '베이스를 눌러 진루 표시'" />
              </div>
            </div>
          </div>
          <div class="action-row">
            <BaseButton type="submit" size="sm">주자 정보 저장</BaseButton>
          </div>
        </form>
        <section class="work-section">
          <div class="section-head">
            <div>
              <h4 class="section-title">현재 투수 · 타자</h4>
              <p class="section-desc">현재 투수와 타자의 이름을 직접 입력합니다.</p>
            </div>
          </div>
          <div class="player-grid">
            <form class="player-form" @submit.prevent="savePitcher">
              <label class="field">
                <span>투수 · {{ pitcherTeam }}</span>
                <BaseInput v-model="pitcher" placeholder="현재 투수명" />
              </label>
              <div class="action-row">
                <BaseButton type="submit" size="sm">투수 저장</BaseButton>
              </div>
            </form>
            <form class="player-form" @submit.prevent="saveBatter">
              <label class="field">
                <span>타자 · {{ batterTeam }}</span>
                <BaseInput v-model="batter" placeholder="현재 타자명" />
              </label>
              <div class="action-row">
                <BaseButton type="submit" size="sm">타자 저장</BaseButton>
              </div>
            </form>
          </div>
        </section>
        <form class="work-section" @submit.prevent="saveStatistics">
          <div class="section-head">
            <div>
              <h4 class="section-title">팀별 H / E / B</h4>
              <p class="section-desc">각 팀의 안타, 실책, 볼넷 수치를 수동으로 보정합니다.</p>
            </div>
          </div>
          <div class="stats-grid stats-heading">
            <span>팀</span>
            <span>H · 안타</span>
            <span>E · 실책</span>
            <span>B · 볼넷</span>
          </div>
          <div v-for="team in teams" :key="team.side" class="stats-grid">
            <strong class="stats-team">
              {{ team.name }}
              <small>{{ team.side === 'away' ? '원정' : '홈' }}</small>
            </strong>
            <input v-for="stat in ['hits', 'errors', 'basesOnBalls']" :key="stat" v-model="statistics[team.statsField][stat]" class="number-input" type="number" min="0" step="1" :aria-label="`${team.name} ${statLabels[stat]}`" />
          </div>
          <div class="action-row">
            <BaseButton type="submit" size="sm">H/E/B 저장</BaseButton>
          </div>
        </form>
      </fieldset>
    </fieldset>
    <AdminUnsavedChangesModal :action="pendingAction" @confirm="confirmDiscard" @cancel="cancelDiscard" />
  </aside>
</template>

<script setup>
import AdminUnsavedChangesModal from '@/components/admin/AdminUnsavedChangesModal.vue'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import MatchCommentarySection from './components/MatchCommentarySection.vue'

import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  getBaseballMatchDetail, updateBaseballScheduledStartAt, updateBaseballStatus,
  updateBaseballHalfInning, updateBaseballInningScores, updateBaseballStatistics,
  updateBaseballCount, updateBaseballBaseStates, updateBaseballPitcher,
  updateBaseballBatter, updateBaseballDetailedBroadcast,
} from '@/api/baseballMatch'

const props = defineProps({ match: { type: Object, default: null } })
const emit = defineEmits(['close', 'match-updated'])
const panel = ref(null)
let previousFocus
let generation = 0
const homeTeamName = computed(() => props.match?.homeTeam?.name || '홈팀')
const awayTeamName = computed(() => props.match?.awayTeam?.name || '원정팀')
const matchLeague = computed(() => props.match?.leagueName || '-')
const teams = computed(() => [{ side: 'away', scoreField: 'awayScore', statsField: 'awayStats', name: awayTeamName.value }, { side: 'home', scoreField: 'homeScore', statsField: 'homeStats', name: homeTeamName.value }])
const statuses = ref([])
const halfInningOptions = ref([])
const countFields = [
  { key: 'balls', code: 'B', label: '볼', max: 3, color: '#16a34a' },
  { key: 'strikes', code: 'S', label: '스트라이크', max: 2, color: '#eab308' },
  { key: 'outs', code: 'O', label: '아웃', max: 2, color: '#dc2626' },
]
const statLabels = { hits: '안타', errors: '실책', basesOnBalls: '볼넷' }
const empty = createBaseballForm()
const progress = ref(empty.progress)
const savedProgress = ref({ ...empty.progress })
const inningScores = ref(empty.inningScores)
const savedTotals = ref(empty.totals)
const counts = ref(empty.counts)
const baseStates = ref(empty.baseStates)
const pitcher = ref('')
const batter = ref('')
const statistics = ref(empty.statistics)
const schedule = ref(empty.schedule)
const detailedBroadcastEnabled = ref(false)
const detailsReady = ref(false)
const loaded = ref(false)
const busy = ref('')
const feedback = ref('')
const errorMessage = ref('')
const persisted = ref({})
const commentarySection = ref(null)
const currentCommentary = ref(null)
const commentaryDirty = ref(false)
const commentaryBusy = ref(false)
const commentaryModalOpen = ref(false)
const detailFields = { counts, baseStates, pitcher, batter, statistics }
const clone = (value) => JSON.parse(JSON.stringify(value))
const zeroCounts = () => ({ balls: 0, strikes: 0, outs: 0 })
const selectedHalfInning = computed({
  get: () => progress.value.halfInningCode,
  set: (value) => {
    const option = halfInningOptions.value.find((item) => item.value === value)
    progress.value.halfInningCode = option?.value ?? ''
    progress.value.currentInningNumber = option?.currentInningNumber ?? null
    progress.value.currentHalfInning = option?.currentHalfInning ?? null
  },
})
const currentInningLabel = computed(() => savedProgress.value.currentInningNumber == null
  ? '미설정' : `${savedProgress.value.currentInningNumber}회${savedProgress.value.currentHalfInning === 'TOP' ? '초' : '말'}`)
const pitcherTeam = computed(() => !savedProgress.value.currentHalfInning ? '이닝 미설정' : savedProgress.value.currentHalfInning === 'TOP' ? homeTeamName.value : awayTeamName.value)
const batterTeam = computed(() => !savedProgress.value.currentHalfInning ? '이닝 미설정' : savedProgress.value.currentHalfInning === 'TOP' ? awayTeamName.value : homeTeamName.value)
const occupiedBases = computed(() => baseStates.value.filter((base) => base.runnerOnBase).length)
const snapshot = () => clone({ progress: progress.value, schedule: schedule.value, inningScores: inningScores.value,
  ...Object.fromEntries(Object.entries(detailFields).map(([key, field]) => [key, field.value])) })
const panelBusy = computed(() => Boolean(busy.value) || commentaryBusy.value)
const hasUnsavedChanges = computed(() => loaded.value && (
  commentaryDirty.value || JSON.stringify(snapshot()) !== JSON.stringify(persisted.value)
))

const { pendingAction, requestDiscard, confirmDiscard, cancelDiscard } = useUnsavedChangesGuard(hasUnsavedChanges, panelBusy)
defineExpose({ requestSwitch: (work) => {
  if (commentaryModalOpen.value) return
  return requestDiscard('switch', work)
} })

function inputValue(value) { return value == null ? '' : String(value) }
function teamStats(stats) {
  return Object.fromEntries(
    ['hits', 'errors', 'basesOnBalls'].map((field) => [field, inputValue(stats?.[field])]),
  )
}

// API 필드명은 유지하고 입력 기본값과 날짜·시간만 준비한다.
function createBaseballForm(response = {}) {
  const detail = response.baseballDetail ?? {}
  const inningScores = Array.from({ length: 20 }, (_, index) => {
    const score = detail.inningScores?.find((item) => item.inningNumber === index + 1)
    return { inningNumber: index + 1, homeScore: inputValue(score?.homeScore), awayScore: inputValue(score?.awayScore) }
  })
  const [date = '', time = ''] = (response.startAt ?? '').split('T')
  return {
    schedule: { date, time: time.slice(0, 5) },
    progress: {
      statusCode: response.statusCode ?? '',
      halfInningCode: detail.currentInning?.halfInningCode ?? '',
      currentInningNumber: detail.currentInning?.currentInningNumber ?? null,
      currentHalfInning: detail.currentInning?.currentHalfInning ?? null,
    },
    inningScores,
    totals: { homeScore: response.homeScore ?? null, awayScore: response.awayScore ?? null },
    detailedBroadcastEnabled: detail.detailedBroadcastEnabled === true,
    counts: { balls: detail.balls ?? null, strikes: detail.strikes ?? null, outs: detail.outs ?? null },
    baseStates: [1, 2, 3].map((baseNumber) => {
      const base = detail.baseStates?.find((state) => state.baseNumber === baseNumber)
      return { baseNumber, runnerOnBase: base?.runnerOnBase === true, runnerName: base?.runnerName ?? '' }
    }),
    pitcher: detail.pitcher ?? '',
    batter: detail.batter ?? '',
    statistics: { homeStats: teamStats(detail.homeStats), awayStats: teamStats(detail.awayStats) },
  }
}

function nonNegativeInteger(value, label, nullable = false) {
  if (value === '' || value == null) {
    if (nullable) return null
    throw new Error(`${label}을(를) 입력해 주세요.`)
  }
  const number = Number(value)
  if (!Number.isInteger(number) || number < 0 || number > 2147483647) {
    throw new Error(`${label}은(는) 0~2147483647 범위의 정수여야 합니다.`)
  }
  return number
}

function inningScoresPayload(scores) {
  const inningScores = scores.map((score) => ({
    ...score,
    homeScore: nonNegativeInteger(score.homeScore, `${score.inningNumber}회 홈 점수`, true),
    awayScore: nonNegativeInteger(score.awayScore, `${score.inningNumber}회 원정 점수`, true),
  }))
  for (const side of ['homeScore', 'awayScore']) {
    nonNegativeInteger(inningScores.reduce((sum, inning) => sum + (inning[side] ?? 0), 0), '총점')
  }
  return { inningScores }
}

function statisticsPayload(statistics) {
  const labels = { hits: '안타', errors: '실책', basesOnBalls: '볼넷' }
  return Object.fromEntries(['homeStats', 'awayStats'].map((team) => [team,
    Object.fromEntries(Object.entries(labels).map(([field, label]) => [
      field, nonNegativeInteger(statistics[team][field], label),
    ])),
  ]))
}

function statusLabel(value) { return statuses.value.find((status) => status.value === value)?.label || '미설정' }
function total(side, values) { return values.reduce((sum, value) => sum + (Number(value[`${side}Score`]) || 0), 0) }
function publishPatch(patch) { emit('match-updated', { matchId: props.match.id, patch }) }
function errorText(error) { return error.response?.data?.message || error.message || '요청을 처리하지 못했습니다.' }
function normalizeCurrentComment(response = {}) {
  if (!response.currentCommentary) return null
  return {
    id: `current-${props.match?.id}`,
    message: response.currentCommentary,
    highlight: Boolean(response.currentCommentaryHighlighted),
    recorded: true,
  }
}

// One operation at a time prevents a count save from racing an inning reset.
// A generation guard discards responses after closing or selecting another match.
async function run(key, work) {
  if (panelBusy.value || !props.match?.id) return
  const current = generation
  const matchId = props.match.id
  const isCurrent = () => generation === current
  busy.value = key
  errorMessage.value = ''
  feedback.value = ''
  try {
    await work(matchId, isCurrent)
  } catch (error) {
    if (isCurrent()) errorMessage.value = errorText(error)
  } finally {
    if (isCurrent()) busy.value = ''
  }
}

function applyFullDetail(response) {
  statuses.value = response.statusOptions ?? []
  halfInningOptions.value = response.halfInningOptions ?? []
  const data = createBaseballForm(response)
  progress.value = clone(data.progress)
  savedProgress.value = clone(data.progress)
  inningScores.value = data.inningScores
  savedTotals.value = data.totals
  schedule.value = data.schedule
  detailedBroadcastEnabled.value = data.detailedBroadcastEnabled
  currentCommentary.value = normalizeCurrentComment(response)
  for (const [key, field] of Object.entries(detailFields)) field.value = data[key]
  detailsReady.value = data.detailedBroadcastEnabled
  persisted.value = snapshot()
  loaded.value = true
  publishPatch({ startDate: data.schedule.date, startTime: data.schedule.time,
    status: data.progress.statusCode, statusName: response.statusName || statusLabel(data.progress.statusCode),
    homeScore: data.totals.homeScore, awayScore: data.totals.awayScore })
}

async function fetchDetail() {
  await run('load', async (matchId, isCurrent) => {
    const response = await getBaseballMatchDetail(matchId)
    if (!isCurrent()) return
    applyFullDetail(response)
    feedback.value = '중계 정보를 불러왔습니다.'
  })
}
function refreshMatch() {
  return requestDiscard('refresh', () => {
    commentarySection.value?.resetDraft()
    return fetchDetail()
  })
}

async function loadDetailed(matchId, isCurrent) {
  const response = await getBaseballMatchDetail(matchId)
  if (!isCurrent()) return
  const data = createBaseballForm(response)
  detailedBroadcastEnabled.value = data.detailedBroadcastEnabled
  if (!data.detailedBroadcastEnabled) throw new Error('상세 중계가 꺼져 있습니다. 설정을 확인하고 다시 켜 주세요.')
  // OFF responses omit these fields. Fetch the server values on ON, retaining
  // locally edited sections instead of replacing them with defaults or stale data.
  for (const [key, field] of Object.entries(detailFields)) {
    if (JSON.stringify(field.value) === JSON.stringify(persisted.value[key])) field.value = clone(data[key])
    persisted.value[key] = clone(data[key])
  }
  detailsReady.value = true
}
async function changeDetailedBroadcast(event) {
  const enabled = event.target.checked
  event.target.checked = detailedBroadcastEnabled.value
  await run('detailed', async (matchId, isCurrent) => {
    await updateBaseballDetailedBroadcast(matchId, { enabled })
    if (!isCurrent()) return
    detailedBroadcastEnabled.value = enabled
    detailsReady.value = false
    if (enabled) {
      try {
        await loadDetailed(matchId, isCurrent)
      } catch (error) {
        throw new Error(`상세 중계 설정은 저장됐지만 상세 조회에 실패했습니다. ${errorText(error)}`)
      }
    }
    if (isCurrent()) feedback.value = enabled ? '상세 중계를 켰습니다.' : '상세 중계를 껐습니다. 저장하지 않은 상세 입력은 유지됩니다.'
  })
}
async function retryDetailed() {
  await run('load', async (matchId, isCurrent) => {
    await loadDetailed(matchId, isCurrent)
    if (isCurrent()) feedback.value = '상세 정보를 불러왔습니다.'
  })
}

async function saveSchedule() {
  await run('schedule', async (matchId, isCurrent) => {
    const value = clone(schedule.value)
    if (!value.date || !value.time) throw new Error('경기 예정일과 시각을 입력해 주세요.')
    await updateBaseballScheduledStartAt(matchId, { startAt: `${value.date}T${value.time}:00` })
    if (!isCurrent()) return
    persisted.value.schedule = value
    publishPatch({ startDate: value.date, startTime: value.time })
    feedback.value = '경기 예정 시각을 저장했습니다.'
  })
}
async function saveStatus() {
  await run('status', async (matchId, isCurrent) => {
    const status = progress.value.statusCode
    if (!status) throw new Error('경기 상태를 선택해 주세요.')
    await updateBaseballStatus(matchId, { status })
    if (!isCurrent()) return
    savedProgress.value.statusCode = status
    persisted.value.progress.statusCode = status
    publishPatch({ status, statusName: statusLabel(status) })
    feedback.value = '경기 상태를 저장했습니다.'
  })
}
async function saveProgress() {
  await run('inning', async (matchId, isCurrent) => {
    const halfInning = selectedHalfInning.value
    if (!halfInning) throw new Error('이닝을 선택해 주세요.')
    const { currentInningNumber: inning, currentHalfInning: half } = halfInningOptions.value.find((item) => item.value === halfInning)
    const changed = savedProgress.value.currentInningNumber !== inning || savedProgress.value.currentHalfInning !== half
    await updateBaseballHalfInning(matchId, { halfInning })
    if (!isCurrent()) return
    Object.assign(savedProgress.value, { halfInningCode: halfInning, currentInningNumber: inning, currentHalfInning: half })
    Object.assign(persisted.value.progress, { halfInningCode: halfInning, currentInningNumber: inning, currentHalfInning: half })
    if (changed) {
      counts.value = zeroCounts()
      persisted.value.counts = zeroCounts()
    }
    feedback.value = changed ? '이닝을 저장하고 B/S/O를 초기화했습니다.' : '이닝을 저장했습니다. 카운트는 유지됩니다.'
  })
}
async function saveScores() {
  await run('inningScores', async (matchId, isCurrent) => {
    const value = clone(inningScores.value)
    await updateBaseballInningScores(matchId, inningScoresPayload(value))
    if (!isCurrent()) return
    persisted.value.inningScores = value
    savedTotals.value = { homeScore: total('home', value), awayScore: total('away', value) }
    publishPatch({ homeScore: savedTotals.value.homeScore, awayScore: savedTotals.value.awayScore })
    feedback.value = '이닝별 점수를 저장했습니다.'
  })
}
async function saveDetailField(key, api, payload) {
  if (!detailsReady.value || !detailedBroadcastEnabled.value) return
  await run(key, async (matchId, isCurrent) => {
    const value = clone(detailFields[key].value)
    await api(matchId, payload(value))
    if (!isCurrent()) return
    persisted.value[key] = value
    feedback.value = '변경 사항을 저장했습니다.'
  })
}
function saveCounts() {
  return saveDetailField('counts', updateBaseballCount, (value) => {
    for (const item of countFields) {
      const count = nonNegativeInteger(value[item.key], item.label)
      if (count > item.max) throw new Error(`${item.label}은(는) 0~${item.max} 범위여야 합니다.`)
      value[item.key] = count
    }
    return value
  })
}
function saveBases() { return saveDetailField('baseStates', updateBaseballBaseStates, (baseStates) => ({ baseStates })) }
function savePitcher() { return saveDetailField('pitcher', updateBaseballPitcher, (value) => ({ pitcher: value })) }
function saveBatter() { return saveDetailField('batter', updateBaseballBatter, (value) => ({ batter: value })) }
function saveStatistics() { return saveDetailField('statistics', updateBaseballStatistics, statisticsPayload) }
function toggleCount(key, value) {
  for (const item of countFields) counts.value[item.key] ??= 0
  counts.value[key] = counts.value[key] >= value ? value - 1 : value
}
function toggleBase(index) {
  const base = baseStates.value[index]
  base.runnerOnBase = !base.runnerOnBase
  if (!base.runnerOnBase) base.runnerName = ''
}
function closePanel() {
  if (pendingAction.value) return cancelDiscard()
  if (commentaryModalOpen.value) return
  return requestDiscard('close', () => emit('close'))
}
watch(() => props.match?.id, () => {
  generation += 1
  busy.value = ''
  loaded.value = false
  detailsReady.value = false
  currentCommentary.value = null
  commentaryDirty.value = false
  commentaryBusy.value = false
  commentaryModalOpen.value = false
  fetchDetail()
}, { immediate: true })
onMounted(async () => {
  previousFocus = document.activeElement
  await nextTick()
  panel.value?.focus()
})
onBeforeUnmount(() => {
  generation += 1
  if (panel.value?.contains(document.activeElement) && previousFocus?.isConnected) previousFocus.focus()
})
</script>

<style scoped>
/* admin-ui-system.md의 공통 중계 패널 규칙을 따른다.
램프와 빨간 베이스는 야구 전용 상태 표시이며 전역 색상 의미를 바꾸지 않는다. */
.broadcast-panel {
  --baseball-runner-color: #dc2626;
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
  overflow: clip;
  outline: none;
  color: var(--admin-color-text-body);
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
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  background: var(--admin-color-surface-subtle);
  border-bottom: 1px solid var(--admin-color-divider);
  border-radius: var(--admin-card-radius) 0 0 0;
}
.heading-copy {
  min-width: 0;
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
  overflow-wrap: anywhere;
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
.detail-editors { margin: 0; padding: 0; border: 0; min-width: 0; }
.panel-error, .detail-load-error {
  margin: 0;
  padding: 10px 16px;
  color: #b91c1c;
  background: #fef2f2;
  font-size: 12px;
}
.panel-error :deep(button), .detail-load-error :deep(button) { margin-left: 8px; }
.panel-close:disabled, .base-marker:disabled, .count-lamp:disabled { cursor: not-allowed; opacity: .6; }
.feedback {
  flex-shrink: 0;
  margin: 0;
  padding: 0 16px 8px;
  min-height: 16px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--admin-color-primary);
  border-bottom: 1px solid var(--admin-color-divider);
}
.panel-body {
  margin: 0;
  border: 0;
  min-width: 0;
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 14px 16px 18px;
}
.work-section {
  margin: 0;
  padding: 14px 0;
  border-bottom: 1px solid var(--admin-color-divider);
  min-width: 0;
}
.panel-body > legend + .work-section {
  padding-top: 0;
}
.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.section-head > :deep(.base-badge) {
  flex-shrink: 0;
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
.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.time-grid, .player-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: var(--admin-field-gap);
  min-width: 0;
  font-size: var(--admin-font-size-label);
  color: var(--admin-color-text-label);
}
.field > span {
  overflow-wrap: anywhere;
}
.status-editor {
  padding: 12px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}
.score-overview {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
}
.summary-team {
  min-width: 0;
  text-align: center;
}
.summary-team span {
  display: block;
  margin-bottom: 5px;
  font-size: 10px;
  color: var(--admin-color-text-muted);
}
.summary-team strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}
.summary-score {
  display: flex;
  align-items: center;
  gap: 14px;
  font-variant-numeric: tabular-nums;
}
.summary-score b {
  font-size: 28px;
}
.summary-score span {
  color: var(--admin-color-text-muted);
}
.score-table-scroll {
  overflow-x: auto;
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}
.score-table {
  --score-team-width: 112px;
  width: 1202px;
  min-width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  font-size: 11px;
}
.score-table .team-column { width: var(--score-team-width); }
.score-table .total-column { width: 50px; }
.score-table .inning-column { width: 52px; }
.score-table th, .score-table td {
  box-sizing: border-box;
  padding: 7px 3px;
  text-align: center;
  border-bottom: 1px solid var(--admin-color-divider);
}
.score-table thead th {
  height: 25px;
  font-size: var(--admin-font-size-table-heading);
  color: var(--admin-color-text-table-heading);
  background: var(--admin-color-table-heading-surface);
}
.score-table tbody tr:last-child > * {
  border-bottom: 0;
}
.score-table .team-cell {
  position: sticky;
  left: 0;
  z-index: 1;
  padding: 8px;
  text-align: left;
  background: var(--admin-color-surface);
  border-right: 1px solid var(--admin-color-border);
}
.team-cell span {
  display: block;
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 400;
  color: var(--admin-color-text-muted);
}
.team-cell strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.score-table .total-cell {
  position: sticky;
  left: var(--score-team-width);
  z-index: 1;
  font-weight: 700;
  background: var(--admin-color-table-heading-surface);
  border-left: 1px solid var(--admin-color-border);
}
.score-table .current {
  color: var(--admin-color-text-title);
  background: #c7ddfa;
}
.number-input {
  width: 100%;
  min-width: 0;
  height: var(--admin-control-height);
  box-sizing: border-box;
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
  background: var(--admin-color-surface-subtle);
  color: var(--admin-color-text-control);
  text-align: center;
  font: inherit;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  appearance: textfield;
}
.number-input::-webkit-inner-spin-button, .number-input::-webkit-outer-spin-button {
  appearance: none;
  margin: 0;
}
.number-input:focus {
  outline: none;
  border-color: var(--admin-color-primary);
  box-shadow: var(--admin-focus-ring);
}
.score-input {
  padding: 0 2px;
}
.current .score-input {
  border-color: var(--admin-color-info-border);
  background: var(--admin-color-surface);
}
.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
/* Native checkbox semantics with a visible on/off switch. */
.toggle-label { position: relative; flex-shrink: 0; }
.toggle-label input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.toggle-track {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: var(--admin-color-text-subtle);
}
.toggle-track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--admin-color-surface);
}
.toggle-label input:checked + .toggle-track { background: var(--admin-color-primary); }
.toggle-label input:checked + .toggle-track::after { transform: translateX(16px); }
.toggle-label input:focus-visible + .toggle-track {
  outline: 2px solid var(--admin-color-primary);
  outline-offset: 3px;
}
.count-board {
  display: grid;
  gap: 10px;
  padding: 16px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}
.count-row {
  display: grid;
  grid-template-columns: 100px 1fr 30px;
  align-items: center;
  gap: 12px;
}
.count-label {
  display: flex;
  align-items: center;
  gap: 10px;
}
.count-label strong {
  width: 18px;
  font-size: 18px;
}
.count-label span {
  color: var(--admin-color-text-label);
  font-size: 11px;
}
.count-lamps {
  display: flex;
  gap: 8px;
}
.count-lamp {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 4px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
}
.lamp-core {
  display: block;
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  border: 1px solid var(--admin-color-control-border);
  border-radius: 50%;
  background: var(--admin-color-divider);
}
.count-lamp.lit .lamp-core {
  border-color: var(--lamp-color);
  background: var(--lamp-color);
}
.count-value {
  text-align: right;
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.runner-editor {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 20px;
  align-items: center;
}
.base-diamond {
  position: relative;
  width: 240px;
  height: 240px;
}
.base-path {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.base-path path {
  fill: var(--admin-color-surface-subtle);
  stroke: var(--admin-color-control-border);
  stroke-width: 2;
}
.base-marker {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 2px solid var(--admin-color-control-border);
  border-radius: 3px;
  background: var(--admin-color-surface);
  color: var(--admin-color-text-label);
  transform: translate(-50%, -50%) rotate(45deg);
  cursor: pointer;
}
.base-marker span {
  transform: rotate(-45deg);
  font-size: 11px;
  font-weight: 700;
}
.base-1 {
  left: 206px;
  top: 120px;
}
.base-2 {
  left: 120px;
  top: 34px;
}
.base-3 {
  left: 34px;
  top: 120px;
}
.base-marker.occupied {
  background: var(--baseball-runner-color);
  border-color: var(--baseball-runner-color);
  color: #fff;
}
.home-marker {
  position: absolute;
  top: 187px;
  left: 101px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: var(--admin-color-text-muted);
  background: var(--admin-color-control-border);
  clip-path: polygon(0 0, 100% 0, 100% 55%, 50% 100%, 0 55%);
  font-size: 11px;
}
.diamond-caption {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: var(--admin-color-text-muted);
  font-size: 11px;
}
.runner-fields {
  display: grid;
  gap: 12px;
}
.runner-label {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 7px;
  font-size: 11px;
  color: var(--admin-color-text-label);
}
.runner-label > span {
  color: var(--admin-color-text-muted);
}
.runner-label > .occupied {
  color: var(--baseball-runner-color);
  font-weight: 700;
}
.stats-grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
  font-size: 12px;
}
.stats-heading {
  text-align: center;
  color: var(--admin-color-text-muted);
  font-size: 10px;
}
.stats-heading > :first-child {
  text-align: left;
}
.stats-team {
  overflow-wrap: anywhere;
  font-size: 11px;
}
.stats-team small {
  display: block;
  margin-top: 4px;
  font-weight: 400;
  color: var(--admin-color-text-muted);
}
.sr-only {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
button:focus-visible, input[type='checkbox']:focus-visible, .score-table-scroll:focus-visible {
  outline: 2px solid var(--admin-color-primary);
  outline-offset: 3px;
}
@media (max-width: 960px) {
  .broadcast-panel {
    top: 52px;
    width: 100vw;
    max-width: 100vw;
    box-sizing: border-box;
  }
  .time-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .runner-editor, .player-grid {
    grid-template-columns: 1fr;
  }
  .base-diamond {
    justify-self: center;
  }
  .count-row {
    grid-template-columns: 86px 1fr 24px;
    gap: 6px;
  }
  .count-lamps {
    gap: 3px;
  }
  .count-board {
    padding: 12px;
  }
  .score-overview {
    gap: 8px;
  }
  .summary-team strong {
    font-size: 12px;
  }
  .summary-score {
    gap: 8px;
  }
  .stats-grid {
    gap: 8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .broadcast-panel {
    animation: none;
  }
}
</style>
