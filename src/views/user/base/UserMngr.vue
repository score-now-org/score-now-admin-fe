<template>
        <!-- Tabs -->
        <div class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab"
            class="tab-btn"
            :class="{ active: activeTab === tab }"
            @click="onTabChange(tab)" 
            >
            {{ tab }}
          </button>
        </div>

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
              <BaseInput v-model="filter.memberId" placeholder="회원번호 입력" />
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
                <input
                  class="date-input"
                  type="date"
                  v-model="filter.createdFrom"
                />
                <span class="date-sep">~</span>
                <input
                  class="date-input"
                  type="date"
                  v-model="filter.createdTo"
                />
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
              <BaseButton variant="primary" size="md" @click="doSearch"
                >조회</BaseButton
              >
              <BaseButton variant="outline" size="md" @click="resetFilter"
                >초기화</BaseButton
              >
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="table-wrap">
          <!-- Toolbar -->
          <div class="toolbar">
            <span class="total-count"
              >총 <strong>{{ pagination.totalElements  }}</strong
              >명</span
            >
            <div class="toolbar-right">
              <span class="toolbar-hint"> </span>
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
                  :key="user.memberId"
                  :class="{ 'row-even': idx % 2 === 1 }"
                >
                  <td class="bold link" @click="openDetailModal(user)">
                    {{ user.memberId }}
                  </td>
                  <td>
                    <!-- BaseBadge 적용 -->
                    <BaseBadge
                      :variant="user.provider === 'google' ? 'red' : 'yellow'"
                    >
                      {{ user.provider }}
                    </BaseBadge>
                  </td>

                  <td>{{ user.nickname || "-" }}</td>

                  <td>
                    <span
                      :class="
                        user.warningCnt > 0
                          ? 'warn-count red'
                          : 'warn-count muted'
                      "
                    >
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
            <!--페이징 ui -->
            <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              class="page-btn"
              :disabled="pagination.currentPage === 0"
              @click="changePage(pagination.currentPage - 1)"
            >
              이전
            </button>

            <button
              v-for="page in pagination.totalPages"
              :key="page"
              class="page-btn"
              :class="{
                active: pagination.currentPage === page - 1
              }"
              @click="changePage(page - 1)"
            >
              {{ page }}
            </button>

            <button
              class="page-btn"
              :disabled="
                pagination.currentPage === pagination.totalPages - 1
              "
              @click="changePage(pagination.currentPage + 1)"
            >
              다음
            </button>
          </div>
        </div>
        </div>
  <UserDetailModal v-model="detailModal.visible" :memberId="detailModal.memberId" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import UserDetailModal from "./modals/UserDetailModal.vue";
import { useUserMngr } from "./composables/useUserMngr";

const {
  users,
  loading,
  error,
  tabs,
  activeTab,
  filter,
  pagination,
  onTabChange,
  resetFilter,
  fetchUsers,
  changePage,
  statusLabel,
  statusVariant,
} = useUserMngr();


const searchOptions = [
  { label: "닉네임", value: "nickname" },
  { label: "회원번호", value: "id" },
  { label: "제공자", value: "provider" },
];


// 페이지 진입시 조회 
onMounted(() => {
  fetchUsers();
});

const filteredUsers = computed(() => {
  return users.value.filter(u => {
    if (filter.value.nickname      && !u.nickname?.toLowerCase().includes(filter.value.nickname.toLowerCase())) return false
    if (filter.value.memberId            && !String(u.memberId).includes(filter.value.memberId)) return false
    if (filter.value.provider      && u.provider !== filter.value.provider) return false
    if (filter.value.status        && u.status !== filter.value.status) return false
    if (filter.value.minWarningCnt && u.warningCnt < filter.value.minWarningCnt) return false

    const created = u.createdAt?.slice(0, 10)
    if (filter.value.createdFrom && created < filter.value.createdFrom) return false
    if (filter.value.createdTo   && created > filter.value.createdTo)   return false

    return true
  })
})

function handleWarn() {
  alert("경고 처리");
}
function handleBan() {
  alert("영구탈퇴 처리");
}

const detailModal = ref({ visible: false, memberId: null });

function openDetailModal(user) {
  detailModal.value = { visible: true, userId: user.memberId };
}
</script>

<style scoped>
/* ── 메인 ── */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

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
.tab-btn:hover {
  background: #e5e7eb;
}
.tab-btn.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
  font-weight: 600;
}

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
  border: 1px solid #e9e9e9;
  border-radius: 4px;
  padding: 7px 12px;
  font-size: 12px;
  color: #232323;
  background: #f3f3f3;
  outline: none;
  font-family: inherit;
  transition:
    border-color 0.15s,
    background 0.15s;
  box-sizing: border-box;
  cursor: pointer;
}
.date-input:focus {
  border-color: #1c67ff;
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
.radio-label input {
  accent-color: #2563eb;
  cursor: pointer;
}
.radio-active {
  color: #2563eb;
  font-weight: 600;
}
.select-country {
  margin-left: auto;
  width: auto;
}
.search-input {
  width: 200px;
}
.search-btn-wrap {
  display: flex;
  justify-content: center;
}

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
.total-count {
  font-size: 12px;
  color: #6b7280;
}
.total-count strong {
  color: #374151;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-hint {
  font-size: 12px;
  color: #9ca3af;
}
.toolbar-hint em {
  font-style: normal;
  font-weight: 600;
}

.table-scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
thead tr {
  background: #f3f4f6;
  border-bottom: 1px solid #d1d5db;
}
th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}
th.col-red {
  color: #ef4444;
}

tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.1s;
}
tbody tr:hover {
  background: #eff6ff;
}
tbody tr.row-even {
  background: #f9fafb;
}
tbody tr.row-even:hover {
  background: #eff6ff;
}

td {
  padding: 8px 12px;
  white-space: nowrap;
  color: #374151;
}
td.bold {
  font-weight: 600;
  color: #111827;
}
td.muted {
  color: #9ca3af;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
}
td.link {
  color: #1c67ff;
  cursor: pointer;
  text-decoration: underline;
}
td.link:hover {
  color: #1450cc;
}

/* ── 경고횟수 ── */
.warn-count {
  font-weight: 600;
}
.warn-count.red {
  color: #ef4444;
}
.warn-count.muted {
  color: #9ca3af;
}

/* ── 정보수정 폼 ── */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.form-label {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}

/* ── 모달 내부 ── */
.modal-row {
  font-size: 12px;
  color: #4b5563;
  margin-bottom: 6px;
}
.modal-row.muted {
  color: #9ca3af;
}

/* ── 공통 색상 ── */
.red {
  color: #ef4444;
}
.orange {
  color: #f97316;
}
.blue {
  color: #2563eb;
}
.muted {
  color: #9ca3af;
}
.member-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 16px 0;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 10px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid #d9dce3;
  border-radius: 6px;
  background: #fff;
  color: #555;
  font-size: 14px;
  cursor: pointer;
}

.page-btn:hover:not(:disabled) {
  background: #f5f6f8;
}

.page-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
  font-weight: 600;
}

.page-btn:disabled {
  color: #bbb;
  background: #f8f8f8;
  cursor: not-allowed;
}

</style>
