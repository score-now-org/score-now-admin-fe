<template>
  <AdminListPage title="금칙어 관리">
    <template #header-actions><BaseButton variant="success" @click="registerOpen = true">+ 금칙어 등록</BaseButton></template>
    <AdminFilterCard aria-label="금칙어 검색 조건">
      <div class="field-group"><label for="word-search">금칙어</label><BaseInput id="word-search" v-model="keyword" maxlength="100" @keyup.enter="search" /></div>
      <template #actions><BaseButton variant="secondary" @click="reset">초기화</BaseButton><BaseButton variant="primary" @click="search">조회</BaseButton></template>
    </AdminFilterCard>
    <AdminTableCard scroll-label="금칙어 목록" table-min-width="600px">
      <template #summary><strong>금칙어 내역</strong><span>총 {{ totalElements }}건</span></template>
      <template #toolbar-actions><AdminTablePagination :page="page + 1" :total-pages="Math.max(1, totalPages)" :page-size="size" :loading="loading" @change-page="changePage" @change-page-size="changeSize" /></template>
      <table><thead><tr><th>금칙어</th><th>변환 문구</th><th>등록 일시</th><th>관리</th></tr></thead><tbody>
        <AdminTableState v-if="loading" type="loading" :colspan="4" title="불러오는 중입니다." />
        <AdminTableState v-else-if="error" type="error" :colspan="4" :title="error" description="다시 조회해 주세요." />
        <AdminTableState v-else-if="!items.length" :colspan="4" title="검색 결과가 없습니다." />
        <tr v-for="item in (loading || error ? [] : items)" :key="item.id"><td class="word">{{ item.word }}</td><td class="word">{{ item.replacement }}</td><td>{{ format(item.createdAt) }}</td><td><BaseButton variant="danger" size="sm" @click="selectDelete(item)">삭제</BaseButton></td></tr>
      </tbody></table>
    </AdminTableCard>
    <ForbiddenWordModal v-model="registerOpen" @created="search" />
    <BaseModal v-model="deleteOpen" title="금칙어 삭제" size="sm" :close-disabled="deleting">
      <p>‘{{ selected?.word }}’ 금칙어를 삭제하시겠습니까?</p><p v-if="deleteError" class="modal-error" role="alert">{{ deleteError }}</p>
      <template #footer><BaseButton variant="outline" :disabled="deleting" @click="deleteOpen = false">취소</BaseButton><BaseButton variant="danger" :disabled="deleting" @click="remove">{{ deleting ? '삭제 중...' : '삭제' }}</BaseButton></template>
    </BaseModal>
  </AdminListPage>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import ForbiddenWordModal from './ForbiddenWordModal.vue'
import { deleteForbiddenWord } from '@/api/forbiddenWord.js'
import { useForbiddenWordMngr } from './useForbiddenWordMngr.js'

const { keyword, items, loading, error, page, size, totalPages, totalElements, fetchWords, search, reset, changePage, changeSize } = useForbiddenWordMngr()
const registerOpen = ref(false), deleteOpen = ref(false), selected = ref(null), deleting = ref(false), deleteError = ref('')
function selectDelete(item) { selected.value = item; deleteError.value = ''; deleteOpen.value = true }
async function remove() {
  if (deleting.value) return
  deleting.value = true; deleteError.value = ''
  try { await deleteForbiddenWord(selected.value.id); deleteOpen.value = false; await fetchWords() }
  catch (err) { deleteError.value = err.response?.data?.error?.message || '금칙어를 삭제하지 못했습니다.' }
  finally { deleting.value = false }
}
function format(value) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
onMounted(fetchWords)
</script>

<style scoped>
.word { overflow-wrap: anywhere; }
</style>
