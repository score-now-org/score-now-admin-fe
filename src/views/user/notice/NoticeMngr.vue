<template>
  <AdminListPage :title="`${subject} 관리`">
    <template #header-actions><BaseButton variant="success" :disabled="busy" @click="openEditor(null)">+ {{ subject }} 등록</BaseButton></template>
    <AdminFilterCard :aria-label="`${subject} OS 필터`">
      <div class="field-group"><label for="notice-filter">OS</label><BaseSelect id="notice-filter" :model-value="platform" :disabled="loading || busy" @update:model-value="setPlatform"><option value="">전체</option><option value="ANDROID">Android</option><option value="IOS">iOS</option></BaseSelect></div>
    </AdminFilterCard>
    <p class="description">수정·노출 설정·순서·삭제는 임시 저장되며 등록하기를 눌러야 앱에 반영됩니다.</p>
    <p v-if="message" role="status" class="notice">{{ message }}</p><p v-if="actionError" class="modal-error" role="alert">{{ actionError }}</p>
    <AdminTableCard :scroll-label="`${subject} 목록`" table-min-width="860px">
      <template #summary><strong>{{ subject }} 목록</strong><span>총 {{ totalElements }}건</span><span v-if="pending === true">앱에 반영되지 않은 변경이 있습니다.</span><span v-else-if="pending === null && !loading">반영 상태를 확인하지 못했습니다.</span></template>
      <template #toolbar-actions><AdminTablePagination :page="page + 1" :total-pages="Math.max(1, totalPages)" :page-size="size" :loading="loading || busy" @change-page="changePage" @change-page-size="changeSize" /></template>
      <table><thead><tr><th class="order">순서</th><th class="number">번호</th><th>제목 / 내용</th><th class="platform">OS</th><th class="date">등록 일시</th><th class="state">노출 설정 / 앱 상태</th><th class="manage">관리</th></tr></thead><tbody>
        <AdminTableState v-if="loading" type="loading" :colspan="7" title="불러오는 중입니다." />
        <AdminTableState v-else-if="error" type="error" :colspan="7" :title="error" description="다시 조회해 주세요." />
        <AdminTableState v-else-if="!items.length" :colspan="7" :title="`등록된 ${subject}이 없습니다.`" />
        <tr v-for="(item, index) in (loading || error ? [] : items)" :key="item.id">
          <td><div class="actions"><span>{{ item.sortOrder }}</span><BaseButton variant="outline" size="sm" :disabled="busy || (index === 0 && page === 0)" :aria-label="`${item.title} 위로 이동`" @click="move(item, index, -1)">↑</BaseButton><BaseButton variant="outline" size="sm" :disabled="busy || (index === items.length - 1 && page + 1 >= totalPages)" :aria-label="`${item.title} 아래로 이동`" @click="move(item, index, 1)">↓</BaseButton></div></td>
          <td>{{ item.id }}</td><td class="content"><button class="content-link" :disabled="busy" @click="openEditor(item)">{{ item.title }}</button><div class="excerpt">{{ item.content }}</div><span v-if="item.ticker && !news">티커</span><span v-if="news">제목 {{ item.titleColor }} · 본문 {{ item.contentColor }}</span></td>
          <td><BaseBadge variant="blue">{{ labels[item.platform] || item.platform }}</BaseBadge></td><td>{{ format(item.createdAt) }}</td>
          <td><div class="state-actions"><BaseButton variant="outline" size="sm" :disabled="busy" @click="toggle(item)">{{ item.visible ? '노출 → 미노출' : '미노출 → 노출' }}</BaseButton><span>{{ item.published ? '앱 노출 중' : '앱 미노출' }}</span></div></td>
          <td><BaseButton variant="danger" size="sm" :disabled="busy" @click="openDelete(item)">삭제</BaseButton></td>
        </tr>
      </tbody></table>
    </AdminTableCard>
    <BaseButton v-if="error" variant="outline" size="sm" class="retry" @click="fetchNotices">다시 조회</BaseButton>
    <div class="footer"><BaseButton variant="primary" :disabled="loading || busy || !!error || pending === false" @click="openPublish">등록하기</BaseButton></div>
    <NoticeEditor v-model="editorOpen" :item="selected" :news="news" @saved="afterSave" />
    <BaseModal v-model="deleteOpen" :title="`${subject} 삭제`" size="sm" :close-disabled="busy"><p>‘{{ selected?.title }}’ 항목을 삭제하시겠습니까? 등록하기를 눌러야 앱에도 반영됩니다.</p><p v-if="actionError" class="modal-error" role="alert">{{ actionError }}</p><template #footer><BaseButton variant="outline" :disabled="busy" @click="deleteOpen = false">취소</BaseButton><BaseButton variant="danger" :disabled="busy" @click="remove">삭제</BaseButton></template></BaseModal>
    <BaseModal v-model="publishOpen" :title="`${subject} 앱 반영`" size="sm" :close-disabled="busy"><p>임시 저장된 {{ subject }} 변경사항을 모두 앱에 반영하시겠습니까?</p><p v-if="actionError" class="modal-error" role="alert">{{ actionError }}</p><template #footer><BaseButton variant="outline" :disabled="busy" @click="publishOpen = false">취소</BaseButton><BaseButton variant="primary" :disabled="busy" @click="publish">{{ busy ? '반영 중...' : '반영' }}</BaseButton></template></BaseModal>
  </AdminListPage>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import NoticeEditor from './NoticeEditor.vue'
import { deleteNotice, moveNotice, publishNotices, setNoticeVisibility, newsApi } from '@/api/adminNotices.js'
import { useNoticeMngr } from './useNoticeMngr.js'
const props = defineProps({ news: Boolean })
const subject = props.news ? '뉴스·알림' : '공지사항'
const { platform, items, page, size, totalPages, totalElements, pending, loading, error, fetchNotices, setPlatform, changePage, changeSize, neighbor } = useNoticeMngr(props.news)
const labels = { ALL: '공통', ANDROID: 'Android', IOS: 'iOS' }
const editorOpen = ref(false), deleteOpen = ref(false), publishOpen = ref(false), selected = ref(null), busy = ref(false), actionError = ref(''), message = ref('')
function format(value) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
function openEditor(item) { selected.value = item; actionError.value = ''; editorOpen.value = true }
function openDelete(item) { selected.value = item; actionError.value = ''; deleteOpen.value = true }
function openPublish() { actionError.value = ''; publishOpen.value = true }
async function afterSave() { page.value = 0; message.value = '임시 저장했습니다. 등록하기를 눌러 앱에 반영해 주세요.'; await fetchNotices() }
async function perform(action, success) {
  if (busy.value) return false
  busy.value = true; actionError.value = ''; message.value = ''
  try { await action(); message.value = success; return true }
  catch (e) { actionError.value = e.response?.data?.error?.message || '처리하지 못했습니다. 다시 시도해 주세요.'; return false }
  finally { busy.value = false }
}
async function move(item, index, delta) {
  const ok = await perform(async () => { const target = await neighbor(index, delta); if (!target) throw new Error('Missing neighbor'); await (props.news ? newsApi.move : moveNotice)(item.id, target.sortOrder) }, '순서를 임시 저장했습니다.')
  if (ok) await fetchNotices()
}
async function toggle(item) { if (await perform(() => (props.news ? newsApi.visibility : setNoticeVisibility)(item.id, !item.visible), '노출 설정을 임시 저장했습니다.')) await fetchNotices() }
async function remove() { if (await perform(() => (props.news ? newsApi.remove : deleteNotice)(selected.value.id), '삭제를 임시 저장했습니다.')) { deleteOpen.value = false; await fetchNotices() } }
async function publish() { if (await perform(props.news ? newsApi.publish : publishNotices, `${subject} 변경사항을 앱에 반영했습니다.`)) { publishOpen.value = false; await fetchNotices() } }
onMounted(fetchNotices)
</script>

<style scoped>
.field-group { display: flex; flex-direction: column; gap: var(--admin-field-gap); width: 180px; }
.field-group label { color: var(--admin-color-text-label); font-size: var(--admin-font-size-label); }
.description { margin: 0 0 12px; color: var(--admin-color-text-muted); }
.notice { margin: 0 0 12px; }
.order { width: 155px; } .number { width: 75px; } .platform { width: 95px; } .date { width: 145px; } .state { width: 160px; } .manage { width: 80px; }
.content { text-align: left; overflow-wrap: anywhere; }
.content-link { border: 0; background: none; color: var(--admin-color-primary); cursor: pointer; text-align: left; }
.excerpt { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; white-space: pre-wrap; }
.actions, .state-actions { display: flex; justify-content: center; align-items: center; gap: 5px; }
.state-actions { flex-direction: column; }
.footer { display: flex; justify-content: flex-end; margin-top: 14px; }
.retry { margin-top: 12px; }
@container admin-content (max-width: 600px) { .field-group { width: 100%; } }
</style>
