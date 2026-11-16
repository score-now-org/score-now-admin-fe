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

        <MemberSearchFilters v-model:filter="filter" @search="doSearch" @reset="resetFilter" />

        <MemberTable :users="users" :loading="loading" :error="error" :pagination="pagination"
          :status-label="statusLabel" :status-variant="statusVariant"
          @select="openDetailModal" @change-page="changePage" />
  <UserDetailModal v-model="detailModal.visible" :userId="detailModal.userId" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import UserDetailModal from "./modals/UserDetailModal.vue";
import MemberSearchFilters from "./MemberSearchFilters.vue";
import MemberTable from "./MemberTable.vue";
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
  doSearch,
  fetchUsers,
  changePage,
  statusLabel,
  statusVariant,
} = useUserMngr();


// 페이지 진입시 조회 
onMounted(() => {
  fetchUsers();
});

const detailModal = ref({ visible: false, userId: null });

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

</style>
