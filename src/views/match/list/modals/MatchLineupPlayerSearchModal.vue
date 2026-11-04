
<template>
  <BaseModal
    v-model="visible"
    :title="`${teamName} 선수 추가`"
    size="xl"
    :close-disabled="busy"
  >
    <div class="player-search-modal">
      <!-- 검색 영역 -->
      <form class="search-area" @submit.prevent="searchPlayers">
        <div class="team-name">
          선수 검색
        </div>

        <input
          id="lineup-player-keyword"
          v-model="keyword"
          type="text"
          placeholder="한글 또는 영문 선수명 입력"
          :disabled="busy"
        />

        <div class="search-actions">
          <button
            type="submit"
            class="search-btn"
            :disabled="busy"
          >
            Search
          </button>

          <button
            type="button"
            class="reset-btn"
            :disabled="busy"
            @click="resetSearch"
          >
            초기화
          </button>
        </div>
      </form>

      <!-- 선수 검색 결과 -->
      <div class="table-container">
        <table class="player-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Provider</th>
              <th>API Player ID</th>
              <th>선수명</th>
              <th>영문선수명</th>
              <th>포지션</th>
              <th>팀명</th>
              <th>등번호</th>
              <th>선택</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="empty-row">
                선수를 불러오는 중입니다.
              </td>
            </tr>

            <tr v-else-if="loadError">
              <td colspan="9" class="empty-row error">
                {{ loadError }}
              </td>
            </tr>

            <tr v-else-if="players.length === 0">
              <td colspan="9" class="empty-row">
                조회된 선수가 없습니다.
              </td>
            </tr>

            <template v-else>
              <tr
                v-for="(player, index) in players"
                :key="`${player.playerId}-${player.teamId}-${index}`"
              >
                <td>{{ player.playerId ?? '-' }}</td>
                <td>{{ player.provider ?? '-' }}</td>
                <td>{{ player.apiPlayerId ?? '-' }}</td>

                <td>{{ player.kName || '-' }}</td>
                <td>{{ player.eName || '-' }}</td>

                <td>
                  <span
                    v-if="player.position"
                    class="position-badge"
                    :class="positionClass(player.position)"
                  >
                    {{ player.position }}
                  </span>
                  <span v-else>-</span>
                </td>

                <td>{{ player.teamName || '-' }}</td>
                <td>{{ player.shirtNumber ?? '-' }}</td>

                <td>
                  <button
                    type="button"
                    class="select-btn"
                    :class="{ selected: player.selected }"
                    :disabled="
                      busy ||
                      player.playerId == null ||
                      !canToggle(player)
                    "
                    :title="getButtonTitle(player)"
                    @click="togglePlayer(player)"
                  >
                    {{
                      updatingId === player.playerId
                        ? '처리 중'
                        : player.selected
                          ? '해제'
                          : '선택'
                    }}
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <p v-if="feedback" class="feedback success">
        {{ feedback }}
      </p>

      <p v-if="actionError" class="feedback error">
        {{ actionError }}
      </p>
    </div>

    <template #footer>
      <div class="footer-actions">
        <button
          type="button"
          class="close-btn"
          :disabled="busy"
          @click="visible = false"
        >
          닫기
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

import {
  getMatchLineupPlayerCandidates,
  searchMatchLineupPlayers,
  addMatchLineupPlayer,
  removeMatchLineupPlayer,
} from '@/api/match'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  matchId: {
    type: [String, Number],
    default: null,
  },
  teamId: {
    type: [String, Number],
    default: null,
  },
  teamName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:modelValue',
  'changed',
])

const visible = computed({
  get: () => props.modelValue,
  set: value => {
    if (!value && busy.value) return
    emit('update:modelValue', value)
  },
})

// 검색 상태
const keyword = ref('')
const appliedKeyword = ref('')
const players = ref([])

// 로딩 상태
const loading = ref(false)
const updating = ref(false)
const updatingId = ref(null)

const busy = computed(
  () => loading.value || updating.value
)

// 메시지
const loadError = ref('')
const actionError = ref('')
const feedback = ref('')

let requestVersion = 0

// API 응답 배열 추출
function extractPlayers(result) {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.content)) return result.content
  if (Array.isArray(result?.players)) return result.players

  throw new Error('선수 목록 응답 형식이 올바르지 않습니다.')
}

// 응답 데이터 정규화
function normalizePlayer(player) {
  return {
    ...player,
    playerId: player.playerId ?? player.id ?? null,
    kName: player.kName ?? player.kname ?? '',
    eName: player.eName ?? player.ename ?? '',
    selected: player.selected === true,
  }
}

// 포지션 스타일
function positionClass(position) {
  const classes = {
    GK: 'position-gk',
    DF: 'position-df',
    MF: 'position-mf',
    FW: 'position-fw',
    ST: 'position-fw',
  }

  return classes[position] || ''
}

// 현재 백엔드는 대상 팀 소속 선수만 등록 허용
function canToggle(player) {
  if (player.selected) return true

  return String(player.teamId) === String(props.teamId)
}

function getButtonTitle(player) {
  if (!canToggle(player)) {
    return '현재 팀 소속 선수만 등록할 수 있습니다.'
  }

  return player.selected
    ? '라인업에서 제외'
    : '라인업에 등록'
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  )
}

// 선수 목록 조회
async function loadPlayers() {
  const version = ++requestVersion

  loading.value = true
  loadError.value = ''

  try {
    let result

    if (appliedKeyword.value) {
      // 선수명 검색
      result = await searchMatchLineupPlayers(
        props.matchId,
        props.teamId,
        appliedKeyword.value
      )
    } else {
      // 모달 최초 진입 시 해당 팀 선수 목록
      result = await getMatchLineupPlayerCandidates(
        props.matchId,
        props.teamId
      )
    }

    if (version !== requestVersion) return

    players.value = extractPlayers(result).map(normalizePlayer)
  } catch (error) {
    if (version !== requestVersion) return

    console.error('라인업 선수 조회 실패', error)
    players.value = []

    loadError.value = getErrorMessage(
      error,
      '선수 목록 조회에 실패했습니다.'
    )
  } finally {
    if (version === requestVersion) {
      loading.value = false
    }
  }
}

// 검색 버튼
async function searchPlayers() {
  if (busy.value) return

  appliedKeyword.value = keyword.value.trim()
  actionError.value = ''
  feedback.value = ''

  await loadPlayers()
}

// 초기화 버튼
async function resetSearch() {
  if (busy.value) return

  keyword.value = ''
  appliedKeyword.value = ''
  actionError.value = ''
  feedback.value = ''

  await loadPlayers()
}

// 선택 / 해제
async function togglePlayer(player) {
  if (busy.value) return

  const playerId = player.playerId

  if (playerId == null) {
    actionError.value = '선수 ID가 없습니다.'
    return
  }

  if (!canToggle(player)) {
    actionError.value =
      '해당 팀 소속 선수만 등록할 수 있습니다.'
    return
  }

  const wasSelected = player.selected

  updating.value = true
  updatingId.value = playerId
  actionError.value = ''
  feedback.value = ''

  try {
    if (wasSelected) {
      // 선택 해제: MongoDB 라인업에서 제거
      await removeMatchLineupPlayer(
        props.matchId,
        props.teamId,
        playerId
      )
    } else {
      // 선택: MongoDB 라인업에 선수 등록
      const numericPlayerId = Number(playerId)

      if (!Number.isSafeInteger(numericPlayerId)) {
        throw new Error('올바르지 않은 선수 ID입니다.')
      }

      await addMatchLineupPlayer(
        props.matchId,
        props.teamId,
        {
          playerId: numericPlayerId,
          role: 'STARTER',
        }
      )
    }

    player.selected = !wasSelected

    feedback.value = wasSelected
      ? '선수 선택이 해제되었습니다.'
      : '선수가 등록되었습니다.'

    // 메인 라인업 갱신 요청
    emit('changed')

    // DB의 최신 선택 상태 다시 조회
    await loadPlayers()
  } catch (error) {
    console.error('라인업 선수 선택 변경 실패', error)

    actionError.value = getErrorMessage(
      error,
      '선수 선택 변경에 실패했습니다.'
    )
  } finally {
    updating.value = false
    updatingId.value = null
  }
}

// 모달이 열릴 때 최초 조회
watch(
  () => [
    props.modelValue,
    props.matchId,
    props.teamId,
  ],
  ([opened, matchId, teamId]) => {
    if (!opened || matchId == null || teamId == null) {
      requestVersion++
      return
    }

    keyword.value = ''
    appliedKeyword.value = ''
    players.value = []
    feedback.value = ''
    actionError.value = ''

    loadPlayers()
  },
  { immediate: true }
)
</script>

<style scoped>
.player-search-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  color: #333;
  font-size: 12px;
}

/* 검색 영역 */
.search-area {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.team-name {
  font-size: 13px;
  font-weight: 800;
}

.search-area label {
  font-size: 11px;
  font-weight: 700;
}

.search-area input {
  box-sizing: border-box;
  width: 100%;
  height: 33px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
}

.search-actions {
  display: flex;
  gap: 6px;
}

.search-actions button {
  height: 27px;
  padding: 0 13px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.search-btn {
  background: #374151;
  color: white;
}

.reset-btn {
  background: #fff;
  color: #333;
}

/* 테이블 */
.table-container {
  width: 100%;
  max-height: 52vh;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
}

.player-table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 11px;
}

.player-table th,
.player-table td {
  padding: 9px 7px;
  border: 1px solid #e5e7eb;
  text-align: center;
  white-space: nowrap;
}

.player-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #f3f4f6;
  font-weight: 800;
}

.player-table tbody tr:hover {
  background: #f9fafb;
}

.empty-row {
  padding: 36px 10px !important;
  color: #888;
}

.empty-row.error {
  color: #dc2626;
}

/* 포지션 */
.position-badge {
  display: inline-block;
  min-width: 24px;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
}

.position-gk {
  background: #fff7ed;
  color: #d97706;
}

.position-df {
  background: #f0fdf4;
  color: #16a34a;
}

.position-mf {
  background: #eff6ff;
  color: #2563eb;
}

.position-fw {
  background: #fef2f2;
  color: #dc2626;
}

/* 선택 / 해제 */
.select-btn {
  min-width: 50px;
  padding: 6px 10px;
  border: 0;
  border-radius: 14px;
  background: #e5e7eb;
  color: #333;
  font-size: 11px;
  cursor: pointer;
}

.select-btn.selected {
  background: #fee2e2;
  color: #dc2626;
}

.select-btn:hover:not(:disabled) {
  filter: brightness(.95);
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

.result-info {
  color: #777;
  font-size: 11px;
  text-align: right;
}

.feedback {
  margin: 0;
  font-size: 11px;
}

.feedback.success {
  color: #15803d;
}

.feedback.error {
  color: #dc2626;
}

/* 하단 */
.footer-actions {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.close-btn {
  padding: 7px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 11px;
  cursor: pointer;
}

/* 컬럼별 너비 */
.player-table th:nth-child(1) { width: 6%; }  /* ID */
.player-table th:nth-child(2) { width: 9%; }  /* Provider */
.player-table th:nth-child(3) { width: 13%; } /* API Player ID */
.player-table th:nth-child(4) { width: 8%; }  /* 선수명 */
.player-table th:nth-child(5) { width: 19%; } /* 영문선수명 */
.player-table th:nth-child(6) { width: 11%; } /* 포지션 */
.player-table th:nth-child(7) { width: 12%; } /* 팀명 */
.player-table th:nth-child(8) { width: 9%; }  /* 등번호 */
.player-table th:nth-child(9) { width: 13%; } /* 선택 */

/* 긴 텍스트 말줄임 */
.player-table th,
.player-table td {
  padding: 9px 5px;
  border: 1px solid #e5e7eb;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
