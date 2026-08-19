<template>
  <div class="admin-page">
    <header class="page-header">
      <div>
        <div class="title-row">
          <h1>경기장 관리</h1>
          <span class="mock-badge">화면 데모</span>
        </div>
        <p>경기장을 검색하고 명칭을 수정하거나 수동 경기장을 새로 등록합니다.</p>
      </div>
      <BaseButton variant="primary" size="md" class="primary-action" @click="openCreateModal">
        + 경기장 등록
      </BaseButton>
    </header>

    <section class="filter-card" aria-label="경기장 검색 조건">
      <div class="field-group name-search">
        <label for="stadium-name">경기장명</label>
        <BaseInput id="stadium-name" v-model="searchName" placeholder="경기장명 입력" @enter="searchStadiums" />
      </div>
      <div class="filter-actions">
        <BaseButton variant="secondary" size="md" @click="resetSearch">초기화</BaseButton>
        <BaseButton variant="primary" size="md" @click="searchStadiums">검색</BaseButton>
      </div>
    </section>

    <section class="table-card">
      <div class="table-toolbar">
        <div>
          <strong>검색 결과</strong>
          <span>총 {{ filteredStadiums.length }}건</span>
        </div>
        <p><span class="info-dot">i</span> 경기장명은 목록에서 바로 수정할 수 있습니다.</p>
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
            <tr v-if="filteredStadiums.length === 0">
              <td colspan="6" class="empty-state">
                <span class="empty-icon">○</span>
                <strong>검색 결과가 없습니다.</strong>
                <small>경기장명을 다시 확인해 주세요.</small>
              </td>
            </tr>
            <tr v-for="stadium in filteredStadiums" :key="stadium.id" :class="{ dirty: isDirty(stadium) }">
              <td class="id-cell">{{ stadium.id }}</td>
              <td><span class="sport-badge" :class="stadium.sport">{{ sportLabel(stadium.sport) }}</span></td>
              <td>
                <input v-model="stadium.name" class="row-control name-control" :aria-label="`${stadium.id} 경기장명`" />
              </td>
              <td class="city-cell">{{ stadium.city }}</td>
              <td>
                <span class="origin-badge" :class="stadium.origin">{{ stadium.origin === 'manual' ? '수동' : 'API 연동' }}</span>
              </td>
              <td>
                <div class="action-buttons">
                  <BaseButton variant="primary" size="sm" :disabled="!isDirty(stadium)" @click="saveStadium(stadium)">저장</BaseButton>
                  <BaseButton variant="danger" size="sm" @click="deleteStadium(stadium)">삭제</BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <BaseModal v-model="createModalOpen" title="수동 경기장 등록" width="520px">
      <div class="modal-intro">
        <span class="manual-icon">M</span>
        <div>
          <strong>수동 경기장으로 등록됩니다.</strong>
          <p>외부 API와 연결되지 않으며 등록 후 경기장 목록에서 관리할 수 있습니다.</p>
        </div>
      </div>

      <form class="stadium-form" @submit.prevent="createStadium">
        <div class="form-field">
          <label for="stadium-sport">종목 <span>*</span></label>
          <div id="stadium-sport" class="sport-options" role="radiogroup" aria-label="종목 선택">
            <button
              v-for="option in sportOptions"
              :key="option.value"
              type="button"
              role="radio"
              :aria-checked="newStadium.sport === option.value"
              :class="[option.value, { selected: newStadium.sport === option.value }]"
              @click="newStadium.sport = option.value"
            >
              <span>{{ option.mark }}</span>{{ option.label }}
            </button>
          </div>
        </div>

        <div class="form-field">
          <label for="new-stadium-name">경기장명 <span>*</span></label>
          <input id="new-stadium-name" v-model="newStadium.name" class="form-control" placeholder="예: 서울월드컵경기장" />
          <small>운영 화면에 표시될 공식 경기장명을 입력해 주세요.</small>
        </div>

        <div class="form-field">
          <label for="new-stadium-city">도시명 <span>*</span></label>
          <input id="new-stadium-city" v-model="newStadium.city" class="form-control" placeholder="예: 서울" />
        </div>
      </form>

      <template #footer>
        <BaseButton variant="outline" size="md" @click="createModalOpen = false">취소</BaseButton>
        <BaseButton variant="primary" size="md" :disabled="!isNewStadiumValid" @click="createStadium">경기장 등록</BaseButton>
      </template>
    </BaseModal>

    <div v-if="toastMessage" class="toast" role="status"><span>✓</span>{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'

const sportOptions = [
  { value: 'soccer', label: '축구', mark: 'F' },
  { value: 'baseball', label: '야구', mark: 'B' },
  { value: 'basketball', label: '농구', mark: 'K' },
]

const initialStadiums = [
  { id: 8101, sport: 'soccer', name: '서울월드컵경기장', city: '서울', origin: 'external' },
  { id: 8102, sport: 'soccer', name: '수원월드컵경기장', city: '수원', origin: 'external' },
  { id: 8204, sport: 'baseball', name: '잠실야구장', city: '서울', origin: 'external' },
  { id: 8208, sport: 'baseball', name: '대전 한화생명 볼파크', city: '대전', origin: 'external' },
  { id: 8303, sport: 'basketball', name: '잠실실내체육관', city: '서울', origin: 'manual' },
  { id: 8114, sport: 'soccer', name: '토트넘 홋스퍼 스타디움', city: '런던', origin: 'external' },
]

const stadiums = ref(initialStadiums.map((stadium) => ({ ...stadium })))
const savedNames = ref(Object.fromEntries(initialStadiums.map((stadium) => [stadium.id, stadium.name])))
const searchName = ref('')
const appliedSearchName = ref('')
const createModalOpen = ref(false)
const newStadium = reactive({ sport: 'soccer', name: '', city: '' })
const toastMessage = ref('')
let toastTimer

const filteredStadiums = computed(() => {
  const keyword = appliedSearchName.value.trim().toLowerCase()
  return stadiums.value.filter((stadium) => !keyword || stadium.name.toLowerCase().includes(keyword))
})

const isNewStadiumValid = computed(() => Boolean(newStadium.sport && newStadium.name.trim() && newStadium.city.trim()))

function sportLabel(sport) {
  return { soccer: '축구', baseball: '야구', basketball: '농구' }[sport] || sport
}

function isDirty(stadium) {
  return savedNames.value[stadium.id] !== stadium.name
}

function searchStadiums() {
  appliedSearchName.value = searchName.value
}

function resetSearch() {
  searchName.value = ''
  searchStadiums()
}

function saveStadium(stadium) {
  savedNames.value[stadium.id] = stadium.name
  showToast(`${stadium.name} 경기장 정보를 저장했습니다.`)
}

function deleteStadium(stadium) {
  stadiums.value = stadiums.value.filter((item) => item.id !== stadium.id)
  delete savedNames.value[stadium.id]
  showToast(`${stadium.name} 경기장을 삭제했습니다.`)
}

function openCreateModal() {
  Object.assign(newStadium, { sport: 'soccer', name: '', city: '' })
  createModalOpen.value = true
}

function createStadium() {
  if (!isNewStadiumValid.value) return
  const created = {
    id: Math.max(...stadiums.value.map((stadium) => stadium.id)) + 1,
    sport: newStadium.sport,
    name: newStadium.name.trim(),
    city: newStadium.city.trim(),
    origin: 'manual',
  }
  stadiums.value.unshift(created)
  savedNames.value[created.id] = created.name
  createModalOpen.value = false
  resetSearch()
  showToast(`${created.name} 경기장을 등록했습니다.`)
}

function showToast(message) {
  toastMessage.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastMessage.value = '' }, 2600)
}
</script>

<style scoped>
.admin-page { min-width: 920px; padding: var(--admin-page-padding); color: var(--admin-color-text-body); }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--admin-page-header-gap); margin-bottom: var(--admin-page-header-margin-bottom); }
.title-row { display: flex; align-items: center; gap: 10px; }
.page-header h1 { margin: 0; font-size: var(--admin-font-size-page-title); line-height: 1.35; letter-spacing: -.04em; color: var(--admin-color-text-title); }
.page-header p { margin: 6px 0 0; color: var(--admin-color-text-description); font-size: var(--admin-font-size-description); }
.mock-badge { padding: 3px 8px; border-radius: 999px; background: #eff5ff; color: #2768dd; font-size: 10px; font-weight: 700; }
.primary-action { min-width: 104px; height: 34px; box-shadow: 0 4px 10px rgba(28, 103, 255, .18); }
.filter-card { display: flex; align-items: flex-end; gap: var(--admin-filter-gap); padding: var(--admin-card-padding); margin-bottom: var(--admin-section-margin-bottom); background: var(--admin-color-surface); border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); }
.field-group { display: flex; flex-direction: column; gap: var(--admin-field-gap); }
.field-group label { color: var(--admin-color-text-label); font-size: var(--admin-font-size-label); font-weight: 700; }
.name-search { width: 330px; }
.filter-actions { display: flex; gap: var(--admin-action-gap); margin-left: auto; }
.table-card { overflow: hidden; background: var(--admin-color-surface); border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); }
.table-toolbar { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 var(--admin-card-padding); border-bottom: 1px solid var(--admin-color-divider); }
.table-toolbar > div { display: flex; align-items: center; gap: 10px; }
.table-toolbar strong { font-size: 13px; }
.table-toolbar span { color: var(--admin-color-text-muted); font-size: var(--admin-font-size-label); }
.table-toolbar p { display: flex; align-items: center; gap: var(--admin-action-gap); margin: 0; color: var(--admin-color-text-subtle); font-size: var(--admin-font-size-table-heading); }
.info-dot { display: inline-grid; place-items: center; width: 15px; height: 15px; border: 1px solid var(--admin-color-info-border); border-radius: 50%; font-size: 9px !important; }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 900px; border-collapse: collapse; table-layout: fixed; }
th { height: 39px; padding: 0 12px; border-bottom: 1px solid var(--admin-color-table-heading-border); color: var(--admin-color-text-table-heading); background: var(--admin-color-table-heading-surface); font-size: var(--admin-font-size-table-heading); font-weight: 700; text-align: left; white-space: nowrap; }
td { height: 62px; padding: 9px 12px; border-bottom: 1px solid var(--admin-color-table-row-border); color: var(--admin-color-text-table-body); font-size: var(--admin-font-size-table-body); vertical-align: middle; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover:not(:has(.empty-state)) { background: var(--admin-color-table-row-hover); }
tbody tr.dirty { background: #fffdf5; }
th:nth-child(1) { width: 100px; } th:nth-child(2) { width: 90px; } th:nth-child(3) { width: 290px; }
th:nth-child(4) { width: 130px; } th:nth-child(5) { width: 100px; } th:nth-child(6) { width: 140px; }
.id-cell { color: #2e3b52; font-weight: 700; font-variant-numeric: tabular-nums; }
.sport-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 38px; height: 22px; border-radius: 5px; font-size: 10px; font-weight: 700; }
.sport-badge.soccer { color: #18734b; background: #eaf8f1; }
.sport-badge.baseball { color: #3864bd; background: #edf3ff; }
.sport-badge.basketball { color: #b85a19; background: #fff3e7; }
.row-control { width: 100%; height: 32px; padding: 0 9px; border: 1px solid transparent; border-radius: 5px; outline: none; color: #303b50; background: transparent; font: inherit; font-size: 11px; }
.row-control:hover { border-color: #e1e6ed; background: #fff; }
.row-control:focus { border-color: #1c67ff; background: #fff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .08); }
.name-control { font-weight: 600; }
.city-cell { color: #768094; }
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
.modal-intro p { margin: 0; color: #7890b2; font-size: 9px; }
.stadium-form { display: flex; flex-direction: column; gap: 17px; }
.form-field { display: flex; flex-direction: column; gap: var(--admin-field-gap); }
.form-field > label { color: var(--admin-color-text-label); font-size: var(--admin-font-size-table-heading); font-weight: 700; }
.form-field > label span { color: #e14d4d; }
.form-field > small { color: #929baa; font-size: 9px; }
.form-control { width: 100%; height: 36px; padding: 0 10px; border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); outline: none; color: var(--admin-color-text-control); background: var(--admin-color-surface-subtle); font: inherit; font-size: var(--admin-font-size-label); }
.form-control:focus { border-color: var(--admin-color-primary); background: var(--admin-color-surface); box-shadow: var(--admin-focus-ring); }
.sport-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.sport-options button { display: flex; align-items: center; justify-content: center; gap: 7px; height: 42px; border: 1px solid #dde3eb; border-radius: 7px; color: #687388; background: #fff; font: inherit; font-size: 10px; font-weight: 700; cursor: pointer; }
.sport-options button > span { display: grid; place-items: center; width: 21px; height: 21px; border-radius: 50%; color: #fff; background: #9ba5b5; font-size: 8px; font-weight: 900; }
.sport-options button.selected { border-color: #4281ec; color: #1f62cc; background: #f6f9ff; box-shadow: 0 0 0 2px rgba(28, 103, 255, .07); }
.sport-options button.selected > span { background: #3975d2; }
.toast { position: fixed; right: 24px; bottom: 24px; z-index: 1500; display: flex; align-items: center; gap: 8px; padding: 11px 15px; border-radius: var(--admin-toast-radius); color: var(--admin-color-surface); background: var(--admin-color-toast-surface); box-shadow: var(--admin-toast-shadow); font-size: var(--admin-font-size-label); }
.toast span { display: grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; color: var(--admin-color-toast-surface); background: var(--admin-color-toast-accent); font-size: var(--admin-font-size-table-heading); font-weight: 900; }
@media (max-width: 1100px) { .admin-page { padding-inline: var(--admin-page-padding-inline-compact); } }
</style>
