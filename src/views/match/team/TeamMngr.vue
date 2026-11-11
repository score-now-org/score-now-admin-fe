<template>
  <AdminListPage title="팀 관리">
    <template #header-actions>
      <BaseButton variant="success" size="md" @click="openCreateModal">
        + 팀 등록
      </BaseButton>
    </template>

    <AdminFilterCard aria-label="팀 검색 조건">
      <div class="field-group id-search">
        <label for="team-id">팀 ID</label>
        <BaseInput id="team-id" v-model="searchForm.id" placeholder="팀 ID 입력" @enter="searchTeams" />
      </div>
      <div class="field-group name-search">
        <label for="team-name">팀명 통합 검색</label>
        <BaseInput id="team-name" v-model="searchForm.keyword" placeholder="한글명, 영문명, 숏네임" @enter="searchTeams" />
      </div>
      <template #actions>
        <BaseButton variant="primary" size="md" :disabled="loading" @click="searchTeams">검색</BaseButton>
      </template>
    </AdminFilterCard>

    <AdminTableCard scroll-label="팀 목록" table-min-width="1120px">
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
              <th>팀 ID</th>
              <th>팀 타입</th>
              <th>팀 한글명</th>
              <th>팀 영문명</th>
              <th>팀 숏네임</th>
              <th>팀 이미지</th>
              <th>국가코드</th>
              <th>데이터 원천</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <AdminTableState
              v-if="loading"
              type="loading"
              :colspan="9"
              title="팀 목록을 불러오는 중입니다."
              compact
            />
            <AdminTableState
              v-else-if="listError"
              type="error"
              :colspan="9"
              :title="listError"
              description="잠시 후 다시 검색해 주세요."
            />
            <AdminTableState
              v-else-if="teams.length === 0"
              :colspan="9"
              title="검색 결과가 없습니다."
              description="팀 ID 또는 팀명을 다시 확인해 주세요."
            />
            <tr v-for="team in teams" v-else :key="team.id" :class="{ dirty: isDirty(team) }">
              <td class="id-cell">{{ team.id }}</td>
              <td>
                <select v-model="team.teamType" class="row-control type-control" :aria-label="`${team.id} 팀 타입`">
                  <option :value="null" disabled>미지정</option>
                  <option v-for="option in teamTypeOptions" :key="option.code" :value="option.code">{{ option.name }}</option>
                </select>
              </td>
              <td><input v-model="team.kName" maxlength="255" class="row-control" :aria-label="`${team.id} 팀 한글명`" /></td>
              <td><input v-model="team.eName" maxlength="255" class="row-control" :aria-label="`${team.id} 팀 영문명`" /></td>
              <td><input v-model="team.sName" maxlength="12" class="row-control short-control" :aria-label="`${team.id} 팀 숏네임`" /></td>
              <td>
                <div class="team-image">
                  <img v-if="team.imageUrl" :src="team.imageUrl" :alt="`${team.kName || team.eName || team.id} 이미지`" />
                  <span v-else>-</span>
                </div>
              </td>
              <td>
                <input v-model="team.cc" maxlength="10" class="row-control country-control" placeholder="-" :aria-label="`${team.id} 국가코드`" />
              </td>
              <td>
                <AdminDataOriginBadge :data-origin="team.dataOrigin" />
              </td>
              <td>
                <div class="action-buttons">
                  <BaseButton variant="primary" size="sm" :disabled="!isDirty(team) || isRowBusy(team.id)" @click="saveTeam(team)">
                    {{ isRowBusy(team.id) ? '저장 중' : '저장' }}
                  </BaseButton>
                  <BaseButton
                    variant="danger"
                    size="sm"
                    :disabled="team.dataOrigin !== 'MANUAL' || isRowBusy(team.id)"
                    :title="team.dataOrigin !== 'MANUAL' ? '수동 등록된 팀만 삭제할 수 있습니다.' : ''"
                    @click="deleteTeam(team)"
                  >삭제</BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
      </table>
    </AdminTableCard>

    <BaseModal v-model="createModalOpen" title="수동 팀 등록" size="lg" :close-disabled="creating">
      <form class="team-form modal-form" @submit.prevent="createTeam">
        <div class="form-field">
          <label for="new-team-type">팀 타입 <span>*</span></label>
          <div id="new-team-type" class="type-radio-grid" role="radiogroup" aria-label="팀 타입">
            <button
              v-for="option in teamTypeOptions"
              :key="option.code"
              type="button"
              role="radio"
              :aria-checked="newTeam.teamType === option.code"
              :class="{ selected: newTeam.teamType === option.code }"
              @click="newTeam.teamType = option.code"
            >
              <span class="radio-dot"><span></span></span>
              <span><strong>{{ option.name }}</strong></span>
            </button>
          </div>
        </div>

        <div class="form-grid two-column">
          <div class="form-field">
            <label for="new-team-ko">팀 한글명 <span>*</span></label>
            <BaseInput id="new-team-ko" v-model="newTeam.kName" maxlength="255" placeholder="예: 토트넘 홋스퍼" />
          </div>
          <div class="form-field">
            <label for="new-team-en">팀 영문명 <span>*</span></label>
            <BaseInput id="new-team-en" v-model="newTeam.eName" maxlength="255" placeholder="예: Tottenham Hotspur" />
          </div>
        </div>

        <div class="form-grid two-column">
          <div class="form-field">
            <label for="new-team-short">팀 숏네임 <span>*</span></label>
            <BaseInput id="new-team-short" v-model="newTeam.sName" placeholder="TOT" maxlength="12" />
          </div>
          <div class="form-field">
            <label for="new-team-sport">종목 <span>*</span></label>
            <BaseSelect id="new-team-sport" v-model="newTeam.sportId">
              <option disabled value="">종목 선택</option>
              <option v-for="sport in sportOptions" :key="sport.id" :value="sport.id">{{ sport.name }}</option>
            </BaseSelect>
          </div>
        </div>
      </form>

      <template #footer>
        <BaseButton variant="outline" size="md" :disabled="creating" @click="createModalOpen = false">취소</BaseButton>
        <BaseButton variant="primary" size="md" :disabled="!isNewTeamValid || creating" @click="createTeam">
          {{ creating ? '등록 중' : '팀 등록' }}
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
import {
  createAdminTeam,
  deleteAdminTeam,
  getAdminTeams,
  getTeamAdminOptions,
  updateAdminTeam,
} from '@/api/team'

const pageSizeOptions = [10, 20, 50]
const teams = ref([])
const teamTypeOptions = ref([])
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
const searchForm = reactive({ id: '', keyword: '' })
const appliedSearch = reactive({ id: '', keyword: '' })
const createModalOpen = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
const newTeam = reactive(emptyNewTeam())
let toastTimer

const maxPage = computed(() => Math.max(1, totalPages.value))
const isNewTeamValid = computed(() => Boolean(
  newTeam.teamType && newTeam.sportId && newTeam.kName.trim() && newTeam.eName.trim()
  && newTeam.sName.trim(),
))

onMounted(async () => {
  await Promise.allSettled([loadOptions(), fetchTeams()])
})

function emptyNewTeam() {
  return { teamType: '', sportId: '', kName: '', eName: '', sName: '' }
}

async function loadOptions() {
  try {
    const result = await getTeamAdminOptions()
    teamTypeOptions.value = Array.isArray(result?.teamTypes) ? result.teamTypes : []
    sportOptions.value = Array.isArray(result?.sports) ? result.sports : []
  } catch (error) {
    showError(error, '팀 등록 옵션을 불러오지 못했습니다.')
  }
}

function normalizeTeam(team) {
  return {
    ...team,
    teamType: team.teamType ?? null,
    kName: team.kName ?? team.kname ?? team.KName ?? '',
    eName: team.eName ?? team.ename ?? team.EName ?? '',
    sName: team.sName ?? team.sname ?? team.SName ?? '',
    imageUrl: team.imageUrl ?? '',
    cc: team.cc ?? '',
  }
}

function snapshotTeam(team) {
  return {
    teamType: team.teamType,
    kName: team.kName,
    eName: team.eName,
    sName: team.sName,
    cc: team.cc,
  }
}

function isDirty(team) {
  return JSON.stringify(savedSnapshots.value[team.id]) !== JSON.stringify(snapshotTeam(team))
}

async function searchTeams() {
  const rawId = searchForm.id.trim()
  if (rawId && !/^\d+$/.test(rawId)) {
    showToast('팀 ID는 숫자로 입력해 주세요.', 'error')
    return
  }
  appliedSearch.id = rawId
  appliedSearch.keyword = searchForm.keyword.trim()
  page.value = 1
  await fetchTeams()
}

async function resetSearch() {
  searchForm.id = ''
  searchForm.keyword = ''
  appliedSearch.id = ''
  appliedSearch.keyword = ''
  page.value = 1
  await fetchTeams()
}

async function fetchTeams() {
  loading.value = true
  listError.value = ''
  try {
    const params = { page: page.value - 1, size: Number(pageSize.value), sort: 'id,asc' }
    if (appliedSearch.id) params.teamId = Number(appliedSearch.id)
    if (appliedSearch.keyword) params.keyword = appliedSearch.keyword

    const result = await getAdminTeams(params)
    teams.value = Array.isArray(result?.content) ? result.content.map(normalizeTeam) : []
    totalElements.value = Number(result?.totalElements ?? teams.value.length)
    totalPages.value = Math.max(1, Number(result?.totalPages ?? 1))
    page.value = Math.min(Math.max(1, Number(result?.number ?? page.value - 1) + 1), totalPages.value)
    savedSnapshots.value = Object.fromEntries(teams.value.map((team) => [team.id, snapshotTeam(team)]))
  } catch (error) {
    teams.value = []
    totalElements.value = 0
    totalPages.value = 1
    listError.value = error?.response?.data?.error?.message || '팀 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

async function changePage(nextPage) {
  if (nextPage < 1 || nextPage > maxPage.value || nextPage === page.value) return
  page.value = nextPage
  await fetchTeams()
}

async function changePageSize() {
  page.value = 1
  await fetchTeams()
}

function buildUpdatePayload(team) {
  const before = savedSnapshots.value[team.id]
  if (!before) return {}
  const payload = {}
  if (team.teamType !== before.teamType) payload.teamType = team.teamType
  if (team.kName !== before.kName) payload.kName = team.kName.trim()
  if (team.eName !== before.eName) payload.eName = team.eName.trim()
  if (team.sName !== before.sName) payload.sName = team.sName.trim().toUpperCase()
  if (team.cc !== before.cc) payload.cc = team.cc.trim()
  return payload
}

function validateUpdatePayload(payload) {
  const requiredTextFields = [
    ['kName', '팀 한글명'], ['eName', '팀 영문명'], ['sName', '팀 숏네임'],
  ]
  const invalid = requiredTextFields.find(([field]) => field in payload && !payload[field])
  if (invalid) {
    showToast(`${invalid[1]}은(는) 비워둘 수 없습니다.`, 'error')
    return false
  }
  return true
}

async function saveTeam(team) {
  const payload = buildUpdatePayload(team)
  if (Object.keys(payload).length === 0 || !validateUpdatePayload(payload)) return

  setIdBusy(rowBusyIds, team.id, true)
  try {
    await updateAdminTeam(team.id, payload)
    if ('sName' in payload) team.sName = payload.sName
    if ('cc' in payload) team.cc = payload.cc.toUpperCase()
    savedSnapshots.value[team.id] = snapshotTeam(team)
    showToast(`${team.kName || team.eName} 팀 정보를 저장했습니다.`)
  } catch (error) {
    showError(error, '팀 정보를 저장하지 못했습니다.')
  } finally {
    setIdBusy(rowBusyIds, team.id, false)
  }
}

async function deleteTeam(team) {
  if (team.dataOrigin !== 'MANUAL') return
  if (!window.confirm(`${team.kName || team.eName} 팀을 삭제하시겠습니까?`)) return

  setIdBusy(rowBusyIds, team.id, true)
  try {
    await deleteAdminTeam(team.id)
    showToast(`${team.kName || team.eName} 팀을 삭제했습니다.`)
    if (teams.value.length === 1 && page.value > 1) page.value -= 1
    await fetchTeams()
  } catch (error) {
    showError(error, '팀을 삭제하지 못했습니다.')
  } finally {
    setIdBusy(rowBusyIds, team.id, false)
  }
}

function openCreateModal() {
  Object.assign(newTeam, emptyNewTeam(), {
    teamType: teamTypeOptions.value[0]?.code ?? '',
    sportId: sportOptions.value[0]?.id ?? '',
  })
  createModalOpen.value = true
}

async function createTeam() {
  if (!isNewTeamValid.value) return
  creating.value = true
  try {
    const created = normalizeTeam(await createAdminTeam({
      sportId: Number(newTeam.sportId),
      teamType: newTeam.teamType,
      kName: newTeam.kName.trim(),
      eName: newTeam.eName.trim(),
      sName: newTeam.sName.trim().toUpperCase(),
    }))
    createModalOpen.value = false
    showToast(`${created.kName || created.eName} 팀을 수동 팀으로 등록했습니다.`)
    await resetSearch()
  } catch (error) {
    showError(error, '팀을 등록하지 못했습니다.')
  } finally {
    creating.value = false
  }
}

function isRowBusy(teamId) {
  return rowBusyIds.value.has(teamId)
}

function setIdBusy(targetRef, id, busy) {
  const next = new Set(targetRef.value)
  if (busy) next.add(id)
  else next.delete(id)
  targetRef.value = next
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
th:nth-child(1) { width: 76px; } th:nth-child(2) { width: 95px; } th:nth-child(3) { width: 155px; }
th:nth-child(4) { width: 178px; } th:nth-child(5) { width: 90px; } th:nth-child(6) { width: 100px; }
th:nth-child(7) { width: 78px; } th:nth-child(8) { width: 86px; } th:nth-child(9) { width: 140px; }
select.row-control { cursor: pointer; }
.type-control { color: #30405b; font-weight: 600; }
.short-control { text-transform: uppercase; }
.country-control { font-weight: 700; text-transform: uppercase; }
.team-image { display: grid; place-items: center; width: 34px; height: 34px; margin: 0 auto; color: var(--admin-color-text-muted); }
.team-image img { width: 100%; height: 100%; object-fit: contain; }
.type-radio-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; }
.type-radio-grid button { display: flex; align-items: center; gap: 10px; min-height: 58px; padding: 10px 12px; border: 1px solid #dde3eb; border-radius: 7px; text-align: left; background: #fff; cursor: pointer; }
.type-radio-grid button.selected { border-color: #4281ec; background: #f6f9ff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .07); }
.radio-dot { display: grid; place-items: center; width: 16px; height: 16px; border: 1px solid #c5ccd8; border-radius: 50%; }
.selected .radio-dot { border-color: #1c67ff; }
.selected .radio-dot span { width: 8px; height: 8px; border-radius: 50%; background: #1c67ff; }
.type-radio-grid strong { display: block; color: #334057; font-size: 11px; }
@media (max-width: 760px) {
  .type-radio-grid { grid-template-columns: 1fr; }
}
</style>
