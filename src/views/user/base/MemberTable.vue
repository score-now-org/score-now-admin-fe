<template>
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
                <tr v-if="loading"><td colspan="8" class="empty">불러오는 중...</td></tr>
                <tr v-else-if="error"><td colspan="8" class="empty" role="alert">{{ error }}</td></tr>
                <tr
                  v-for="(user, idx) in (loading || error ? [] : users)"
                  :key="user.memberId"
                  :class="{ 'row-even': idx % 2 === 1 }"
                >
                  <td class="bold">
                    <button type="button" class="member-link" @click="$emit('select', user)">{{ user.memberId }}</button>
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

                <tr v-if="!loading && !error && users.length === 0">
                  <td colspan="8" class="empty">검색 결과가 없습니다.</td>
                </tr>
              </tbody>
            </table>
            <!--페이징 ui -->
            <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              class="page-btn"
              :disabled="pagination.currentPage === 0"
              @click="$emit('change-page', pagination.currentPage - 1)"
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
              @click="$emit('change-page', page - 1)"
            >
              {{ page }}
            </button>

            <button
              class="page-btn"
              :disabled="
                pagination.currentPage === pagination.totalPages - 1
              "
              @click="$emit('change-page', pagination.currentPage + 1)"
            >
              다음
            </button>
          </div>
        </div>
        </div>
</template>

<script setup>
defineProps({
  users: { type: Array, required: true },
  loading: { type: Boolean, required: true },
  error: { type: String, default: null },
  pagination: { type: Object, required: true },
  statusLabel: { type: Function, required: true },
  statusVariant: { type: Function, required: true },
})
defineEmits(['select', 'change-page'])
</script>

<style scoped>
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
.member-link {
  color: #1c67ff;
  cursor: pointer;
  text-decoration: underline;
  border: 0;
  background: transparent;
  padding: 0;
  font: inherit;
}
.member-link:hover {
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
