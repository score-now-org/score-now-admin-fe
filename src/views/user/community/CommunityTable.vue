<template>
  <AdminTableCard :scroll-label="isPost ? '게시글 목록' : '댓글 목록'" table-min-width="1550px">
    <template #summary><strong>검색 결과</strong><span>총 {{ pagination.totalElements }}건</span><span v-if="isPost">오늘 등록 {{ todayCount }}건</span></template>
    <template #toolbar-actions><AdminTablePagination :page="pagination.currentPage + 1" :total-pages="Math.max(1, pagination.totalPages)" :page-size="pagination.size" :page-size-options="[15, 30, 50]" :loading="loading" @change-page="$emit('change-page', $event - 1)" @change-page-size="$emit('change-page-size', $event)" /></template>
    <table><thead><tr><th>게시물 사진</th><th>회원번호</th><th>아이디</th><th>닉네임</th><th>경고정보</th><th>제목</th><th>내용</th><th>추천수</th><th>팔로워</th><th v-if="isPost">댓글</th><th>등록시간</th><th>상태</th><th>관리</th></tr></thead><tbody>
      <AdminTableState v-if="loading" type="loading" :colspan="columns" title="불러오는 중입니다." />
      <AdminTableState v-else-if="error" type="error" :colspan="columns" :title="error" description="다시 조회해 주세요." />
      <AdminTableState v-else-if="!items.length" :colspan="columns" title="검색 결과가 없습니다." />
      <tr v-for="item in (loading || error ? [] : items)" :key="item.id">
        <td><img v-if="item.imageUrl" :src="item.imageUrl" class="thumbnail" alt="게시물 사진" /><span v-else>-</span></td>
        <td>{{ item.memberId }}</td><td class="long-text">{{ item.socialId || '-' }}</td><td class="long-text">{{ item.nickname || '-' }}</td><td><BaseButton variant="outline" size="sm" @click="$emit('member-history', item.memberId)">경고 {{ item.warningCount ?? 0 }} · 이력</BaseButton></td>
        <td class="long-text">{{ isPost ? item.title : item.postTitle }}</td><td class="long-text">{{ item.content }}</td><td>{{ item.likeCount }}</td><td title="팔로워 데이터 미지원">미지원</td><td v-if="isPost">{{ item.commentCount }}</td>
        <td>{{ format(item.createdAt) }}</td><td>{{ statusLabel(item.status) }}<span v-if="!isPost && item.postStatus !== 'ACTIVE'"> (게시글 {{ statusLabel(item.postStatus) }})</span></td>
        <td><div class="actions"><BaseButton v-if="isPost ? item.status !== 'DELETED' : item.status === 'ACTIVE'" variant="danger" size="sm" @click="$emit(isPost ? 'delete-post' : 'delete-comment', item)">{{ isPost ? '게시글 삭제' : '댓글 삭제' }}</BaseButton><BaseButton v-if="!isPost && item.postStatus !== 'DELETED'" variant="danger" size="sm" @click="$emit('delete-post', item)">게시글 삭제</BaseButton><BaseButton variant="outline" size="sm" @click="$emit('member-action', item.memberId, 'WARN')">경고</BaseButton><BaseButton variant="outline" size="sm" @click="$emit('member-action', item.memberId, 'BAN')">정지</BaseButton><BaseButton variant="outline" size="sm" @click="$emit('member-action', item.memberId, 'PERMANENT_WITHDRAWAL')">영구탈퇴</BaseButton></div></td>
      </tr>
    </tbody></table>
  </AdminTableCard>
</template>
<script setup>
import { computed } from 'vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
const props = defineProps({ isPost: Boolean, items: { type: Array, required: true }, loading: Boolean, error: { type: String, default: '' }, pagination: { type: Object, required: true }, todayCount: { type: Number, default: 0 } })
defineEmits(['change-page', 'change-page-size', 'delete-post', 'delete-comment', 'member-action', 'member-history'])
const columns = computed(() => props.isPost ? 13 : 12)
function format(value) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
function statusLabel(value) { return ({ ACTIVE: '정상', DELETED: '삭제', HIDDEN: '숨김' })[value] || value || '-' }
</script>
<style scoped>
.thumbnail { width: 42px; height: 42px; object-fit: cover; border-radius: var(--admin-control-radius); }
.long-text { overflow-wrap: anywhere; }
.actions { display: flex; flex-wrap: wrap; gap: 5px; justify-content: center; }
</style>
