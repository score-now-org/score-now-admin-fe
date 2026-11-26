<template>
  <BaseModal v-model="visible" title="경기장 매핑" size="xl" :close-disabled="submitting">
    <div class="stadium-dialog">
      <MatchContextSummary :match="match">
        <template #badges>
          <BaseBadge :variant="currentMappingBadgeVariant">
            {{ currentMappingLabel }}
          </BaseBadge>
        </template>
      </MatchContextSummary>

      <div v-if="initialLoading" class="modal-state" role="status">
        <span class="state-spinner"></span>
        <strong>현재 경기장 매핑을 불러오는 중입니다.</strong>
      </div>

      <div v-else-if="initialError" class="modal-state error" role="alert">
        <strong>{{ initialError }}</strong>
        <BaseButton variant="outline" size="sm" @click="initializeModal">다시 조회</BaseButton>
      </div>

      <div v-if="!initialLoading && !initialError && currentMapping" class="current-mapping">
        <span class="current-label">현재 매핑</span>
        <div class="current-copy">
          <strong>{{ currentMapping.stadiumName }}</strong>
          <small>{{ currentMapping.city || '도시 정보 없음' }}</small>
        </div>
        <div v-if="currentMapping.type === 'REGISTERED'" class="current-meta">
          <AdminSportBadge
            :sport-code="currentMapping.sportCode"
            :sport-name="currentMapping.sportName"
          />
          <span v-if="currentMapping.stadiumId">#{{ currentMapping.stadiumId }}</span>
          <span v-if="currentMapping.active === false" class="inactive-stadium">비활성</span>
        </div>
        <BaseButton
          v-else
          variant="danger"
          size="sm"
          :disabled="submitting"
          @click="releaseTemporaryMapping"
        >
          임시 경기장 매핑 해제
        </BaseButton>
      </div>

      <section v-if="!initialLoading && !initialError" class="mapping-section">
        <div class="section-title">
          <div>
            <span>STEP 1</span>
            <h2>매핑 방식 선택</h2>
          </div>
          <small>등록 경기장은 변경만 가능하며, 임시 경기장만 해제할 수 있습니다.</small>
        </div>

        <div class="mapping-type-grid" role="radiogroup" aria-label="경기장 매핑 방식">
          <button
            type="button"
            role="radio"
            :aria-checked="mappingMode === 'REGISTERED'"
            :class="{ selected: mappingMode === 'REGISTERED' }"
            @click="selectMappingMode('REGISTERED')"
          >
            <span class="radio-mark"><i></i></span>
            <span>
              <strong>등록 경기장</strong>
              <small>경기장 관리에 등록된 경기장을 선택합니다.</small>
            </span>
            <b>등록</b>
          </button>
          <button
            type="button"
            role="radio"
            :aria-checked="mappingMode === 'TEMPORARY'"
            :class="{ selected: mappingMode === 'TEMPORARY' }"
            @click="selectMappingMode('TEMPORARY')"
          >
            <span class="radio-mark"><i></i></span>
            <span>
              <strong>임시 경기장</strong>
              <small>현재 경기에서만 사용할 정보를 입력합니다.</small>
            </span>
            <b class="temporary">임시</b>
          </button>
        </div>
      </section>

      <section v-if="!initialLoading && !initialError && mappingMode === 'REGISTERED'" class="mapping-section">
        <div class="section-title">
          <div>
            <span>STEP 2</span>
            <h2>등록 경기장 선택</h2>
          </div>
          <small class="result-count">{{ candidateCountLabel }}</small>
        </div>

        <form class="candidate-toolbar" @submit.prevent="searchStadiumCandidates">
          <select v-model="searchType" class="search-type" aria-label="경기장 검색 조건">
            <option value="name">경기장명</option>
            <option value="stadiumId">경기장 ID</option>
          </select>
          <label class="search-field">
            <span>⌕</span>
            <input
              v-model="searchValue"
              type="search"
              :inputmode="searchType === 'stadiumId' ? 'numeric' : 'search'"
              :placeholder="searchType === 'stadiumId' ? '경기장 ID 입력' : '경기장명 입력'"
              aria-label="경기장 검색"
            />
          </label>
          <button type="submit" class="candidate-search-button" :disabled="candidateLoading">검색</button>
          <div class="scope-control" role="group" aria-label="경기장 종목 범위">
            <button
              type="button"
              :class="{ active: candidateScope === 'same' }"
              :disabled="candidateLoading"
              @click="changeCandidateScope('same')"
            >같은 종목</button>
            <button
              type="button"
              :class="{ active: candidateScope === 'all' }"
              :disabled="candidateLoading"
              @click="changeCandidateScope('all')"
            >전체 종목</button>
          </div>
        </form>

        <div class="candidate-list" role="radiogroup" aria-label="경기장 후보">
          <div v-if="candidateLoading && stadiumCandidates.length === 0" class="candidate-loading" role="status">
            <span class="state-spinner"></span>
            경기장 후보를 조회하고 있습니다.
          </div>

          <button
            v-for="stadium in stadiumCandidates"
            :key="stadium.id"
            type="button"
            role="radio"
            :aria-checked="String(selectedStadiumId) === String(stadium.id)"
            :class="{ selected: String(selectedStadiumId) === String(stadium.id) }"
            @click="selectStadium(stadium)"
          >
            <span class="radio-mark"><i></i></span>
            <span class="candidate-copy">
              <strong>{{ stadium.name }}</strong>
              <small>{{ stadium.city || '도시 정보 없음' }} · #{{ stadium.id }}</small>
            </span>
            <AdminSportBadge :sport-code="stadium.sportCode" :sport-name="stadium.sportName" />
            <AdminDataOriginBadge :data-origin="stadium.dataOrigin" />
          </button>

          <div v-if="!candidateLoading && stadiumCandidates.length === 0" class="candidate-empty">
            <span>○</span>
            <strong>조건에 맞는 경기장이 없습니다.</strong>
            <small>검색어를 변경하거나 전체 종목을 선택해 주세요.</small>
          </div>

          <button
            v-if="hasMoreCandidates"
            type="button"
            class="candidate-load-more"
            :disabled="candidateLoading"
            @click="loadMoreStadiums"
          >
            {{ candidateLoading ? '불러오는 중' : '경기장 더보기' }}
          </button>
        </div>

        <div v-if="candidateError" class="inline-error" role="alert">
          <span>{{ candidateError }}</span>
          <button type="button" @click="retryCandidateRequest">다시 시도</button>
        </div>
      </section>

      <section v-else-if="!initialLoading && !initialError" class="mapping-section">
        <div class="section-title">
          <div>
            <span>STEP 2</span>
            <h2>임시 경기장 입력</h2>
          </div>
        </div>

        <div class="temporary-note">
          <span>T</span>
          <div>
            <strong>이 경기에서만 사용하는 경기장입니다.</strong>
            <small>경기장 관리 목록에는 등록되지 않으며 이후 해제할 수 있습니다.</small>
          </div>
        </div>

        <div class="temporary-form">
          <div class="form-field">
            <label for="temporary-stadium-name">경기장명 <span>*</span></label>
            <BaseInput
              id="temporary-stadium-name"
              v-model="temporaryForm.stadiumName"
              maxlength="255"
              placeholder="경기장명 입력"
            />
          </div>
          <div class="form-field">
            <label for="temporary-stadium-city">도시명 <small>선택</small></label>
            <BaseInput
              id="temporary-stadium-city"
              v-model="temporaryForm.city"
              maxlength="255"
              placeholder="도시명 입력"
            />
          </div>
        </div>
      </section>

      <div v-if="submitError" class="submit-error" role="alert">{{ submitError }}</div>

      <div v-if="!initialLoading && !initialError && selectionSummary" class="selection-summary">
        <span>✓</span>
        <div>
          <strong>{{ selectionSummary.title }}</strong>
          <small>{{ selectionSummary.description }}</small>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="outline" size="md" :disabled="submitting" @click="visible = false">취소</BaseButton>
      <BaseButton variant="primary" size="md" :disabled="!canSave || submitting" @click="requestSaveMapping">
        {{ saving ? '저장 중' : '경기장 매핑 저장' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { useAdminConfirm } from '@/composables/useAdminConfirm'
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import AdminDataOriginBadge from '@/components/common/AdminDataOriginBadge.vue'
import AdminSportBadge from '@/components/common/AdminSportBadge.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import MatchContextSummary from './components/MatchContextSummary.vue'
import {
  assignMatchStadium,
  assignMatchTemporaryStadium,
  getMatchStadiumMapping,
  removeMatchTemporaryStadium,
} from '@/api/match'
import { getAdminStadiums } from '@/api/stadium'

const CANDIDATE_PAGE_SIZE = 20

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  match: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'completed'])

const currentMapping = ref(null)
const mappingMode = ref('REGISTERED')
const selectedStadiumId = ref('')
const temporaryForm = ref(emptyTemporaryForm())
const stadiumCandidates = ref([])
const searchType = ref('name')
const searchValue = ref('')
const appliedSearch = ref({ type: 'name', value: '' })
const candidateScope = ref('same')
const candidatePage = ref(0)
const candidateTotalPages = ref(1)
const candidateTotalElements = ref(0)
const candidateLoading = ref(false)
const candidateError = ref('')
const initialLoading = ref(false)
const initialError = ref('')
const saving = ref(false)
const releasing = ref(false)
const submitError = ref('')
const requestConfirmation = useAdminConfirm()
let modalRequestSequence = 0
let candidateRequestSequence = 0

const visible = computed({
  get: () => props.modelValue,
  set: (value) => {
    if (!value && submitting.value) return
    emit('update:modelValue', value)
  },
})

const currentMappingType = computed(() => {
  if (!currentMapping.value) return 'none'
  return currentMapping.value.type === 'TEMPORARY' ? 'temporary' : 'registered'
})

const currentMappingLabel = computed(() => ({
  registered: '등록 경기장',
  temporary: '임시 경기장',
  none: initialLoading.value ? '조회 중' : '할당된 경기장 없음',
}[currentMappingType.value]))

const currentMappingBadgeVariant = computed(() => ({
  registered: 'blue',
  temporary: 'yellow',
  none: 'gray',
}[currentMappingType.value]))

const matchSportKey = computed(() => sportKey({
  sportCode: props.match?.sportCode,
  sportName: props.match?.sportName || props.match?.sport,
}))

const selectedStadium = computed(() => stadiumCandidates.value.find(
  (stadium) => String(stadium.id) === String(selectedStadiumId.value),
))

const submitting = computed(() => saving.value || releasing.value)

const hasMoreCandidates = computed(() => (
  candidatePage.value + 1 < candidateTotalPages.value
))

const candidateCountLabel = computed(() => {
  if (candidateLoading.value && stadiumCandidates.value.length === 0) return '조회 중'
  if (candidateTotalElements.value <= stadiumCandidates.value.length) {
    return `${candidateTotalElements.value}개`
  }
  return `${stadiumCandidates.value.length} / ${candidateTotalElements.value}개`
})

const canSave = computed(() => (
  !initialLoading.value && !initialError.value && (mappingMode.value === 'REGISTERED'
    ? Boolean(selectedStadium.value)
    : Boolean(temporaryForm.value.stadiumName.trim()))
))

const selectionSummary = computed(() => {
  if (mappingMode.value === 'REGISTERED' && selectedStadium.value) {
    return {
      title: `${selectedStadium.value.name}으로 매핑합니다.`,
      description: `${selectedStadium.value.city || '도시 정보 없음'} · ${selectedStadium.value.sportName || '종목 미지정'}`,
    }
  }

  return null
})

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      initializeModal()
      return
    }

    modalRequestSequence += 1
    candidateRequestSequence += 1
  },
)

async function initializeModal() {
  const requestSequence = ++modalRequestSequence
  resetModalState()

  if (!props.match?.id) {
    initialLoading.value = false
    initialError.value = '경기 정보가 없어 경기장 매핑을 조회할 수 없습니다.'
    return
  }

  initialLoading.value = true

  try {
    const result = await getMatchStadiumMapping(props.match.id)
    if (requestSequence !== modalRequestSequence || !props.modelValue) return

    currentMapping.value = normalizeCurrentMapping(result)
    mappingMode.value = currentMapping.value?.type || 'REGISTERED'
    selectedStadiumId.value = currentMapping.value?.type === 'REGISTERED'
      ? currentMapping.value.stadiumId
      : ''
    temporaryForm.value = currentMapping.value?.type === 'TEMPORARY'
      ? {
          stadiumName: currentMapping.value.stadiumName || '',
          city: currentMapping.value.city || '',
        }
      : emptyTemporaryForm()
    candidateScope.value = shouldShowAllCandidates(currentMapping.value) ? 'all' : 'same'
    initialLoading.value = false
    await loadCandidatePage(0, false)
  } catch (error) {
    if (requestSequence !== modalRequestSequence || !props.modelValue) return
    initialLoading.value = false
    initialError.value = extractApiErrorMessage(error, '현재 경기장 매핑을 불러오지 못했습니다.')
  }
}

function resetModalState() {
  currentMapping.value = null
  mappingMode.value = 'REGISTERED'
  selectedStadiumId.value = ''
  temporaryForm.value = emptyTemporaryForm()
  stadiumCandidates.value = []
  searchType.value = 'name'
  searchValue.value = ''
  appliedSearch.value = { type: 'name', value: '' }
  candidateScope.value = props.match?.sportId == null ? 'all' : 'same'
  candidatePage.value = 0
  candidateTotalPages.value = 1
  candidateTotalElements.value = 0
  candidateLoading.value = false
  candidateError.value = ''
  initialLoading.value = false
  initialError.value = ''
  saving.value = false
  releasing.value = false
  submitError.value = ''
}

function selectMappingMode(mode) {
  mappingMode.value = mode
  submitError.value = ''
}

function selectStadium(stadium) {
  selectedStadiumId.value = stadium.id
  submitError.value = ''
}

async function searchStadiumCandidates() {
  const value = searchValue.value.trim()
  if (searchType.value === 'stadiumId' && value) {
    const numericId = Number(value)
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(numericId) || numericId <= 0) {
      candidateError.value = '경기장 ID는 1 이상의 숫자로 입력해 주세요.'
      return
    }
  }

  appliedSearch.value = { type: searchType.value, value }
  selectedStadiumId.value = ''
  await loadCandidatePage(0, false)
}

async function changeCandidateScope(scope) {
  if (scope === candidateScope.value || candidateLoading.value) return
  candidateScope.value = scope
  selectedStadiumId.value = ''
  await loadCandidatePage(0, false)
}

async function loadMoreStadiums() {
  if (!hasMoreCandidates.value || candidateLoading.value) return
  await loadCandidatePage(candidatePage.value + 1, true)
}

async function retryCandidateRequest() {
  if (stadiumCandidates.value.length > 0) {
    await loadMoreStadiums()
    return
  }
  await loadCandidatePage(0, false)
}

async function loadCandidatePage(page, append) {
  const requestSequence = ++candidateRequestSequence
  candidateLoading.value = true
  candidateError.value = ''

  if (!append) {
    stadiumCandidates.value = []
    candidatePage.value = 0
    candidateTotalPages.value = 1
    candidateTotalElements.value = 0
  }

  try {
    const result = await getAdminStadiums(buildCandidateParams(page))
    if (requestSequence !== candidateRequestSequence || !props.modelValue) return

    const content = Array.isArray(result?.content) ? result.content.map(normalizeStadium) : []
    stadiumCandidates.value = append
      ? mergeStadiumCandidates(stadiumCandidates.value, content)
      : content
    candidatePage.value = Number(result?.number ?? page)
    candidateTotalPages.value = Math.max(1, Number(result?.totalPages ?? 1))
    candidateTotalElements.value = Number(result?.totalElements ?? stadiumCandidates.value.length)
  } catch (error) {
    if (requestSequence !== candidateRequestSequence || !props.modelValue) return
    candidateError.value = extractApiErrorMessage(error, '경기장 후보를 불러오지 못했습니다.')
  } finally {
    if (requestSequence === candidateRequestSequence) {
      candidateLoading.value = false
    }
  }
}

function buildCandidateParams(page) {
  const params = {
    page,
    size: CANDIDATE_PAGE_SIZE,
    sort: 'id,asc',
  }
  const search = appliedSearch.value

  if (search.value) {
    params[search.type] = search.type === 'stadiumId' ? Number(search.value) : search.value
  }
  if (candidateScope.value === 'same' && props.match?.sportId != null) {
    params.sportId = Number(props.match.sportId)
  }

  return params
}

async function requestSaveMapping(event) {
  if (!canSave.value || submitting.value) return
  submitError.value = ''

  if (mappingMode.value === 'TEMPORARY' && currentMapping.value?.type === 'REGISTERED') {
    const confirmed = await requestConfirmation({
      title: '임시 경기장으로 교체할까요?',
      message: '현재 등록 경기장 매핑이 제거됩니다.',
      confirmLabel: '교체 후 저장',
      confirmVariant: 'warn',
    }, event?.currentTarget)
    if (!confirmed) return
  }

  submitMapping()
}

async function submitMapping() {
  if (!canSave.value || submitting.value || !props.match?.id) return
  saving.value = true
  submitError.value = ''

  try {
    if (mappingMode.value === 'REGISTERED') {
      await assignMatchStadium(props.match.id, { stadiumId: Number(selectedStadium.value.id) })
    } else {
      await assignMatchTemporaryStadium(props.match.id, {
        stadiumName: temporaryForm.value.stadiumName.trim(),
        city: temporaryForm.value.city.trim() || null,
      })
    }

    emit('completed', {
      matchId: props.match.id,
      message: '경기장 매핑이 저장되었습니다.',
    })
    emit('update:modelValue', false)
  } catch (error) {
    submitError.value = extractApiErrorMessage(error, '경기장 매핑을 저장하지 못했습니다.')
  } finally {
    saving.value = false
  }
}

async function releaseTemporaryMapping(event) {
  if (currentMapping.value?.type !== 'TEMPORARY' || submitting.value || !props.match?.id) return
  const confirmed = await requestConfirmation({
    title: '임시 경기장 매핑을 해제할까요?',
    message: '할당된 경기장이 없는 상태가 되며, 이후 동기화에서 경기장이 다시 배정될 수 있습니다.',
    confirmLabel: '매핑 해제',
    confirmVariant: 'danger',
  }, event?.currentTarget)
  if (!confirmed || submitting.value) return

  releasing.value = true
  submitError.value = ''

  try {
    await removeMatchTemporaryStadium(props.match.id)
    emit('completed', {
      matchId: props.match.id,
      message: '임시 경기장 매핑이 해제되었습니다.',
    })
    emit('update:modelValue', false)
  } catch (error) {
    submitError.value = extractApiErrorMessage(error, '임시 경기장 매핑을 해제하지 못했습니다.')
  } finally {
    releasing.value = false
  }
}

function mergeStadiumCandidates(current, incoming) {
  const byId = new Map(current.map((stadium) => [String(stadium.id), stadium]))
  incoming.forEach((stadium) => byId.set(String(stadium.id), stadium))
  return Array.from(byId.values())
}

function emptyTemporaryForm() {
  return { stadiumName: '', city: '' }
}

function normalizeCurrentMapping(mapping) {
  const type = String(mapping?.mappingType || '').toUpperCase()
  if (type === 'NONE' || !type) return null

  return {
    type: type === 'TEMPORARY' ? 'TEMPORARY' : 'REGISTERED',
    stadiumId: mapping.stadiumId ?? null,
    stadiumName: mapping.stadiumName || '',
    city: mapping.city || '',
    sportId: mapping.sportId ?? null,
    sportCode: mapping.sportCode || '',
    sportName: mapping.sportName || '',
    dataOrigin: mapping.dataOrigin || '',
    active: mapping.active ?? null,
  }
}

function normalizeStadium(stadium) {
  return {
    id: stadium.id,
    name: stadium.name || '-',
    city: stadium.city || '',
    sportId: stadium.sportId ?? null,
    sportCode: stadium.sportCode || '',
    sportName: stadium.sportName || '',
    dataOrigin: stadium.dataOrigin || '',
  }
}

function shouldShowAllCandidates(mapping) {
  if (props.match?.sportId == null) return true
  if (mapping?.type !== 'REGISTERED') return false
  if (mapping.sportId != null) {
    return String(mapping.sportId) !== String(props.match.sportId)
  }
  return sportKey(mapping) !== matchSportKey.value
}

function extractApiErrorMessage(error, fallback) {
  return error?.response?.data?.error?.message || error?.message || fallback
}

function sportKey(source = {}) {
  const code = String(source.sportCode || '').trim().toUpperCase()
  const name = String(source.sportName || '').trim().toLowerCase()

  if (code === 'AMERICAN_FOOTBALL' || ['미식축구', 'american football'].some((value) => name.includes(value))) {
    return 'american-football'
  }
  if (['FOOTBALL', 'SOCCER'].includes(code) || ['축구', 'football', 'soccer'].some((value) => name.includes(value))) {
    return 'football'
  }
  if (code === 'BASEBALL' || ['야구', 'baseball'].some((value) => name.includes(value))) return 'baseball'
  if (code === 'BASKETBALL' || ['농구', 'basketball'].some((value) => name.includes(value))) return 'basketball'

  return code || name
}
</script>

<style scoped>
.stadium-dialog { display: flex; flex-direction: column; gap: 16px; color: var(--admin-color-text-body); }
.modal-state { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 108px; padding: 16px; border: 1px solid var(--admin-color-border); border-radius: var(--admin-control-radius); color: var(--admin-color-text-muted); background: var(--admin-color-surface-subtle); font-size: var(--admin-font-size-label); }
.modal-state.error { flex-direction: column; color: #a4434b; border-color: #efc9cc; background: #fff8f8; }
.state-spinner { width: 14px; height: 14px; border: 2px solid #d5e1f5; border-top-color: #1c67ff; border-radius: 50%; animation: stadium-spin .8s linear infinite; }
@keyframes stadium-spin { to { transform: rotate(360deg); } }

.current-mapping { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 52px; padding: 9px 12px; border: 1px solid var(--admin-color-border); border-radius: var(--admin-control-radius); background: var(--admin-color-surface-subtle); }
.current-label { padding-right: 10px; border-right: 1px solid var(--admin-color-divider); color: var(--admin-color-text-muted); font-size: var(--admin-font-size-table-heading); font-weight: 800; }
.current-copy { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.current-copy strong { overflow: hidden; color: var(--admin-color-text-body); font-size: var(--admin-font-size-description); text-overflow: ellipsis; white-space: nowrap; }
.current-copy small { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-table-heading); }
.current-meta { display: flex; align-items: center; gap: 7px; }
.current-meta > span { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-table-heading); font-weight: 700; }
.current-meta > .inactive-stadium { padding: 3px 6px; border-radius: 999px; color: #a43d46; background: #fdecee; }
.mapping-section { display: flex; flex-direction: column; gap: 9px; }
.section-title { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.section-title > div > span { display: block; margin-bottom: 3px; color: var(--admin-color-primary); font-size: 9px; font-weight: 800; letter-spacing: .08em; }
.section-title h2 { margin: 0; color: var(--admin-color-text-body); font-size: 13px; }
.section-title > small { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-table-heading); }
.section-title .result-count { display: inline-flex; min-height: 23px; align-items: center; padding: 0 8px; border-radius: 999px; color: #3864bd; background: #edf3ff; font-weight: 700; }
.mapping-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.mapping-type-grid > button { display: grid; grid-template-columns: 16px 1fr auto; align-items: center; gap: 10px; min-height: 62px; padding: 10px 12px; border: 1px solid var(--admin-color-control-border); border-radius: 8px; text-align: left; background: var(--admin-color-surface); cursor: pointer; }
.mapping-type-grid > button:hover { border-color: #bfccdf; }
.mapping-type-grid > button.selected { border-color: #4281ec; background: #f6f9ff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .07); }
.radio-mark { display: grid; place-items: center; width: 16px; height: 16px; border: 1px solid #c5ccd8; border-radius: 50%; }
.selected > .radio-mark { border-color: #1c67ff; }
.selected > .radio-mark i { width: 8px; height: 8px; border-radius: 50%; background: #1c67ff; }
.mapping-type-grid > button > span:nth-child(2) { display: flex; flex-direction: column; gap: 2px; }
.mapping-type-grid strong { color: var(--admin-color-text-body); font-size: var(--admin-font-size-label); }
.mapping-type-grid small { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-table-heading); }
.mapping-type-grid b { display: inline-flex; min-height: 23px; align-items: center; padding: 0 8px; border-radius: 999px; color: #3864bd; background: #edf3ff; font-size: var(--admin-font-size-table-heading); }
.mapping-type-grid b.temporary { color: #996514; background: #fff2d2; }

.candidate-toolbar { display: grid; grid-template-columns: 104px minmax(160px, 1fr) 52px auto; gap: 8px; }
.search-type { height: 36px; padding: 0 10px; border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); outline: none; color: var(--admin-color-text-control); background: var(--admin-color-surface-subtle); font: inherit; font-size: var(--admin-font-size-label); }
.search-type:focus { border-color: var(--admin-color-primary); background: #fff; box-shadow: var(--admin-focus-ring); }
.search-field { display: flex; align-items: center; height: 36px; padding: 0 10px; border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); background: var(--admin-color-surface-subtle); }
.search-field:focus-within { border-color: var(--admin-color-primary); background: #fff; box-shadow: var(--admin-focus-ring); }
.search-field > span { color: #8995a7; font-size: 14px; }
.search-field input { flex: 1; min-width: 0; padding: 0 7px; border: 0; outline: 0; color: var(--admin-color-text-control); background: transparent; font: inherit; font-size: var(--admin-font-size-label); }
.candidate-search-button { height: 36px; border: 0; border-radius: var(--admin-control-radius); color: #fff; background: var(--admin-color-primary); font: inherit; font-size: var(--admin-font-size-label); font-weight: 700; cursor: pointer; }
.candidate-search-button:disabled { opacity: .55; cursor: not-allowed; }
.scope-control { display: flex; padding: 2px; border-radius: 7px; background: #f1f4f8; }
.scope-control button { min-width: 80px; height: 32px; padding: 0 9px; border: 0; border-radius: 5px; color: var(--admin-color-text-muted); background: transparent; font: inherit; font-size: var(--admin-font-size-table-heading); font-weight: 700; cursor: pointer; }
.scope-control button.active { color: #1c67ff; background: #fff; box-shadow: 0 1px 4px rgba(15, 23, 42, .12); }
.scope-control button:disabled { cursor: not-allowed; opacity: .65; }
.candidate-list { max-height: 192px; overflow-y: auto; border: 1px solid var(--admin-color-border); border-radius: var(--admin-control-radius); background: var(--admin-color-surface); }
.candidate-list > button { display: grid; grid-template-columns: 16px minmax(160px, 1fr) auto auto; align-items: center; gap: 8px; width: 100%; min-height: 48px; padding: 7px 10px; border: 0; border-bottom: 1px solid var(--admin-color-divider); text-align: left; background: var(--admin-color-surface); cursor: pointer; }
.candidate-list > button:last-of-type { border-bottom: 0; }
.candidate-list > button:hover { background: var(--admin-color-table-row-hover); }
.candidate-list > button.selected { background: #f5f9ff; }
.candidate-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.candidate-copy strong { overflow: hidden; color: var(--admin-color-text-control); font-size: var(--admin-font-size-label); text-overflow: ellipsis; white-space: nowrap; }
.candidate-copy small { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-table-heading); }
.candidate-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 104px; color: #929bab; }
.candidate-empty > span { margin-bottom: 3px; color: #b5becb; font-size: 18px; }
.candidate-empty strong { font-size: var(--admin-font-size-label); }
.candidate-empty small { margin-top: 3px; font-size: var(--admin-font-size-table-heading); }
.candidate-loading { display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 104px; color: var(--admin-color-text-muted); font-size: var(--admin-font-size-table-heading); }
.candidate-list > .candidate-load-more { display: flex; align-items: center; justify-content: center; min-height: 36px; color: var(--admin-color-primary); background: var(--admin-color-surface-subtle); font-size: var(--admin-font-size-table-heading); font-weight: 700; }
.candidate-list > .candidate-load-more:hover:not(:disabled) { background: #eef5ff; }
.candidate-list > .candidate-load-more:disabled { color: #8fa8d1; cursor: not-allowed; }
.inline-error { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 10px; border-radius: var(--admin-control-radius); color: #a4434b; background: #fff1f2; font-size: var(--admin-font-size-table-heading); }
.inline-error button { padding: 0; border: 0; color: #9c3440; background: transparent; font: inherit; font-size: var(--admin-font-size-table-heading); font-weight: 800; text-decoration: underline; cursor: pointer; }

.temporary-note { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--admin-color-border); border-radius: var(--admin-control-radius); background: var(--admin-color-surface-subtle); }
.temporary-note > span { display: grid; place-items: center; width: 25px; height: 25px; border-radius: var(--admin-control-radius); color: #9a6511; background: #fff5d9; font-size: var(--admin-font-size-table-heading); font-weight: 900; }
.temporary-note > div { display: flex; flex-direction: column; gap: 2px; }
.temporary-note strong { color: var(--admin-color-text-body); font-size: var(--admin-font-size-label); }
.temporary-note small { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-table-heading); }
.temporary-form { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.form-field label > small { margin-left: 3px; color: #9aa3b2; font-size: 8px; }
.submit-error { padding: 8px 10px; border: 1px solid #efc9cc; border-radius: var(--admin-control-radius); color: #a43d46; background: #fff6f7; font-size: var(--admin-font-size-table-heading); font-weight: 700; }
.selection-summary { display: flex; align-items: center; gap: 9px; min-height: 40px; padding: 8px 10px; border: 1px solid var(--admin-color-border); border-radius: var(--admin-control-radius); background: var(--admin-color-surface-subtle); }
.selection-summary > span { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; color: #3864bd; background: #edf3ff; font-size: var(--admin-font-size-table-heading); font-weight: 800; }
.selection-summary > div { display: flex; flex-direction: column; gap: 1px; }
.selection-summary strong { color: var(--admin-color-text-body); font-size: var(--admin-font-size-label); }
.selection-summary small { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-table-heading); }

@media (max-width: 720px) {
  .mapping-type-grid, .temporary-form, .candidate-toolbar { grid-template-columns: 1fr; }
  .section-title > small:not(.result-count) { display: none; }
  .candidate-list > button { grid-template-columns: 16px 1fr auto; }
  .candidate-list > .candidate-load-more { display: flex; }
  .candidate-list > button > :deep(.data-origin-badge) { display: none; }
}
</style>
