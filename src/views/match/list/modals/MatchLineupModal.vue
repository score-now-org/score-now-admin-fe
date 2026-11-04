
<template>
  <BaseModal
    v-model="visible"
    title="경기 라인업 관리"
    size="xl"
    :close-disabled="saving"
  >
    <div class="lineup-manager">
      <!-- 로딩 -->
      <div v-if="loading" class="lineup-state">
        라인업을 불러오는 중입니다.
      </div>

      <!-- 조회 오류 -->
      <div v-else-if="loadError" class="lineup-state error">
        {{ loadError }}
      </div>

      <!-- 라인업 없음 -->
      <div v-else-if="!draft" class="lineup-state">
        등록된 라인업이 없습니다.
      </div>

      <!-- 라인업 화면 -->
      <div v-else class="lineup-scroll">
        <div class="lineup-columns">
          <section
            v-for="team in teams"
            :key="team.key"
            class="lineup-team"
          >
            <!-- HOME / AWAY -->
            <h3 class="team-name">
              {{ team.label }}({{ team.name }})
            </h3>

            <!-- 팀 설정 -->
            <div class="team-toolbar">
              <button
                type="button"
                class="add-player-btn"
                :disabled="saving || team.side.teamId == null"
                @click="openPlayerSearch(team)"
              >
                선수추가
              </button>

              <span class="formation-label">
                포메이션
              </span>

              <input
                v-model="team.side.formation"
                class="formation-input"
                :disabled="saving"
                :aria-label="`${team.name} 포메이션`"
              />

              <select
                v-model="team.side.uniformColor"
                class="uniform-select"
                :disabled="saving"
                :aria-label="`${team.name} 유니폼 색상`"
              >
                <option value="">색상선택</option>

                <option
                  v-if="
                    team.side.uniformColor &&
                    !colorOptions.some(
                      item => item.value === team.side.uniformColor
                    )
                  "
                  :value="team.side.uniformColor"
                >
                  {{ team.side.uniformColor }}
                </option>

                <option
                  v-for="color in colorOptions"
                  :key="color.value"
                  :value="color.value"
                >
                  {{ color.label }}
                </option>
              </select>

              <button
                type="button"
                class="uniform-save-btn"
                :disabled="saving || !hasColorChange(team.key)"
                @click="saveUniformColor(team.key)"
              >
                유니폼변경
              </button>
            </div>

            <!-- 선발 / 후보 선수 -->
            <div
              v-for="section in lineupSections"
              :key="section.key"
              class="lineup-section"
            >
              <!-- 구분 제목 -->
              <div class="section-header">
                <span>{{ section.label }}</span>

                <span class="player-count">
                  {{ getPlayers(team.side, section.key).length }}명
                </span>
              </div>

              <!-- 선수 목록 -->
              <div class="player-list">
                <div
                  v-for="(player, index) in getPlayers(team.side, section.key)"
                  :key="`${section.key}-${player.playerId ?? index}`"
                  class="player-row"
                >
                  <!-- 포지션 -->
                  <select
                    v-model="player.position"
                    class="position-select"
                    :disabled="saving || player.playerId == null"
                    :aria-label="`${team.name} 선수 포지션`"
                  >
                    <option value="">선택</option>

                    <option
                      v-if="
                        player.position &&
                        !positionOptions.includes(player.position)
                      "
                      :value="player.position"
                    >
                      {{ player.position }}
                    </option>

                    <option
                      v-for="position in positionOptions"
                      :key="position"
                      :value="position"
                    >
                      {{ position }}
                    </option>
                  </select>

                  <!-- 등번호 -->
                  <input
                    v-model="player.shirtNumber"
                    type="text"
                    class="shirt-input"
                    placeholder="등번호"
                    maxlength="3"
                    :disabled="saving || player.playerId == null"
                    :aria-label="`${team.name} 선수 등번호`"
                  />

                  <!-- 선수 이름 (수정 불가) -->
                  <input
                    :value="player.kName || player.eName || '-'"
                    type="text"
                    class="player-name-input"
                    placeholder="선수이름"
                    readonly
                    :title="player.kName || player.eName || ''"
                  />

                  <!-- 득점 -->
                  <select
                    v-model.number="player.goals"
                    class="goals-select"
                    :disabled="saving || player.playerId == null"
                    :aria-label="`${team.name} 선수 득점`"
                  >
                    <option
                      v-if="player.goals > 30"
                      :value="player.goals"
                    >
                      {{ player.goals }}
                    </option>

                    <option
                      v-for="goal in goalOptions"
                      :key="goal"
                      :value="goal"
                    >
                      {{ goal }}
                    </option>
                  </select>
                </div>

                <div
                  v-if="getPlayers(team.side, section.key).length === 0"
                  class="empty-players"
                >
                  등록된 선수가 없습니다.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- 저장 결과 -->
      <p v-if="notice" class="save-message">
        {{ notice }}
      </p>

      <p v-if="saveError" class="save-message error">
        {{ saveError }}
      </p>
    </div>

    <!-- 하단 버튼 -->
    <template #footer>
      <div class="lineup-footer">
        <span class="footer-notice">
          ※ 유니폼변경 시 유니폼변경 버튼을 클릭해주세요.
        </span>

        <div class="footer-buttons">
          <button
            type="button"
            class="footer-btn save-btn"
            :disabled="saving || !hasPlayerChanges"
            @click="savePlayerChanges"
          >
            {{ saving ? '저장 중...' : '저장' }}
          </button>

          <button
            type="button"
            class="footer-btn formation-btn"
            :disabled="saving || !hasFormationChanges"
            @click="saveFormations"
          >
            포메이션 수정
          </button>

          <button
            type="button"
            class="footer-btn close-btn"
            :disabled="saving"
            @click="visible = false"
          >
            닫기
          </button>
        </div>
      </div>
    </template>
  </BaseModal>

  <MatchLineupPlayerSearchModal
  v-if="playerSearchModal.visible"
  v-model="playerSearchModal.visible"
  :match-id="match?.id"
  :team-id="playerSearchModal.teamId"
  :team-name="playerSearchModal.teamName"
  @changed="handlePlayerSearchChanged"
/>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

import {
  getMatchLineup,
  updateMatchLineupTeam,
  updateMatchLineupPlayer,
} from '@/api/match'

import MatchLineupPlayerSearchModal from './MatchLineupPlayerSearchModal.vue'

const playerSearchModal = ref({
  visible: false,
  teamId: null,
  teamName: '',
})

function openPlayerSearch(team) {
  if (hasUnsavedChanges.value) {
    window.alert('먼저 수정 중인 라인업 정보를 저장해주세요.')
    return
  }

  playerSearchModal.value = {
    visible: true,
    teamId: team.side.teamId,
    teamName: team.name,
  }
}

async function handlePlayerSearchChanged() {
  if (props.match?.id == null) return

  await loadLineup(props.match.id)
}

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  match: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

// 모달 열기 / 닫기
const visible = computed({
  get: () => props.modelValue,
  set: value => {
    if (!value && saving.value) return

    if (!value && hasUnsavedChanges.value) {
      const confirmed = window.confirm(
        '저장하지 않은 수정사항이 있습니다. 닫으시겠습니까?'
      )
      if (!confirmed) return
    }

    emit('update:modelValue', value)
  },
})

// 상태
const draft = ref(null)
const original = ref(null)

const loading = ref(false)
const saving = ref(false)

const loadError = ref('')
const saveError = ref('')
const notice = ref('')

let requestVersion = 0

// 선수 영역
const lineupSections = [
  {
    key: 'startingLineup',
    label: '선발 선수',
  },
  {
    key: 'substitutes',
    label: '후보 선수',
  },
]

// 포지션 (SUB 제외)
const positionOptions = [
  'GK',
  'DF',
  'MF',
  'FW',
  'ST',
]

// 득점
const goalOptions = Array.from(
  { length: 31 },
  (_, index) => index
)

// 유니폼 색상
const colorOptions = [
  { label: '빨간색', value: '#ef4444' },
  { label: '파란색', value: '#2563eb' },
  { label: '흰색', value: '#ffffff' },
  { label: '검은색', value: '#111827' },
  { label: '노란색', value: '#eab308' },
  { label: '초록색', value: '#16a34a' },
  { label: '주황색', value: '#f97316' },
  { label: '보라색', value: '#9333ea' },
]

// HOME / AWAY
const teams = computed(() => {
  if (!draft.value) return []

  return [
    {
      key: 'home',
      label: 'HOME',
      side: draft.value.home,
      name:
        props.match?.homeTeam?.name ||
        draft.value.home?.teamEname ||
        '홈팀',
    },
    {
      key: 'away',
      label: 'AWAY',
      side: draft.value.away,
      name:
        props.match?.awayTeam?.name ||
        draft.value.away?.teamEname ||
        '원정팀',
    },
  ].filter(team => team.side)
})

// 선수 배열
function getPlayers(side, sectionKey) {
  return Array.isArray(side?.[sectionKey])
    ? side[sectionKey]
    : []
}

// 깊은 복사
function deepCopy(value) {
  return JSON.parse(JSON.stringify(value))
}

// 조회 데이터 정규화
function normalizeLineup(data) {
  const result = deepCopy(data)

  for (const sideKey of ['home', 'away']) {
    const side = result[sideKey]
    if (!side) continue

    side.formation ??= ''
    side.uniformColor ??= ''

    for (const section of lineupSections) {
      side[section.key] = getPlayers(
        side,
        section.key
      ).map(player => ({
        ...player,
        eName: player.eName ?? player.ename ?? '',
        kName: player.kName ?? player.kname ?? '',
        position: player.position ?? '',
        shirtNumber: player.shirtNumber ?? '',
        goals: Number(player.goals ?? 0),
      }))
    }
  }

  return result
}

// 라인업 조회
async function loadLineup(matchId) {
  const currentVersion = ++requestVersion

  loading.value = true
  draft.value = null
  original.value = null

  loadError.value = ''
  saveError.value = ''
  notice.value = ''

  try {
    const result = await getMatchLineup(matchId)

    if (currentVersion !== requestVersion) return

    if (!result?.home && !result?.away) {
      loadError.value = '등록된 라인업이 없습니다.'
      return
    }

    draft.value = normalizeLineup(result)
    original.value = deepCopy(draft.value)
  } catch (error) {
    if (currentVersion !== requestVersion) return

    console.error('라인업 조회 실패', error)

    loadError.value =
      error?.response?.status === 404
        ? '등록된 라인업이 없습니다.'
        : '라인업 조회에 실패했습니다.'
  } finally {
    if (currentVersion === requestVersion) {
      loading.value = false
    }
  }
}

// 모달 열면 조회
watch(
  () => [props.modelValue, props.match?.id],
  ([opened, matchId]) => {
    if (!opened || matchId == null) {
      requestVersion++
      return
    }

    loadLineup(matchId)
  },
  { immediate: true }
)

// 유니폼 변경 여부
function hasColorChange(sideKey) {
  return (
    draft.value?.[sideKey]?.uniformColor !==
    original.value?.[sideKey]?.uniformColor
  )
}

// 포메이션 변경 여부
const hasFormationChanges = computed(() => {
  if (!draft.value || !original.value) return false

  return ['home', 'away'].some(sideKey => {
    return (
      draft.value?.[sideKey]?.formation !==
      original.value?.[sideKey]?.formation
    )
  })
})

// 선수 정보 변경 내역
const playerChanges = computed(() => {
  if (!draft.value || !original.value) return []

  const changes = []

  for (const sideKey of ['home', 'away']) {
    const side = draft.value[sideKey]
    const oldSide = original.value[sideKey]

    if (!side || !oldSide) continue

    for (const section of lineupSections) {
      const currentPlayers = getPlayers(
        side,
        section.key
      )

      const oldPlayers = getPlayers(
        oldSide,
        section.key
      )

      currentPlayers.forEach((player, index) => {
        const oldPlayer = oldPlayers[index]

        if (!oldPlayer) return

        const changed =
          player.position !== oldPlayer.position ||
          player.shirtNumber !== oldPlayer.shirtNumber ||
          Number(player.goals) !== Number(oldPlayer.goals)

        if (!changed) return

        changes.push({
          sideKey,
          sectionKey: section.key,
          index,
          teamId: side.teamId,
          playerId: player.playerId,
          position: player.position,
          shirtNumber: player.shirtNumber,
          goals: Number(player.goals),
        })
      })
    }
  }

  return changes
})

// 선수 정보 수정 여부
const hasPlayerChanges = computed(
  () => playerChanges.value.length > 0
)

// 미저장 변경사항 여부
const hasUnsavedChanges = computed(() => {
  return (
    hasPlayerChanges.value ||
    hasFormationChanges.value ||
    ['home', 'away'].some(hasColorChange)
  )
})

// API 에러 메시지
function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.message ||
    fallback
  )
}

// 유니폼 색상 저장
async function saveUniformColor(sideKey) {
  const side = draft.value?.[sideKey]
  const oldSide = original.value?.[sideKey]

  if (!side || !oldSide || !hasColorChange(sideKey)) return

  if (side.teamId == null) {
    saveError.value = '팀 ID가 없어 수정할 수 없습니다.'
    return
  }

  saving.value = true
  saveError.value = ''
  notice.value = ''

  try {
    await updateMatchLineupTeam(
      props.match.id,
      side.teamId,
      {
        // 미저장 포메이션은 함께 저장하지 않음
        formation: oldSide.formation,
        uniformColor: side.uniformColor || null,
      }
    )

    oldSide.uniformColor = side.uniformColor

    notice.value = '유니폼 색상이 저장되었습니다.'
  } catch (error) {
    console.error('유니폼 변경 실패', error)

    saveError.value = getErrorMessage(
      error,
      '유니폼 변경에 실패했습니다.'
    )
  } finally {
    saving.value = false
  }
}

// 포메이션 저장
async function saveFormations() {
  if (!hasFormationChanges.value) return

  saving.value = true
  saveError.value = ''
  notice.value = ''

  try {
    for (const sideKey of ['home', 'away']) {
      const side = draft.value?.[sideKey]
      const oldSide = original.value?.[sideKey]

      if (!side || !oldSide) continue

      if (side.formation === oldSide.formation) {
        continue
      }

      if (side.teamId == null) {
        throw new Error(`${sideKey} 팀 ID가 없습니다.`)
      }

      await updateMatchLineupTeam(
        props.match.id,
        side.teamId,
        {
          formation: side.formation,
          // 미저장 색상은 함께 저장하지 않음
          uniformColor: oldSide.uniformColor || null,
        }
      )

      oldSide.formation = side.formation
    }

    notice.value = '포메이션이 저장되었습니다.'
  } catch (error) {
    console.error('포메이션 수정 실패', error)

    saveError.value = getErrorMessage(
      error,
      '포메이션 수정에 실패했습니다. 일부 팀만 저장되었을 수 있습니다.'
    )
  } finally {
    saving.value = false
  }
}

// 선수 포지션 / 등번호 / 득점 저장
async function savePlayerChanges() {
  if (!hasPlayerChanges.value) return

  saving.value = true
  saveError.value = ''
  notice.value = ''

  try {
    const changes = [...playerChanges.value]

    for (const change of changes) {
      if (change.playerId == null) {
        throw new Error(
          '선수 ID가 없는 선수는 수정할 수 없습니다.'
        )
      }

      await updateMatchLineupPlayer(
        props.match.id,
        change.teamId,
        change.playerId,
        {
          position: change.position,
          shirtNumber: change.shirtNumber,
          goals: change.goals,
        }
      )

      // 저장된 항목만 원본 상태 갱신
      const savedPlayer =
        original.value[change.sideKey]
          [change.sectionKey]
          [change.index]

      if (savedPlayer) {
        savedPlayer.position = change.position
        savedPlayer.shirtNumber = change.shirtNumber
        savedPlayer.goals = change.goals
      }
    }

    notice.value = '선수 정보가 저장되었습니다.'
  } catch (error) {
    console.error('선수 정보 저장 실패', error)

    saveError.value = getErrorMessage(
      error,
      '선수 정보 저장에 실패했습니다. 일부 항목만 저장되었을 수 있습니다.'
    )
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>

/* 선수 검색 + 라인업 관리 모달 좌우 배치 */
@media (min-width: 1200px) {

  /* 선수 검색이 열리면 라인업 관리 모달을 오른쪽으로 이동 */
  :global(
    body:has(.player-search-modal)
    > .base-modal-overlay:has(.lineup-manager)
  ) {
    justify-content: flex-end;
    padding-inline: 16px;
  }

  /* 오른쪽 라인업 관리 모달 너비 */
  :global(
    body:has(.player-search-modal)
    > .base-modal-overlay:has(.lineup-manager)
    > .base-modal-box
  ) {
    width: min(880px, calc(50vw - 24px));
  }

  /* 왼쪽 선수 검색 모달 */
  :global(
    body > .base-modal-overlay:has(.player-search-modal)
  ) {
    z-index: 1001;
    justify-content: flex-start;
    padding-inline: 16px;
    background: transparent;
    pointer-events: none;
  }

  /* 왼쪽 선수 검색 모달 너비 및 클릭 허용 */
  :global(
    body > .base-modal-overlay:has(.player-search-modal)
    > .base-modal-box
  ) {
    width: min(920px, calc(50vw - 24px));
    pointer-events: auto;
  }
}

/* 전체 */
.lineup-manager {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  color: #333;
  font-size: 12px;
}

/* 스크롤 */
.lineup-scroll {
  max-height: 65vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px 4px 10px 0;
}

/* HOME / AWAY */
.lineup-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.lineup-team {
  min-width: 0;
}

/* 팀명 */
.team-name {
  margin: 0 0 10px;
  padding-bottom: 7px;
  border-bottom: 1px solid #ddd;
  font-size: 13px;
  font-weight: 800;
}

/* 팀 설정 */
.team-toolbar {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 12px;
  white-space: nowrap;
}

.add-player-btn {
  flex-shrink: 0;
  padding: 5px 7px;
  border: 0;
  border-radius: 3px;
  background: #50ad62;
  color: white;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.formation-label {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
}

.formation-input {
  width: 58px;
  min-width: 0;
  padding: 3px 0;
  border: 0;
  outline: none;
  background: transparent;
  color: #ef4444;
  font-size: 11px;
  font-weight: 800;
  text-align: center;
}

.formation-input:focus {
  outline: 1px solid #93c5fd;
}

.uniform-select {
  width: 78px;
  height: 25px;
  padding: 0 3px;
  border: 1px solid #ccc;
  border-radius: 3px;
  background: #eee;
  color: #444;
  font-size: 10px;
}

.uniform-save-btn {
  flex-shrink: 0;
  height: 25px;
  padding: 0 8px;
  border: 0;
  border-radius: 3px;
  background: #333;
  color: white;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

/* 선발 / 후보 영역 */
.lineup-section {
  margin-bottom: 17px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 7px 9px;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  background: #f3f4f6;
  font-size: 11px;
  font-weight: 800;
}

.player-count {
  color: #666;
  font-size: 10px;
  font-weight: 500;
}

/* 선수 행 */
.player-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.player-row {
  display: grid;
  grid-template-columns:
    54px
    45px
    minmax(70px, 1fr)
    47px;
  gap: 4px;
  align-items: center;
}

.player-row input,
.player-row select {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 25px;
  padding: 0 4px;
  border: 1px solid #d1d5db;
  border-radius: 2px;
  background: white;
  color: #333;
  font-size: 11px;
  font-family: inherit;
}

.player-row input:focus,
.player-row select:focus {
  border-color: #3b82f6;
  outline: 1px solid #93c5fd;
}

.shirt-input {
  text-align: center;
}

.player-row .player-name-input {
  padding: 0 5px;
  background: #eee;
  text-overflow: ellipsis;
}

.goals-select {
  text-align: center;
}

.empty-players {
  padding: 12px 6px;
  color: #999;
  text-align: center;
  font-size: 11px;
}

/* 하단 버튼 */
.lineup-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 10px;
}

.footer-notice {
  color: #ef4444;
  font-size: 10px;
  white-space: nowrap;
}

.footer-buttons {
  display: flex;
  gap: 5px;
}

.footer-btn {
  min-width: 92px;
  height: 29px;
  padding: 0 10px;
  border: 0;
  border-radius: 3px;
  color: white;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.save-btn {
  background: #0065d8;
}

.formation-btn,
.close-btn {
  background: #333;
}

button:disabled {
  opacity: .5;
  cursor: not-allowed;
}

/* 메시지 */
.save-message {
  margin: 8px 0 0;
  color: #15803d;
  font-size: 11px;
}

.save-message.error,
.lineup-state.error {
  color: #dc2626;
}

.lineup-state {
  padding: 55px 12px;
  color: #64748b;
  text-align: center;
}

/* 작은 화면 */
@media (max-width: 640px) {
  .lineup-columns {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .team-toolbar {
    flex-wrap: wrap;
  }

  .lineup-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .footer-notice {
    white-space: normal;
  }

  .footer-buttons {
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>
