<template>
  <BaseModal v-model="visible" title="경기 등록" size="lg" :close-disabled="saving">
    <div class="form modal-form">
      <div class="form-grid">
        <div class="form-row">
          <label class="form-label">종목</label>
          <BaseSelect v-model="form.sport">
            <option value="">선택</option>
            <option
              v-for="sport in sportOptions"
              :key="sport.value"
              :value="sport.value"
            >
              {{ sport.label }}
            </option>
          </BaseSelect>
        </div>

        <div class="form-row">
          <label class="form-label">리그</label>
          <BaseSelect v-model="form.leagueId">
            <option value="">선택</option>
            <option
              v-for="league in selectableLeagues"
              :key="league.id"
              :value="league.id"
            >
              {{ league.name }}
            </option>
          </BaseSelect>
        </div>

        <div class="form-row">
          <label class="form-label">시작 날짜</label>
          <BaseInput v-model="form.startDate" type="date" />
        </div>

        <div class="form-row">
          <label class="form-label">시작 시간</label>
          <BaseInput
            v-model="form.startTime"
            type="time"
          />
        </div>
      </div>

      <div class="team-search-grid">
        <div class="team-search-box form-field">
          <label class="form-label">홈팀</label>
          <input
            ref="homeTeamInput"
            v-model="form.homeTeamKeyword"
            class="form-input"
            type="text"
            :disabled="!selectedSportId"
            :placeholder="teamSearchPlaceholder"
            @input="handleTeamKeywordInput('home')"
          />
          <div class="team-result-panel">
            <div v-if="selectedHomeTeam" class="selected-team-card">
              <span class="selected-team-label">선택됨</span>
              <div class="selected-team-content">
                <img
                  v-if="selectedHomeTeam.imageUrl"
                  class="selected-team-image"
                  :src="selectedHomeTeam.imageUrl"
                  :alt="`${selectedHomeTeam.name} 이미지`"
                />
                <span v-else class="selected-team-image fallback">
                  {{ teamInitials(selectedHomeTeam.name) }}
                </span>
                <strong>{{ selectedHomeTeam.name }}</strong>
              </div>
            </div>
            <template v-else>
              <button
                v-for="team in filteredHomeTeams"
                :key="team.id"
                class="team-result-item"
                type="button"
                @click="selectTeam('home', team)"
              >
                <img
                  v-if="team.imageUrl"
                  class="team-result-image"
                  :src="team.imageUrl"
                  :alt="`${team.name} 이미지`"
                />
                <span class="team-result-name">{{ team.name }}</span>
                <span v-if="team.shortName" class="team-result-sub">{{ team.shortName }}</span>
              </button>
              <p v-if="homeTeamLoading" class="team-search-guide">
                팀을 검색하는 중입니다.
              </p>
              <p v-else-if="showHomeSportGuide" class="team-search-guide">
                종목을 먼저 선택하면 팀 검색을 사용할 수 있습니다.
              </p>
              <p v-else-if="showHomeSearchGuide" class="team-search-guide">
                팀명을 2글자 이상 입력해주세요.
              </p>
              <p v-else-if="homeTeamSearchError" class="team-search-guide error">
                {{ homeTeamSearchError }}
              </p>
              <p v-else-if="showHomeEmptyResult" class="team-search-guide">
                검색 결과가 없습니다. 원하는 팀이 보이지 않으면 팀명을 더 상세하게 입력해주세요.
              </p>
              <p v-if="showHomeLimitGuide" class="team-search-note">
                검색 결과는 최대 10개까지 표시됩니다. 원하는 팀이 보이지 않으면 팀명을 더 상세하게 입력해주세요.
              </p>
            </template>
          </div>
        </div>

        <div class="team-search-box form-field">
          <label class="form-label">원정팀</label>
          <input
            v-model="form.awayTeamKeyword"
            class="form-input"
            type="text"
            :disabled="!selectedSportId"
            :placeholder="teamSearchPlaceholder"
            @input="handleTeamKeywordInput('away')"
          />
          <div class="team-result-panel">
            <div v-if="selectedAwayTeam" class="selected-team-card">
              <span class="selected-team-label">선택됨</span>
              <div class="selected-team-content">
                <img
                  v-if="selectedAwayTeam.imageUrl"
                  class="selected-team-image"
                  :src="selectedAwayTeam.imageUrl"
                  :alt="`${selectedAwayTeam.name} 이미지`"
                />
                <span v-else class="selected-team-image fallback">
                  {{ teamInitials(selectedAwayTeam.name) }}
                </span>
                <strong>{{ selectedAwayTeam.name }}</strong>
              </div>
            </div>
            <template v-else>
              <button
                v-for="team in filteredAwayTeams"
                :key="team.id"
                class="team-result-item"
                type="button"
                @click="selectTeam('away', team)"
              >
                <img
                  v-if="team.imageUrl"
                  class="team-result-image"
                  :src="team.imageUrl"
                  :alt="`${team.name} 이미지`"
                />
                <span class="team-result-name">{{ team.name }}</span>
                <span v-if="team.shortName" class="team-result-sub">{{ team.shortName }}</span>
              </button>
              <p v-if="awayTeamLoading" class="team-search-guide">
                팀을 검색하는 중입니다.
              </p>
              <p v-else-if="showAwaySportGuide" class="team-search-guide">
                종목을 먼저 선택하면 팀 검색을 사용할 수 있습니다.
              </p>
              <p v-else-if="showAwaySearchGuide" class="team-search-guide">
                팀명을 2글자 이상 입력해주세요.
              </p>
              <p v-else-if="awayTeamSearchError" class="team-search-guide error">
                {{ awayTeamSearchError }}
              </p>
              <p v-else-if="showAwayEmptyResult" class="team-search-guide">
                검색 결과가 없습니다. 원하는 팀이 보이지 않으면 팀명을 더 상세하게 입력해주세요.
              </p>
              <p v-if="showAwayLimitGuide" class="team-search-note">
                검색 결과는 최대 10개까지 표시됩니다. 원하는 팀이 보이지 않으면 팀명을 더 상세하게 입력해주세요.
              </p>
            </template>
          </div>
        </div>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>

    <template #footer>
      <BaseButton variant="outline" :disabled="saving" @click="visible = false">
        취소
      </BaseButton>
      <BaseButton variant="primary" :disabled="saving" @click="handleSave">
        {{ saving ? '등록중' : '등록' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { getMatchTeamCandidates } from '../../../../api/match'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  sportOptions: { type: Array, default: () => [] },
  leagueOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])

const visible = ref(props.modelValue)
const errorMsg = ref('')
const homeTeamInput = ref(null)

const defaultForm = () => ({
  sport: '',
  leagueId: '',
  startDate: '',
  startTime: '',
  homeId: '',
  homeTeamName: '',
  homeTeamKeyword: '',
  homeTeamImageUrl: '',
  awayId: '',
  awayTeamName: '',
  awayTeamKeyword: '',
  awayTeamImageUrl: '',
})

const form = ref(defaultForm())
const homeTeamCandidates = ref([])
const awayTeamCandidates = ref([])
const homeTeamLoading = ref(false)
const awayTeamLoading = ref(false)
const homeTeamSearchError = ref('')
const awayTeamSearchError = ref('')

const teamSearchTimers = { home: null, away: null }
const teamSearchRequestIds = { home: 0, away: 0 }

const selectableLeagues = computed(() => (
  props.leagueOptions.filter((league) => !form.value.sport || league.sport === form.value.sport)
))

const selectedSportId = computed(() => {
  const selectedSport = props.sportOptions.find((sport) => sport.value === form.value.sport)
  return selectedSport?.serverValue ?? selectedSport?.id ?? ''
})
const teamSearchPlaceholder = computed(() => (
  selectedSportId.value ? '팀명 2글자 이상 검색' : '종목을 먼저 선택해주세요'
))

const filteredHomeTeams = computed(() => (
  form.value.homeId ? [] : excludeSelectedTeam(homeTeamCandidates.value, form.value.awayId)
))
const filteredAwayTeams = computed(() => (
  form.value.awayId ? [] : excludeSelectedTeam(awayTeamCandidates.value, form.value.homeId)
))
const selectedHomeTeam = computed(() => selectedTeam('home'))
const selectedAwayTeam = computed(() => selectedTeam('away'))
const showHomeSportGuide = computed(() => !form.value.homeId && !selectedSportId.value)
const showAwaySportGuide = computed(() => !form.value.awayId && !selectedSportId.value)
const showHomeSearchGuide = computed(() => (
  !form.value.homeId && Boolean(selectedSportId.value) && hasShortKeyword(form.value.homeTeamKeyword)
))
const showAwaySearchGuide = computed(() => (
  !form.value.awayId && Boolean(selectedSportId.value) && hasShortKeyword(form.value.awayTeamKeyword)
))
const showHomeEmptyResult = computed(() => (
  !form.value.homeId
    && !homeTeamLoading.value
    && !homeTeamSearchError.value
    && hasEnoughKeyword(form.value.homeTeamKeyword)
    && filteredHomeTeams.value.length === 0
))
const showAwayEmptyResult = computed(() => (
  !form.value.awayId
    && !awayTeamLoading.value
    && !awayTeamSearchError.value
    && hasEnoughKeyword(form.value.awayTeamKeyword)
    && filteredAwayTeams.value.length === 0
))
const showHomeLimitGuide = computed(() => !form.value.homeId && homeTeamCandidates.value.length >= 10)
const showAwayLimitGuide = computed(() => !form.value.awayId && awayTeamCandidates.value.length >= 10)

watch(
  () => props.modelValue,
  (value) => {
    visible.value = value
    if (value) {
      form.value = defaultForm()
      clearAllTeamSearchState()
      errorMsg.value = ''
    }
  },
)

watch(visible, (value) => {
  if (!value) clearAllTeamSearchTimers()
  emit('update:modelValue', value)
})

watch(
  () => form.value.sport,
  async () => {
    form.value.leagueId = ''
    clearTeamSelection('home')
    clearTeamSelection('away')
    clearAllTeamSearchState()

    if (!visible.value || !selectedSportId.value) return

    await nextTick()
    homeTeamInput.value?.focus()
  },
)

function handleSave() {
  if (props.saving) return

  errorMsg.value = ''

  if (!form.value.sport) {
    errorMsg.value = '종목을 선택해주세요.'
    return
  }

  if (!form.value.leagueId) {
    errorMsg.value = '리그를 선택해주세요.'
    return
  }

  if (!form.value.startDate || !form.value.startTime) {
    errorMsg.value = '경기 시작 날짜와 시간을 입력해주세요.'
    return
  }

  const normalizedTime = normalizeTime(form.value.startTime)

  if (!normalizedTime) {
    errorMsg.value = '시작 시간은 24시간 형식(HH:MM)으로 입력해주세요.'
    return
  }

  if (!form.value.homeId || !form.value.awayId) {
    errorMsg.value = '홈팀과 원정팀을 검색 후 선택해주세요.'
    return
  }

  if (form.value.homeId === form.value.awayId) {
    errorMsg.value = '홈팀과 원정팀은 서로 달라야 합니다.'
    return
  }

  emit('save', {
    ...form.value,
    sportId: selectedSportId.value,
    dataSourceType: 'manual',
    dataSourceName: '수동',
    matchType: 'A',
    status: 'NOT_STARTED',
    useStatus: 'active',
    startTime: normalizedTime,
  })
}

function handleTeamKeywordInput(type) {
  const prefix = teamFieldPrefix(type)
  form.value[`${prefix}Id`] = ''
  form.value[`${prefix}TeamName`] = ''
  errorMsg.value = ''
  scheduleTeamSearch(type)
}

function selectTeam(type, team) {
  const prefix = teamFieldPrefix(type)
  form.value[`${prefix}Id`] = team.id
  form.value[`${prefix}TeamName`] = team.name
  form.value[`${prefix}TeamKeyword`] = team.name
  form.value[`${prefix}TeamImageUrl`] = team.imageUrl || ''
  errorMsg.value = ''
}

function clearTeamSelection(type) {
  const prefix = teamFieldPrefix(type)
  form.value[`${prefix}Id`] = ''
  form.value[`${prefix}TeamName`] = ''
  form.value[`${prefix}TeamKeyword`] = ''
  form.value[`${prefix}TeamImageUrl`] = ''
}

function teamFieldPrefix(type) {
  return type === 'home' ? 'home' : 'away'
}

function selectedTeam(type) {
  const prefix = teamFieldPrefix(type)
  const teamId = form.value[`${prefix}Id`]

  if (!teamId) return null

  return {
    id: teamId,
    name: form.value[`${prefix}TeamName`],
    imageUrl: form.value[`${prefix}TeamImageUrl`],
  }
}

function teamInitials(name) {
  return String(name || '').trim().slice(0, 2) || '-'
}

function scheduleTeamSearch(type) {
  clearTeamSearchTimer(type)
  resetTeamSearchResult(type)

  const keyword = getTeamKeyword(type)

  if (!selectedSportId.value || !hasEnoughKeyword(keyword)) {
    return
  }

  teamSearchTimers[type] = window.setTimeout(() => {
    fetchTeamCandidates(type)
  }, 250)
}

async function fetchTeamCandidates(type) {
  const requestId = ++teamSearchRequestIds[type]
  const keyword = getTeamKeyword(type)
  const sportId = selectedSportId.value

  if (!sportId || !hasEnoughKeyword(keyword)) {
    return
  }

  setTeamSearchLoading(type, true)
  setTeamSearchError(type, '')

  try {
    const candidates = normalizeTeamCandidates(await getMatchTeamCandidates({
      keyword: keyword.trim(),
      sportId,
    }))

    if (requestId !== teamSearchRequestIds[type]) return

    setTeamCandidates(type, candidates)
  } catch (error) {
    if (requestId !== teamSearchRequestIds[type]) return

    console.error('팀 후보 검색에 실패했습니다.', error)
    setTeamCandidates(type, [])
    setTeamSearchError(type, '팀 검색에 실패했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    if (requestId === teamSearchRequestIds[type]) {
      setTeamSearchLoading(type, false)
    }
  }
}

function normalizeTeamCandidates(candidates) {
  return ensureArray(candidates).map((team) => ({
    id: team.id,
    sportId: team.sportId,
    name: team.name,
    shortName: team.shortName,
    imageUrl: team.imageUrl,
  }))
}

function excludeSelectedTeam(candidates, excludedTeamId) {
  if (!excludedTeamId) return candidates

  return candidates.filter((candidate) => String(candidate.id) !== String(excludedTeamId))
}

function getTeamKeyword(type) {
  const prefix = teamFieldPrefix(type)
  return form.value[`${prefix}TeamKeyword`]
}

function setTeamCandidates(type, candidates) {
  if (type === 'home') {
    homeTeamCandidates.value = candidates
    return
  }

  awayTeamCandidates.value = candidates
}

function setTeamSearchLoading(type, value) {
  if (type === 'home') {
    homeTeamLoading.value = value
    return
  }

  awayTeamLoading.value = value
}

function setTeamSearchError(type, message) {
  if (type === 'home') {
    homeTeamSearchError.value = message
    return
  }

  awayTeamSearchError.value = message
}

function resetTeamSearchResult(type) {
  teamSearchRequestIds[type] += 1
  setTeamCandidates(type, [])
  setTeamSearchLoading(type, false)
  setTeamSearchError(type, '')
}

function clearAllTeamSearchState() {
  clearAllTeamSearchTimers()
  resetTeamSearchResult('home')
  resetTeamSearchResult('away')
}

function clearTeamSearchTimer(type) {
  if (!teamSearchTimers[type]) return

  window.clearTimeout(teamSearchTimers[type])
  teamSearchTimers[type] = null
}

function clearAllTeamSearchTimers() {
  clearTeamSearchTimer('home')
  clearTeamSearchTimer('away')
}

function hasShortKeyword(keyword) {
  const normalizedKeyword = normalizeSearchText(keyword)
  return normalizedKeyword.length < 2
}

function hasEnoughKeyword(keyword) {
  return normalizeSearchText(keyword).length >= 2
}

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s/g, '')
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
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
.team-search-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.team-search-box {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.team-result-panel {
  height: 154px;
  overflow: auto;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}

.team-result-item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  color: var(--admin-color-text-body);
  font-family: inherit;
  font-size: var(--admin-font-size-description);
  text-align: left;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--admin-color-divider);
  cursor: pointer;
}

.team-result-item:last-child {
  border-bottom: none;
}

.team-result-item:hover {
  background: var(--admin-color-table-row-hover);
}

.team-result-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-result-image {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 50%;
  object-fit: cover;
}

.team-result-sub {
  flex: 0 0 auto;
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-label);
}

.team-search-guide {
  display: flex;
  min-height: 100%;
  align-items: center;
  box-sizing: border-box;
  justify-content: center;
  margin: 0;
  color: var(--admin-color-text-empty-description);
  font-size: var(--admin-font-size-description);
  line-height: 1.5;
  padding: 0 16px;
  text-align: center;
}

.team-search-guide.error {
  color: #c53c46;
}

.team-search-note {
  margin: 0;
  padding: 8px 10px;
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-label);
  line-height: 1.5;
  background: var(--admin-color-surface);
  border-top: 1px solid var(--admin-color-divider);
}

.selected-team-card {
  display: flex;
  height: 100%;
  align-items: center;
  box-sizing: border-box;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  padding: 16px;
  color: var(--admin-color-text-body);
  background: var(--admin-color-surface);
  border: none;
  border-radius: 0;
}

.selected-team-content {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.selected-team-image {
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 50%;
  object-fit: cover;
}

.selected-team-image.fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--admin-color-primary);
  font-size: 10px;
  font-weight: 700;
  background: #edf3ff;
  border: 1px solid #cfdfff;
}

.selected-team-card strong {
  min-width: 0;
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-team-label {
  padding: 5px 8px;
  color: #3864bd;
  font-size: var(--admin-font-size-table-heading);
  font-weight: 700;
  background: #edf3ff;
  border-radius: 999px;
}

@media (max-width: 640px) {
  .team-search-grid {
    grid-template-columns: 1fr;
  }
}
</style>
