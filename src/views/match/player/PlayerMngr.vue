
<template>
  <AdminListPage title="선수 관리">
    <!-- 선수 검색 -->
    <AdminFilterCard aria-label="선수 검색 조건">
      <!-- 종목 선택 -->
      <div class="field-group select-search">
        <label for="player-sport">종목</label>
        <BaseSelect
          id="player-sport"
          v-model="searchForm.sportId"
        >
          <option value="">전체 종목</option>
          <option
            v-for="sport in sportOptions"
            :key="sport.id"
            :value="String(sport.id)"
          >
            {{ sport.name }}
          </option>
        </BaseSelect>
      </div>

      <!-- 리그 선택 -->
      <div class="field-group select-search">
        <label for="player-league">리그</label>
        <BaseSelect
          id="player-league"
          v-model="searchForm.leagueId"
          :disabled="!searchForm.sportId || leagueOptionsLoading"
        >
          <option value="">
            {{ leagueOptionsLoading ? '리그 불러오는 중' : '전체 리그' }}
          </option>

          <option
            v-for="league in filteredLeagueOptions"
            :key="league.id"
            :value="String(league.id)"
          >
            {{ league.kName || league.eName || league.sName || '-' }}
          </option>
        </BaseSelect>
      </div>

      <!-- 선수 통합 검색 -->
      <div class="field-group keyword-search">
        <label for="player-keyword">선수 통합 검색</label>
        <BaseInput
          id="player-keyword"
          v-model="searchForm.playerKeyword"
          placeholder="선수명 / 선수 ID"
          @enter="searchPlayers"
        />
      </div>

      <!-- 팀 통합 검색 -->
      <div class="field-group keyword-search">
        <label for="team-keyword">팀 통합 검색</label>
        <BaseInput
          id="team-keyword"
          v-model="searchForm.teamKeyword"
          placeholder="팀명 / 팀 ID"
          @enter="searchPlayers"
        />
      </div>

      <template #actions>
        <BaseButton
          variant="secondary"
          size="md"
          :disabled="loading"
          @click="resetSearch"
        >
          초기화
        </BaseButton>

        <BaseButton
          variant="primary"
          size="md"
          :disabled="loading"
          @click="searchPlayers"
        >
          검색
        </BaseButton>
      </template>
    </AdminFilterCard>

    <!-- 선수 목록 -->
    <AdminTableCard
      scroll-label="선수 목록"
      table-min-width="1200px"
    >
      <template #summary>
        <strong>선수 목록</strong>
        <span>총 {{ totalElements }}명</span>
      </template>

      <template #toolbar-actions>
  <div class="player-toolbar">
    <BaseButton
      variant="primary"
      size="md"
      @click="openCreateModal"
    >
      선수 등록
    </BaseButton>

    <AdminTablePagination
      v-model:page-size="pageSize"
      :page-size-options="pageSizeOptions"
      :page="page"
      :total-pages="maxPage"
      :loading="loading"
      @change-page="changePage"
      @change-page-size="changePageSize"
    />
  </div>
</template>

      <table>
        <thead>
          <tr>
            <th>선수 ID</th>
            <th>Provider</th>
<th>API Player ID</th>
            <th>종목</th>
            <th>선수명</th>
            <th>영문 선수명</th>
            <th>국가</th>
            <th>팀 ID</th>
            <th>팀명</th>
            <th>태극전사</th>
            <th>팀 스쿼드</th>
            <th>삭제</th>
          </tr>
        </thead>

        <tbody>
          <AdminTableState
            v-if="loading"
            type="loading"
            :colspan="12"
            title="선수 목록을 불러오는 중입니다."
            compact
          />

          <AdminTableState
            v-else-if="listError"
            type="error"
            :colspan="12"
            :title="listError"
          />

          <AdminTableState
            v-else-if="playerRows.length === 0"
            :colspan="12"
            title="검색 결과가 없습니다."
            description="검색 조건을 다시 확인해 주세요."
          />

          <tr
            v-for="player in playerRows"
            v-else
            :key="`${player.id}-${player.team?.playerTeamDetailId ?? 'none'}`"
          >
            <td class="id-cell">
              {{ player.id }}
            </td>

            <td>
  {{ player.provider ?? '-' }}
</td>

<td>
  {{ player.apiPlayerId ?? '-' }}
</td>

            <td>
              {{ player.sportName || '-' }}
            </td>

            <td>
              <BaseInput
                v-model="nameDrafts[player.id].kName"
                placeholder="선수명 입력"
                :disabled="savingPlayerId === player.id"
                @enter="savePlayerName(player, 'kName')"
              />
            </td>

            <td>
              <BaseInput
    v-model="nameDrafts[player.id].eName"
    placeholder="영문 선수명 입력"
    :disabled="savingPlayerId === player.id"
    @enter="savePlayerName(player, 'eName')"
  />
            </td>

            <td>
              {{ player.cc || '-' }}
            </td>

            <!-- 팀 ID -->
            <td>
              {{ player.team?.teamId ?? '-' }}
            </td>

            <!-- 팀명 -->
            <td>
              {{ player.team?.teamName || '-' }}
            </td>

            <!-- 태극전사 여부 -->
            <td>
  <button
    type="button"
    class="status-button"
    :class="player.taegeuk ? 'active' : 'inactive'"
    :disabled="savingTaegeukId === player.id"
    :aria-pressed="player.taegeuk"
    @click="toggleTaegeuk(player)"
  >
    {{ player.taegeuk ? 'ON' : 'OFF' }}
  </button>
</td>

            <!-- 팀별 스쿼드 여부 -->
            <td>
  <button
    v-if="player.team?.playerTeamDetailId != null"
    type="button"
    class="status-button"
    :class="player.team.squadOn ? 'active' : 'inactive'"
    :disabled="savingSquadDetailId === player.team.playerTeamDetailId"
    :aria-pressed="player.team.squadOn"
    @click="toggleSquad(player.team)"
  >
    {{ player.team.squadOn ? 'ON' : 'OFF' }}
  </button>
  <span v-else>-</span>
</td>


<!-- 선수 팀 소속 삭제 -->
<td>
  <button
    v-if="player.team?.playerTeamDetailId != null"
    type="button"
    class="delete-button"
    :disabled="deletingDetailId !== null"
    @click="deletePlayerTeamDetail(player)"
  >
    {{ deletingDetailId === player.team.playerTeamDetailId
      ? '삭제 중...'
      : '삭제' }}
  </button>
  <span v-else>-</span>
</td>


          </tr>
        </tbody>
      </table>
    </AdminTableCard>

    
<!-- 선수 등록 모달 -->
<div
  v-if="createModalOpen"
  class="create-modal-backdrop"
  @click.self="closeCreateModal"
>
  <section
    class="create-modal"
    role="dialog"
    aria-modal="true"
    aria-label="선수 등록"
  >
    <h3>선수 등록</h3>

    <form @submit.prevent="submitCreatePlayer">

<div class="create-fields">

  <!-- 1줄: 종목 -->
  <label class="create-field--full">
    종목 *
    <select v-model="createForm.sportId" required>
      <option value="">종목 선택</option>
      <option
        v-for="sport in sportOptions"
        :key="sport.id"
        :value="String(sport.id)"
      >
        {{ sport.name }}
      </option>
    </select>
  </label>

  <!-- 2줄: 팀 ID -->
  <label class="create-field--full">
    팀 ID *
    <input
      v-model="createForm.teamId"
      type="number"
      min="1"
      placeholder="팀 ID 입력"
      required
    />
  </label>

  <!-- 3줄: Provider / API Player ID -->
  <label
    :class="{
      'create-field--full':
        !createForm.provider || createForm.provider === 'MANUAL'
    }"
  >
    Provider *
    <select v-model="createForm.provider" required>
      <option value="" disabled>Provider 선택</option>
      <option
        v-for="provider in providerOptions"
        :key="provider"
        :value="provider"
      >
        {{ provider }}
      </option>
    </select>
  </label>

  <label
    v-if="createForm.provider && createForm.provider !== 'MANUAL'"
  >
    API Player ID *
    <input
      v-model.trim="createForm.apiPlayerId"
      type="text"
      placeholder="API Player ID 입력"
      required
    />
  </label>

  <!-- 4줄: 선수명 / 영문 선수명 -->
  <label>
    선수명 *
    <input
      v-model="createForm.kName"
      placeholder="선수명 입력"
      required
    />
  </label>

  <label>
    영문 선수명 *
    <input
      v-model="createForm.eName"
      placeholder="영문 선수명 입력"
      required
    />
  </label>

  <!-- 5줄: 등번호 / 국가 -->
  <label>
    등번호
    <input
      v-model="createForm.shirtNumber"
      type="number"
      min="0"
      placeholder="등번호 입력"
    />
  </label>

  <label>
    국가
    <input
      v-model="createForm.cc"
      placeholder="KR"
      maxlength="2"
    />
  </label>

  <!-- 6줄: 생년월일 -->
  <div class="create-field--full create-birthdate">
    <span class="create-field-label">생년월일</span>

    <div class="create-birthdate-selects">
      <select
        v-model="createForm.birthYear"
        aria-label="출생 연도"
      >
        <option value="">년</option>
        <option
          v-for="year in birthYears"
          :key="year"
          :value="String(year)"
        >
          {{ year }}년
        </option>
      </select>

      <select
        v-model="createForm.birthMonth"
        aria-label="출생 월"
      >
        <option value="">월</option>
        <option
          v-for="month in 12"
          :key="month"
          :value="String(month)"
        >
          {{ month }}월
        </option>
      </select>

      <select
        v-model="createForm.birthDay"
        aria-label="출생 일"
        :disabled="!createForm.birthYear || !createForm.birthMonth"
      >
        <option value="">일</option>
        <option
          v-for="day in birthDays"
          :key="day"
          :value="String(day)"
        >
          {{ day }}일
        </option>
      </select>
    </div>
  </div>

  <!-- 7줄: 신장 -->
  <label class="create-field--full">
    신장 (cm)
    <input
      v-model="createForm.height"
      type="number"
      min="1"
      placeholder="신장 입력"
    />
  </label>

</div>


      <div class="create-actions">
        <button
          type="button"
          :disabled="createSaving"
          @click="closeCreateModal"
        >
          취소
        </button>

        <button type="submit" :disabled="createSaving">
          {{ createSaving ? '등록 중...' : '등록' }}
        </button>
      </div>
    </form>
  </section>
</div>


    <!-- 알림 메시지 -->
    <div
      v-if="toastMessage"
      class="toast"
      :class="toastType"
      role="status"
    >
      <span>
        {{ toastType === 'error' ? '!' : '✓' }}
      </span>
      {{ toastMessage }}
    </div>
  </AdminListPage>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'

import AdminListPage from '@/components/admin/AdminListPage.vue'
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'

import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'

import { getAdminPlayers, updateAdminPlayer, updateAdminPlayerSquad, createAdminPlayer, getPlayerProviders, deleteAdminPlayerTeamDetail } from '@/api/player'
import { getTeamAdminOptions } from '@/api/team'
import { getAdminLeagues } from '@/api/league'

// 선수 목록
const players = ref([])
const createModalOpen = ref(false)
const createSaving = ref(false)

const createForm = reactive({
  sportId: '',
  provider: '',
  apiPlayerId: '',
  teamId: '',
  kName: '',
  eName: '',
  cc: '',
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  height: '',
  shirtNumber: '',
})

const birthdate = computed(() => {
  const { birthYear, birthMonth, birthDay } = createForm

  if (!birthYear || !birthMonth || !birthDay) {
    return null
  }

  const month = String(birthMonth).padStart(2, '0')
  const day = String(birthDay).padStart(2, '0')

  return `${birthYear}-${month}-${day}`
})

// 출생 연도: 현재 연도부터 1900년까지
const birthYears = Array.from(
  { length: new Date().getFullYear() - 1899 },
  (_, i) => new Date().getFullYear() - i
)

// 선택한 년도와 월에 맞는 일수 계산
const birthDays = computed(() => {
  const year = Number(createForm.birthYear)
  const month = Number(createForm.birthMonth)

  if (!year || !month) return []

  const lastDay = new Date(year, month, 0).getDate()

  return Array.from(
    { length: lastDay },
    (_, i) => i + 1
  )
})

// 년도 또는 월 변경 시 유효하지 않은 날짜 초기화
watch(
  () => [createForm.birthYear, createForm.birthMonth],
  () => {
    if (
      createForm.birthDay &&
      Number(createForm.birthDay) > birthDays.value.length
    ) {
      createForm.birthDay = ''
    }
  }
)

watch(
  () => createForm.provider,
  () => {
    createForm.apiPlayerId = ''
  }
)

function openCreateModal() {
  Object.keys(createForm).forEach((key) => {
    createForm[key] = ''
  })
  createModalOpen.value = true
}

function closeCreateModal() {
  if (createSaving.value) return
  createModalOpen.value = false
}

async function submitCreatePlayer() {
  if (createSaving.value) return

  const birthParts = [
  createForm.birthYear,
  createForm.birthMonth,
  createForm.birthDay
]

if (
  birthParts.some(Boolean) &&
  !birthParts.every(Boolean)
) {
  showToast(
    '생년월일은 년, 월, 일을 모두 선택해 주세요.',
    'error'
  )
  return
}

  createSaving.value = true

  try {
    const optionalNumber = (value) =>
      value === '' ? null : Number(value)

    await createAdminPlayer({
      provider: createForm.provider,
apiPlayerId: createForm.provider === 'MANUAL'
  ? null
  : createForm.apiPlayerId.trim(),


      sportId: Number(createForm.sportId),
      teamId: Number(createForm.teamId),
      kName: createForm.kName.trim(),
      eName: createForm.eName.trim(),
      cc: createForm.cc.trim().toUpperCase() || null,
      birthdate: birthdate.value,
      height: optionalNumber(createForm.height),
      shirtNumber: createForm.shirtNumber.trim() || null,
    })

    createModalOpen.value = false
    page.value = 1
    await fetchPlayers()
    showToast('선수가 등록되었습니다.')
  } catch (error) {
    console.error('선수 등록 실패', error)
    showToast(
      error?.response?.data?.error?.message ||
        '선수 등록에 실패했습니다.',
      'error'
    )
  } finally {
    createSaving.value = false
  }
}
const savingTaegeukId = ref(null)
const savingSquadDetailId = ref(null)
const deletingDetailId = ref(null)


// 검색 옵션
const providerOptions = ref([])
const sportOptions = ref([])
const leagueOptions = ref([])
const leagueOptionsLoading = ref(false)

// 로딩 및 오류
const loading = ref(false)
const listError = ref('')

// 페이지네이션
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const totalElements = ref(0)
const pageSizeOptions = [10, 20, 50]

// 알림 메시지
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer

// 검색 조건
const searchForm = reactive({
  sportId: '',
  leagueId: '',
  playerKeyword: '',
  teamKeyword: '',
})

// 실제 검색에 적용된 조건
const appliedSearch = reactive({ ...searchForm })

// 선수명 입력값 관리
const nameDrafts = reactive({})

// 저장 중인 선수 ID
const savingPlayerId = ref(null)

// Enter 입력 시 선수명 저장
async function savePlayerName(player, field) {
  if (savingPlayerId.value !== null) return

  const draft = nameDrafts[player.id]
  if (!draft || !['kName', 'eName'].includes(field)) return

  const originalValue = player[field] ?? ''
  const newValue = draft[field].trim()

  // 변경된 값이 없다면 저장하지 않음
  if (originalValue === newValue) return

  savingPlayerId.value = player.id

  try {
    await updateAdminPlayer(player.id, {
      [field]: newValue,
    })

    // 동일 선수가 여러 팀에 소속되어 있어도 이름 일괄 반영
    players.value = players.value.map((item) =>
      item.id === player.id
        ? { ...item, [field]: newValue }
        : item
    )

    draft[field] = newValue

    showToast('저장되었습니다.')
  } catch (error) {
    console.error('선수명 저장 실패', error)

    // 실패하면 기존 값으로 복구
    draft[field] = originalValue

    showToast(
      error?.response?.data?.error?.message ||
        '저장에 실패했습니다.',
      'error'
    )
  } finally {
    savingPlayerId.value = null
  }
}

// 선택한 종목에 해당하는 리그만 표시
const filteredLeagueOptions = computed(() => {
  if (!searchForm.sportId) {
    return []
  }

  return leagueOptions.value.filter(
    (league) =>
      String(league.sportId) === String(searchForm.sportId)
  )
})

// 종목이 변경되면 기존 리그 선택 초기화
watch(
  () => searchForm.sportId,
  () => {
    searchForm.leagueId = ''
  }
)

// 최대 페이지
const maxPage = computed(() =>
  Math.max(1, totalPages.value)
)

// 한 선수의 소속 팀마다 별도의 행 생성
const playerRows = computed(() =>
  players.value.flatMap((player) => {
    if (!player.teams?.length) {
      return [
        {
          ...player,
          team: null,
        },
      ]
    }

    return player.teams.map((team) => ({
      ...player,
      team,
    }))
  })
)

// 최초 화면 진입
onMounted(async () => {
  await Promise.allSettled([
    loadPlayerProviders(),
    loadOptions(),
    loadLeagueOptions(),
    fetchPlayers(),
  ])
})


async function loadPlayerProviders() {
  try {
    const result = await getPlayerProviders()

    providerOptions.value = Array.isArray(result)
      ? result
      : []
  } catch (error) {
    console.error('Provider 목록 조회 실패', error)
    showToast('Provider 목록을 불러오지 못했습니다.', 'error')
  }
}


// 종목 옵션 조회
async function loadOptions() {
  try {
    const result = await getTeamAdminOptions()

    sportOptions.value = Array.isArray(result?.sports)
      ? result.sports
      : []
  } catch (error) {
    console.error('종목 옵션 조회 실패', error)

    showToast(
      '종목 옵션을 불러오지 못했습니다.',
      'error'
    )
  }
}

// 리그 목록 조회
async function loadLeagueOptions() {
  leagueOptionsLoading.value = true

  try {
    const result = await getAdminLeagues()

    leagueOptions.value = Array.isArray(result)
      ? result
      : []
  } catch (error) {
    console.error('리그 목록 조회 실패', error)

    leagueOptions.value = []

    showToast(
      '리그 목록을 불러오지 못했습니다.',
      'error'
    )
  } finally {
    leagueOptionsLoading.value = false
  }
}

// 선수 검색
async function searchPlayers() {
  Object.assign(appliedSearch, {
    sportId: searchForm.sportId,
    leagueId: searchForm.leagueId,
    playerKeyword: searchForm.playerKeyword.trim(),
    teamKeyword: searchForm.teamKeyword.trim(),
  })

  page.value = 1

  await fetchPlayers()
}

// 검색 초기화
async function resetSearch() {
  Object.keys(searchForm).forEach((key) => {
    searchForm[key] = ''
    appliedSearch[key] = ''
  })

  page.value = 1

  await fetchPlayers()
}

// 선수 목록 조회
async function fetchPlayers() {
  loading.value = true
  listError.value = ''

  try {
    const params = {
      page: page.value - 1,
      size: Number(pageSize.value),
    }

    if (appliedSearch.sportId) {
      params.sportId = Number(appliedSearch.sportId)
    }

    if (appliedSearch.leagueId) {
      params.leagueId = Number(appliedSearch.leagueId)
    }

    if (appliedSearch.playerKeyword) {
      params.playerKeyword = appliedSearch.playerKeyword
    }

    if (appliedSearch.teamKeyword) {
      params.teamKeyword = appliedSearch.teamKeyword
    }

    const result = await getAdminPlayers(params)

const content = Array.isArray(result?.content)
  ? result.content
  : []

// 조회된 선수의 기존 이름으로 입력값 설정
Object.keys(nameDrafts).forEach((id) => {
  delete nameDrafts[id]
})

content.forEach((player) => {
  nameDrafts[player.id] = {
    kName: player.kName ?? '',
    eName: player.eName ?? '',
  }
})

players.value = content

    totalElements.value = Number(
      result?.totalElements ?? players.value.length
    )

    totalPages.value = Math.max(
      1,
      Number(result?.totalPages ?? 1)
    )

    page.value = Math.min(
      Math.max(
        1,
        Number(result?.number ?? page.value - 1) + 1
      ),
      totalPages.value
    )
  } catch (error) {
    console.error('선수 목록 조회 실패', error)

    players.value = []
    totalElements.value = 0
    totalPages.value = 1

    listError.value =
      error?.response?.data?.error?.message ||
      '선수 목록을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

// 페이지 변경
async function changePage(nextPage) {
  if (
    nextPage < 1 ||
    nextPage > maxPage.value ||
    nextPage === page.value
  ) {
    return
  }

  page.value = nextPage

  await fetchPlayers()
}

// 페이지 크기 변경
async function changePageSize() {
  page.value = 1

  await fetchPlayers()
}


async function toggleTaegeuk(player) {
  if (savingTaegeukId.value !== null) return

  const nextValue = !player.taegeuk
  savingTaegeukId.value = player.id

  try {
    await updateAdminPlayer(player.id, {
      taegeuk: nextValue,
    })

    players.value = players.value.map((item) =>
      item.id === player.id
        ? { ...item, taegeuk: nextValue }
        : item
    )

    showToast('저장되었습니다.')
  } catch (error) {
    console.error('태극전사 상태 변경 실패', error)
    showToast(
      error?.response?.data?.error?.message ||
        '태극전사 상태 변경에 실패했습니다.',
      'error'
    )
  } finally {
    savingTaegeukId.value = null
  }
}

async function toggleSquad(team) {
  const detailId = team?.playerTeamDetailId

  if (detailId == null || savingSquadDetailId.value !== null) return

  const nextValue = !team.squadOn
  savingSquadDetailId.value = detailId

  try {
    await updateAdminPlayerSquad(detailId, {
      squadOn: nextValue,
    })

    players.value = players.value.map((player) => ({
      ...player,
      teams: player.teams?.map((item) =>
        item.playerTeamDetailId === detailId
          ? { ...item, squadOn: nextValue }
          : item
      ) ?? [],
    }))

    showToast('저장되었습니다.')
  } catch (error) {
    console.error('팀 스쿼드 상태 변경 실패', error)
    showToast(
      error?.response?.data?.error?.message ||
        '팀 스쿼드 상태 변경에 실패했습니다.',
      'error'
    )
  } finally {
    savingSquadDetailId.value = null
  }
}


// 선수 팀 소속 정보 삭제
async function deletePlayerTeamDetail(player) {
  const detailId = player.team?.playerTeamDetailId

  if (detailId == null || deletingDetailId.value !== null) return

  const confirmed = window.confirm(
    `${player.kName || player.eName} 선수의 ${player.team.teamName} 팀 소속 정보를 삭제하시겠습니까?`
  )

  if (!confirmed) return

  deletingDetailId.value = detailId

  try {
    await deleteAdminPlayerTeamDetail(detailId)

    await fetchPlayers()
    showToast('팀 소속 정보가 삭제되었습니다.')
  } catch (error) {
    console.error('팀 소속 정보 삭제 실패', error)

    showToast(
      error?.response?.data?.error?.message ||
        '팀 소속 정보 삭제에 실패했습니다.',
      'error'
    )
  } finally {
    deletingDetailId.value = null
  }
}



// 알림 메시지
function showToast(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type

  window.clearTimeout(toastTimer)

  toastTimer = window.setTimeout(() => {
    toastMessage.value = ''
  }, 3200)
}
</script>

<style scoped>
.select-search {
  width: 160px;
}

.keyword-search {
  width: 240px;
}

.active {
  color: #15803d;
  font-weight: 700;
}

.inactive {
  color: #94a3b8;
  font-weight: 600;
}


.status-button {
  min-width: 44px;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.status-button:hover:not(:disabled) {
  background: #f1f5f9;
}

.status-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}


.player-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.create-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.create-modal {
  width: 100%;
  max-width: 620px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.create-modal h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
}

.create-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.create-fields label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}

.create-fields input,
.create-fields select {
  width: 100%;
  min-width: 0;
  padding: 9px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: white;
  color: #0f172a;
}

.create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.create-actions button {
  padding: 9px 18px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
}

.create-actions button[type="submit"] {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.create-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .create-fields {
    grid-template-columns: 1fr;
  }
}


/* 삭제 컬럼 */
th:nth-child(12) {
  width: 90px;
}

/* 팀 소속 삭제 버튼 */
.delete-button {
  padding: 6px 12px;
  border: 1px solid #ef4444;
  border-radius: 6px;
  background: white;
  color: #dc2626;
  cursor: pointer;
}

.delete-button:hover:not(:disabled) {
  background: #fef2f2;
}

.delete-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 한 줄 전체 너비 */
.create-field--full {
  grid-column: 1 / -1;
}

/* 생년월일 영역 */
.create-birthdate {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.create-field-label {
  font-size: 14px;
  font-weight: 600;
}

/* 년 / 월 / 일 3열 */
.create-birthdate-selects {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.create-birthdate-selects select {
  width: 100%;
  min-width: 0;
}

.create-birthdate-selects select:disabled {
  background: #f8fafc;
  color: #94a3b8;
  cursor: not-allowed;
}


/* 선수 목록 컬럼 너비 */
th:nth-child(1) { width: 90px; }   /* 선수 ID */
th:nth-child(2) { width: 70px; }  /* Provider */
th:nth-child(3) { width: 100px; }  /* API Player ID */
th:nth-child(4) { width: 70px; }  /* 종목 */
th:nth-child(5) { width: 150px; }  /* 선수명 */
th:nth-child(6) { width: 150px; }  /* 영문 선수명 */
th:nth-child(7) { width: 70px; }   /* 국가 */
th:nth-child(8) { width: 70px; }  /* 팀 ID */
th:nth-child(9) { width: 100px; }  /* 팀명 */
th:nth-child(10) { width: 70px; } /* 태극전사 */
th:nth-child(11) { width: 100px; } /* 팀 스쿼드 */

</style>
