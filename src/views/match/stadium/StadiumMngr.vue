<template>
  <div class="admin-page">
    <header class="page-header">
      <div class="title-row"><h1>경기장 관리</h1></div>
    </header>

    <section class="filter-card" aria-label="경기장 검색 조건">
      <div class="field-group id-search">
        <label for="stadium-id">경기장 ID</label>
        <BaseInput id="stadium-id" v-model="searchForm.id" placeholder="경기장 ID 입력" @enter="searchStadiums" />
      </div>
      <div class="field-group name-search">
        <label for="stadium-name">경기장명</label>
        <BaseInput id="stadium-name" v-model="searchForm.name" placeholder="경기장명 입력" @enter="searchStadiums" />
      </div>
      <div class="filter-actions">
        <BaseButton variant="secondary" size="md" :disabled="loading" @click="resetSearch">초기화</BaseButton>
        <BaseButton variant="primary" size="md" :disabled="loading" @click="searchStadiums">검색</BaseButton>
        <BaseButton variant="secondary" size="md" class="register-action" @click="openCreateModal">+ 경기장 등록</BaseButton>
      </div>
    </section>

    <section class="table-card">
      <div class="table-toolbar">
        <div class="result-summary">
          <strong>검색 결과</strong>
          <span>총 {{ totalElements }}건</span>
        </div>
        <div class="paging-toolbar">
          <label for="stadium-page-size">페이지당</label>
          <select id="stadium-page-size" v-model="pageSize" :disabled="loading" @change="changePageSize">
            <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}개</option>
          </select>
          <span>{{ page }} / {{ maxPage }} 페이지</span>
          <BaseButton variant="outline" size="sm" :disabled="loading || page === 1" @click="changePage(page - 1)">이전</BaseButton>
          <BaseButton variant="outline" size="sm" :disabled="loading || page === maxPage" @click="changePage(page + 1)">다음</BaseButton>
        </div>
      </div>

      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>경기장 ID</th>
              <th>종목</th>
              <th>경기장명</th>
              <th>도시명</th>
              <th>데이터 원천</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="empty-state"><strong>경기장 목록을 불러오는 중입니다.</strong></td>
            </tr>
            <tr v-else-if="stadiums.length === 0">
              <td colspan="6" class="empty-state">
                <span class="empty-icon">○</span>
                <strong>검색 결과가 없습니다.</strong>
                <small>경기장 ID 또는 경기장명을 다시 확인해 주세요.</small>
              </td>
            </tr>
            <template v-else>
              <tr v-for="stadium in stadiums" :key="stadium.id" :class="{ dirty: isDirty(stadium) }">
                <td class="id-cell">{{ stadium.id }}</td>
                <td><AdminSportBadge :sport-code="stadium.sportCode" :sport-name="sportLabel(stadium)" /></td>
                <td>
                  <input
                    v-model="stadium.name"
                    maxlength="255"
                    class="row-control name-control"
                    :disabled="isRowBusy(stadium.id)"
                    :aria-label="`${stadium.id} 경기장명`"
                  />
                </td>
                <td>
                  <input
                    v-model="stadium.city"
                    maxlength="255"
                    class="row-control"
                    :disabled="isRowBusy(stadium.id)"
                    :aria-label="`${stadium.id} 도시명`"
                  />
                </td>
                <td>
                  <AdminDataOriginBadge :data-origin="stadium.dataOrigin" />
                </td>
                <td>
                  <div class="action-buttons">
                    <BaseButton
                      variant="primary"
                      size="sm"
                      :disabled="!isDirty(stadium) || isRowBusy(stadium.id)"
                      @click="saveStadium(stadium)"
                    >{{ isRowBusy(stadium.id) ? '처리 중' : '저장' }}</BaseButton>
                    <BaseButton
                      variant="danger"
                      size="sm"
                      :disabled="stadium.dataOrigin !== 'MANUAL' || isRowBusy(stadium.id)"
                      :title="stadium.dataOrigin !== 'MANUAL' ? '수동 등록된 경기장만 삭제할 수 있습니다.' : ''"
                      @click="deleteStadium(stadium)"
                    >삭제</BaseButton>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal v-model="createModalOpen" title="수동 경기장 등록" width="560px">
      <form class="stadium-form" @submit.prevent="createStadium">
        <div class="form-field">
          <label for="stadium-sport">종목 <span>*</span></label>
          <div id="stadium-sport" class="sport-options" role="radiogroup" aria-label="종목 선택">
            <button
              v-for="option in sportOptions"
              :key="option.id"
              type="button"
              role="radio"
              :aria-checked="newStadium.sportId === option.id"
              :class="{ selected: newStadium.sportId === option.id }"
              @click="newStadium.sportId = option.id"
            >
              {{ option.name }}
            </button>
          </div>
        </div>

        <div class="form-field">
          <label for="new-stadium-name">경기장명 <span>*</span></label>
          <input
            id="new-stadium-name"
            v-model="newStadium.name"
            maxlength="255"
            class="form-control"
            placeholder="예: 서울월드컵경기장"
          />
        </div>

        <div class="form-field">
          <label for="new-stadium-city">도시명 <span>*</span></label>
          <input
            id="new-stadium-city"
            v-model="newStadium.city"
            maxlength="255"
            class="form-control"
            placeholder="예: 서울"
          />
        </div>
      </form>

      <template #footer>
        <BaseButton variant="outline" size="md" :disabled="creating" @click="createModalOpen = false">취소</BaseButton>
        <BaseButton variant="primary" size="md" :disabled="!isNewStadiumValid || creating" @click="createStadium">
          {{ creating ? '등록 중' : '경기장 등록' }}
        </BaseButton>
      </template>
    </BaseModal>

    <div v-if="toastMessage" class="toast" :class="toastType" role="status">
      <span>{{ toastType === 'error' ? '!' : '✓' }}</span>{{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminDataOriginBadge from '@/components/common/AdminDataOriginBadge.vue'
import AdminSportBadge from '@/components/common/AdminSportBadge.vue'
import {
  createAdminStadium,
  deleteAdminStadium,
  getAdminStadiums,
  getStadiumAdminOptions,
  updateAdminStadium,
} from '@/api/stadium'

const pageSizeOptions = [10, 20, 50]
const stadiums = ref([])
const sportOptions = ref([])
const savedSnapshots = ref({})
const loading = ref(false)
const creating = ref(false)
const rowBusyIds = ref(new Set())
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const totalElements = ref(0)
const searchForm = reactive({ id: '', name: '' })
const appliedSearch = reactive({ id: '', name: '' })
const createModalOpen = ref(false)
const newStadium = reactive(emptyNewStadium())
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer

const maxPage = computed(() => Math.max(1, totalPages.value))
const isNewStadiumValid = computed(() => Boolean(
  newStadium.sportId && newStadium.name.trim() && newStadium.city.trim(),
))

onMounted(async () => {
  await Promise.allSettled([loadOptions(), fetchStadiums()])
})

function emptyNewStadium() {
  return { sportId: '', name: '', city: '' }
}

async function loadOptions() {
  try {
    const result = await getStadiumAdminOptions()
    sportOptions.value = Array.isArray(result?.sports) ? result.sports : []
  } catch (error) {
    showError(error, '경기장 등록 옵션을 불러오지 못했습니다.')
  }
}

function normalizeStadium(stadium) {
  return {
    ...stadium,
    name: stadium.name ?? '',
    city: stadium.city ?? '',
    sportCode: stadium.sportCode ?? '',
    sportName: stadium.sportName ?? '',
    dataOrigin: stadium.dataOrigin ?? null,
  }
}

function snapshotStadium(stadium) {
  return { name: stadium.name, city: stadium.city }
}

function isDirty(stadium) {
  return JSON.stringify(savedSnapshots.value[stadium.id]) !== JSON.stringify(snapshotStadium(stadium))
}

function sportLabel(stadium) {
  if (stadium.sportName) return stadium.sportName
  if (stadium.sportCode) return stadium.sportCode
  const sport = sportOptions.value.find((option) => Number(option.id) === Number(stadium.sportId))
  return sport?.name || sport?.code || `#${stadium.sportId}`
}

async function searchStadiums() {
  const rawId = searchForm.id.trim()
  if (rawId && !/^\d+$/.test(rawId)) {
    showToast('경기장 ID는 숫자로 입력해 주세요.', 'error')
    return
  }
  appliedSearch.id = rawId
  appliedSearch.name = searchForm.name.trim()
  page.value = 1
  await fetchStadiums()
}

async function resetSearch() {
  searchForm.id = ''
  searchForm.name = ''
  appliedSearch.id = ''
  appliedSearch.name = ''
  page.value = 1
  await fetchStadiums()
}

async function fetchStadiums() {
  loading.value = true
  try {
    const params = { page: page.value - 1, size: Number(pageSize.value), sort: 'id,asc' }
    if (appliedSearch.id) params.stadiumId = Number(appliedSearch.id)
    if (appliedSearch.name) params.name = appliedSearch.name

    const result = await getAdminStadiums(params)
    stadiums.value = Array.isArray(result?.content) ? result.content.map(normalizeStadium) : []
    totalElements.value = Number(result?.totalElements ?? stadiums.value.length)
    totalPages.value = Math.max(1, Number(result?.totalPages ?? 1))
    page.value = Math.min(Math.max(1, Number(result?.number ?? page.value - 1) + 1), totalPages.value)
    savedSnapshots.value = Object.fromEntries(stadiums.value.map((stadium) => [stadium.id, snapshotStadium(stadium)]))
  } catch (error) {
    stadiums.value = []
    totalElements.value = 0
    totalPages.value = 1
    showError(error, '경기장 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function changePage(nextPage) {
  if (nextPage < 1 || nextPage > maxPage.value || nextPage === page.value) return
  page.value = nextPage
  await fetchStadiums()
}

async function changePageSize() {
  page.value = 1
  await fetchStadiums()
}

function buildUpdatePayload(stadium) {
  const before = savedSnapshots.value[stadium.id]
  if (!before) return {}
  const payload = {}
  if (stadium.name !== before.name) payload.name = stadium.name.trim()
  if (stadium.city !== before.city) payload.city = stadium.city.trim()
  return payload
}

function validateUpdatePayload(payload) {
  if ('name' in payload && !payload.name) {
    showToast('경기장명은 비워둘 수 없습니다.', 'error')
    return false
  }
  if ('city' in payload && !payload.city) {
    showToast('도시명은 비워둘 수 없습니다.', 'error')
    return false
  }
  return true
}

async function saveStadium(stadium) {
  const payload = buildUpdatePayload(stadium)
  if (Object.keys(payload).length === 0 || !validateUpdatePayload(payload)) return

  setIdBusy(stadium.id, true)
  try {
    await updateAdminStadium(stadium.id, payload)
    if ('name' in payload) stadium.name = payload.name
    if ('city' in payload) stadium.city = payload.city
    savedSnapshots.value[stadium.id] = snapshotStadium(stadium)
    showToast(`${stadium.name} 경기장 정보를 저장했습니다.`)
  } catch (error) {
    showError(error, '경기장 정보를 저장하지 못했습니다.')
  } finally {
    setIdBusy(stadium.id, false)
  }
}

async function deleteStadium(stadium) {
  if (stadium.dataOrigin !== 'MANUAL') return
  if (!window.confirm(`${stadium.name} 경기장을 삭제하시겠습니까?`)) return

  setIdBusy(stadium.id, true)
  try {
    await deleteAdminStadium(stadium.id)
    showToast(`${stadium.name} 경기장을 삭제했습니다.`)
    if (stadiums.value.length === 1 && page.value > 1) page.value -= 1
    await fetchStadiums()
  } catch (error) {
    showError(error, '경기장을 삭제하지 못했습니다.')
  } finally {
    setIdBusy(stadium.id, false)
  }
}

function openCreateModal() {
  Object.assign(newStadium, emptyNewStadium(), {
    sportId: sportOptions.value[0]?.id ?? '',
  })
  createModalOpen.value = true
}

async function createStadium() {
  if (!isNewStadiumValid.value) return
  creating.value = true
  try {
    const created = normalizeStadium(await createAdminStadium({
      sportId: Number(newStadium.sportId),
      name: newStadium.name.trim(),
      city: newStadium.city.trim(),
    }))
    createModalOpen.value = false
    showToast(`${created.name} 경기장을 등록했습니다.`)
    await resetSearch()
  } catch (error) {
    showError(error, '경기장을 등록하지 못했습니다.')
  } finally {
    creating.value = false
  }
}

function isRowBusy(stadiumId) {
  return rowBusyIds.value.has(stadiumId)
}

function setIdBusy(stadiumId, busy) {
  const next = new Set(rowBusyIds.value)
  if (busy) next.add(stadiumId)
  else next.delete(stadiumId)
  rowBusyIds.value = next
}

function showError(error, fallback) {
  showToast(error?.response?.data?.error?.message || fallback, 'error')
}

function showToast(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastMessage.value = '' }, 3200)
}
</script>

<style scoped>
.admin-page { min-width: 920px; padding: var(--admin-page-padding); color: var(--admin-color-text-body); }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--admin-page-header-gap); margin-bottom: var(--admin-page-header-margin-bottom); }
.title-row { display: flex; align-items: center; gap: 10px; }
.page-header h1 { margin: 0; font-size: var(--admin-font-size-page-title); line-height: 1.35; letter-spacing: -.04em; color: var(--admin-color-text-title); }
.filter-card { display: flex; align-items: flex-end; gap: var(--admin-filter-gap); padding: var(--admin-card-padding); margin-bottom: var(--admin-section-margin-bottom); background: var(--admin-color-surface); border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); }
.field-group { display: flex; flex-direction: column; gap: var(--admin-field-gap); }
.field-group label { color: var(--admin-color-text-label); font-size: var(--admin-font-size-label); font-weight: 700; }
.id-search { width: 160px; }
.name-search { width: 310px; }
.filter-actions { display: flex; gap: var(--admin-action-gap); margin-left: auto; }
.filter-actions :deep(.register-action) { min-width: 104px; background: #0f9f6e; color: #fff; box-shadow: 0 4px 10px rgba(15, 159, 110, .18); }
.filter-actions :deep(.register-action:hover:not(.disabled)) { background: #0b8059; }
.table-card { overflow: hidden; background: var(--admin-color-surface); border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 var(--admin-card-padding); border-bottom: 1px solid var(--admin-color-divider); }
.result-summary, .paging-toolbar { display: flex; align-items: center; gap: 10px; }
.table-toolbar strong { font-size: 13px; }
.table-toolbar span, .paging-toolbar label { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-label); }
.paging-toolbar select { height: 28px; padding: 0 8px; border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); color: var(--admin-color-text-control); background: #fff; font-size: var(--admin-font-size-label); }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 900px; border-collapse: collapse; table-layout: fixed; }
th { height: 39px; padding: 0 10px; border-bottom: 1px solid var(--admin-color-table-heading-border); color: var(--admin-color-text-table-heading); background: var(--admin-color-table-heading-surface); font-size: var(--admin-font-size-table-heading); font-weight: 700; text-align: center; white-space: nowrap; }
td { height: 64px; padding: 8px 10px; border-bottom: 1px solid var(--admin-color-table-row-border); color: var(--admin-color-text-table-body); font-size: var(--admin-font-size-table-body); text-align: center; vertical-align: middle; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover:not(:has(.empty-state)) { background: var(--admin-color-table-row-hover); }
tbody tr.dirty { background: #fffdf5; }
tbody tr.dirty:hover { background: #fffaf0; }
th:nth-child(1) { width: 92px; } th:nth-child(2) { width: 100px; } th:nth-child(3) { width: 260px; }
th:nth-child(4) { width: 180px; } th:nth-child(5) { width: 100px; } th:nth-child(6) { width: 140px; }
.id-cell { color: #2e3b52; font-weight: 700; font-variant-numeric: tabular-nums; }
.row-control { width: 100%; height: 32px; padding: 0 9px; border: 1px solid transparent; border-radius: 5px; outline: none; color: #303b50; background: transparent; font: inherit; font-size: 11px; text-align: center; }
.row-control:hover:not(:disabled) { border-color: #e1e6ed; background: #fff; }
.row-control:focus { border-color: #1c67ff; background: #fff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .08); }
.row-control:disabled { opacity: .65; }
.name-control { font-weight: 600; }
.action-buttons { display: flex; justify-content: center; gap: 5px; }
.empty-state { height: 230px; text-align: center; }
.empty-state > * { display: block; margin: auto; }
.empty-state .empty-icon { margin-bottom: 9px; color: var(--admin-color-info-border); font-size: 24px; }
.empty-state strong { color: var(--admin-color-text-empty-title); font-size: var(--admin-font-size-description); }
.empty-state small { margin-top: 5px; color: var(--admin-color-text-empty-description); font-size: var(--admin-font-size-table-heading); }
.stadium-form { display: flex; flex-direction: column; gap: 17px; }
.form-field { display: flex; flex-direction: column; gap: var(--admin-field-gap); }
.form-field > label { color: var(--admin-color-text-label); font-size: var(--admin-font-size-table-heading); font-weight: 700; }
.form-field > label span { color: #e14d4d; }
.form-control { width: 100%; height: 36px; padding: 0 10px; border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); outline: none; color: var(--admin-color-text-control); background: var(--admin-color-surface-subtle); font: inherit; font-size: var(--admin-font-size-label); }
.form-control:focus { border-color: var(--admin-color-primary); background: var(--admin-color-surface); box-shadow: var(--admin-focus-ring); }
.sport-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; }
.sport-options button { display: flex; align-items: center; justify-content: center; gap: 7px; height: 42px; border: 1px solid #dde3eb; border-radius: 7px; color: #687388; background: #fff; font: inherit; font-size: 10px; font-weight: 700; cursor: pointer; }
.sport-options button.selected { border-color: #4281ec; color: #1f62cc; background: #f6f9ff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .07); }
.toast { position: fixed; right: 24px; bottom: 24px; z-index: 1500; display: flex; align-items: center; gap: 8px; max-width: 460px; padding: 11px 15px; border-radius: var(--admin-toast-radius); color: var(--admin-color-surface); background: var(--admin-color-toast-surface); box-shadow: var(--admin-toast-shadow); font-size: var(--admin-font-size-label); }
.toast.error { background: #a92f3c; }
.toast span { display: grid; place-items: center; flex: 0 0 auto; width: 17px; height: 17px; border-radius: 50%; color: var(--admin-color-toast-surface); background: var(--admin-color-toast-accent); font-size: var(--admin-font-size-table-heading); font-weight: 900; }
.toast.error span { color: #a92f3c; background: #fff; }
@media (max-width: 1100px) { .admin-page { padding-inline: var(--admin-page-padding-inline-compact); } }
</style>
