<template>
  <AdminListPage title="문의하기">
    <AdminFilterCard aria-label="문의 검색">
      <div class="field-group"><label for="inquiry-nickname">닉네임</label><BaseInput id="inquiry-nickname" v-model="filters.nickname" placeholder="닉네임 입력" @enter="search" /></div>
      <div class="field-group"><label for="inquiry-user">회원번호</label><BaseInput id="inquiry-user" v-model="filters.userId" inputmode="numeric" placeholder="회원번호 입력" @enter="search" /></div>
      <div class="field-group"><label for="inquiry-from">문의 등록일</label><div class="dates"><BaseInput id="inquiry-from" v-model="filters.from" type="date" aria-label="등록 시작일" /><span>~</span><BaseInput v-model="filters.to" type="date" aria-label="등록 종료일" /></div></div>
      <div class="field-group"><label for="inquiry-status">답변 상태</label><BaseSelect id="inquiry-status" v-model="filters.status"><option value="">전체</option><option value="WAITING">답변대기</option><option value="ANSWERED">답변완료</option></BaseSelect></div>
      <template #actions><BaseButton :disabled="loading" @click="search">조회</BaseButton><BaseButton variant="outline" :disabled="loading" @click="reset">초기화</BaseButton></template>
    </AdminFilterCard>
    <p v-if="filterError" role="alert" class="error">{{ filterError }}</p>
    <AdminTableCard scroll-label="문의 목록" table-min-width="900px">
      <template #summary><strong>총 {{ total }}개</strong></template>
      <table><thead><tr><th>번호</th><th>제목</th><th>회원번호</th><th>닉네임</th><th>문의 등록일</th><th>답변 상태</th><th>답변일</th></tr></thead><tbody>
        <AdminTableState v-if="loading" type="loading" :colspan="7" title="문의를 불러오는 중입니다." />
        <AdminTableState v-else-if="error" type="error" :colspan="7" :title="error" />
        <AdminTableState v-else-if="!items.length" :colspan="7" title="문의 내역이 없습니다." />
        <tr v-for="item in items" v-else :key="item.id"><td>{{ item.id }}</td><td><button class="title-link" @click="selectedId = item.id">{{ item.title }}</button></td><td>{{ item.userId }}</td><td>{{ item.nickname || '-' }}</td><td>{{ format(item.createdAt) }}</td><td>{{ item.status === 'ANSWERED' ? '답변완료' : '답변대기' }}</td><td>{{ format(item.answeredAt) }}</td></tr>
      </tbody></table>
    </AdminTableCard>
    <div class="pagination"><AdminTablePagination :page="page + 1" :total-pages="Math.max(totalPages, 1)" :page-size="size" :loading="loading" @change-page="changePage" @change-page-size="changeSize" /></div>
    <InquiryDetail v-if="selectedId !== null" :id="selectedId" @close="selectedId = null" @saved="onSaved" />
  </AdminListPage>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import InquiryDetail from './InquiryDetail.vue'
import { getInquiries } from '@/api/adminInquiry.js'
const filters = reactive({ nickname: '', userId: '', from: '', to: '', status: '' })
const items = ref([]), total = ref(0), page = ref(0), size = ref(20), totalPages = ref(1)
const loading = ref(false), error = ref(''), filterError = ref(''), selectedId = ref(null)
let applied = {}, sequence = 0
function format(date) { return date ? date.replace('T', ' ').slice(0, 16) : '-' }
async function load() {
  const request = ++sequence; loading.value = true; error.value = ''
  try {
    const response = await getInquiries({ ...applied, page: page.value, size: size.value })
    if (request !== sequence) return
    const data = response.data.data; items.value = data.content; total.value = data.totalElements; totalPages.value = data.totalPages
  } catch (e) { if (request === sequence) { error.value = e.response?.status === 401 ? '관리자 로그인이 필요합니다.' : '문의를 불러오지 못했습니다.'; items.value = [] } }
  finally { if (request === sequence) loading.value = false }
}
function search() {
  filterError.value = ''
  if (filters.userId && !/^[1-9]\d*$/.test(filters.userId)) { filterError.value = '회원번호는 양의 정수로 입력해 주세요.'; return }
  if (filters.from && filters.to && filters.from > filters.to) { filterError.value = '시작일은 종료일보다 늦을 수 없습니다.'; return }
  applied = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '')); page.value = 0; load()
}
function reset() { Object.assign(filters, { nickname: '', userId: '', from: '', to: '', status: '' }); search() }
function changePage(value) { page.value = value - 1; load() }
function changeSize(value) { size.value = value; page.value = 0; load() }
function onSaved() { selectedId.value = null; load() }
onMounted(load)
</script>
<style scoped>
.dates { display: flex; align-items: center; gap: 6px; }
.title-link { padding: 0; border: 0; background: none; color: var(--admin-color-primary); text-decoration: underline; cursor: pointer; overflow-wrap: anywhere; }
.pagination { margin-top: 14px; }
.error { color: #c53c46; }
</style>
