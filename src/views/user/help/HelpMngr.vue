<template>
  <AdminListPage title="도움말 관리">
    <template #header-actions><BaseButton variant="success" :disabled="loading || busy || !!error || items.length >= 50" @click="openEditor(null)">+ 도움말 등록</BaseButton></template>
    <p class="description">내용, 순서와 삭제 사항은 임시 저장됩니다. 앱에 반영하려면 등록하기를 눌러 주세요.</p>
    <p v-if="message" role="status" class="notice">{{ message }}</p>
    <p v-if="actionError && !editorOpen && !deleteOpen" role="alert" class="modal-error">{{ actionError }} <BaseButton variant="outline" size="sm" @click="load">다시 조회</BaseButton></p>
    <BaseButton v-if="error" variant="outline" size="sm" @click="load">다시 조회</BaseButton>
    <AdminTableCard scroll-label="도움말 목록" table-min-width="650px">
      <template #summary><strong>도움말 내역</strong><span>총 {{ items.length }}건</span><span v-if="unpublished">앱에 반영되지 않은 변경이 있습니다.</span></template>
      <table><thead><tr><th class="order">순서</th><th>내용</th><th class="date">작성 일시</th><th class="manage">관리</th></tr></thead><tbody>
        <AdminTableState v-if="loading" type="loading" :colspan="4" title="불러오는 중입니다." />
        <AdminTableState v-else-if="error" type="error" :colspan="4" :title="error" description="다시 조회해 주세요." />
        <AdminTableState v-else-if="!items.length" :colspan="4" title="등록된 도움말이 없습니다." />
        <tr v-for="(item, index) in (loading || error ? [] : items)" :key="item.id">
          <td><div class="actions"><span>{{ index + 1 }}</span><BaseButton variant="outline" size="sm" :disabled="busy || index === 0" :aria-label="`${index + 1}번 도움말 위로 이동`" @click="move(index, -1)">↑</BaseButton><BaseButton variant="outline" size="sm" :disabled="busy || index === items.length - 1" :aria-label="`${index + 1}번 도움말 아래로 이동`" @click="move(index, 1)">↓</BaseButton></div></td>
          <td class="content"><button class="content-link" :disabled="busy" @click="openEditor(item)">{{ item.content || '이미지 도움말' }}</button><span v-if="item.imageUrl"> · 이미지 첨부</span></td>
          <td>{{ format(item.createdAt) }}</td>
          <td><BaseButton variant="danger" size="sm" :disabled="busy" @click="selected = item; actionError = ''; deleteOpen = true">삭제</BaseButton></td>
        </tr>
      </tbody></table>
    </AdminTableCard>
    <div class="footer"><BaseButton variant="primary" :disabled="loading || busy || !!error || !unpublished" @click="publish">{{ busy ? '처리 중...' : '등록하기' }}</BaseButton></div>
    <HelpEditor v-model="editorOpen" :item="selected" :saving="busy" :save-error="actionError" @save="saveItem" />
    <BaseModal v-model="deleteOpen" title="도움말 삭제" size="sm" :close-disabled="busy">
      <p>선택한 도움말을 삭제하시겠습니까? 등록하기를 눌러야 앱에도 반영됩니다.</p>
      <p v-if="actionError" class="modal-error" role="alert">{{ actionError }}</p>
      <template #footer><BaseButton variant="outline" :disabled="busy" @click="deleteOpen = false">취소</BaseButton><BaseButton variant="danger" :disabled="busy" @click="remove">삭제</BaseButton></template>
    </BaseModal>
  </AdminListPage>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
import HelpEditor from './HelpEditor.vue'
import { getHelp, publishHelp, saveHelpDraft } from '@/api/adminHelp.js'
const items = ref([]), version = ref(-1), unpublished = ref(false), loading = ref(false), busy = ref(false)
const error = ref(''), actionError = ref(''), message = ref(''), editorOpen = ref(false), deleteOpen = ref(false), selected = ref(null)
function apply(snapshot) { items.value = snapshot.items; version.value = snapshot.version; unpublished.value = snapshot.unpublished }
function format(value) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
function openEditor(item) { selected.value = item; actionError.value = ''; editorOpen.value = true }
function errorText(e) { return e.response?.status === 409 ? '다른 관리자가 변경했습니다. 다시 조회해 주세요.' : (e.response?.data?.error?.message || '처리하지 못했습니다. 다시 시도해 주세요.') }
async function load() {
  loading.value = true; error.value = ''
  try { apply((await getHelp()).data.data) } catch { error.value = '도움말을 불러오지 못했습니다.' }
  finally { loading.value = false }
}
async function save(next) {
  if (busy.value) return false
  busy.value = true; actionError.value = ''; message.value = ''
  try {
    const payload = next.map(({ id, content, imageKey }) => ({ id, content, imageKey }))
    apply((await saveHelpDraft({ version: version.value, items: payload })).data.data)
    message.value = '임시 저장했습니다. 등록하기를 눌러 앱에 반영해 주세요.'; return true
  } catch (e) { actionError.value = errorText(e); return false }
  finally { busy.value = false }
}
async function saveItem(item) {
  const next = [...items.value], index = next.findIndex(x => x.id === item.id)
  if (index < 0) next.push(item); else next[index] = item
  if (await save(next)) editorOpen.value = false
}
async function move(index, delta) {
  const next = [...items.value], other = index + delta
  if (other < 0 || other >= next.length) return
  ;[next[index], next[other]] = [next[other], next[index]]
  await save(next)
}
async function remove() { if (await save(items.value.filter(item => item.id !== selected.value.id))) deleteOpen.value = false }
async function publish() {
  if (busy.value) return
  busy.value = true; actionError.value = ''; message.value = ''
  try { apply((await publishHelp(version.value)).data.data); message.value = '도움말을 앱에 반영했습니다.' }
  catch (e) { actionError.value = errorText(e) }
  finally { busy.value = false }
}
onMounted(load)
</script>

<style scoped>
.description { margin: 0 0 12px; color: var(--admin-color-text-muted); }
.notice { margin: 0 0 12px; }
.actions { display: flex; justify-content: center; align-items: center; gap: 5px; }
.order { width: 160px; } .date { width: 160px; } .manage { width: 90px; }
.content { text-align: left; overflow-wrap: anywhere; }
.content-link { border: 0; background: none; color: var(--admin-color-primary); cursor: pointer; text-align: left; white-space: pre-wrap; }
.footer { display: flex; justify-content: flex-end; margin-top: 14px; }
</style>
