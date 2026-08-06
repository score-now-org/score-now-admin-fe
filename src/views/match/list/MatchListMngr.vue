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
          <BaseButton
            variant="primary"
            size="md"
            :disabled="matchesLoading"
            @click="doSearch"
          >
            {{ matchesLoading ? '검색중' : '검색' }}
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
          총 <strong>{{ totalMatches }}</strong>건
        </span>
        <div class="toolbar-right">
          <span class="toolbar-hint">
            {{ page }} / {{ maxPage }} 페이지
          </span>
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="matchesLoading || page === 1"
            @click="changePage(page - 1)"
          >
            이전
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="matchesLoading || page === maxPage"
            @click="changePage(page + 1)"
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
            <col class="col-league" />
            <col class="col-type" />
            <col class="col-team" />
            <col class="col-team" />
            <col class="col-data" />
            <col class="col-date-time" />
            <col class="col-status" />
            <col class="col-exposure" />
            <col class="col-save" />
            <col class="col-detail-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>경기 ID</th>
              <th>종목</th>
              <th>리그</th>
              <th>타입</th>
              <th>홈팀</th>
              <th>원정팀</th>
              <th>데이터 관리</th>
              <th>날짜/시간</th>
              <th>경기상태</th>
              <th>앱 노출</th>
              <th>저장</th>
              <th class="action-area-start">상세 관리</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(match, idx) in visibleMatches"
              :key="match.id"
              :class="['match-row', { 'row-even': idx % 2 === 1 }]"
            >
              <td class="match-id">{{ match.id }}</td>
              <td>
                <BaseBadge :variant="sportVariant(match.sport)">
                  {{ sportLabel(match.sport) }}
                </BaseBadge>
              </td>
              <td class="league-cell">{{ leagueName(match.leagueId) }}</td>
              <td class="center">{{ match.matchType }}</td>
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
              <td class="data-source-cell">
                <div
                  class="data-mode-toggle"
                  role="group"
                  :aria-label="`${match.id} 데이터 관리 방식`"
                >
                  <button
                    class="data-mode-option auto"
                    :class="{ active: match.editDataSourceType === 'external' }"
                    :disabled="isSaving(match)"
                    type="button"
                    @click="setDataSourceType(match, 'external')"
                  >
                    자동
                  </button>
                  <button
                    class="data-mode-option manual"
                    :class="{ active: match.editDataSourceType === 'manual' }"
                    :disabled="isSaving(match)"
                    type="button"
                    @click="setDataSourceType(match, 'manual')"
                  >
                    수동
                  </button>
                </div>
              </td>
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
              <td class="exposure-cell">
                <div
                  class="exposure-mode-toggle"
                  role="group"
                  :aria-label="`${match.id} 앱 노출 여부`"
                >
                  <button
                    class="exposure-mode-option visible"
                    :class="{ active: match.editUseStatus === 'active' }"
                    :disabled="isSaving(match)"
                    type="button"
                    @click="setUseStatus(match, 'active')"
                  >
                    노출
                  </button>
                  <button
                    class="exposure-mode-option inactive"
                    :class="{ active: match.editUseStatus === 'inactive' }"
                    :disabled="isSaving(match)"
                    type="button"
                    @click="setUseStatus(match, 'inactive')"
                  >
                    숨김
                  </button>
                </div>
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
              <td class="detail-actions-cell action-area-start">
                <div class="detail-action-row">
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    class="match-action-btn action-broadcast"
                    @click="openBroadcastModal(match)"
                  >
                    중계
                  </BaseButton>
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

            <tr v-if="matchesLoading">
              <td colspan="12" class="empty" :style="{ height: emptyResultHeight }">
                경기 목록을 불러오는 중입니다.
              </td>
            </tr>
            <tr v-else-if="matchListError">
              <td colspan="12" class="empty error-empty" :style="{ height: emptyResultHeight }">
                {{ matchListError }}
              </td>
            </tr>
            <tr v-else-if="visibleMatches.length === 0">
              <td colspan="12" class="empty" :style="{ height: emptyResultHeight }">
                검색 결과가 없습니다.
              </td>
            </tr>
            <template v-else>
              <tr
                v-for="rowIndex in placeholderRowCount"
                :key="`placeholder-${rowIndex}`"
                class="result-placeholder-row"
                aria-hidden="true"
              >
                <td colspan="12" class="result-placeholder-cell">&nbsp;</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <MatchCreateModal
      v-model="createModalVisible"
      :saving="createSaving"
      :sport-options="sportOptionsWithoutAll"
      :league-options="leagueOptions"
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
      @match-updated="applyMatchUpdate"
    />

    <MatchStadiumModal
      v-model="stadiumModal.visible"
      :match="stadiumModal.match"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  createAdminMatch,
  getAdminMatches,
  getMatchSearchOptions,
  updateAdminMatch,
} from '../../../api/match'
import MatchCreateModal from './modals/MatchCreateModal.vue'
import MatchStadiumModal from './modals/MatchStadiumModal.vue'
import MatchSoccerBroadcastPanel from './panels/MatchSoccerBroadcastPanel.vue'
import MatchBaseballBroadcastPanel from './panels/MatchBaseballBroadcastPanel.vue'

const fallbackSportOptions = [
  { value: '', label: '전체' },
  { value: 'soccer', label: '축구' },
  { value: 'baseball', label: '야구' },
]

const fallbackLeagueOptions = [
  { id: 'epl', sport: 'soccer', name: '잉글랜드 프리미어 리그' },
  { id: 'kleague1', sport: 'soccer', name: 'K리그1' },
  { id: 'laliga', sport: 'soccer', name: '라리가' },
  { id: 'kbo', sport: 'baseball', name: 'KBO' },
  { id: 'mlb', sport: 'baseball', name: 'MLB' },
  { id: 'npb', sport: 'baseball', name: 'NPB' },
]

const fallbackStatusOptions = [
  { value: '', label: '전체' },
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

const fallbackUseStatusOptions = [
  { value: '', label: '전체' },
  { value: 'active', label: '사용중' },
  { value: 'inactive', label: '미사용중' },
]

const sportOptions = ref([...fallbackSportOptions])
const leagueOptions = ref([...fallbackLeagueOptions])
const statusOptions = ref([...fallbackStatusOptions])
const useStatusOptions = ref([...fallbackUseStatusOptions])
const isManualOptions = ref([])

const sportOptionsWithoutAll = computed(() => sportOptions.value.filter((sport) => sport.value))
const rowStatusOptions = computed(() => statusOptions.value.filter((status) => status.value))

const RESULT_ROW_HEIGHT = 78
const pageSizeOptions = [10, 20, 50]
const pageSize = ref('10')
const page = ref(1)
const totalMatches = ref(0)
const totalPages = ref(1)
const saveStates = ref({})
const matchesLoading = ref(false)
const createSaving = ref(false)
const matchListError = ref('')

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

const matches = ref([])

const filteredLeagueOptions = computed(() => {
  const sport = searchForm.value.sport
  const keyword = searchForm.value.leagueKeyword.trim().toLowerCase()

  return leagueOptions.value.filter((league) => {
    if (sport && league.sport !== sport) return false
    if (keyword && !league.name.toLowerCase().includes(keyword)) return false
    return true
  })
})

const maxPage = computed(() => Math.max(1, totalPages.value))
const visibleMatches = computed(() => matches.value)
const pageSizeNumber = computed(() => Number(pageSize.value) || pageSizeOptions[0])
const placeholderRowCount = computed(() => {
  if (matchesLoading.value || matchListError.value || visibleMatches.value.length === 0) return 0

  return Math.max(0, pageSizeNumber.value - visibleMatches.value.length)
})
const emptyResultHeight = computed(() => `${pageSizeNumber.value * RESULT_ROW_HEIGHT}px`)

const createModalVisible = ref(false)
const broadcastPanel = ref({ visible: false, match: null })
const stadiumModal = ref({ visible: false, match: null })

onMounted(async () => {
  await loadSearchOptions()
})

watch(
  () => searchForm.value.sport,
  () => {
    searchForm.value.leagueId = ''
    searchForm.value.leagueKeyword = ''
  },
)

watch(pageSize, async () => {
  page.value = 1
  await fetchMatches()
})

async function doSearch() {
  appliedFilter.value = { ...searchForm.value }
  page.value = 1
  await fetchMatches()
}

async function resetSearch() {
  searchForm.value = defaultSearchForm()
  appliedFilter.value = defaultSearchForm()
  page.value = 1
  await fetchMatches()
}

async function changePage(nextPage) {
  if (nextPage < 1 || nextPage > maxPage.value || nextPage === page.value) return

  page.value = nextPage
  await fetchMatches()
}

function openCreateModal() {
  createModalVisible.value = true
}

async function loadSearchOptions() {
  try {
    const options = normalizeSearchOptions(await getMatchSearchOptions())

    if (options.sports.length) sportOptions.value = withAllOption(options.sports)
    if (options.leagues.length) leagueOptions.value = options.leagues
    if (options.statusOptions.length) statusOptions.value = withAllOption(options.statusOptions)
    if (options.isActiveOptions.length) useStatusOptions.value = withAllOption(options.isActiveOptions)
    isManualOptions.value = options.isManualOptions
  } catch (error) {
    console.error('경기 목록 검색 옵션 조회에 실패했습니다.', error)
  }
}

async function fetchMatches() {
  matchesLoading.value = true
  matchListError.value = ''
  matches.value = []

  try {
    const result = await getAdminMatches(buildMatchSearchParams())
    const content = ensureArray(result?.content)

    matches.value = content.map(mapMatchResponse)
    totalMatches.value = Number(result?.totalElements ?? content.length)
    totalPages.value = Math.max(1, Number(result?.totalPages ?? 1))

    if (Number.isFinite(Number(result?.number))) {
      page.value = Number(result.number) + 1
    }
  } catch (error) {
    console.error('경기 목록 조회에 실패했습니다.', error)
    matches.value = []
    totalMatches.value = 0
    totalPages.value = 1
    matchListError.value = '경기 목록 조회에 실패했습니다.'
  } finally {
    matchesLoading.value = false
  }
}

function buildMatchSearchParams() {
  const filter = appliedFilter.value
  const sportOption = sportOptions.value.find((sport) => sport.value === filter.sport)
  const useStatusOption = useStatusOptions.value.find((option) => option.value === filter.useStatus)

  return compactQueryParams({
    sportId: sportOption?.serverValue,
    leagueId: filter.leagueId,
    leagueName: filter.leagueKeyword.trim(),
    status: filter.status,
    isActive: useStatusOption?.serverValue,
    date: formatSearchDate(filter.matchDate),
    page: Math.max(0, page.value - 1),
    size: Number(pageSize.value),
  })
}

function mapMatchResponse(match) {
  const startAt = splitStartAt(match.startAt)
  const isManual = match.isManual ?? match.manual ?? false
  const isActive = match.isActive ?? match.active ?? false
  const sport = sportValueFromServer(match.sportId, match.sportName)

  return createMatch({
    id: String(match.id),
    sport,
    sportId: match.sportId,
    sportName: match.sportName,
    leagueId: match.leagueId,
    leagueName: match.leagueName,
    matchType: match.matchType || 'A',
    startDate: startAt.date,
    startTime: startAt.time,
    status: match.statusCode,
    statusName: match.statusName,
    useStatus: isActive ? 'active' : 'inactive',
    dataSource: {
      type: isManual ? 'manual' : 'external',
      name: isManual ? '수동' : '자동',
    },
    homeScore: match.homeScore ?? 0,
    awayScore: match.awayScore ?? 0,
    teamDisplayOrder: match.teamDisplayOrder || [],
    homeTeam: makeTeamFromResponse(match.homeId, match.homeName, match.homeImageUrl, '#ef4444'),
    awayTeam: makeTeamFromResponse(match.awayId, match.awayName, match.awayImageUrl, '#2563eb'),
  })
}

function normalizeSearchOptions(options = {}) {
  const sports = normalizeSports(options.sports)
  const sportValueById = new Map(sports.map((sport) => [String(sport.id), sport.value]))

  return {
    sports,
    leagues: normalizeLeagues(options.leagues, sportValueById),
    statusOptions: normalizeStatusOptions(options.statusOptions),
    isActiveOptions: normalizeBooleanOptions(options.isActiveOptions, {
      trueValue: 'active',
      falseValue: 'inactive',
    }),
    isManualOptions: normalizeBooleanOptions(options.isManualOptions, {
      trueValue: 'manual',
      falseValue: 'external',
    }),
  }
}

function normalizeSports(sports) {
  return ensureArray(sports)
    .map((sport) => {
      const label = optionLabel(sport)
      const id = sport.id ?? sport.value

      return {
        id,
        value: sportValueFromLabel(label, id),
        label,
        serverValue: id,
      }
    })
    .filter((sport) => sport.id != null && sport.label)
}

function normalizeLeagues(leagues, sportValueById) {
  return ensureArray(leagues)
    .map((league) => {
      const id = league.id ?? league.value
      const sportId = league.sportId
      const label = optionLabel(league)

      return {
        id,
        sportId,
        sport: sportValueById.get(String(sportId)) || String(sportId ?? ''),
        name: label,
        label,
        serverValue: id,
      }
    })
    .filter((league) => league.id != null && league.label)
}

function normalizeStatusOptions(statuses) {
  return ensureArray(statuses)
    .map((status) => {
      const serverValue = optionValue(status)

      return {
        value: serverValue,
        label: optionLabel(status),
        serverValue,
      }
    })
    .filter((status) => status.value && status.label)
}

function normalizeBooleanOptions(options, values) {
  return ensureArray(options)
    .map((option) => {
      const serverValue = optionValue(option)
      const boolValue = toBoolean(serverValue)

      if (boolValue == null) return null

      return {
        value: boolValue ? values.trueValue : values.falseValue,
        label: optionLabel(option),
        serverValue: boolValue,
      }
    })
    .filter(Boolean)
}

function withAllOption(options) {
  return [{ value: '', label: '전체' }, ...options]
}

async function addMatch(payload) {
  if (createSaving.value) return

  const requestPayload = buildCreateMatchPayload(payload)

  if (!requestPayload) return

  createSaving.value = true

  try {
    await createAdminMatch(requestPayload)
    createModalVisible.value = false
    await fetchMatches()
  } catch (error) {
    console.error('경기 등록에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '경기 등록에 실패했습니다.'))
  } finally {
    createSaving.value = false
  }
}

function buildCreateMatchPayload(payload) {
  const normalizedDate = normalizeDate(payload.startDate)
  const normalizedTime = normalizeTime(payload.startTime)
  const requestPayload = {
    sportId: toLongId(payload.sportId),
    leagueId: toLongId(payload.leagueId),
    homeId: toLongId(payload.homeId),
    awayId: toLongId(payload.awayId),
    startAt: normalizedDate && normalizedTime ? `${normalizedDate}T${normalizedTime}:00` : '',
  }

  if (
    requestPayload.sportId == null
      || requestPayload.leagueId == null
      || requestPayload.homeId == null
      || requestPayload.awayId == null
  ) {
    alert('경기 등록에 필요한 ID 값이 올바르지 않습니다.')
    return null
  }

  if (!requestPayload.startAt) {
    alert('경기 시작 날짜와 시간을 확인해주세요.')
    return null
  }

  return requestPayload
}

function toLongId(value) {
  const numericValue = Number(value)

  if (!Number.isSafeInteger(numericValue) || numericValue <= 0) {
    return null
  }

  return numericValue
}

async function saveMatch(match) {
  const normalizedDate = normalizeDate(match.editDate)
  const normalizedTime = normalizeTime(match.editTime)

  if (!normalizedDate) {
    alert('날짜는 YYYY-MM-DD 형식으로 입력해주세요.')
    return
  }

  if (!normalizedTime) {
    alert('시간은 24시간 형식(HH:MM)으로 입력해주세요.')
    return
  }

  if (!match.editStatus) {
    alert('경기 상태를 선택해주세요.')
    return
  }

  setSaveState(match.id, 'saving')

  try {
    await updateAdminMatch(match.id, {
      startAt: `${normalizedDate}T${normalizedTime}:00`,
      statusCode: match.editStatus,
      isManual: match.editDataSourceType === 'manual',
      isActive: match.editUseStatus === 'active',
    })

    match.startDate = normalizedDate
    match.editDate = normalizedDate
    match.editTime = normalizedTime
    match.startTime = normalizedTime
    match.status = match.editStatus
    match.statusName = statusLabel(match.editStatus)
    match.useStatus = match.editUseStatus
    match.dataSource = makeDataSourceByType(match, match.editDataSourceType)
    setSaveState(match.id, 'saved')
    scheduleSaveStateClear(match.id)
  } catch (error) {
    console.error('경기 정보 저장에 실패했습니다.', error)
    revertMatchEdits(match)
    setSaveState(match.id, 'error')
    scheduleSaveStateClear(match.id)
    alert(extractApiErrorMessage(error, '경기 정보 저장에 실패했습니다.'))
  }
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
  if (state === 'error') return '저장 실패'
  return '저장'
}

function saveButtonClass(match) {
  const state = saveStates.value[match.id]
  if (state === 'saving') return 'action-save-loading'
  if (state === 'saved') return 'action-save-done'
  if (state === 'error') return 'action-save-error'
  return 'action-save'
}

function scheduleSaveStateClear(matchId) {
  window.setTimeout(() => {
    if (saveStates.value[matchId] === 'saved' || saveStates.value[matchId] === 'error') {
      clearSaveState(matchId)
    }
  }, 1400)
}

function setDataSourceType(match, type) {
  match.editDataSourceType = type
}

function setUseStatus(match, useStatus) {
  match.editUseStatus = useStatus
}

function revertMatchEdits(match) {
  match.editDate = match.startDate
  match.editTime = match.startTime
  match.editStatus = match.status
  match.editDataSourceType = match.dataSource?.type || 'external'
  match.editUseStatus = match.useStatus || 'inactive'
}

function openBroadcastModal(match) {
  broadcastPanel.value = { visible: true, match }
}

function closeBroadcastPanel() {
  broadcastPanel.value = { visible: false, match: null }
}

function applyMatchUpdate({ matchId, patch = {} }) {
  const match = matches.value.find((item) => item.id === String(matchId))
  if (!match) return

  if (patch.startDate) {
    match.startDate = patch.startDate
    match.editDate = patch.startDate
  }

  if (patch.startTime) {
    match.startTime = patch.startTime
    match.editTime = patch.startTime
  }

  if (patch.status) {
    match.status = patch.status
    match.editStatus = patch.status
  }

  if (patch.statusName) {
    match.statusName = patch.statusName
  }

  if (patch.homeScore != null) {
    match.homeScore = patch.homeScore
  }

  if (patch.awayScore != null) {
    match.awayScore = patch.awayScore
  }
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
    editDataSourceType: match.dataSource?.type || 'external',
    editUseStatus: match.useStatus || 'inactive',
  }
}

function makeDataSourceByType(match, type) {
  const providerName = match.dataSource?.providerName
    || (match.dataSource?.name && match.dataSource.name !== '수동' ? match.dataSource.name : defaultDataProviderName(match.sport))

  return {
    ...match.dataSource,
    type,
    name: type === 'manual' ? '수동' : providerName,
    providerName,
  }
}

function makeTeam(name, code, color) {
  return {
    name,
    emblemUrl: makeEmblem(code || name.slice(0, 2), color),
  }
}

function makeTeamFromResponse(id, name, imageUrl, fallbackColor) {
  const teamName = name || '-'

  return {
    id,
    name: teamName,
    emblemUrl: imageUrl || makeEmblem(teamName.slice(0, 3), fallbackColor),
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
  return sportOptions.value.find((item) => item.value === sport)?.label || sport
}

function sportVariant(sport) {
  return { soccer: 'green', baseball: 'yellow' }[sport] || 'gray'
}

function statusLabel(status) {
  return rowStatusOptions.value.find((item) => item.value === status)?.label || status
}

function leagueName(leagueId) {
  return matches.value.find((match) => isSameOptionValue(match.leagueId, leagueId))?.leagueName
    || leagueOptions.value.find((league) => isSameOptionValue(league.id, leagueId))?.name
    || fallbackLeagueOptions.find((league) => isSameOptionValue(league.id, leagueId))?.name
    || '-'
}

function defaultDataProviderName(sport) {
  return sport === 'baseball' ? 'KBO API' : 'Sports API'
}

function optionValue(option) {
  return option?.value ?? option?.code ?? option?.id ?? ''
}

function optionLabel(option) {
  return option?.label
    ?? option?.name
    ?? option?.kName
    ?? option?.eName
    ?? option?.sName
    ?? String(optionValue(option))
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function compactQueryParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null && !Number.isNaN(value)),
  )
}

function formatSearchDate(date) {
  return date ? date.replaceAll('-', '') : ''
}

function splitStartAt(startAt) {
  if (!startAt) {
    return { date: '', time: '' }
  }

  const normalized = String(startAt).replace(' ', 'T')
  const [date = '', time = ''] = normalized.split('T')

  return {
    date,
    time: time.slice(0, 5),
  }
}

function sportValueFromLabel(label, fallbackValue) {
  const normalizedLabel = String(label || '').toLowerCase()

  if (normalizedLabel.includes('축구') || normalizedLabel.includes('soccer') || normalizedLabel.includes('football')) {
    return 'soccer'
  }

  if (normalizedLabel.includes('야구') || normalizedLabel.includes('baseball')) {
    return 'baseball'
  }

  return String(fallbackValue ?? '')
}

function sportValueFromServer(sportId, sportName) {
  return sportOptions.value.find((sport) => isSameOptionValue(sport.serverValue, sportId))?.value
    || sportValueFromLabel(sportName, sportId)
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false

  return null
}

function isSameOptionValue(left, right) {
  return String(left) === String(right)
}

function normalizeDate(value) {
  const date = String(value || '').trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null
  }

  return date
}

function normalizeTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{1,2})$/)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (hour > 23 || minute > 59) return null

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
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
</script>

<style scoped>
.match-list-wrap {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
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
  flex: 0 0 auto;
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
  --match-row-height: 78px;

  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin: 0 12px 12px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.toolbar {
  display: flex;
  flex: 0 0 auto;
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
  flex: 1;
  min-height: 0;
  overflow: auto;
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
.col-exposure { width: 116px; }
.col-detail-actions { width: 220px; }

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

th.action-area-start,
td.action-area-start {
  border-left: 1px solid #cbd5e1;
}

tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}

tbody tr.match-row,
tbody tr.result-placeholder-row {
  height: var(--match-row-height);
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

tbody tr.result-placeholder-row:hover {
  background: transparent;
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

.exposure-cell {
  padding-right: 16px;
  padding-left: 16px;
}

.data-mode-toggle,
.exposure-mode-toggle {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px;
  width: 92px;
  padding: 2px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.data-mode-option,
.exposure-mode-option {
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

.data-mode-option:hover,
.exposure-mode-option:hover {
  color: #111827;
  background: #e5e7eb;
}

.data-mode-option:disabled,
.exposure-mode-option:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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

.exposure-mode-option.active.visible {
  color: #075985;
  background: #e0f2fe;
}

.exposure-mode-option.active.inactive {
  color: #b91c1c;
  background: #fee2e2;
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
.exposure-cell {
  width: 92px;
  text-align: center;
}

.detail-actions-cell {
  min-width: 210px;
  padding-right: 12px;
  padding-left: 12px;
}

.detail-action-row {
  display: flex;
  justify-content: center;
  gap: 6px;
}

:deep(.base-btn.match-action-btn) {
  border: none;
  color: #fff;
  font-weight: 600;
  width: 100%;
}

.detail-action-row :deep(.base-btn.match-action-btn) {
  flex: 1;
  min-width: 0;
}

:deep(.base-btn.match-action-btn.action-save) {
  background: #1C67FF;
}

:deep(.base-btn.match-action-btn.action-save:hover:not(.disabled)) {
  background: #1450cc;
}

:deep(.base-btn.match-action-btn.action-save-loading) {
  background: #64748b;
}

:deep(.base-btn.match-action-btn.action-save-done) {
  background: #059669;
}

:deep(.base-btn.match-action-btn.action-save-error) {
  background: #dc2626;
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

.result-placeholder-cell {
  padding: 0;
  color: transparent;
  pointer-events: none;
}

.error-empty {
  color: #dc2626;
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
