<template>
  <div class="page-wrap">
    <!-- Body -->
    <div class="body-wrap">

      <!-- Sidebar -->
   <AppSidebar v-model="activeSidebar" />
      <!-- Main -->
      <main class="main-content">

        <!-- Tabs -->
        <div class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab"
            class="tab-btn"
            :class="{ active: activeTab === tab }"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <!-- Search -->
     <!-- Search -->
<div class="search-box">
  <div class="filter-row">

    <!-- 닉네임 -->
    <div class="filter-item">
      <label class="filter-label">닉네임</label>
      <BaseInput v-model="filter.nickname" placeholder="닉네임 입력" />
    </div>

    <!-- 회원번호 -->
    <div class="filter-item">
      <label class="filter-label">회원번호</label>
      <BaseInput v-model="filter.id" placeholder="회원번호 입력" />
    </div>

    <!-- 제공자 -->
    <div class="filter-item">
      <label class="filter-label">제공자</label>
      <BaseSelect v-model="filter.provider">
        <option value="">전체</option>
        <option value="kakao">kakao</option>
        <option value="google">google</option>
      </BaseSelect>
    </div>

    <!-- 가입일 -->
<div class="filter-item">
  <label class="filter-label">가입일</label>
  <div class="date-range">
    <input class="date-input" type="date" v-model="filter.createdFrom" />
    <span class="date-sep">~</span>
    <input class="date-input" type="date" v-model="filter.createdTo" />
  </div>
</div>

    <!-- 활동상태 -->
    <div class="filter-item">
      <label class="filter-label">활동상태</label>
      <BaseSelect v-model="filter.status">
        <option value="">전체</option>
        <option value="active">활동중</option>
        <option value="inactive">비활동</option>
        <option value="banned">정지</option>
      </BaseSelect>
    </div>

    <!-- 버튼 -->
    <div class="filter-item filter-btns">
      <BaseButton variant="primary" size="md" @click="doSearch">조회</BaseButton>
      <BaseButton variant="outline" size="md"  @click="resetFilter">초기화</BaseButton>
    </div>

  </div>
</div>

        <!-- Table -->
        <div class="table-wrap">

          <!-- Toolbar -->
          <div class="toolbar">
            <span class="total-count">총 <strong>{{ filteredUsers.length }}</strong>명</span>
            <div class="toolbar-right">
              <span class="toolbar-hint">
              </span>
              <!-- BaseButton 적용 -->
            </div>
          </div>

          <!-- Table -->
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>회원번호</th>
                  <th>제공자</th>
                  <th>닉네임</th>
                  <th class="col-red">경고횟수</th>
                  <th>국가</th>
                  <th>가입일</th>
                  <th>최근수정일</th>
                  <th>활동상태</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(user, idx) in filteredUsers"
                  :key="user.id"
                  :class="{ 'row-even': idx % 2 === 1 }"
                >
                  <td class="bold">{{ user.id }}</td>

                  <td>
                    <!-- BaseBadge 적용 -->
                    <BaseBadge :variant="user.provider === 'google' ? 'red' : 'yellow'">
                      {{ user.provider }}
                    </BaseBadge>
                  </td>

                  <td>{{ user.nickname || '-' }}</td>

                  <td>
                    <span :class="user.warningCnt > 0 ? 'warn-count red' : 'warn-count muted'">
                      {{ user.warningCnt }}
                    </span>
                  </td>

                  <td>
                    <BaseBadge variant="blue">{{ user.countryCode }}</BaseBadge>
                  </td>

                  <td class="muted">{{ user.createdAt }}</td>
                  <td class="muted">{{ user.updatedAt }}</td>

                  <td>
                    <BaseBadge :variant="statusVariant(user.status)">
                      {{ statusLabel(user.status) }}
                    </BaseBadge>
                  </td>
                </tr>

                <tr v-if="filteredUsers.length === 0">
                  <td colspan="10" class="empty">검색 결과가 없습니다.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>

    <BaseModal v-model="ipModal.visible" title="IP 확인">
      <p class="modal-row">회원번호: <strong>{{ ipModal.user?.id }}</strong></p>
      <p class="modal-row">닉네임: <strong>{{ ipModal.user?.nickname }}</strong></p>
      <p class="modal-row">접속 IP: <strong class="blue">192.168.1.{{ ipModal.user?.id % 255 }}</strong></p>
      <p class="modal-row muted">가입일: {{ ipModal.user?.createdAt }}</p>
      <template #footer>
        <BaseButton variant="outline" @click="ipModal.visible = false">닫기</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="editModal.visible" title="정보수정" width="400px">
      <div class="edit-form">
        <div class="form-row">
          <label class="form-label">닉네임</label>
          <BaseInput v-model="editForm.nickname" placeholder="닉네임 입력" />
        </div>
        <div class="form-row">
          <label class="form-label">활동상태</label>
          <BaseSelect v-model="editForm.status">
            <option value="active">활동중</option>
            <option value="inactive">비활동</option>
            <option value="banned">정지</option>
          </BaseSelect>
        </div>
        <div class="form-row">
          <label class="form-label">경고횟수</label>
          <BaseInput v-model="editForm.warningCnt" type="number" placeholder="0" />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="editModal.visible = false">취소</BaseButton>
        <BaseButton variant="primary" @click="saveEdit">저장</BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const activeSidebar = ref('회원')

const tabs = ['회원', '경고회원', '영구탈퇴회원', '탈퇴 회원']
const activeTab = ref('회원')

const searchOptions = [
  { label: '닉네임', value: 'nickname' },
  { label: '회원번호', value: 'id' },
  { label: '제공자', value: 'provider' },
]
const filter = ref({
  nickname:    '',
  id:          '',
  provider:    '',
  createdFrom: '',  // ← 시작일
  createdTo:   '',  // ← 종료일
  status:      '',
})
function resetFilter() {
  filter.value = {
    nickname: '', id: '', provider: '',
    createdFrom: '', createdTo: '', status: ''
  }
}
function doSearch() {} // TODO: API 연결 시 구현

const users = ref([
  { id: 1234567, provider: 'google', nickname: 'playerOne', warningCnt: 0, countryCode: 'KR', createdAt: '2025-12-29 20:00:06', updatedAt: '2026-01-05 10:12:00', status: 'active' },
  { id: 2345678, provider: 'kakao',  nickname: 'shooter99', warningCnt: 2, countryCode: 'KR', createdAt: '2025-11-15 14:30:22', updatedAt: '2026-02-01 09:00:00', status: 'active' },
  { id: 3456789, provider: 'google', nickname: 'goalking',  warningCnt: 0, countryCode: 'US', createdAt: '2025-10-03 09:12:44', updatedAt: '2025-12-20 17:45:00', status: 'inactive' },
  { id: 4567890, provider: 'kakao',  nickname: 'redcard77', warningCnt: 5, countryCode: 'KR', createdAt: '2025-09-01 08:00:00', updatedAt: '2026-03-10 11:30:00', status: 'banned' },
  { id: 5678901, provider: 'google', nickname: 'matchpro',  warningCnt: 1, countryCode: 'JP', createdAt: '2026-01-20 16:22:11', updatedAt: '2026-04-01 14:00:00', status: 'active' },
])

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    if (filter.value.nickname    && !u.nickname?.toLowerCase().includes(filter.value.nickname.toLowerCase())) return false
    if (filter.value.id          && !String(u.id).includes(filter.value.id)) return false
    if (filter.value.provider    && u.provider !== filter.value.provider) return false
    if (filter.value.status      && u.status !== filter.value.status) return false

    // 가입일 범위 체크
    const created = u.createdAt?.slice(0, 10) // '2025-12-29' 형식으로 자르기
    if (filter.value.createdFrom && created < filter.value.createdFrom) return false
    if (filter.value.createdTo   && created > filter.value.createdTo)   return false

    return true
  })
})

function statusLabel(status) {
  return { active: '활동중', inactive: '비활동', banned: '정지' }[status] || status
}

function statusVariant(status) {
  return { active: 'green', inactive: 'gray', banned: 'red' }[status] || 'gray'
}

function handleWarn() { alert('경고 처리') }
function handleBan()  { alert('영구탈퇴 처리') }

// ── IP 모달 ──
const ipModal = ref({ visible: false, user: null })
function openIPModal(user) {
  ipModal.value = { visible: true, user }
}

// ── 정보수정 모달 ──
const editModal = ref({ visible: false, user: null })
const editForm  = ref({ nickname: '', status: 'active', warningCnt: 0 })

function openEditModal(user) {
  editForm.value = {
    nickname:   user.nickname,
    status:     user.status,
    warningCnt: user.warningCnt,
  }
  editModal.value = { visible: true, user }
}

function saveEdit() {
  const target = users.value.find(u => u.id === editModal.value.user?.id)
  if (target) {
    target.nickname   = editForm.value.nickname
    target.status     = editForm.value.status
    target.warningCnt = Number(editForm.value.warningCnt)
  }
  editModal.value.visible = false
}
</script>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f9fafb;
  font-size: 13px;
  color: #1f2937;
  font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
}

/* ── 메타바 ── */
.meta-bar { background: #fff; border-bottom: 1px solid #d1d5db; }
.meta-row {
  display: grid;
  grid-template-columns: 120px 1fr;
  border-bottom: 1px solid #d1d5db;
  font-size: 12px;
}
.meta-label {
  padding: 6px 12px;
  background: #f3f4f6;
  border-right: 1px solid #d1d5db;
  font-weight: 600;
  color: #4b5563;
}
.meta-value { padding: 6px 12px; color: #374151; }
.meta-value.gray { color: #9ca3af; }

/* ── 바디 ── */
.body-wrap { display: flex; flex: 1; overflow: hidden; }

/* ── 사이드바 ── */
.sidebar {
  width: 90px;
  background: #fff;
  border-right: 1px solid #d1d5db;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-title {
  text-align: center;
  padding: 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: #6b7280;
  border-bottom: 1px solid #9ca3af;
}
.sidebar-btn {
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  font-size: 12px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}
.sidebar-btn:hover { background: #eff6ff; }
.sidebar-btn.active { background: #2563eb; color: #fff; font-weight: 600; }

/* ── 메인 ── */
.main-content { flex: 1; display: flex; flex-direction: column; overflow: auto; }

/* ── 탭 ── */
.tab-bar {
  background: #fff;
  border-bottom: 1px solid #d1d5db;
  display: flex;
  align-items: flex-end;
  padding: 8px 12px 0;
  gap: 4px;
}
.tab-btn {
  padding: 6px 16px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}
.tab-btn:hover { background: #e5e7eb; }
.tab-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 600; }

/* ── 검색 ── */
.search-box {
  background: #fff;
  border: 1px solid #d1d5db;
  margin: 12px 12px 8px;
  border-radius: 6px;
  padding: 14px 16px;
}
.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}
.filter-btns {
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: flex-end;
  margin-left: auto;
}
.filter-btn {
    width: 88px;
}
.date-input {
  border: 1px solid #E9E9E9;
  border-radius: 4px;
  padding: 7px 12px;
  font-size: 12px;
  color: #232323;
  background: #F3F3F3;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s;
  box-sizing: border-box;
  cursor: pointer;
}
.date-input:focus {
  border-color: #1C67FF;
  background: #fff;
}
.search-options {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.radio-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  cursor: pointer;
  color: #6b7280;
}
.radio-label input { accent-color: #2563eb; cursor: pointer; }
.radio-active { color: #2563eb; font-weight: 600; }
.select-country { margin-left: auto; width: auto; }
.search-input { width: 200px; }
.search-btn-wrap { display: flex; justify-content: center; }

/* ── 테이블 ── */
.table-wrap {
  background: #fff;
  border: 1px solid #d1d5db;
  margin: 0 12px 12px;
  border-radius: 6px;
  overflow: hidden;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.total-count { font-size: 12px; color: #6b7280; }
.total-count strong { color: #374151; }
.toolbar-right { display: flex; align-items: center; gap: 8px; }
.toolbar-hint { font-size: 12px; color: #9ca3af; }
.toolbar-hint em { font-style: normal; font-weight: 600; }

.table-scroll { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: 12px; }
thead tr { background: #f3f4f6; border-bottom: 1px solid #d1d5db; }
th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}
th.col-red { color: #ef4444; }

tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.1s; }
tbody tr:hover { background: #eff6ff; }
tbody tr.row-even { background: #f9fafb; }
tbody tr.row-even:hover { background: #eff6ff; }

td { padding: 8px 12px; white-space: nowrap; color: #374151; }
td.bold { font-weight: 600; color: #111827; }
td.muted { color: #9ca3af; }

.empty { text-align: center; padding: 40px; color: #9ca3af; }

/* ── 경고횟수 ── */
.warn-count { font-weight: 600; }
.warn-count.red   { color: #ef4444; }
.warn-count.muted { color: #9ca3af; }

/* ── 정보수정 폼 ── */
.edit-form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 12px; font-weight: 600; color: #4b5563; }

/* ── 모달 내부 ── */
.modal-row { font-size: 12px; color: #4b5563; margin-bottom: 6px; }
.modal-row.muted { color: #9ca3af; }

/* ── 공통 색상 ── */
.red    { color: #ef4444; }
.orange { color: #f97316; }
.blue   { color: #2563eb; }
.muted  { color: #9ca3af; }
</style>