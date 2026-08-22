<template>
  <div class="admin-page">
    <header class="page-header">
      <div>
        <div class="title-row">
          <h1>상단고정/핫매치</h1>
        </div>
      </div>
    </header>

    <section class="summary-grid" aria-label="등록 현황">
      <article class="summary-card pinned">
        <div class="summary-icon" aria-hidden="true">P</div>
        <div>
          <span>상단고정</span>
          <strong>{{ filteredTypeCount('pinned') }}경기</strong>
        </div>
      </article>
      <article class="summary-card hot">
        <div class="summary-icon" aria-hidden="true">H</div>
        <div>
          <span>핫매치</span>
          <strong>{{ filteredTypeCount('hot') }}경기</strong>
        </div>
      </article>
    </section>

    <section class="filter-card" aria-label="경기 조회 조건">
      <div class="field-group">
        <label for="featured-date">경기 시작일</label>
        <input id="featured-date" v-model="searchDate" type="date" class="control date-control" />
      </div>
      <div class="field-group type-filter">
        <span class="field-label">노출 유형</span>
        <div class="segmented-control" role="group" aria-label="노출 유형 필터">
          <button
            v-for="option in filterTypeOptions"
            :key="option.value"
            type="button"
            :class="{ active: searchType === option.value }"
            @click="searchType = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <div class="filter-actions">
        <BaseButton variant="secondary" size="md" :disabled="matchesLoading" @click="resetSearch">초기화</BaseButton>
        <BaseButton variant="primary" size="md" :disabled="matchesLoading" @click="applySearch">
          {{ matchesLoading ? '조회 중' : '조회' }}
        </BaseButton>
        <BaseButton variant="secondary" size="md" class="register-action" @click="openRegisterModal">
          + 경기 등록
        </BaseButton>
      </div>
    </section>

    <section class="table-card">
      <div class="table-toolbar">
        <div>
          <strong>{{ formattedAppliedDate }}</strong>
          <span>등록 경기 {{ visibleFeaturedMatches.length }}건</span>
        </div>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>경기 ID</th>
              <th>종목</th>
              <th>리그명</th>
              <th>홈팀명</th>
              <th>원정팀명</th>
              <th>경기 예정 시각</th>
              <th>노출 유형</th>
              <th>순서 변경</th>
              <th>삭제</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="matchesLoading">
              <td colspan="9" class="empty-state compact">
                <span class="loading-mark"></span>
                <strong>등록 경기를 조회하고 있습니다.</strong>
              </td>
            </tr>
            <tr v-else-if="visibleFeaturedMatches.length === 0">
              <td colspan="9" class="empty-state">
                <span class="empty-icon">○</span>
                <strong>조회 조건에 맞는 경기가 없습니다.</strong>
                <small>다른 날짜나 노출 유형을 선택해 보세요.</small>
              </td>
            </tr>
            <tr v-for="match in visibleFeaturedMatches" :key="match.featuredMatchId">
              <td class="id-cell">{{ match.matchId }}</td>
              <td><AdminSportBadge :sport-code="match.sportCode" :sport-name="match.sportName" /></td>
              <td>{{ match.league }}</td>
              <td class="team-name">{{ match.homeTeam }}</td>
              <td class="team-name">{{ match.awayTeam }}</td>
              <td class="time-only">{{ formatTime(match.startAt) }}</td>
              <td>
                <span class="type-badge" :class="match.featuredType">
                  <span class="type-dot"></span>{{ featuredTypeLabel(match.featuredType) }}
                </span>
              </td>
              <td>
                <div class="order-actions">
                  <button
                    type="button"
                    title="위로 이동"
                    :disabled="orderSaving || !canMove(match, -1)"
                    @click="moveMatch(match, -1)"
                  >↑</button>
                  <span>{{ typeOrder(match) }}</span>
                  <button
                    type="button"
                    title="아래로 이동"
                    :disabled="orderSaving || !canMove(match, 1)"
                    @click="moveMatch(match, 1)"
                  >↓</button>
                </div>
              </td>
              <td>
                <BaseButton variant="danger" size="sm" :disabled="deletingId === match.featuredMatchId" @click="removeMatch(match)">
                  {{ deletingId === match.featuredMatchId ? '삭제 중' : '삭제' }}
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal v-model="registerModalOpen" title="노출 경기 등록" width="880px">
      <div class="registration-flow">
        <div class="modal-intro">
          <div>
            <span class="step-label">STEP 1</span>
            <h2>노출 유형을 선택해 주세요</h2>
          </div>
          <span class="selection-status">{{ selectedMatchIds.length }}경기 선택</span>
        </div>

        <div class="type-cards" role="radiogroup" aria-label="노출 유형 선택">
          <button
            v-for="option in registerTypeOptions"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="registerType === option.value"
            :class="[option.value, { selected: registerType === option.value }]"
            @click="registerType = option.value"
          >
            <span class="radio-mark"><span></span></span>
            <span>
              <strong>{{ option.label }}</strong>
            </span>
          </button>
        </div>

        <div class="modal-search-row">
          <div>
            <span class="step-label">STEP 2</span>
            <h2>등록할 경기를 찾아 선택해 주세요</h2>
          </div>
          <div class="modal-date-search">
            <input v-model="registerDate" type="date" class="control" />
            <BaseButton variant="primary" size="md" :disabled="candidatesLoading" @click="searchScheduledMatches">
              {{ candidatesLoading ? '조회 중' : '경기 조회' }}
            </BaseButton>
          </div>
        </div>

        <div class="scheduled-table-wrap">
          <table class="scheduled-table">
            <thead>
              <tr>
                <th class="check-column">
                  <input
                    type="checkbox"
                    :checked="allSelectableChecked"
                    :disabled="selectableScheduledMatches.length === 0"
                    aria-label="조회 경기 전체 선택"
                    @change="toggleAllMatches"
                  />
                </th>
                <th>시작 시간</th>
                <th>종목</th>
                <th>리그명</th>
                <th>경기</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="candidatesLoading">
                <td colspan="6" class="modal-empty">예정 경기를 조회하고 있습니다.</td>
              </tr>
              <tr v-else-if="!scheduledSearchDone">
                <td colspan="6" class="modal-empty">날짜를 선택한 뒤 경기 조회를 눌러 주세요.</td>
              </tr>
              <tr v-else-if="scheduledMatches.length === 0">
                <td colspan="6" class="modal-empty">선택한 날짜에 예정된 경기가 없습니다.</td>
              </tr>
              <tr
                v-for="match in scheduledMatches"
                v-else
                :key="match.id"
                :class="{ selected: selectedMatchIds.includes(match.id), disabled: isRegistered(match) }"
              >
                <td class="check-column">
                  <input
                    v-model="selectedMatchIds"
                    type="checkbox"
                    :value="match.id"
                    :disabled="isRegistered(match)"
                    :aria-label="`${match.homeTeam} 대 ${match.awayTeam} 선택`"
                  />
                </td>
                <td class="time-only">{{ formatTime(match.startAt) }}</td>
                <td><AdminSportBadge :sport-code="match.sportCode" :sport-name="match.sportName" /></td>
                <td>{{ match.league }}</td>
                <td>
                  <div class="matchup">
                    <strong>{{ match.homeTeam }}</strong>
                    <span>vs</span>
                    <strong>{{ match.awayTeam }}</strong>
                  </div>
                </td>
                <td>
                  <span v-if="isRegistered(match)" class="registered-label">등록됨</span>
                  <span v-else class="scheduled-label">예정</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="selection-summary">
          <div class="summary-check">✓</div>
          <div>
            <strong>{{ selectedMatchIds.length }}개 경기를 {{ featuredTypeLabel(registerType) }}로 등록합니다.</strong>
          </div>
        </div>
      </div>

      <template #footer>
        <BaseButton variant="outline" size="md" @click="registerModalOpen = false">취소</BaseButton>
        <BaseButton
          variant="primary"
          size="md"
          :disabled="selectedMatchIds.length === 0 || registering"
          @click="registerSelectedMatches"
        >
          {{ registering ? '등록 중' : `선택 경기 등록 (${selectedMatchIds.length})` }}
        </BaseButton>
      </template>
    </BaseModal>

    <div v-if="toastMessage" class="toast" role="status"><span>✓</span>{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminSportBadge from '@/components/common/AdminSportBadge.vue'
import {
  createFeaturedMatches,
  deleteFeaturedMatch,
  getFeaturedMatchCandidates,
  getFeaturedMatches,
  updateFeaturedMatchesOrder,
} from '@/api/featuredMatch'

const defaultDate = toInputDate(new Date())

const filterTypeOptions = [
  { value: 'all', label: '전체' },
  { value: 'pinned', label: '상단고정' },
  { value: 'hot', label: '핫매치' },
]

const registerTypeOptions = [
  { value: 'pinned', label: '상단고정' },
  { value: 'hot', label: '핫매치' },
]

const searchDate = ref(defaultDate)
const searchType = ref('all')
const appliedDate = ref(defaultDate)
const appliedType = ref('all')
const featuredMatches = ref([])
const matchesLoading = ref(false)
const orderSaving = ref(false)
const deletingId = ref(null)
const registerModalOpen = ref(false)
const registerType = ref('pinned')
const registerDate = ref(defaultDate)
const scheduledSearchDone = ref(false)
const scheduledMatches = ref([])
const candidatesLoading = ref(false)
const registering = ref(false)
const selectedMatchIds = ref([])
const toastMessage = ref('')
let toastTimer

const visibleFeaturedMatches = computed(() => featuredMatches.value.filter((match) => {
  const typeMatches = appliedType.value === 'all' || match.featuredType === appliedType.value
  return typeMatches
}))

const formattedAppliedDate = computed(() => {
  const [, month = '', day = ''] = appliedDate.value.split('-')
  return `${month}월 ${day}일`
})

const selectableScheduledMatches = computed(() => scheduledMatches.value.filter((match) => match.registerable))
const allSelectableChecked = computed(() => (
  selectableScheduledMatches.value.length > 0
  && selectableScheduledMatches.value.every((match) => selectedMatchIds.value.includes(match.id))
))

function featuredTypeLabel(type) {
  return type === 'pinned' ? '상단고정' : '핫매치'
}

function formatTime(dateTime) {
  return dateTime?.slice(11, 16) || '-'
}

function filteredTypeCount(type) {
  return featuredMatches.value.filter((match) => match.featuredType === type).length
}

async function applySearch() {
  if (!searchDate.value) {
    showToast('조회할 날짜를 선택해 주세요.')
    return
  }

  matchesLoading.value = true
  try {
    const response = await getFeaturedMatches(toApiDate(searchDate.value))
    applyFeaturedMatchesResponse(response)
    appliedDate.value = searchDate.value
    appliedType.value = searchType.value
  } catch (error) {
    showToast(apiErrorMessage(error, '등록 경기 조회에 실패했습니다.'))
  } finally {
    matchesLoading.value = false
  }
}

async function resetSearch() {
  searchDate.value = defaultDate
  searchType.value = 'all'
  await applySearch()
}

function typeMatches(match) {
  return featuredMatches.value
    .filter((item) => item.featuredType === match.featuredType)
    .sort((a, b) => a.displayOrder - b.displayOrder)
}

function typeOrder(match) {
  return match.displayOrder
}

function canMove(match, direction) {
  const matches = typeMatches(match)
  const index = matches.findIndex((item) => item.featuredMatchId === match.featuredMatchId)
  return direction < 0 ? index > 0 : index < matches.length - 1
}

async function moveMatch(match, direction) {
  const reordered = [...typeMatches(match)]
  const currentIndex = reordered.findIndex((item) => item.featuredMatchId === match.featuredMatchId)
  const targetIndex = currentIndex + direction
  if (targetIndex < 0 || targetIndex >= reordered.length) return

  ;[reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]]

  orderSaving.value = true
  try {
    const response = await updateFeaturedMatchesOrder({
      displayDate: toApiDate(appliedDate.value),
      type: toApiType(match.featuredType),
      featuredMatchIds: reordered.map((item) => item.featuredMatchId),
    })
    applyFeaturedMatchesResponse(response)
    showToast(`${featuredTypeLabel(match.featuredType)} 노출 순서를 변경했습니다.`)
  } catch (error) {
    showToast(apiErrorMessage(error, '노출 순서 변경에 실패했습니다.'))
  } finally {
    orderSaving.value = false
  }
}

async function removeMatch(match) {
  const confirmed = window.confirm(`${match.homeTeam} vs ${match.awayTeam} 경기의 ${featuredTypeLabel(match.featuredType)} 설정을 삭제할까요?`)
  if (!confirmed) return

  deletingId.value = match.featuredMatchId
  try {
    const response = await deleteFeaturedMatch(match.featuredMatchId)
    applyFeaturedMatchesResponse(response)
    showToast(`${match.homeTeam} vs ${match.awayTeam} 경기 설정을 삭제했습니다.`)
  } catch (error) {
    showToast(apiErrorMessage(error, '경기 설정 삭제에 실패했습니다.'))
  } finally {
    deletingId.value = null
  }
}

function openRegisterModal() {
  registerModalOpen.value = true
  registerType.value = 'pinned'
  registerDate.value = appliedDate.value
  selectedMatchIds.value = []
  scheduledSearchDone.value = false
  scheduledMatches.value = []
  searchScheduledMatches()
}

async function searchScheduledMatches() {
  if (!registerDate.value) {
    showToast('후보 경기를 조회할 날짜를 선택해 주세요.')
    return
  }

  candidatesLoading.value = true
  selectedMatchIds.value = []
  try {
    const response = await getFeaturedMatchCandidates(toApiDate(registerDate.value))
    scheduledMatches.value = (response || [])
      .map(normalizeCandidateMatch)
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
    scheduledSearchDone.value = true
  } catch (error) {
    scheduledMatches.value = []
    scheduledSearchDone.value = true
    showToast(apiErrorMessage(error, '등록 후보 경기 조회에 실패했습니다.'))
  } finally {
    candidatesLoading.value = false
  }
}

function isRegistered(match) {
  return !match.registerable
}

function toggleAllMatches(event) {
  selectedMatchIds.value = event.target.checked ? selectableScheduledMatches.value.map((match) => match.id) : []
}

async function registerSelectedMatches() {
  if (selectedMatchIds.value.length === 0) return

  const registeredCount = selectedMatchIds.value.length
  registering.value = true

  try {
    await createFeaturedMatches({
      matchIds: selectedMatchIds.value,
      type: toApiType(registerType.value),
    })
  } catch (error) {
    showToast(apiErrorMessage(error, '선택 경기 등록에 실패했습니다.'))
    registering.value = false
    return
  }

  searchDate.value = registerDate.value
  searchType.value = 'all'
  registerModalOpen.value = false

  try {
    const response = await getFeaturedMatches(toApiDate(registerDate.value))
    applyFeaturedMatchesResponse(response)
    appliedDate.value = registerDate.value
    appliedType.value = 'all'
    showToast(`${registeredCount}개 경기를 ${featuredTypeLabel(registerType.value)}로 등록했습니다.`)
  } catch (error) {
    showToast(apiErrorMessage(error, '등록은 완료되었지만 최신 목록 조회에 실패했습니다. 다시 조회해 주세요.'))
  } finally {
    registering.value = false
  }
}

function applyFeaturedMatchesResponse(response) {
  const pinnedMatches = (response?.pinnedMatches || [])
    .map(normalizeFeaturedMatch)
    .sort((a, b) => a.displayOrder - b.displayOrder)
  const hotMatches = (response?.hotMatches || [])
    .map(normalizeFeaturedMatch)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  featuredMatches.value = [...pinnedMatches, ...hotMatches]
}

function normalizeFeaturedMatch(match) {
  return {
    featuredMatchId: match.featuredMatchId,
    matchId: match.matchId,
    sportId: match.sportId,
    sportCode: match.sportCode || '',
    sportName: match.sportName || '-',
    league: match.leagueName || '-',
    homeTeam: match.homeTeamName || '-',
    awayTeam: match.awayTeamName || '-',
    startAt: match.startAt,
    featuredType: match.type === 'PINNED' ? 'pinned' : 'hot',
    displayOrder: match.displayOrder,
  }
}

function normalizeCandidateMatch(match) {
  return {
    id: match.matchId,
    sportId: match.sportId,
    sportCode: match.sportCode || '',
    sportName: match.sportName || '-',
    league: match.leagueName || '-',
    homeTeam: match.homeTeamName || '-',
    awayTeam: match.awayTeamName || '-',
    startAt: match.startAt,
    registerable: match.registerable,
  }
}

function toApiType(type) {
  return type === 'pinned' ? 'PINNED' : 'HOT_MATCH'
}

function toApiDate(date) {
  return date.replaceAll('-', '')
}

function toInputDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function apiErrorMessage(error, fallback) {
  return error?.response?.data?.error?.message || fallback
}

function showToast(message) {
  toastMessage.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastMessage.value = '' }, 2600)
}

onMounted(applySearch)
</script>

<style scoped>
.admin-page { min-width: 1060px; padding: var(--admin-page-padding); color: var(--admin-color-text-body); }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--admin-page-header-gap); margin-bottom: var(--admin-page-header-margin-bottom); }
.title-row { display: flex; align-items: center; gap: 10px; }
.page-header h1 { margin: 0; font-size: var(--admin-font-size-page-title); line-height: 1.35; letter-spacing: -.04em; color: var(--admin-color-text-title); }

.summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
.summary-card { display: grid; grid-template-columns: 40px 1fr; align-items: center; gap: 12px; min-height: 74px; padding: 14px 16px; background: var(--admin-color-surface); border: 1px solid #e7ebf2; border-radius: var(--admin-card-radius); box-shadow: 0 1px 2px rgba(15, 23, 42, .03); }
.summary-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 9px; font-size: 12px; font-weight: 900; }
.summary-card.pinned .summary-icon { color: #1763da; background: #eaf2ff; }
.summary-card.hot .summary-icon { color: #d94747; background: #fff0f0; }
.summary-card > div:nth-child(2) { display: flex; flex-direction: column; gap: 3px; }
.summary-card span { font-size: 11px; color: #7b8496; }
.summary-card strong { font-size: 18px; line-height: 1; color: #1d2738; }

.filter-card { display: flex; align-items: flex-end; gap: var(--admin-filter-gap); padding: var(--admin-card-padding); margin-bottom: var(--admin-section-margin-bottom); background: var(--admin-color-surface); border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); }
.field-group { display: flex; flex-direction: column; gap: var(--admin-field-gap); }
.field-group label, .field-label { color: var(--admin-color-text-label); font-size: var(--admin-font-size-label); font-weight: 700; }
.control { height: 34px; padding: 0 11px; border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); outline: none; color: var(--admin-color-text-control); background: var(--admin-color-surface-subtle); font: inherit; font-size: var(--admin-font-size-description); }
.control:focus { border-color: var(--admin-color-primary); background: var(--admin-color-surface); box-shadow: var(--admin-focus-ring); }
.date-control { width: 170px; }
.type-filter { min-width: 260px; }
.segmented-control { display: flex; padding: 3px; border-radius: 7px; background: #f1f4f8; }
.segmented-control button { flex: 1; height: 28px; padding: 0 14px; border: 0; border-radius: 5px; color: #778195; background: transparent; font: inherit; font-size: 11px; font-weight: 600; cursor: pointer; }
.segmented-control button.active { color: #1c67ff; background: #fff; box-shadow: 0 1px 4px rgba(15, 23, 42, .12); }
.filter-actions { display: flex; gap: var(--admin-action-gap); margin-left: auto; }
.filter-actions :deep(.register-action) { min-width: 100px; background: #0f9f6e; color: #fff; box-shadow: 0 4px 10px rgba(15, 159, 110, .18); }
.filter-actions :deep(.register-action:hover:not(.disabled)) { background: #0b8059; }

.table-card { overflow: hidden; background: var(--admin-color-surface); border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 var(--admin-card-padding); border-bottom: 1px solid var(--admin-color-divider); }
.table-toolbar > div { display: flex; align-items: center; gap: 10px; }
.table-toolbar strong { font-size: 13px; }
.table-toolbar span { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-label); }
.table-scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th { height: 39px; padding: 0 10px; border-bottom: 1px solid var(--admin-color-table-heading-border); color: var(--admin-color-text-table-heading); background: var(--admin-color-table-heading-surface); font-size: var(--admin-font-size-table-heading); font-weight: 700; text-align: center; white-space: nowrap; }
td { height: 58px; padding: 8px 10px; border-bottom: 1px solid var(--admin-color-table-row-border); color: var(--admin-color-text-table-body); font-size: var(--admin-font-size-table-body); text-align: center; vertical-align: middle; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover:not(:has(.empty-state)) { background: var(--admin-color-table-row-hover); }
th:nth-child(1) { width: 80px; } th:nth-child(2) { width: 64px; } th:nth-child(3) { width: 120px; }
th:nth-child(4), th:nth-child(5) { width: 135px; } th:nth-child(6) { width: 112px; }
th:nth-child(7) { width: 104px; } th:nth-child(8) { width: 120px; } th:nth-child(9) { width: 70px; }
.id-cell { color: #2e3b52; font-weight: 700; font-variant-numeric: tabular-nums; }
.team-name { color: #273348; font-weight: 600; }
.type-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; }
.type-badge.pinned { color: #1e61c9; background: #eaf2ff; }
.type-badge.hot { color: #d34646; background: #fff0f0; }
.type-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.order-actions { display: inline-flex; align-items: center; overflow: hidden; height: 27px; border: 1px solid #dce1e9; border-radius: 6px; background: #fff; }
.order-actions button { width: 30px; height: 100%; border: 0; color: #536078; background: #fff; cursor: pointer; }
.order-actions button:hover:not(:disabled) { color: #1c67ff; background: #f1f6ff; }
.order-actions button:disabled { color: #c9ced7; cursor: not-allowed; }
.order-actions span { display: grid; place-items: center; width: 28px; height: 100%; border-inline: 1px solid #e6e9ee; color: #536078; font-size: 10px; font-weight: 700; }
.empty-state { height: 230px; text-align: center; }
.empty-state.compact { height: 150px; }
.empty-state > * { display: block; margin: auto; }
.empty-state .empty-icon { margin-bottom: 9px; color: var(--admin-color-info-border); font-size: 24px; }
.empty-state strong { color: var(--admin-color-text-empty-title); font-size: var(--admin-font-size-description); }
.empty-state small { margin-top: 5px; color: var(--admin-color-text-empty-description); font-size: var(--admin-font-size-table-heading); }
.loading-mark { width: 20px; height: 20px; margin-bottom: 10px; border: 2px solid #dbe6fa; border-top-color: #1c67ff; border-radius: 50%; animation: spin .8s linear infinite; }

.registration-flow { display: flex; flex-direction: column; gap: 16px; }
.modal-intro, .modal-search-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; }
.step-label { display: block; margin-bottom: 4px; color: #1c67ff; font-size: 9px; font-weight: 800; letter-spacing: .08em; }
.registration-flow h2 { margin: 0; color: #1f293b; font-size: 14px; }
.selection-status { padding: 5px 9px; border-radius: 999px; color: #1c67ff; background: #edf4ff; font-size: 10px; font-weight: 700; }
.type-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.type-cards > button { display: flex; align-items: center; gap: 12px; min-height: 70px; padding: 13px 14px; border: 1px solid #dfe4eb; border-radius: 8px; text-align: left; background: #fff; cursor: pointer; }
.type-cards > button.selected.pinned { border-color: #4c8cff; background: #f6f9ff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .08); }
.type-cards > button.selected.hot { border-color: #ef6a6a; background: #fff8f8; box-shadow: 0 0 0 2px rgba(230, 76, 76, .07); }
.type-cards strong { display: block; color: #273348; font-size: 12px; }
.radio-mark { display: grid; place-items: center; width: 17px; height: 17px; border: 1px solid #c9d0dc; border-radius: 50%; flex: 0 0 auto; }
.selected.pinned .radio-mark { border-color: #1c67ff; }
.selected.hot .radio-mark { border-color: #e64c4c; }
.selected .radio-mark span { width: 9px; height: 9px; border-radius: 50%; background: currentColor; }
.selected.pinned .radio-mark span { color: #1c67ff; }
.selected.hot .radio-mark span { color: #e64c4c; }
.modal-date-search { display: flex; align-items: center; gap: 6px; }
.modal-date-search .control { width: 155px; }
.scheduled-table-wrap { max-height: 290px; overflow: auto; border: 1px solid #e3e7ed; border-radius: 8px; }
.scheduled-table th { position: sticky; top: 0; z-index: 1; }
.scheduled-table th:nth-child(1) { width: 42px; } .scheduled-table th:nth-child(2) { width: 70px; }
.scheduled-table th:nth-child(3) { width: 64px; } .scheduled-table th:nth-child(4) { width: 130px; }
.scheduled-table th:nth-child(6) { width: 66px; }
.scheduled-table td { height: 46px; }
.scheduled-table tr.selected { background: #f5f9ff; }
.scheduled-table tr.disabled { opacity: .6; background: #f8f9fb; }
.check-column { text-align: center; }
input[type='checkbox'] { width: 14px; height: 14px; accent-color: #1c67ff; cursor: pointer; }
.time-only { color: #2e3a4f; font-weight: 700; font-variant-numeric: tabular-nums; }
.matchup { display: flex; align-items: center; justify-content: center; gap: 8px; }
.matchup strong { color: #303b50; font-size: 11px; }
.matchup span { color: #a5adba; font-size: 9px; }
.registered-label, .scheduled-label { font-size: 10px; font-weight: 700; }
.registered-label { color: #8a94a5; }
.scheduled-label { color: #18855a; }
.modal-empty { height: 130px !important; color: #929bab; text-align: center; }
.selection-summary { display: flex; align-items: center; gap: 10px; padding: 11px 13px; border-radius: 8px; background: #f2f7ff; }
.summary-check { display: grid; place-items: center; width: 25px; height: 25px; border-radius: 50%; color: #fff; background: #1c67ff; font-size: 12px; font-weight: 800; }
.selection-summary strong { display: block; color: #28549b; font-size: 11px; }

.toast { position: fixed; right: 24px; bottom: 24px; z-index: 1500; display: flex; align-items: center; gap: 8px; padding: 11px 15px; border-radius: var(--admin-toast-radius); color: var(--admin-color-surface); background: var(--admin-color-toast-surface); box-shadow: var(--admin-toast-shadow); font-size: var(--admin-font-size-label); }
.toast span { display: grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; color: var(--admin-color-toast-surface); background: var(--admin-color-toast-accent); font-size: var(--admin-font-size-table-heading); font-weight: 900; }

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1180px) {
  .admin-page { padding-inline: var(--admin-page-padding-inline-compact); }
}
</style>
