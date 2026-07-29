<template>
  <div class="match-list-wrap">
    <div class="tab-bar">
      <span class="page-title">경기 리스트</span>
    </div>

    <div class="search-box">
      <div class="filter-row">
        <div class="filter-item filter-sport">
          <label class="filter-label">종목</label>
          <BaseSelect v-model="searchForm.sport">
            <option
              v-for="sport in sportOptions"
              :key="sport.value"
              :value="sport.value"
            >
              {{ sport.label }}
            </option>
          </BaseSelect>
        </div>

        <div class="filter-item filter-league-search">
          <label class="filter-label">리그명</label>
          <BaseInput
            v-model="searchForm.leagueKeyword"
            placeholder="리그 검색"
          />
        </div>

        <div class="filter-item filter-league">
          <label class="filter-label">하위 리그</label>
          <BaseSelect v-model="searchForm.leagueId">
            <option value="">전체</option>
            <option
              v-for="league in filteredLeagueOptions"
              :key="league.id"
              :value="league.id"
            >
              {{ league.name }}
            </option>
          </BaseSelect>
        </div>

        <div class="filter-item filter-status">
          <label class="filter-label">경기상태</label>
          <BaseSelect v-model="searchForm.status">
            <option
              v-for="status in statusOptions"
              :key="status.value"
              :value="status.value"
            >
              {{ status.label }}
            </option>
          </BaseSelect>
        </div>

        <div class="filter-item filter-use">
          <label class="filter-label">사용 유무</label>
          <BaseSelect v-model="searchForm.useStatus">
            <option
              v-for="useStatus in useStatusOptions"
              :key="useStatus.value"
              :value="useStatus.value"
            >
              {{ useStatus.label }}
            </option>
          </BaseSelect>
        </div>

        <div class="filter-item filter-date">
          <label class="filter-label">날짜</label>
          <input
            v-model="searchForm.matchDate"
            class="date-input"
            type="date"
          />
        </div>

        <div class="filter-item filter-page-size">
          <label class="filter-label">페이지당</label>
          <BaseSelect v-model="pageSize">
            <option
              v-for="option in pageSizeOptions"
              :key="option"
              :value="String(option)"
            >
              {{ option }}개
            </option>
          </BaseSelect>
        </div>

        <div class="filter-item filter-btns">
          <BaseButton variant="primary" size="md" @click="doSearch">
            검색
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="md"
            class="reset-filter-btn"
            @click="resetSearch"
          >
            초기화
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="md"
            class="create-match-btn"
            @click="openCreateModal"
          >
            경기 등록
          </BaseButton>
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <div class="toolbar">
        <span class="total-count">
          총 <strong>{{ filteredMatches.length }}</strong>건
        </span>
        <div class="toolbar-right">
          <span class="toolbar-hint">
            {{ page }} / {{ maxPage }} 페이지
          </span>
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="page === 1"
            @click="page--"
          >
            이전
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="page === maxPage"
            @click="page++"
          >
            다음
          </BaseButton>
        </div>
      </div>

      <div class="table-scroll">
        <table>
          <colgroup>
            <col class="col-match-id" />
            <col class="col-sport" />
            <col class="col-data" />
            <col class="col-league" />
            <col class="col-type" />
            <col class="col-date-time" />
            <col class="col-status" />
            <col class="col-save" />
            <col class="col-team" />
            <col class="col-team" />
            <col class="col-exposure" />
            <col class="col-broadcast" />
            <col class="col-sub-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>경기 ID</th>
              <th>종목</th>
              <th>데이터</th>
              <th>리그</th>
              <th>타입</th>
              <th>날짜/시간</th>
              <th>경기상태</th>
              <th>저장</th>
              <th>홈팀</th>
              <th>원정팀</th>
              <th>노출</th>
              <th>중계</th>
              <th>부가관리</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(match, idx) in visibleMatches"
              :key="match.id"
              :class="{ 'row-even': idx % 2 === 1 }"
            >
              <td class="match-id">{{ match.id }}</td>
              <td>
                <BaseBadge :variant="sportVariant(match.sport)">
                  {{ sportLabel(match.sport) }}
                </BaseBadge>
              </td>
              <td class="data-source-cell">
                <div
                  class="data-mode-toggle"
                  role="group"
                  :aria-label="`${match.id} 데이터 관리 방식`"
                >
                  <button
                    class="data-mode-option auto"
                    :class="{ active: match.dataSource.type === 'external' }"
                    type="button"
                    @click="setDataSourceType(match, 'external')"
                  >
                    자동
                  </button>
                  <button
                    class="data-mode-option manual"
                    :class="{ active: match.dataSource.type === 'manual' }"
                    type="button"
                    @click="setDataSourceType(match, 'manual')"
                  >
                    수동
                  </button>
                </div>
              </td>
              <td class="league-cell">{{ leagueName(match.leagueId) }}</td>
              <td class="center">{{ match.matchType }}</td>
              <td>
                <div class="date-time-editor">
                  <input
                    v-model="match.editDate"
                    class="row-input"
                    type="date"
                  />
                  <input
                    v-model="match.editTime"
                    class="row-input"
                    type="time"
                  />
                </div>
              </td>
              <td>
                <BaseSelect v-model="match.editStatus">
                  <option
                    v-for="status in rowStatusOptions"
                    :key="status.value"
                    :value="status.value"
                  >
                    {{ status.label }}
                  </option>
                </BaseSelect>
              </td>
              <td class="save-cell">
                <BaseButton
                  variant="primary"
                  size="sm"
                  :disabled="isSaving(match)"
                  :class="[
                    'match-action-btn',
                    saveButtonClass(match),
                  ]"
                  @click="saveMatch(match)"
                >
                  {{ saveButtonLabel(match) }}
                </BaseButton>
              </td>
              <td>
                <div class="team-cell">
                  <img
                    class="team-emblem"
                    :src="match.homeTeam.emblemUrl"
                    :alt="`${match.homeTeam.name} 엠블럼`"
                  />
                  <span class="team-name">{{ match.homeTeam.name }}</span>
                </div>
              </td>
              <td>
                <div class="team-cell">
                  <img
                    class="team-emblem"
                    :src="match.awayTeam.emblemUrl"
                    :alt="`${match.awayTeam.name} 엠블럼`"
                  />
                  <span class="team-name">{{ match.awayTeam.name }}</span>
                </div>
              </td>
              <td class="exposure-cell">
                <BaseButton
                  variant="outline"
                  size="sm"
                  :class="[
                    'match-action-btn',
                    match.useStatus === 'active' ? 'action-use-active' : 'action-use-inactive',
                  ]"
                  @click="requestUseStatusChange(match)"
                >
                  {{ match.useStatus === 'active' ? '사용중' : '미사용중' }}
                </BaseButton>
              </td>
              <td class="broadcast-cell">
                <BaseButton
                  variant="secondary"
                  size="sm"
                  class="match-action-btn action-broadcast"
                  @click="openBroadcastModal(match)"
                >
                  중계
                </BaseButton>
              </td>
              <td class="sub-actions-cell">
                <div class="sub-action-row">
                  <BaseButton
                    variant="outline"
                    size="sm"
                    class="match-action-btn action-lineup"
                  >
                    라인업
                  </BaseButton>
                  <BaseButton
                    variant="warn"
                    size="sm"
                    class="match-action-btn action-stadium"
                    @click="openStadiumModal(match)"
                  >
                    경기장
                  </BaseButton>
                </div>
              </td>
            </tr>

            <tr v-if="visibleMatches.length === 0">
              <td colspan="13" class="empty">검색 결과가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <MatchCreateModal
      v-model="createModalVisible"
      :sport-options="sportOptionsWithoutAll"
      :league-options="leagueOptions"
      :status-options="rowStatusOptions"
      @save="addMatch"
    />

    <MatchBaseballBroadcastPanel
      v-if="broadcastPanel.visible && broadcastPanel.match?.sport === 'baseball'"
      :match="broadcastPanel.match"
      @close="closeBroadcastPanel"
    />

    <MatchSoccerBroadcastPanel
      v-else-if="broadcastPanel.visible"
      :match="broadcastPanel.match"
      @close="closeBroadcastPanel"
    />

    <MatchStadiumModal
      v-model="stadiumModal.visible"
      :match="stadiumModal.match"
    />

    <BaseModal
      v-model="useStatusConfirm.visible"
      title="사용 상태 변경"
      width="360px"
    >
      <p class="confirm-message">
        {{ useStatusConfirmMessage }}
      </p>

      <template #footer>
        <BaseButton variant="outline" @click="closeUseStatusConfirm">
          취소
        </BaseButton>
        <BaseButton :variant="useStatusConfirmVariant" @click="confirmUseStatusChange">
          확인
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import MatchCreateModal from './modals/MatchCreateModal.vue'
import MatchStadiumModal from './modals/MatchStadiumModal.vue'
import MatchSoccerBroadcastPanel from './panels/MatchSoccerBroadcastPanel.vue'
import MatchBaseballBroadcastPanel from './panels/MatchBaseballBroadcastPanel.vue'

const sportOptions = [
  { value: '', label: '전체' },
  { value: 'soccer', label: '축구' },
  { value: 'baseball', label: '야구' },
]

const sportOptionsWithoutAll = sportOptions.filter((sport) => sport.value)

const leagueOptions = [
  { id: 'epl', sport: 'soccer', name: '잉글랜드 프리미어 리그' },
  { id: 'kleague1', sport: 'soccer', name: 'K리그1' },
  { id: 'laliga', sport: 'soccer', name: '라리가' },
  { id: 'kbo', sport: 'baseball', name: 'KBO' },
  { id: 'mlb', sport: 'baseball', name: 'MLB' },
  { id: 'npb', sport: 'baseball', name: 'NPB' },
]

const statusOptions = [
  { value: '', label: '전체' },
  { value: 'scheduled', label: '경기전' },
  { value: 'live', label: '경기중' },
  { value: 'ended', label: '경기종료' },
  { value: 'delayed', label: '경기지연' },
  { value: 'interrupted', label: '경기중지' },
  { value: 'suspended', label: '서스펜디드' },
  { value: 'rainout', label: '우천중지' },
  { value: 'canceled', label: '경기취소' },
]

const rowStatusOptions = [
  { value: 'scheduled', label: '경기전' },
  { value: 'live', label: '경기중' },
  { value: 'ended', label: '경기종료' },
  { value: 'delayed', label: '경기지연' },
  { value: 'interrupted', label: '경기중지' },
  { value: 'suspended', label: '서스펜디드' },
  { value: 'rainout', label: '우천중지' },
  { value: 'canceled', label: '경기취소' },
]

const useStatusOptions = [
  { value: '', label: '전체' },
  { value: 'active', label: '사용중' },
  { value: 'inactive', label: '미사용중' },
]

const pageSizeOptions = [10, 20, 50]
const pageSize = ref('10')
const page = ref(1)
const saveStates = ref({})

const defaultSearchForm = () => ({
  sport: '',
  leagueKeyword: '',
  leagueId: '',
  status: '',
  useStatus: '',
  matchDate: '',
})

const searchForm = ref(defaultSearchForm())
const appliedFilter = ref(defaultSearchForm())

const matches = ref([
  createMatch({
    id: 'EB924924924',
    sport: 'soccer',
    leagueId: 'epl',
    matchType: 'A',
    startDate: '2025-12-31',
    startTime: '12:59',
    status: 'scheduled',
    useStatus: 'active',
    dataSource: { type: 'external', name: 'Sports API' },
    homeTeam: makeTeam('맨유', 'MU', '#ef4444'),
    awayTeam: makeTeam('맨시티', 'MC', '#60a5fa'),
  }),
  createMatch({
    id: 'EB824824824',
    sport: 'soccer',
    leagueId: 'epl',
    matchType: 'A',
    startDate: '2025-12-31',
    startTime: '12:59',
    status: 'scheduled',
    useStatus: 'active',
    dataSource: { type: 'manual', name: '수동' },
    homeTeam: makeTeam('아스널', 'ARS', '#dc2626'),
    awayTeam: makeTeam('첼시', 'CHE', '#2563eb'),
  }),
  createMatch({
    id: 'KB102410240',
    sport: 'baseball',
    leagueId: 'kbo',
    matchType: 'A',
    startDate: '2025-12-31',
    startTime: '18:30',
    status: 'scheduled',
    useStatus: 'active',
    dataSource: { type: 'external', name: 'KBO API' },
    homeTeam: makeTeam('LG', 'LG', '#c81e1e'),
    awayTeam: makeTeam('KIA', 'KIA', '#1f2937'),
  }),
  createMatch({
    id: 'KL512300011',
    sport: 'soccer',
    leagueId: 'kleague1',
    matchType: 'A',
    startDate: '2026-01-03',
    startTime: '15:00',
    status: 'live',
    useStatus: 'active',
    dataSource: { type: 'external', name: 'League API' },
    homeTeam: makeTeam('서울', 'SEO', '#ef4444'),
    awayTeam: makeTeam('울산', 'USN', '#0ea5e9'),
  }),
  createMatch({
    id: 'ML200077731',
    sport: 'baseball',
    leagueId: 'mlb',
    matchType: 'A',
    startDate: '2026-01-04',
    startTime: '09:10',
    status: 'ended',
    useStatus: 'inactive',
    dataSource: { type: 'external', name: 'Stats API' },
    homeTeam: makeTeam('LAD', 'LAD', '#2563eb'),
    awayTeam: makeTeam('NYY', 'NYY', '#111827'),
  }),
])

const filteredLeagueOptions = computed(() => {
  const sport = searchForm.value.sport
  const keyword = searchForm.value.leagueKeyword.trim().toLowerCase()

  return leagueOptions.filter((league) => {
    if (sport && league.sport !== sport) return false
    if (keyword && !league.name.toLowerCase().includes(keyword)) return false
    return true
  })
})

const filteredMatches = computed(() => {
  const filter = appliedFilter.value
  const keyword = filter.leagueKeyword.trim().toLowerCase()

  return matches.value.filter((match) => {
    const league = leagueName(match.leagueId)

    if (filter.sport && match.sport !== filter.sport) return false
    if (filter.leagueId && match.leagueId !== filter.leagueId) return false
    if (keyword && !league.toLowerCase().includes(keyword)) return false
    if (filter.status && match.status !== filter.status) return false
    if (filter.useStatus && match.useStatus !== filter.useStatus) return false
    if (filter.matchDate && match.startDate !== filter.matchDate) return false

    return true
  })
})

const maxPage = computed(() => (
  Math.max(1, Math.ceil(filteredMatches.value.length / Number(pageSize.value)))
))

const visibleMatches = computed(() => {
  const size = Number(pageSize.value)
  const start = (page.value - 1) * size
  return filteredMatches.value.slice(start, start + size)
})

const createModalVisible = ref(false)
const broadcastPanel = ref({ visible: false, match: null })
const stadiumModal = ref({ visible: false, match: null })
const useStatusConfirm = ref({ visible: false, match: null, nextStatus: null })

const useStatusConfirmMessage = computed(() => {
  if (useStatusConfirm.value.nextStatus === 'active') {
    return '확인을 누르면 해당 경기가 앱에 다시 노출됩니다.'
  }

  return '확인을 누르면 해당 경기가 앱에 보이지 않게 변경됩니다.'
})

const useStatusConfirmVariant = computed(() => (
  useStatusConfirm.value.nextStatus === 'active' ? 'primary' : 'danger'
))

watch(
  () => searchForm.value.sport,
  () => {
    searchForm.value.leagueId = ''
    searchForm.value.leagueKeyword = ''
  },
)

watch(pageSize, () => {
  page.value = 1
})

watch(maxPage, (value) => {
  if (page.value > value) page.value = value
})

function doSearch() {
  appliedFilter.value = { ...searchForm.value }
  page.value = 1
}

function resetSearch() {
  searchForm.value = defaultSearchForm()
  appliedFilter.value = defaultSearchForm()
  page.value = 1
}

function openCreateModal() {
  createModalVisible.value = true
}

function addMatch(payload) {
  const league = leagueOptions.find((item) => item.id === payload.leagueId)
  const nextNumber = matches.value.length + 1

  matches.value.unshift(createMatch({
    id: `MN${String(Date.now()).slice(-8)}${nextNumber}`,
    sport: payload.sport,
    leagueId: payload.leagueId,
    matchType: payload.matchType,
    startDate: payload.startDate,
    startTime: payload.startTime,
    status: payload.status,
    useStatus: payload.useStatus,
    dataSource: { type: payload.dataSourceType, name: payload.dataSourceName },
    homeTeam: makeTeam(payload.homeTeamName, payload.homeTeamName.slice(0, 3), '#1c67ff'),
    awayTeam: makeTeam(payload.awayTeamName, payload.awayTeamName.slice(0, 3), '#6b7280'),
  }))

  if (league && searchForm.value.sport && searchForm.value.sport !== league.sport) {
    searchForm.value.sport = ''
  }

  doSearch()
}

async function saveMatch(match) {
  const normalizedTime = normalizeTime(match.editTime)

  if (!normalizedTime) {
    alert('시간은 24시간 형식(HH:MM)으로 입력해주세요.')
    return
  }

  setSaveState(match.id, 'saving')

  // TODO: 실제 API 연결 시 저장 요청으로 교체
  await new Promise((resolve) => window.setTimeout(resolve, 500))

  match.startDate = match.editDate
  match.editTime = normalizedTime
  match.startTime = normalizedTime
  match.status = match.editStatus
  setSaveState(match.id, 'saved')

  window.setTimeout(() => {
    if (saveStates.value[match.id] === 'saved') {
      clearSaveState(match.id)
    }
  }, 1400)
}

function setSaveState(matchId, state) {
  saveStates.value = {
    ...saveStates.value,
    [matchId]: state,
  }
}

function clearSaveState(matchId) {
  const nextStates = { ...saveStates.value }
  delete nextStates[matchId]
  saveStates.value = nextStates
}

function isSaving(match) {
  return saveStates.value[match.id] === 'saving'
}

function saveButtonLabel(match) {
  const state = saveStates.value[match.id]
  if (state === 'saving') return '저장중'
  if (state === 'saved') return '저장 완료'
  return '저장'
}

function saveButtonClass(match) {
  const state = saveStates.value[match.id]
  if (state === 'saving') return 'action-save-loading'
  if (state === 'saved') return 'action-save-done'
  return 'action-save'
}

function requestUseStatusChange(match) {
  useStatusConfirm.value = {
    visible: true,
    match,
    nextStatus: match.useStatus === 'active' ? 'inactive' : 'active',
  }
}

function closeUseStatusConfirm() {
  useStatusConfirm.value = { visible: false, match: null, nextStatus: null }
}

function confirmUseStatusChange() {
  if (useStatusConfirm.value.match) {
    useStatusConfirm.value.match.useStatus = useStatusConfirm.value.nextStatus
  }

  closeUseStatusConfirm()
}

function setDataSourceType(match, type) {
  if (match.dataSource.type === type) return

  const providerName = match.dataSource.providerName
    || (match.dataSource.name !== '수동' ? match.dataSource.name : defaultDataProviderName(match.sport))

  match.dataSource = {
    ...match.dataSource,
    type,
    name: type === 'manual' ? '수동' : providerName,
    providerName,
  }
}

function openBroadcastModal(match) {
  broadcastPanel.value = { visible: true, match }
}

function closeBroadcastPanel() {
  broadcastPanel.value = { visible: false, match: null }
}

function openStadiumModal(match) {
  stadiumModal.value = { visible: true, match }
}

function createMatch(match) {
  return {
    ...match,
    editDate: match.startDate,
    editTime: match.startTime,
    editStatus: match.status,
  }
}

function makeTeam(name, code, color) {
  return {
    name,
    emblemUrl: makeEmblem(code || name.slice(0, 2), color),
  }
}

function makeEmblem(text, color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <circle cx="18" cy="18" r="17" fill="${color}"/>
      <circle cx="18" cy="18" r="14" fill="white" opacity="0.18"/>
      <text x="18" y="21" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="700" fill="white">${text}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function sportLabel(sport) {
  return sportOptions.find((item) => item.value === sport)?.label || sport
}

function sportVariant(sport) {
  return { soccer: 'green', baseball: 'yellow' }[sport] || 'gray'
}

function leagueName(leagueId) {
  return leagueOptions.find((league) => league.id === leagueId)?.name || '-'
}

function defaultDataProviderName(sport) {
  return sport === 'baseball' ? 'KBO API' : 'Sports API'
}

function normalizeTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{1,2})$/)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (hour > 23 || minute > 59) return null

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
</script>

<style scoped>
.match-list-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  overflow: auto;
}

.tab-bar {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 12px;
  background: #fff;
  border-bottom: 1px solid #d1d5db;
}

.page-title {
  padding: 10px 12px;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
}

.search-box {
  margin: 12px 12px 8px;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
}

.filter-sport,
.filter-status,
.filter-use,
.filter-page-size {
  width: 120px;
}

.filter-league-search {
  width: 180px;
}

.filter-league {
  width: 220px;
}

.filter-date {
  width: 150px;
}

.filter-btns {
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: flex-end;
  margin-left: auto;
}

.date-input,
.row-input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 12px;
  color: #232323;
  font-family: inherit;
  font-size: 12px;
  background: #f3f3f3;
  border: 1px solid #e9e9e9;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.date-input:focus,
.row-input:focus {
  background: #fff;
  border-color: #1c67ff;
}

.table-wrap {
  margin: 0 12px 12px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.total-count {
  color: #6b7280;
  font-size: 12px;
}

.total-count strong {
  color: #374151;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-hint {
  color: #9ca3af;
  font-size: 12px;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1480px;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 12px;
}

.col-match-id { width: 118px; }
.col-sport { width: 76px; }
.col-data { width: 110px; }
.col-league { width: 170px; }
.col-type { width: 64px; }
.col-date-time { width: 156px; }
.col-status { width: 118px; }
.col-save { width: 92px; }
.col-team { width: 120px; }
.col-exposure { width: 96px; }
.col-broadcast { width: 84px; }
.col-sub-actions { width: 156px; }

thead tr {
  background: #f3f4f6;
  border-bottom: 1px solid #d1d5db;
}

th {
  padding: 8px 12px;
  color: #374151;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}

tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}

tbody tr:hover {
  background: #eff6ff;
}

tbody tr.row-even {
  background: #f9fafb;
}

tbody tr.row-even:hover {
  background: #eff6ff;
}

td {
  padding: 8px 12px;
  color: #374151;
  vertical-align: middle;
  text-align: center;
  white-space: nowrap;
}

.match-id {
  max-width: 120px;
  color: #111827;
  font-weight: 600;
  white-space: normal;
  word-break: break-all;
}

.league-cell {
  min-width: 150px;
  font-weight: 600;
}

.data-source-cell {
  padding-right: 8px;
  padding-left: 8px;
}

.data-mode-toggle {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px;
  width: 92px;
  padding: 2px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.data-mode-option {
  height: 26px;
  padding: 0;
  color: #6b7280;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.data-mode-option:hover {
  color: #111827;
  background: #e5e7eb;
}

.data-mode-option.active.auto {
  color: #075985;
  background: #e0f2fe;
}

.data-mode-option.active.manual {
  color: #374151;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.12);
}

.center {
  text-align: center;
}

.date-time-editor {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 5px;
}

.team-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  width: 100%;
  min-width: 0;
}

.team-emblem {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  border-radius: 50%;
  object-fit: cover;
}

.team-name {
  color: #374151;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.save-cell,
.exposure-cell,
.broadcast-cell {
  width: 92px;
  text-align: center;
}

.sub-actions-cell {
  min-width: 150px;
}

.sub-action-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.confirm-message {
  margin: 0;
  color: #374151;
  font-size: 13px;
  line-height: 1.6;
}

:deep(.base-btn.match-action-btn) {
  border: none;
  color: #fff;
  font-weight: 600;
  width: 100%;
}

.sub-action-row :deep(.base-btn.match-action-btn) {
  flex: 1;
  min-width: 0;
}

:deep(.base-btn.match-action-btn.action-save) {
  background: #4f46e5;
}

:deep(.base-btn.match-action-btn.action-save:hover:not(.disabled)) {
  background: #4338ca;
}

:deep(.base-btn.match-action-btn.action-save-loading) {
  background: #64748b;
}

:deep(.base-btn.match-action-btn.action-save-done) {
  background: #059669;
}

:deep(.base-btn.match-action-btn.action-use-active) {
  background: #16a34a;
}

:deep(.base-btn.match-action-btn.action-use-active:hover:not(.disabled)) {
  background: #15803d;
}

:deep(.base-btn.match-action-btn.action-use-inactive) {
  color: #fff !important;
  background: #dc2626 !important;
  border: none !important;
  box-shadow: none;
}

:deep(.base-btn.match-action-btn.action-use-inactive:hover:not(.disabled)) {
  color: #fff !important;
  background: #b91c1c !important;
}

:deep(.base-btn.match-action-btn.action-broadcast) {
  background: #0891b2;
}

:deep(.base-btn.match-action-btn.action-broadcast:hover:not(.disabled)) {
  background: #0e7490;
}

:deep(.base-btn.match-action-btn.action-lineup) {
  background: #92400e;
}

:deep(.base-btn.match-action-btn.action-lineup:hover:not(.disabled)) {
  background: #78350f;
}

:deep(.base-btn.match-action-btn.action-stadium) {
  background: #f59e0b;
}

:deep(.base-btn.match-action-btn.action-stadium:hover:not(.disabled)) {
  background: #d97706;
}

:deep(.base-btn.create-match-btn) {
  background: #047857;
  color: #fff;
  font-weight: 600;
}

:deep(.base-btn.create-match-btn:hover:not(.disabled)) {
  background: #065f46;
}

:deep(.base-btn.reset-filter-btn) {
  background: #64748b;
  color: #fff;
  font-weight: 600;
}

:deep(.base-btn.reset-filter-btn:hover:not(.disabled)) {
  background: #475569;
}

.empty {
  padding: 40px;
  color: #9ca3af;
  text-align: center;
}

@media (max-width: 960px) {
  .filter-sport,
  .filter-status,
  .filter-use,
  .filter-page-size,
  .filter-date,
  .filter-league-search,
  .filter-league {
    width: calc(50% - 6px);
  }

  .filter-btns {
    width: 100%;
    margin-left: 0;
  }
}
</style>
