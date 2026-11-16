<template>
  <AdminListPage title="응원글 관리">
    <div class="tabs" role="tablist" aria-label="응원글 관리 구분">
      <button v-for="item in tabs" :key="item" role="tab" :aria-selected="tab === item" :class="{ active: tab === item }" @click="setTab(item)">{{ item }}</button>
    </div>
    <ChatFilters v-model:filter="filter" :profile="profile" :sports="sports" :sports-error="sportsError" @search="search" @reset="reset" />
    <ChatPhotoGrid v-if="photos" :items="items" :profile="profile" :loading="loading" :error="error" :pagination="pagination" @change-page="changePage" @change-page-size="changePageSize" @delete="openDeleteImage" @action="openAction" />
    <ChatTable v-else :items="items" :loading="loading" :error="error" :pagination="pagination" @change-page="changePage" @change-page-size="changePageSize" @delete="openDelete" @action="openAction" @reports="openReports" />
    <ChatReportModal v-model="reportModal.visible" :chat-id="reportModal.id" />
    <MemberActionModal v-model="actionModal.visible" :user-id="actionModal.userId" :action="actionModal.action" @completed="fetchItems" />
    <BaseModal v-model="deleteModal.visible" :title="deleteModal.imageOnly ? '채팅 사진 삭제' : '응원글 삭제'" size="sm" :close-disabled="deleting">
      <div class="delete-form"><p>{{ deleteModal.imageOnly ? '채팅 사진을 삭제하시겠습니까?' : '응원글을 삭제하시겠습니까?' }}</p><label for="chat-delete-reason">삭제 사유</label><BaseTextarea id="chat-delete-reason" v-model="deleteModal.reason" maxlength="500" /><p v-if="deleteError" role="alert" class="error">{{ deleteError }}</p></div>
      <template #footer><BaseButton variant="outline" :disabled="deleting" @click="deleteModal.visible = false">취소</BaseButton><BaseButton variant="danger" :disabled="deleting" @click="removeChat">{{ deleting ? '처리 중...' : '삭제' }}</BaseButton></template>
    </BaseModal>
  </AdminListPage>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import MemberActionModal from '../components/MemberActionModal.vue'
import ChatFilters from './ChatFilters.vue'
import ChatTable from './ChatTable.vue'
import ChatPhotoGrid from './ChatPhotoGrid.vue'
import ChatReportModal from './ChatReportModal.vue'
import { useChatMngr } from './useChatMngr.js'
import { deleteAdminChatImage, deleteAdminChatMessage } from '@/api/adminChat'
import { getTeamAdminOptions } from '@/api/team'
const { tabs, tab, items, loading, error, filter, pagination, profile, photos, fetchItems, search, reset, setTab, changePage, changePageSize } = useChatMngr()
const sports = ref([]), sportsError = ref(false)
const actionModal = ref({ visible: false, userId: null, action: '' })
const reportModal = ref({ visible: false, id: null })
function openReports(item) { reportModal.value = { visible: true, id: item.chatId } }
const deleteModal = ref({ visible: false, id: null, reason: '', imageOnly: false }), deleteError = ref(''), deleting = ref(false)
function openAction(userId, action) { actionModal.value = { visible: true, userId, action } }
function openDelete(item) { deleteError.value = ''; deleteModal.value = { visible: true, id: item.chatId, reason: '', imageOnly: false } }
function openDeleteImage(item) { deleteError.value = ''; deleteModal.value = { visible: true, id: item.chatId, reason: '', imageOnly: true } }
async function removeChat() {
  if (deleting.value) return
  if (!deleteModal.value.reason.trim()) { deleteError.value = '삭제 사유를 입력해 주세요.'; return }
  deleting.value = true; deleteError.value = ''
  try { await (deleteModal.value.imageOnly ? deleteAdminChatImage(deleteModal.value.id, deleteModal.value.reason) : deleteAdminChatMessage(deleteModal.value.id, deleteModal.value.reason)); deleteModal.value.visible = false; await fetchItems() }
  catch (err) { deleteError.value = err.response?.data?.error?.message || '삭제하지 못했습니다.' }
  finally { deleting.value = false }
}
onMounted(() => {
  fetchItems()
  getTeamAdminOptions().then(options => { sports.value = Array.isArray(options?.sports) ? options.sports : [] }).catch(() => { sportsError.value = true })
})
</script>
<style scoped>
.tabs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
.tabs button { padding: 7px 14px; border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); background: var(--admin-color-surface); color: var(--admin-color-text-control); cursor: pointer; }
.tabs button.active { color: white; background: var(--admin-color-primary); }
.tabs button:focus-visible { outline: 2px solid var(--admin-color-primary); outline-offset: 2px; }
.delete-form { display: flex; flex-direction: column; gap: 10px; }
.delete-form p { margin: 0; }
.error { color: #b43b48; }
</style>
