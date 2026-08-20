<template>
  <div class="admin-page">
    <header class="page-header">
      <div>
        <div class="title-row">
          <h1>팀 관리</h1>
          <span class="mock-badge">화면 데모</span>
        </div>
      </div>
      <BaseButton variant="primary" size="md" class="primary-action" @click="openCreateModal">
        + 팀 등록
      </BaseButton>
    </header>

    <section class="filter-card" aria-label="팀 검색 조건">
      <div class="field-group id-search">
        <label for="team-id">팀 ID</label>
        <BaseInput id="team-id" v-model="searchForm.id" placeholder="팀 ID 입력" @enter="searchTeams" />
      </div>
      <div class="field-group name-search">
        <label for="team-name">팀명 (한글/영문)</label>
        <BaseInput id="team-name" v-model="searchForm.name" placeholder="예: 토트넘, Tottenham" @enter="searchTeams" />
      </div>
      <div class="filter-actions">
        <BaseButton variant="secondary" size="md" @click="resetSearch">초기화</BaseButton>
        <BaseButton variant="primary" size="md" @click="searchTeams">검색</BaseButton>
      </div>
    </section>

    <section class="table-card">
      <div class="table-toolbar">
        <div>
          <strong>검색 결과</strong>
          <span>총 {{ filteredTeams.length }}건</span>
        </div>
      </div>

      <div class="table-scroll">
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
            <tr v-if="filteredTeams.length === 0">
              <td colspan="9" class="empty-state">
                <span class="empty-icon">○</span>
                <strong>검색 결과가 없습니다.</strong>
                <small>팀 ID 또는 팀명을 다시 확인해 주세요.</small>
              </td>
            </tr>
            <tr v-for="team in filteredTeams" :key="team.id" :class="{ dirty: isDirty(team) }">
              <td class="id-cell">{{ team.id }}</td>
              <td>
                <select v-model="team.type" class="row-control type-control" :aria-label="`${team.id} 팀 타입`">
                  <option value="club">클럽</option>
                  <option value="national">국가대표</option>
                </select>
              </td>
              <td><input v-model="team.nameKo" class="row-control" :aria-label="`${team.id} 팀 한글명`" /></td>
              <td><input v-model="team.nameEn" class="row-control" :aria-label="`${team.id} 팀 영문명`" /></td>
              <td><input v-model="team.shortName" class="row-control short-control" :aria-label="`${team.id} 팀 숏네임`" /></td>
              <td>
                <div class="image-editor">
                  <div class="team-avatar" :style="avatarStyle(team)">
                    <img v-if="team.imageUrl" :src="team.imageUrl" :alt="`${team.nameKo} 이미지`" />
                    <span v-else>{{ avatarText(team) }}</span>
                  </div>
                  <label class="upload-link">
                    변경
                    <input type="file" accept="image/*" @change="changeTeamImage($event, team)" />
                  </label>
                </div>
              </td>
              <td>
                <select v-model="team.countryCode" class="row-control country-control" :aria-label="`${team.id} 국가코드`">
                  <option v-for="country in countryOptions" :key="country.code" :value="country.code">
                    {{ country.code }}
                  </option>
                </select>
              </td>
              <td>
                <span class="origin-badge" :class="team.origin">
                  {{ team.origin === 'manual' ? '수동' : 'API 연동' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <BaseButton variant="primary" size="sm" :disabled="!isDirty(team)" @click="saveTeam(team)">저장</BaseButton>
                  <BaseButton variant="danger" size="sm" @click="deleteTeam(team)">삭제</BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal v-model="createModalOpen" title="수동 팀 등록" width="660px">
      <div class="modal-intro">
        <span class="manual-icon">M</span>
        <div>
          <strong>수동 팀으로 등록됩니다.</strong>
        </div>
      </div>

      <form class="team-form" @submit.prevent="createTeam">
        <div class="form-field">
          <label for="new-team-type">팀 타입 <span>*</span></label>
          <div id="new-team-type" class="type-radio-grid" role="radiogroup" aria-label="팀 타입">
            <button
              v-for="option in teamTypeOptions"
              :key="option.value"
              type="button"
              role="radio"
              :aria-checked="newTeam.type === option.value"
              :class="{ selected: newTeam.type === option.value }"
              @click="newTeam.type = option.value"
            >
              <span class="radio-dot"><span></span></span>
              <span><strong>{{ option.label }}</strong></span>
            </button>
          </div>
        </div>

        <div class="form-grid two-column">
          <div class="form-field">
            <label for="new-team-ko">팀 한글명 <span>*</span></label>
            <input id="new-team-ko" v-model="newTeam.nameKo" class="form-control" placeholder="예: 토트넘 홋스퍼" />
          </div>
          <div class="form-field">
            <label for="new-team-en">팀 영문명 <span>*</span></label>
            <input id="new-team-en" v-model="newTeam.nameEn" class="form-control" placeholder="예: Tottenham Hotspur" />
          </div>
        </div>

        <div class="form-grid three-column">
          <div class="form-field">
            <label for="new-team-short">팀 숏네임 <span>*</span></label>
            <input id="new-team-short" v-model="newTeam.shortName" class="form-control" placeholder="TOT" maxlength="12" />
          </div>
          <div class="form-field">
            <label for="new-team-sport">종목 <span>*</span></label>
            <select id="new-team-sport" v-model="newTeam.sport" class="form-control">
              <option value="soccer">축구</option>
              <option value="baseball">야구</option>
              <option value="basketball">농구</option>
            </select>
          </div>
          <div class="form-field">
            <label for="new-team-country">국가코드 <span>*</span></label>
            <select id="new-team-country" v-model="newTeam.countryCode" class="form-control">
              <option v-for="country in countryOptions" :key="country.code" :value="country.code">
                {{ country.name }} ({{ country.code }})
              </option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label>팀 이미지 <span>*</span></label>
          <label class="image-dropzone" :class="{ filled: newTeam.imageUrl }">
            <div v-if="newTeam.imageUrl" class="upload-preview">
              <img :src="newTeam.imageUrl" alt="업로드 이미지 미리보기" />
              <div><strong>{{ newTeam.imageName }}</strong><small>클릭하여 다른 이미지 선택</small></div>
            </div>
            <div v-else class="upload-placeholder">
              <span>＋</span>
              <div><strong>이미지 파일을 선택해 주세요</strong><small>PNG, JPG 권장 · 최대 5MB</small></div>
            </div>
            <input type="file" accept="image/*" @change="selectNewTeamImage" />
          </label>
        </div>
      </form>

      <template #footer>
        <BaseButton variant="outline" size="md" @click="createModalOpen = false">취소</BaseButton>
        <BaseButton variant="primary" size="md" :disabled="!isNewTeamValid" @click="createTeam">팀 등록</BaseButton>
      </template>
    </BaseModal>

    <div v-if="toastMessage" class="toast" role="status"><span>✓</span>{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const countryOptions = [
  { code: 'KR', name: '대한민국' },
  { code: 'GB', name: '영국' },
  { code: 'ES', name: '스페인' },
  { code: 'DE', name: '독일' },
  { code: 'FR', name: '프랑스' },
  { code: 'IT', name: '이탈리아' },
  { code: 'US', name: '미국' },
  { code: 'JP', name: '일본' },
]

const teamTypeOptions = [
  { value: 'club', label: '클럽' },
  { value: 'national', label: '국가대표' },
]

const initialTeams = [
  { id: 21041, type: 'club', nameKo: '토트넘 홋스퍼', nameEn: 'Tottenham Hotspur', shortName: 'TOT', sport: 'soccer', countryCode: 'GB', origin: 'external', color: '#193b78', imageUrl: '' },
  { id: 21042, type: 'club', nameKo: '맨체스터 시티', nameEn: 'Manchester City', shortName: 'MCI', sport: 'soccer', countryCode: 'GB', origin: 'external', color: '#6caedf', imageUrl: '' },
  { id: 31018, type: 'club', nameKo: 'LG 트윈스', nameEn: 'LG Twins', shortName: 'LG', sport: 'baseball', countryCode: 'KR', origin: 'external', color: '#b01935', imageUrl: '' },
  { id: 31022, type: 'club', nameKo: '한화 이글스', nameEn: 'Hanwha Eagles', shortName: 'HAN', sport: 'baseball', countryCode: 'KR', origin: 'external', color: '#e86621', imageUrl: '' },
  { id: 41008, type: 'national', nameKo: '대한민국 축구 국가대표팀', nameEn: 'Korea Republic', shortName: 'KOR', sport: 'soccer', countryCode: 'KR', origin: 'manual', color: '#d8394c', imageUrl: '' },
  { id: 21054, type: 'club', nameKo: 'FC 바르셀로나', nameEn: 'FC Barcelona', shortName: 'BAR', sport: 'soccer', countryCode: 'ES', origin: 'external', color: '#293a93', imageUrl: '' },
]

const teams = ref(initialTeams.map((team) => ({ ...team })))
const savedSnapshots = ref(Object.fromEntries(initialTeams.map((team) => [team.id, serializeTeam(team)])))
const searchForm = reactive({ id: '', name: '' })
const appliedSearch = reactive({ id: '', name: '' })
const createModalOpen = ref(false)
const toastMessage = ref('')
let toastTimer

const newTeam = reactive(emptyNewTeam())

const filteredTeams = computed(() => teams.value.filter((team) => {
  const idMatches = !appliedSearch.id || String(team.id).includes(appliedSearch.id.trim())
  const keyword = appliedSearch.name.trim().toLowerCase()
  const nameMatches = !keyword || [team.nameKo, team.nameEn, team.shortName].some((name) => name.toLowerCase().includes(keyword))
  return idMatches && nameMatches
}))

const isNewTeamValid = computed(() => Boolean(
  newTeam.type && newTeam.nameKo.trim() && newTeam.nameEn.trim()
  && newTeam.shortName.trim() && newTeam.sport && newTeam.countryCode && newTeam.imageUrl,
))

function emptyNewTeam() {
  return { type: 'club', nameKo: '', nameEn: '', shortName: '', sport: 'soccer', countryCode: 'KR', imageUrl: '', imageName: '' }
}

function serializeTeam(team) {
  return JSON.stringify({
    type: team.type,
    nameKo: team.nameKo,
    nameEn: team.nameEn,
    shortName: team.shortName,
    countryCode: team.countryCode,
    imageUrl: team.imageUrl,
  })
}

function isDirty(team) {
  return savedSnapshots.value[team.id] !== serializeTeam(team)
}

function avatarText(team) {
  return (team.shortName || team.nameEn || team.nameKo || '?').slice(0, 3).toUpperCase()
}

function avatarStyle(team) {
  return { '--team-color': team.color || '#2768dd' }
}

function searchTeams() {
  appliedSearch.id = searchForm.id
  appliedSearch.name = searchForm.name
}

function resetSearch() {
  searchForm.id = ''
  searchForm.name = ''
  searchTeams()
}

function changeTeamImage(event, team) {
  const file = event.target.files?.[0]
  if (!file) return
  team.imageUrl = URL.createObjectURL(file)
}

function saveTeam(team) {
  savedSnapshots.value[team.id] = serializeTeam(team)
  showToast(`${team.nameKo} 팀 정보를 저장했습니다.`)
}

function deleteTeam(team) {
  teams.value = teams.value.filter((item) => item.id !== team.id)
  delete savedSnapshots.value[team.id]
  showToast(`${team.nameKo} 팀을 삭제했습니다.`)
}

function openCreateModal() {
  Object.assign(newTeam, emptyNewTeam())
  createModalOpen.value = true
}

function selectNewTeamImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  newTeam.imageUrl = URL.createObjectURL(file)
  newTeam.imageName = file.name
}

function createTeam() {
  if (!isNewTeamValid.value) return
  const created = {
    id: Math.max(...teams.value.map((team) => team.id)) + 1,
    type: newTeam.type,
    nameKo: newTeam.nameKo.trim(),
    nameEn: newTeam.nameEn.trim(),
    shortName: newTeam.shortName.trim().toUpperCase(),
    sport: newTeam.sport,
    countryCode: newTeam.countryCode,
    origin: 'manual',
    color: '#2768dd',
    imageUrl: newTeam.imageUrl,
  }
  teams.value.unshift(created)
  savedSnapshots.value[created.id] = serializeTeam(created)
  createModalOpen.value = false
  resetSearch()
  showToast(`${created.nameKo} 팀을 수동 팀으로 등록했습니다.`)
}

function showToast(message) {
  toastMessage.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastMessage.value = '' }, 2600)
}
</script>

<style scoped>
.admin-page { min-width: 1120px; padding: var(--admin-page-padding); color: var(--admin-color-text-body); }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--admin-page-header-gap); margin-bottom: var(--admin-page-header-margin-bottom); }
.title-row { display: flex; align-items: center; gap: 10px; }
.page-header h1 { margin: 0; font-size: var(--admin-font-size-page-title); line-height: 1.35; letter-spacing: -.04em; color: var(--admin-color-text-title); }
.mock-badge { padding: 3px 8px; border-radius: 999px; background: #eff5ff; color: #2768dd; font-size: 10px; font-weight: 700; }
.primary-action { min-width: 92px; height: 34px; box-shadow: 0 4px 10px rgba(28, 103, 255, .18); }

.filter-card { display: flex; align-items: flex-end; gap: var(--admin-filter-gap); padding: var(--admin-card-padding); margin-bottom: var(--admin-section-margin-bottom); background: var(--admin-color-surface); border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); }
.field-group { display: flex; flex-direction: column; gap: var(--admin-field-gap); }
.field-group label { color: var(--admin-color-text-label); font-size: var(--admin-font-size-label); font-weight: 700; }
.id-search { width: 160px; }
.name-search { width: 310px; }
.filter-actions { display: flex; gap: var(--admin-action-gap); margin-left: auto; }

.table-card { overflow: hidden; background: var(--admin-color-surface); border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 var(--admin-card-padding); border-bottom: 1px solid var(--admin-color-divider); }
.table-toolbar > div { display: flex; align-items: center; gap: 10px; }
.table-toolbar strong { font-size: 13px; }
.table-toolbar span { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-label); }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 1120px; border-collapse: collapse; table-layout: fixed; }
th { height: 39px; padding: 0 8px; border-bottom: 1px solid var(--admin-color-table-heading-border); color: var(--admin-color-text-table-heading); background: var(--admin-color-table-heading-surface); font-size: var(--admin-font-size-table-heading); font-weight: 700; text-align: left; white-space: nowrap; }
td { height: 66px; padding: 8px; border-bottom: 1px solid var(--admin-color-table-row-border); color: var(--admin-color-text-table-body); font-size: var(--admin-font-size-table-body); vertical-align: middle; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover:not(:has(.empty-state)) { background: var(--admin-color-table-row-hover); }
tbody tr.dirty { background: #fffdf5; }
tbody tr.dirty:hover { background: #fffaf0; }
th:nth-child(1) { width: 76px; } th:nth-child(2) { width: 95px; } th:nth-child(3) { width: 155px; }
th:nth-child(4) { width: 178px; } th:nth-child(5) { width: 90px; } th:nth-child(6) { width: 100px; }
th:nth-child(7) { width: 78px; } th:nth-child(8) { width: 86px; } th:nth-child(9) { width: 126px; }
.id-cell { color: #2e3b52; font-weight: 700; font-variant-numeric: tabular-nums; }
.row-control { width: 100%; height: 31px; padding: 0 8px; border: 1px solid transparent; border-radius: 5px; outline: none; color: #303b50; background: transparent; font: inherit; font-size: 11px; }
.row-control:hover { border-color: #e1e6ed; background: #fff; }
.row-control:focus { border-color: #1c67ff; background: #fff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .08); }
select.row-control { cursor: pointer; }
.type-control { color: #30405b; font-weight: 600; }
.short-control { text-transform: uppercase; }
.country-control { font-weight: 700; }
.image-editor { display: flex; align-items: center; gap: 8px; }
.team-avatar { display: grid; place-items: center; overflow: hidden; width: 34px; height: 34px; border: 1px solid color-mix(in srgb, var(--team-color) 50%, #fff); border-radius: 50%; color: #fff; background: var(--team-color); box-shadow: inset 0 0 0 3px rgba(255, 255, 255, .14); font-size: 8px; font-weight: 900; letter-spacing: -.02em; }
.team-avatar img { width: 100%; height: 100%; object-fit: cover; }
.upload-link { color: #2768dd; font-size: 10px; font-weight: 700; cursor: pointer; }
.upload-link input, .image-dropzone input { display: none; }
.origin-badge { display: inline-flex; align-items: center; padding: 5px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; }
.origin-badge.manual { color: #8b5e14; background: #fff5d9; }
.origin-badge.external { color: #3972c5; background: #edf4ff; }
.action-buttons { display: flex; gap: 5px; }
.empty-state { height: 230px; text-align: center; }
.empty-state > * { display: block; margin: auto; }
.empty-state .empty-icon { margin-bottom: 9px; color: var(--admin-color-info-border); font-size: 24px; }
.empty-state strong { color: var(--admin-color-text-empty-title); font-size: var(--admin-font-size-description); }
.empty-state small { margin-top: 5px; color: var(--admin-color-text-empty-description); font-size: var(--admin-font-size-table-heading); }

.modal-intro { display: flex; align-items: center; gap: 11px; padding: 12px 13px; margin-bottom: 18px; border: 1px solid #dce8fb; border-radius: 8px; background: #f5f9ff; }
.manual-icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 7px; color: #fff; background: #3975d2; font-size: 10px; font-weight: 900; }
.modal-intro strong { display: block; margin-bottom: 3px; color: #315f9e; font-size: 11px; }
.team-form { display: flex; flex-direction: column; gap: 16px; }
.form-grid { display: grid; gap: 12px; }
.two-column { grid-template-columns: 1fr 1fr; }
.three-column { grid-template-columns: .85fr .9fr 1.25fr; }
.form-field { display: flex; flex-direction: column; gap: var(--admin-field-gap); }
.form-field > label { color: var(--admin-color-text-label); font-size: var(--admin-font-size-table-heading); font-weight: 700; }
.form-field > label span { color: #e14d4d; }
.form-control { width: 100%; height: 36px; padding: 0 10px; border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); outline: none; color: var(--admin-color-text-control); background: var(--admin-color-surface-subtle); font: inherit; font-size: var(--admin-font-size-label); }
.form-control:focus { border-color: var(--admin-color-primary); background: var(--admin-color-surface); box-shadow: var(--admin-focus-ring); }
.type-radio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.type-radio-grid button { display: flex; align-items: center; gap: 10px; min-height: 58px; padding: 10px 12px; border: 1px solid #dde3eb; border-radius: 7px; text-align: left; background: #fff; cursor: pointer; }
.type-radio-grid button.selected { border-color: #4281ec; background: #f6f9ff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .07); }
.radio-dot { display: grid; place-items: center; width: 16px; height: 16px; border: 1px solid #c5ccd8; border-radius: 50%; }
.selected .radio-dot { border-color: #1c67ff; }
.selected .radio-dot span { width: 8px; height: 8px; border-radius: 50%; background: #1c67ff; }
.type-radio-grid strong { display: block; color: #334057; font-size: 11px; }
.image-dropzone { display: block; padding: 13px; border: 1px dashed #c9d2df; border-radius: 7px; background: #fafbfd; cursor: pointer; }
.image-dropzone:hover { border-color: #1c67ff; background: #f8fbff; }
.upload-placeholder, .upload-preview { display: flex; align-items: center; justify-content: center; gap: 11px; min-height: 44px; }
.upload-placeholder > span { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; color: #6287c3; background: #eaf2ff; font-size: 18px; }
.upload-preview img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
.upload-placeholder strong, .upload-placeholder small, .upload-preview strong, .upload-preview small { display: block; }
.upload-placeholder strong, .upload-preview strong { margin-bottom: 4px; color: #4a566a; font-size: 10px; }
.upload-placeholder small, .upload-preview small { color: #929cab; font-size: 9px; }
.toast { position: fixed; right: 24px; bottom: 24px; z-index: 1500; display: flex; align-items: center; gap: 8px; padding: 11px 15px; border-radius: var(--admin-toast-radius); color: var(--admin-color-surface); background: var(--admin-color-toast-surface); box-shadow: var(--admin-toast-shadow); font-size: var(--admin-font-size-label); }
.toast span { display: grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; color: var(--admin-color-toast-surface); background: var(--admin-color-toast-accent); font-size: var(--admin-font-size-table-heading); font-weight: 900; }

@media (max-width: 1220px) { .admin-page { padding-inline: var(--admin-page-padding-inline-compact); } }
</style>
