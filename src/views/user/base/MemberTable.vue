<template>
  <AdminTableCard class="member-table" scroll-label="회원 목록" table-min-width="1100px">
    <template #summary><strong>검색 결과</strong><span>총 {{ pagination.totalElements }}명</span></template>
    <template #toolbar-actions>
      <AdminTablePagination :page="pagination.currentPage + 1" :total-pages="Math.max(1, pagination.totalPages)"
        :page-size="pagination.size" :page-size-options="[15, 30, 50]" :loading="loading"
        @change-page="$emit('change-page', $event - 1)" @change-page-size="$emit('change-page-size', $event)" />
    </template>
    <table>
      <thead><tr>
        <th v-for="heading in headings" :key="heading">{{ heading }}</th>
      </tr></thead>
      <tbody>
        <AdminTableState v-if="loading" type="loading" :colspan="headings.length" title="불러오는 중입니다." />
        <AdminTableState v-else-if="error" type="error" :colspan="headings.length" :title="error" />
        <AdminTableState v-else-if="!users.length" :colspan="headings.length" title="검색 결과가 없습니다." />
        <tr v-for="user in (loading || error ? [] : users)" :key="user.memberId">
          <td>{{ user.memberId }}</td>
          <td><img v-if="user.profileImageUrl" class="profile-image" :src="user.profileImageUrl" alt="프로필 사진" /><span v-else>-</span></td>
          <td class="social-id">{{ user.socialId || '-' }}</td><td>{{ user.nickname || '-' }}</td>
          <td><button class="link" @click="$emit('detail', user, 'warning')">{{ user.warningCnt ?? 0 }}</button></td>
          <td>{{ user.countryCode || '-' }}</td>
          <template v-if="tab === '회원'">
            <td title="팔로워 기능 미지원">-</td><td>{{ format(user.createdAt) }}</td>
            <td><BaseButton variant="outline" size="sm" @click="$emit('detail', user, 'security')">IP 확인</BaseButton></td>
            <td><BaseButton variant="outline" size="sm" @click="$emit('action', user, 'EDIT')">정보 수정</BaseButton></td>
            <td class="actions"><BaseButton variant="outline" size="sm" @click="$emit('action', user, 'WARN')">경고</BaseButton>
              <BaseButton v-if="user.status === 'active'" variant="outline" size="sm" @click="$emit('action', user, 'BAN')">정지</BaseButton>
              <BaseButton v-if="user.status === 'banned'" variant="outline" size="sm" @click="$emit('action', user, 'RESTORE')">정지 해제</BaseButton>
              <BaseButton variant="danger" size="sm" @click="$emit('action', user, 'PERMANENT_WITHDRAWAL')">영구탈퇴</BaseButton></td>
          </template>
          <template v-else-if="tab === '경고회원'"><td>{{ user.warningReason || '-' }}</td><td>{{ format(user.warnedAt) }}</td></template>
          <template v-else-if="tab === '영구탈퇴회원'">
            <td title="팔로워 기능 미지원">-</td><td>{{ format(user.createdAt) }}</td><td>{{ user.permanentWithdrawalReason || '-' }}</td>
            <td>{{ format(user.permanentlyWithdrawnAt) }}</td><td><BaseButton variant="outline" size="sm" @click="$emit('detail', user, 'security')">IP 확인</BaseButton></td>
            <td><BaseButton variant="outline" size="sm" @click="$emit('action', user, 'RESTORE')">복구</BaseButton></td>
          </template>
          <template v-else><td title="팔로워 기능 미지원">-</td><td>{{ format(user.deletedAt) }}</td>
            <td><BaseButton variant="outline" size="sm" @click="$emit('detail', user, 'security')">IP 확인</BaseButton></td></template>
        </tr>
      </tbody>
    </table>
  </AdminTableCard>
</template>
<script setup>
import { computed } from 'vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
const props = defineProps({ users: { type: Array, required: true }, tab: { type: String, required: true }, loading: Boolean,
  error: { type: String, default: null }, pagination: { type: Object, required: true } })
defineEmits(['detail', 'action', 'change-page', 'change-page-size'])
const headings = computed(() => ['회원번호', '프로필사진', '아이디', '닉네임', '경고정보', '국가', ...({
  '회원': ['팔로워', '가입일', 'IP 확인', '정보 수정', '관리'],
  '경고회원': ['경고 사유', '경고일'],
  '영구탈퇴회원': ['팔로워', '가입일', '영구탈퇴 사유', '영구탈퇴일', 'IP 확인', '복구'],
  '탈퇴 회원': ['팔로워', '탈퇴일', 'IP 확인'],
}[props.tab] || [])])
function format(value) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
</script>
<style scoped>
.member-table { margin: 0 12px 12px; }
.profile-image { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.social-id { overflow-wrap: anywhere; }
.link { border: 0; background: transparent; color: var(--admin-color-primary); cursor: pointer; font: inherit; }
.actions { min-width: 250px; }
.actions :deep(button) { margin: 2px; }
</style>
