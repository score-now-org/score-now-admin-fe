<template>
  <div class="version-content">
    <AdminListPage title="버전 관리">
      <template #header-actions><BaseButton variant="success" @click="openEditor(null)">+ 버전 추가</BaseButton></template>
      <AdminTableCard scroll-label="앱 버전 이력" table-min-width="720px">
        <template #summary><strong>업데이트 내역</strong><span>총 {{ totalElements }}건</span></template>
        <template #toolbar-actions><AdminTablePagination :page="page + 1" :total-pages="Math.max(1, totalPages)" :page-size="size" :loading="loading" @change-page="changePage" @change-page-size="changeSize" /></template>
        <table><thead><tr><th class="number">순서</th><th class="version">버전 정보</th><th class="os">OS</th><th class="date">업데이트 날짜</th><th>업데이트 내용</th><th class="manage">관리</th></tr></thead><tbody>
          <AdminTableState v-if="loading" type="loading" :colspan="6" title="불러오는 중입니다." />
          <AdminTableState v-else-if="error" type="error" :colspan="6" :title="error" description="다시 조회해 주세요." />
          <AdminTableState v-else-if="!items.length" :colspan="6" title="등록된 버전이 없습니다." />
          <tr v-for="(item, index) in (loading || error ? [] : items)" :key="item.id">
            <td>{{ page * size + index + 1 }}</td><td>{{ item.versionName }}</td>
            <td><BaseBadge variant="blue">{{ labels[item.platform] || item.platform }}</BaseBadge></td>
            <td>{{ item.releaseDate }}</td><td class="content">{{ item.content }}</td>
            <td><div class="actions"><BaseButton variant="outline" size="sm" @click="openEditor(item)">수정</BaseButton><BaseButton variant="danger" size="sm" @click="openDelete(item)">삭제</BaseButton></div></td>
          </tr>
        </tbody></table>
      </AdminTableCard>
      <BaseButton v-if="error" variant="outline" size="sm" class="retry" @click="fetchVersions">다시 조회</BaseButton>
      <VersionEditor v-model="editorOpen" :item="selected" @saved="afterSave" />
      <BaseModal v-model="deleteOpen" title="버전 삭제" size="sm" :close-disabled="deleting">
        <p>‘{{ selected?.versionName }}’ 버전 이력을 삭제하시겠습니까?</p>
        <p v-if="deleteError" class="modal-error" role="alert">{{ deleteError }}</p>
        <template #footer><BaseButton variant="outline" :disabled="deleting" @click="deleteOpen = false">취소</BaseButton><BaseButton variant="danger" :disabled="deleting" @click="remove">{{ deleting ? '삭제 중...' : '삭제' }}</BaseButton></template>
      </BaseModal>
    </AdminListPage>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import { deleteAppVersion } from '@/api/adminVersions.js'
import VersionEditor from './VersionEditor.vue'
import { useVersionMngr } from './useVersionMngr.js'
const { items, loading, error, page, size, totalPages, totalElements, fetchVersions, changePage, changeSize } = useVersionMngr()
const labels = { ALL: '공통', IOS: 'iOS', ANDROID: 'Android' }
const editorOpen = ref(false), deleteOpen = ref(false), selected = ref(null), deleting = ref(false), deleteError = ref('')
function openEditor(item) { selected.value = item; editorOpen.value = true }
function openDelete(item) { selected.value = item; deleteError.value = ''; deleteOpen.value = true }
function afterSave() { page.value = 0; return fetchVersions() }
async function remove() {
  if (deleting.value) return
  deleting.value = true; deleteError.value = ''
  try { await deleteAppVersion(selected.value.id); deleteOpen.value = false; await fetchVersions() }
  catch (e) { deleteError.value = e.response?.data?.error?.message || '버전을 삭제하지 못했습니다.' }
  finally { deleting.value = false }
}
onMounted(fetchVersions)
</script>

<style scoped>
.version-content { container: admin-content / inline-size; }
.number { width: 70px; } .version { width: 120px; } .os { width: 100px; } .date { width: 130px; } .manage { width: 145px; }
.content { white-space: pre-wrap; overflow-wrap: anywhere; text-align: left; }
.actions { display: flex; justify-content: center; flex-wrap: wrap; gap: var(--admin-action-gap); }
.retry { margin-top: 12px; }
</style>
