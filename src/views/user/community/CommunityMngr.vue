<template>
  <AdminListPage title="게시판 / 댓글 관리">
    <div class="tabs" role="tablist" aria-label="게시판 관리 구분"><button v-for="item in ['게시글', '댓글']" :key="item" role="tab" :aria-selected="tab === item" :class="{ active: tab === item }" @click="setTab(item)">{{ item }}</button></div>
    <div v-if="isPost" class="tabs" role="group" aria-label="게시글 유형"><button :aria-pressed="!hotOnly" :class="{ active: !hotOnly }" @click="setHot(false)">전체 게시글</button><button :aria-pressed="hotOnly" :class="{ active: hotOnly }" @click="setHot(true)">HOT 게시글 (추천 10 이상)</button></div>
    <CommunityFilters v-model:filter="filter" :is-post="isPost" @search="search" @reset="reset" />
    <CommunityTable :is-post="isPost" :items="items" :loading="loading" :error="error" :pagination="pagination" :today-count="todayCount" @change-page="changePage" @change-page-size="changePageSize" @delete-post="openDeletePost" @delete-comment="openDeleteComment" @member-action="openAction" @member-history="openHistory" />
    <MemberActionModal v-model="actionModal.visible" :user-id="actionModal.userId" :action="actionModal.action" @completed="fetchItems" />
    <MemberHistoryModal v-model="historyModal.visible" :user-id="historyModal.userId" />
    <BaseModal v-model="deleteModal.visible" :title="deleteModal.type === 'post' ? '게시글 삭제' : '댓글 삭제'" size="sm" :close-disabled="deleting">
      <p>{{ deleteModal.type === 'post' ? '게시글과 해당 게시글의 댓글을 모두 삭제하시겠습니까?' : '이 댓글을 삭제하시겠습니까?' }}</p><p v-if="deleteError" class="modal-error" role="alert">{{ deleteError }}</p>
      <template #footer><BaseButton variant="outline" :disabled="deleting" @click="deleteModal.visible = false">취소</BaseButton><BaseButton variant="danger" :disabled="deleting" @click="remove">{{ deleting ? '처리 중...' : '삭제' }}</BaseButton></template>
    </BaseModal>
  </AdminListPage>
</template>
<script setup>
import { computed, onMounted, ref } from 'vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import MemberActionModal from '../components/MemberActionModal.vue'
import CommunityFilters from './CommunityFilters.vue'
import CommunityTable from './CommunityTable.vue'
import MemberHistoryModal from './MemberHistoryModal.vue'
import { useCommunityMngr } from './useCommunityMngr.js'
import { deleteAdminPost, deleteAdminComment } from '@/api/adminCommunity.js'
const { tab, hotOnly, filter, items, loading, error, todayCount, pagination, fetchItems, search, reset, setTab, setHot, changePage, changePageSize } = useCommunityMngr()
const isPost = computed(() => tab.value === '게시글')
const actionModal = ref({ visible: false, userId: null, action: '' })
const historyModal = ref({ visible: false, userId: null })
const deleteModal = ref({ visible: false, id: null, type: 'post' }), deleting = ref(false), deleteError = ref('')
function openAction(userId, action) { actionModal.value = { visible: true, userId, action } }
function openHistory(userId) { historyModal.value = { visible: true, userId } }
function openDeletePost(item) { deleteError.value = ''; deleteModal.value = { visible: true, id: isPost.value ? item.id : item.postId, type: 'post' } }
function openDeleteComment(item) { deleteError.value = ''; deleteModal.value = { visible: true, id: item.id, type: 'comment' } }
async function remove() {
  if (deleting.value) return
  deleting.value = true; deleteError.value = ''
  try { await (deleteModal.value.type === 'post' ? deleteAdminPost(deleteModal.value.id) : deleteAdminComment(deleteModal.value.id)); deleteModal.value.visible = false; await fetchItems() }
  catch (err) { deleteError.value = err.response?.data?.error?.message || '삭제하지 못했습니다.' }
  finally { deleting.value = false }
}
onMounted(fetchItems)
</script>
<style scoped>
.tabs { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
.tabs button { padding: 7px 14px; border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); background: var(--admin-color-surface); color: var(--admin-color-text-control); cursor: pointer; }
.tabs button.active { color: white; background: var(--admin-color-primary); }
.tabs button:focus-visible { outline: 2px solid var(--admin-color-primary); outline-offset: 2px; }
</style>
