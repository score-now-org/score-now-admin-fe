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
            <tr v-for="team in teams" v-else :key="team.id">
              <td class="id-cell">{{ team.id }}</td>
              <td>{{ getTeamTypeName(team.teamType) }}</td>
              <td class="team-name" :title="team.kName">{{ team.kName || '-' }}</td>
              <td class="team-name" :title="team.eName">{{ team.eName || '-' }}</td>
              <td>{{ team.sName || '-' }}</td>
              <td>
                <div class="team-image">
                  <img v-if="team.imageUrl" :src="team.imageUrl" :alt="`${team.kName || team.eName || team.id} 이미지`" />
                  <span v-else>-</span>
                </div>
              </td>
              <td>{{ team.cc || '-' }}</td>
              <td>
                <AdminDataOriginBadge :data-origin="team.dataOrigin" />
              </td>
              <td>
                <div class="action-buttons">
                  <BaseButton variant="primary" size="sm" :disabled="isRowBusy(team.id)" @click="openEditModal(team)">
                    수정
                  </BaseButton>
                  <BaseButton
                    variant="danger"
                    size="sm"
                    :disabled="team.dataOrigin !== 'MANUAL' || isRowBusy(team.id)"
                    :title="team.dataOrigin !== 'MANUAL' ? '수동 등록된 팀만 삭제할 수 있습니다.' : ''"
                    @click="deleteTeam(team, $event)"
                  >삭제</BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
      </table>
    </AdminTableCard>

    <BaseModal
      :model-value="Boolean(newTeam)"
      title="수동 팀 등록"
      size="lg"
      keyboard
      :close-disabled="creating"
      @update:model-value="newTeam = null"
    >
      <form v-if="newTeam" id="create-team-form" class="modal-form" @submit.prevent="createTeam">
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
              :disabled="creating"
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
            <BaseInput id="new-team-ko" v-model="newTeam.kName" maxlength="255" placeholder="예: 토트넘 홋스퍼" :disabled="creating" />
          </div>
          <div class="form-field">
            <label for="new-team-en">팀 영문명 <span>*</span></label>
            <BaseInput id="new-team-en" v-model="newTeam.eName" maxlength="255" placeholder="예: Tottenham Hotspur" :disabled="creating" />
          </div>
        </div>

        <div class="form-grid two-column">
          <div class="form-field">
            <label for="new-team-short">팀 숏네임 <span>*</span></label>
            <BaseInput id="new-team-short" v-model="newTeam.sName" placeholder="TOT" maxlength="12" :disabled="creating" />
          </div>
          <div class="form-field">
            <label for="new-team-sport">종목 <span>*</span></label>
            <BaseSelect id="new-team-sport" v-model="newTeam.sportId" :disabled="creating">
              <option disabled value="">종목 선택</option>
              <option v-for="sport in sportOptions" :key="sport.id" :value="sport.id">{{ sport.name }}</option>
            </BaseSelect>
          </div>
        </div>
        <TeamEmblemField v-model:file="newTeam.image" label="팀 이미지 (선택)" :disabled="creating" />
        <p v-if="newTeam.error" class="modal-error" role="alert">{{ newTeam.error }}</p>
      </form>

      <template #footer>
        <BaseButton variant="outline" size="md" :disabled="creating" @click="newTeam = null">취소</BaseButton>
        <BaseButton type="submit" form="create-team-form" variant="primary" size="md" :disabled="!isNewTeamValid || creating">
          {{ creating ? '등록 중' : '팀 등록' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      :model-value="Boolean(editTeam)"
      title="팀 정보 수정"
      size="lg"
      keyboard
      :close-disabled="saving"
      @update:model-value="editTeam = null"
    >
      <form v-if="selectedTeam" id="edit-team-form" class="modal-form" @submit.prevent="saveTeam">
        <div class="modal-grid">
          <div class="modal-field">
            <label class="modal-label" for="edit-team-id">팀 ID</label>
            <BaseInput id="edit-team-id" :model-value="String(selectedTeam.id)" readonly />
          </div>
          <div class="modal-field">
            <label class="modal-label" for="edit-team-sport">종목</label>
            <BaseInput id="edit-team-sport" :model-value="selectedTeamSport" readonly />
          </div>
          <div class="modal-field modal-field--wide">
            <label class="modal-label" for="edit-team-type">팀 타입</label>
            <BaseSelect id="edit-team-type" v-model="editTeam.teamType" :disabled="saving || !teamTypeOptions.length" autofocus>
              <option v-if="!selectedTeam.teamType" disabled value="">미지정</option>
              <option v-else-if="!teamTypeOptions.length" :value="selectedTeam.teamType">
                {{ getTeamTypeName(selectedTeam.teamType) }}
              </option>
              <option v-for="option in teamTypeOptions" :key="option.code" :value="option.code">{{ option.name }}</option>
            </BaseSelect>
          </div>
          <div class="modal-field">
            <label class="modal-label" for="edit-team-ko">팀 한글명</label>
            <BaseInput id="edit-team-ko" v-model="editTeam.kName" maxlength="255" :disabled="saving" />
          </div>
          <div class="modal-field">
            <label class="modal-label" for="edit-team-en">팀 영문명</label>
            <BaseInput id="edit-team-en" v-model="editTeam.eName" maxlength="255" :disabled="saving" />
          </div>
          <div class="modal-field">
            <label class="modal-label" for="edit-team-short">팀 숏네임</label>
            <BaseInput id="edit-team-short" v-model="editTeam.sName" maxlength="12" :disabled="saving" />
          </div>
          <div class="modal-field">
            <label class="modal-label" for="edit-team-country">국가코드</label>
            <BaseInput id="edit-team-country" v-model="editTeam.cc" maxlength="10" :disabled="saving" />
          </div>
        </div>
        <TeamEmblemField
          v-model:file="editTeam.image"
          v-model:remove-emblem="editTeam.removeEmblem"
          :current-image-url="selectedTeam.imageUrl"
          :disabled="saving"
        />
        <p v-if="editTeam.error" class="modal-error" role="alert">{{ editTeam.error }}</p>
      </form>

      <template #footer>
        <BaseButton variant="outline" :disabled="saving" @click="editTeam = null">취소</BaseButton>
        <BaseButton type="submit" form="edit-team-form" variant="primary" :disabled="saving || !hasTeamEdits">
          {{ saving ? '저장 중' : '저장' }}
        </BaseButton>
      </template>
    </BaseModal>

    <div v-if="toastMessage" class="toast" :class="toastType" role="status">
      <span>{{ toastType === 'error' ? '!' : '✓' }}</span>{{ toastMessage }}
    </div>
  </AdminListPage>
</template>

<script setup>
import { useAdminConfirm } from '@/composables/useAdminConfirm'
import { computed, onMounted, reactive, ref } from 'vue'
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
import AdminDataOriginBadge from '@/components/common/AdminDataOriginBadge.vue'
import TeamEmblemField from './TeamEmblemField.vue'
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
const loading = ref(false)
const creating = ref(false)
const saving = ref(false)
const rowBusyIds = ref(new Set())
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const totalElements = ref(0)
const listError = ref('')
const searchForm = reactive({ id: '', keyword: '' })
const appliedSearch = reactive({ id: '', keyword: '' })
const toastMessage = ref('')
const toastType = ref('success')
const newTeam = ref(null)
const editTeam = ref(null)
let toastTimer

const maxPage = computed(() => Math.max(1, totalPages.value))
const isNewTeamValid = computed(() => {
  const team = newTeam.value
  return Boolean(team && team.teamType && team.sportId && team.kName.trim() && team.eName.trim() && team.sName.trim())
})
const selectedTeam = computed(() => editTeam.value?.original)
const selectedTeamSport = computed(() => {
  const sportId = selectedTeam.value?.sportId
  if (sportId == null) return '미지정'
  return sportOptions.value.find((sport) => sport.id === sportId)?.name || `ID ${sportId}`
})
const updatePayload = computed(() => {
  const team = editTeam.value
  if (!team) return {}

  const before = team.original
  const payload = {}
  if (team.teamType !== before.teamType) payload.teamType = team.teamType
  if (team.kName !== before.kName) payload.kName = team.kName.trim()
  if (team.eName !== before.eName) payload.eName = team.eName.trim()
  if (team.sName !== before.sName) payload.sName = team.sName.trim().toUpperCase()
  if (team.cc !== before.cc) payload.cc = team.cc.trim()
  if (team.removeEmblem) payload.removeEmblem = true
  return payload
})
const hasTeamEdits = computed(() => Boolean(editTeam.value?.image) || Object.keys(updatePayload.value).length > 0)

onMounted(async () => {
  await Promise.allSettled([loadOptions(), fetchTeams()])
})

async function loadOptions() {
  try {
    const result = await getTeamAdminOptions()
    teamTypeOptions.value = Array.isArray(result?.teamTypes) ? result.teamTypes : []
    sportOptions.value = Array.isArray(result?.sports) ? result.sports : []
  } catch (error) {
    showToast(getErrorMessage(error, '팀 관리 옵션을 불러오지 못했습니다.'), 'error')
  }
}

function normalizeTeam(team) {
  return {
    ...team,
    teamType: team.teamType ?? '',
    kName: team.kName ?? team.kname ?? team.KName ?? '',
    eName: team.eName ?? team.ename ?? team.EName ?? '',
    sName: team.sName ?? team.sname ?? team.SName ?? '',
    imageUrl: team.imageUrl ?? '',
    cc: team.cc ?? '',
  }
}

function getTeamTypeName(teamType) {
  return teamTypeOptions.value.find((option) => option.code === teamType)?.name || teamType || '미지정'
}

async function searchTeams() {
  if (loading.value) return
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

    let result = await getAdminTeams(params)
    const lastPage = Math.max(1, Number(result?.totalPages ?? 1))
    if (params.page >= lastPage) {
      params.page = lastPage - 1
      result = await getAdminTeams(params)
    }
    teams.value = Array.isArray(result?.content) ? result.content.map(normalizeTeam) : []
    totalElements.value = Number(result?.totalElements ?? teams.value.length)
    totalPages.value = Math.max(1, Number(result?.totalPages ?? 1))
    page.value = Math.min(Math.max(1, Number(result?.number ?? params.page) + 1), totalPages.value)
  } catch (error) {
    teams.value = []
    totalElements.value = 0
    totalPages.value = 1
    listError.value = getErrorMessage(error, '팀 목록을 불러오지 못했습니다.')
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

function openEditModal(team) {
  editTeam.value = {
    original: team,
    teamType: team.teamType,
    kName: team.kName,
    eName: team.eName,
    sName: team.sName,
    cc: team.cc,
    image: null,
    removeEmblem: false,
    error: '',
  }
}

async function saveTeam() {
  if (saving.value || !hasTeamEdits.value) return

  const team = editTeam.value
  const payload = updatePayload.value
  const requiredTextFields = [
    ['kName', '팀 한글명'], ['eName', '팀 영문명'], ['sName', '팀 숏네임'],
  ]
  const invalid = requiredTextFields.find(([field]) => field in payload && !payload[field])
  if (invalid) {
    team.error = `${invalid[1]}은(는) 비워둘 수 없습니다.`
    return
  }

  saving.value = true
  team.error = ''
  try {
    await updateAdminTeam(team.original.id, payload, team.image)
    editTeam.value = null
    const teamName = team.kName.trim() || team.eName.trim()
    showToast(teamName ? `${teamName} 팀 정보를 저장했습니다.` : '팀 정보를 저장했습니다.')
    await fetchTeams()
  } catch (error) {
    team.error = getErrorMessage(error, '팀 정보를 저장하지 못했습니다.')
  } finally {
    saving.value = false
  }
}

const requestConfirmation = useAdminConfirm()

async function deleteTeam(team, event) {
  if (team.dataOrigin !== 'MANUAL') return
  if (!await requestConfirmation({
    title: '팀 삭제',
    message: `${team.kName || team.eName} 팀을 삭제하시겠습니까?`,
    confirmLabel: '삭제',
    confirmVariant: 'danger',
  }, event?.currentTarget)) return

  setIdBusy(rowBusyIds, team.id, true)
  try {
    await deleteAdminTeam(team.id)
    showToast(`${team.kName || team.eName} 팀을 삭제했습니다.`)
    if (teams.value.length === 1 && page.value > 1) page.value -= 1
    await fetchTeams()
  } catch (error) {
    showToast(getErrorMessage(error, '팀을 삭제하지 못했습니다.'), 'error')
  } finally {
    setIdBusy(rowBusyIds, team.id, false)
  }
}

function openCreateModal() {
  if (creating.value) return
  newTeam.value = {
    teamType: teamTypeOptions.value[0]?.code ?? '',
    sportId: sportOptions.value[0]?.id ?? '',
    kName: '',
    eName: '',
    sName: '',
    image: null,
    error: '',
  }
}

async function createTeam() {
  if (creating.value || !isNewTeamValid.value) return
  const team = newTeam.value
  creating.value = true
  team.error = ''
  try {
    const created = normalizeTeam(await createAdminTeam({
      sportId: Number(team.sportId),
      teamType: team.teamType,
      kName: team.kName.trim(),
      eName: team.eName.trim(),
      sName: team.sName.trim().toUpperCase(),
    }, team.image))
    newTeam.value = null
    showToast(`${created.kName || created.eName} 팀을 수동 팀으로 등록했습니다.`)
    await resetSearch()
  } catch (error) {
    team.error = getErrorMessage(error, '팀을 등록하지 못했습니다.')
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

function getErrorMessage(error, fallback) {
  return error?.response?.data?.error?.message || fallback
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
.team-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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
