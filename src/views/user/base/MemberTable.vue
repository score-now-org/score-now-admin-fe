<template>
  <AdminTableCard class="member-table" scroll-label="회원 목록" table-min-width="950px">
    <template #summary><strong>검색 결과</strong><span>총 {{ pagination.totalElements }}명</span></template>
    <template #toolbar-actions>
      <AdminTablePagination :page="pagination.currentPage + 1" :total-pages="Math.max(1, pagination.totalPages)"
        :page-size="pagination.size" :page-size-options="[15, 30, 50]" :loading="loading"
        @change-page="$emit('change-page', $event - 1)" @change-page-size="$emit('change-page-size', $event)" />
    </template>
    <table>
      <thead><tr>
        <th>회원번호</th><th>프로필사진</th><th>아이디</th><th>닉네임</th><th>경고횟수</th><th>국가</th><th>가입일</th><th>활동상태</th><th>상세</th>
      </tr></thead>
      <tbody>
        <AdminTableState v-if="loading" type="loading" :colspan="9" title="불러오는 중입니다." />
        <AdminTableState v-else-if="error" type="error" :colspan="9" :title="error" />
        <AdminTableState v-else-if="!users.length" :colspan="9" title="검색 결과가 없습니다." />
        <tr v-for="user in (loading || error ? [] : users)" :key="user.memberId">
          <td>{{ user.memberId }}</td>
          <td><img v-if="user.profileImageUrl" class="profile-image" :src="user.profileImageUrl" alt="프로필 사진" /><span v-else>-</span></td>
          <td class="social-id">{{ user.socialId || '-' }}</td>
          <td>{{ user.nickname || '-' }}</td>
          <td>{{ user.warningCnt ?? 0 }}</td>
          <td>{{ user.countryCode || '-' }}</td>
          <td>{{ user.createdAt || '-' }}</td>
          <td><BaseBadge :variant="statusVariant(user.status)">{{ statusLabel(user.status) }}</BaseBadge></td>
          <td><BaseButton variant="outline" size="sm" @click="$emit('select', user)">상세</BaseButton></td>
        </tr>
      </tbody>
    </table>
  </AdminTableCard>
</template>

<script setup>
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
defineProps({
  users: { type: Array, required: true },
  loading: { type: Boolean, required: true },
  error: { type: String, default: null },
  pagination: { type: Object, required: true },
  statusLabel: { type: Function, required: true },
  statusVariant: { type: Function, required: true },
})
defineEmits(['select', 'change-page', 'change-page-size'])
</script>

<style scoped>
.member-table { margin: 0 12px 12px; }
.profile-image { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.social-id { overflow-wrap: anywhere; }
</style>
