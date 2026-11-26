<template>
  <AdminTableCard scroll-label="응원글 목록" table-min-width="1300px">
    <template #summary><strong>검색 결과</strong><span>총 {{ pagination.totalElements }}건</span></template>
    <template #toolbar-actions><AdminTablePagination :page="pagination.currentPage + 1" :total-pages="Math.max(1, pagination.totalPages)" :page-size="pagination.size" :page-size-options="[15, 30, 50]" :loading="loading" @change-page="$emit('change-page', $event - 1)" @change-page-size="$emit('change-page-size', $event)" /></template>
    <table><thead><tr><th>프로필사진</th><th>회원번호</th><th>아이디</th><th>닉네임</th><th>경고정보</th><th>포인트</th><th>알림</th><th>국가</th><th>경기 ID</th><th>종목 ID</th><th>내용</th><th>등록시간</th><th>신고</th><th>삭제 여부</th><th>관리</th></tr></thead>
      <tbody>
        <AdminTableState v-if="loading" type="loading" :colspan="15" title="불러오는 중입니다." />
        <AdminTableState v-else-if="error" type="error" :colspan="15" :title="error" />
        <AdminTableState v-else-if="!items.length" :colspan="15" title="검색 결과가 없습니다." />
        <tr v-for="item in (loading || error ? [] : items)" :key="item.chatId">
          <td><img v-if="item.profileImageUrl" class="avatar" :src="item.profileImageUrl" alt="프로필 사진" /><span v-else>-</span></td>
          <td>{{ item.memberId ?? '-' }}</td><td class="long-text">{{ item.socialId || '-' }}</td><td>{{ item.nickname || '-' }}</td>
          <td>{{ item.warningCnt ?? '-' }}</td><td title="포인트 데이터 미지원">-</td><td title="알림 정보 미지원">-</td><td>{{ item.countryCode || '-' }}</td><td>{{ item.matchId }}</td><td>{{ item.sportId ?? '-' }}</td>
          <td class="long-text">{{ item.message || (item.imageUrl ? '사진' : '-') }}</td><td>{{ format(item.createdAt) }}</td><td><button v-if="item.reportCount" class="report-link" @click="$emit('reports', item)">{{ item.reportCount }}</button><span v-else>0</span></td>
          <td>{{ item.deleted ? '삭제됨' : '정상' }}</td>
          <td><div class="actions"><BaseButton v-if="!item.deleted" variant="danger" size="sm" @click="$emit('delete', item)">삭제</BaseButton><BaseButton v-if="item.memberId" variant="outline" size="sm" @click="$emit('action', item.memberId, 'WARN')">경고</BaseButton><BaseButton v-if="item.memberId" variant="outline" size="sm" @click="$emit('action', item.memberId, 'BAN')">정지</BaseButton><BaseButton v-if="item.memberId" variant="outline" size="sm" @click="$emit('action', item.memberId, 'PERMANENT_WITHDRAWAL')">영구탈퇴</BaseButton></div></td>
        </tr>
      </tbody>
    </table>
  </AdminTableCard>
</template>
<script setup>
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
defineProps({ items: { type: Array, required: true }, loading: Boolean, error: { type: String, default: '' }, pagination: { type: Object, required: true } })
defineEmits(['change-page', 'change-page-size', 'delete', 'action', 'reports'])
function format(value) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
</script>
<style scoped>
.avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
.long-text { overflow-wrap: anywhere; }
.report-link { background: none; border: 0; color: var(--admin-color-primary); cursor: pointer; text-decoration: underline; }
.actions { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; }
</style>
