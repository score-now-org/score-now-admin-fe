<template>
  <AdminListPage title="경기장 관리">
    <template #header-actions>
      <BaseButton variant="success" size="md" @click="openCreateModal">
        + 경기장 등록
      </BaseButton>
    </template>

    <AdminFilterCard aria-label="경기장 검색 조건">
      <div class="field-group id-search">
        <label for="stadium-id">경기장 ID</label>
        <BaseInput id="stadium-id" v-model="searchForm.id" placeholder="경기장 ID 입력" @enter="searchStadiums" />
      </div>
      <div class="field-group name-search">
        <label for="stadium-name">경기장명</label>
        <BaseInput id="stadium-name" v-model="searchForm.name" placeholder="경기장명 입력" @enter="searchStadiums" />
      </div>
      <template #actions>
        <BaseButton variant="secondary" size="md" :disabled="loading" @click="resetSearch">초기화</BaseButton>
        <BaseButton variant="primary" size="md" :disabled="loading" @click="searchStadiums">검색</BaseButton>
      </template>
    </AdminFilterCard>

    <AdminTableCard scroll-label="경기장 목록" table-min-width="900px">
      <template #summary>
        <strong>검색 결과</strong>
        <span>총 {{ totalElements }}건</span>
      </template>
      <template #toolbar-actions>
        <AdminTablePagination
          v-model:page-size="pageSize"
          :page-size-options="pageSizeOptions"
          :page="page"
          :total-pages="maxPage"
          :loading="loading"
          @change-page="changePage"
          @change-page-size="changePageSize"
        />
      </template>

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
            <AdminTableState
              v-if="loading"
              type="loading"
              :colspan="6"
              title="경기장 목록을 불러오는 중입니다."
              compact
            />
            <AdminTableState
              v-else-if="listError"
              type="error"
              :colspan="6"
              :title="listError"
              description="잠시 후 다시 검색해 주세요."
            />
            <AdminTableState
              v-else-if="stadiums.length === 0"
              :colspan="6"
              title="검색 결과가 없습니다."
              description="경기장 ID 또는 경기장명을 다시 확인해 주세요."
            />
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
    </AdminTableCard>

    <BaseModal v-model="createModalOpen" title="수동 경기장 등록" size="md" :close-disabled="creating">
      <form class="stadium-form modal-form" @submit.prevent="createStadium">
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
          <BaseInput
            id="new-stadium-name"
            v-model="newStadium.name"
            maxlength="255"
            placeholder="예: 서울월드컵경기장"
          />
        </div>

        <div class="form-field">
          <label for="new-stadium-city">도시명 <span>*</span></label>
          <BaseInput
            id="new-stadium-city"
            v-model="newStadium.city"
            maxlength="255"
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
  </AdminListPage>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
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
const listError = ref('')
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
  listError.value = ''
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
    listError.value = error?.response?.data?.error?.message || '경기장 목록을 불러오지 못했습니다.'
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
.id-search { width: 160px; }
.name-search { width: 310px; }
th:nth-child(1) { width: 92px; } th:nth-child(2) { width: 100px; } th:nth-child(3) { width: 260px; }
th:nth-child(4) { width: 180px; } th:nth-child(5) { width: 100px; } th:nth-child(6) { width: 140px; }
.name-control { font-weight: 600; }
.sport-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; }
.sport-options button { display: flex; align-items: center; justify-content: center; gap: 7px; height: 42px; border: 1px solid #dde3eb; border-radius: 7px; color: #687388; background: #fff; font: inherit; font-size: 10px; font-weight: 700; cursor: pointer; }
.sport-options button.selected { border-color: #4281ec; color: #1f62cc; background: #f6f9ff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .07); }
</style>
