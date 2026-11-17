<template>
  <AdminListPage title="약관 관리">
    <p class="description">현재 앱에 게시된 약관을 수정할 수 있습니다. 등록하기를 누르면 앱에 반영됩니다.</p>
    <p v-if="loading" role="status">약관을 불러오는 중입니다.</p>
    <div v-else-if="loadError" role="alert">{{ loadError }} <BaseButton variant="outline" size="sm" @click="load">다시 조회</BaseButton></div>
    <template v-else>
      <p v-if="!published" class="description">게시된 약관이 없습니다. 실제 약관을 입력해 등록해 주세요.</p>
      <p v-else class="description">최종 등록: {{ formatDate(publishedAt) }}</p>
      <p v-if="message" role="status">{{ message }}</p>
      <p v-if="actionError" role="alert" class="error">{{ actionError }}</p>
      <label for="terms-content" class="label">약관 내용</label>
      <BaseTextarea id="terms-content" v-model="content" :disabled="busy" :rows="22" maxlength="100000" placeholder="약관 내용을 입력해 주세요." />
      <div class="actions">
        <BaseButton variant="outline" :disabled="busy" @click="requestReload">다시 조회</BaseButton>
        <BaseButton variant="primary" :disabled="busy || !dirty || !content.trim()" @click="dialog = 'publish'">등록하기</BaseButton>
      </div>
    </template>
    <BaseModal :model-value="!!dialog" :title="dialogTitle" size="sm" :close-disabled="busy" @update:model-value="cancelDialog">
      <p v-if="dialog === 'publish'">입력한 약관이 앱에 바로 반영됩니다. 등록하시겠습니까?</p>
      <p v-else-if="dialog === 'reload'">다시 조회하면 현재 수정한 내용이 사라집니다. 계속하시겠습니까?</p>
      <p v-else>저장하지 않은 약관이 있습니다. 이 페이지를 떠나시겠습니까?</p>
      <template #footer>
        <BaseButton variant="outline" :disabled="busy" @click="cancelDialog">취소</BaseButton>
        <BaseButton variant="primary" :disabled="busy" @click="confirmDialog">{{ busy ? '처리 중...' : '확인' }}</BaseButton>
      </template>
    </BaseModal>
  </AdminListPage>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import BaseTextarea from '@/components/common/BaseTextarea.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { getTerms, publishTerms } from '@/api/adminTerms.js'

const content = ref(''), original = ref(''), version = ref(0), published = ref(false), publishedAt = ref(null)
const loading = ref(true), busy = ref(false), loadError = ref(''), actionError = ref(''), message = ref(''), dialog = ref('')
const dirty = computed(() => content.value !== original.value)
const dialogTitle = computed(() => ({ publish: '약관 등록', reload: '약관 다시 조회', leave: '페이지 이동' }[dialog.value] || '확인'))
let resolveLeave
function apply(snapshot) {
  version.value = snapshot.version; published.value = snapshot.published; publishedAt.value = snapshot.publishedAt
  content.value = snapshot.content || ''; original.value = content.value
}
function formatDate(value) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
async function load() {
  loading.value = true; loadError.value = ''; actionError.value = ''; message.value = ''
  try { apply((await getTerms()).data.data) } catch { loadError.value = '약관을 불러오지 못했습니다.' }
  finally { loading.value = false }
}
function requestReload() { if (dirty.value) dialog.value = 'reload'; else load() }
function cancelDialog() { dialog.value = ''; if (resolveLeave) { resolveLeave(false); resolveLeave = null } }
async function confirmDialog() {
  if (dialog.value === 'leave') { dialog.value = ''; resolveLeave?.(true); resolveLeave = null; return }
  if (dialog.value === 'reload') { dialog.value = ''; await load(); return }
  if (busy.value) return
  busy.value = true; actionError.value = ''; message.value = ''
  try { apply((await publishTerms(version.value, content.value)).data.data); message.value = '약관을 앱에 반영했습니다.' }
  catch (error) { actionError.value = error.response?.status === 409 ? '다른 관리자가 약관을 변경했습니다. 내용을 복사한 뒤 다시 조회해 주세요.' : '약관을 등록하지 못했습니다. 다시 시도해 주세요.' }
  finally { busy.value = false; dialog.value = '' }
}
function beforeUnload(event) { if (dirty.value || busy.value) { event.preventDefault(); event.returnValue = '' } }
onBeforeRouteLeave(() => {
  if (busy.value) return false
  if (!dirty.value) return true
  dialog.value = 'leave'
  return new Promise(resolve => { resolveLeave = resolve })
})
onMounted(() => { window.addEventListener('beforeunload', beforeUnload); load() })
onBeforeUnmount(() => { window.removeEventListener('beforeunload', beforeUnload); resolveLeave?.(false) })
</script>

<style scoped>
.description { margin: 0 0 12px; color: var(--admin-color-text-muted); }
.label { display: block; margin-bottom: 7px; color: var(--admin-color-text-label); font-weight: 700; }
.actions { display: flex; justify-content: flex-end; gap: var(--admin-action-gap); margin-top: 14px; }
.error { color: #c53c46; }
</style>
