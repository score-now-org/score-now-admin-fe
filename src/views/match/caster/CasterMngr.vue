<template>
  <AdminListPage title="캐스터 관리">
    <template #header-actions>
      <BaseButton variant="success" size="md" @click="openCreateModal">
        + 캐스터 등록
      </BaseButton>
    </template>

    <AdminFilterCard aria-label="캐스터 검색 조건">
      <div class="field-group name-search">
        <label for="caster-name">캐스터 이름</label>
        <BaseInput
          id="caster-name"
          v-model="searchForm.casterName"
          maxlength="50"
          placeholder="캐스터 이름을 입력해 주세요."
          @enter="searchCasters"
        />
      </div>

      <template #actions>
        <BaseButton variant="primary" size="md" :disabled="loading" @click="searchCasters">
          {{ loading ? '검색 중' : '검색' }}
        </BaseButton>
      </template>
    </AdminFilterCard>

    <AdminTableCard scroll-label="캐스터 목록" table-min-width="680px">
      <template #summary>
        <strong>검색 결과</strong>
        <span>총 {{ totalElements }}건</span>
      </template>

      <template #toolbar-actions>
        <AdminTablePagination
          v-model:page-size="pageSize"
          :page-size-options="pageSizeOptions"
          :page="page"
          :total-pages="maxPage"
          :loading="loading"
          @change-page="changePage"
          @change-page-size="changePageSize"
        />
      </template>

      <table>
        <colgroup>
          <col class="col-id" />
          <col class="col-photo" />
          <col class="col-name" />
          <col class="col-actions" />
        </colgroup>
        <thead>
          <tr>
            <th>캐스터 ID</th>
            <th>캐스터 사진</th>
            <th>캐스터명</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <AdminTableState
            v-if="loading"
            type="loading"
            :colspan="4"
            title="캐스터 목록을 불러오는 중입니다."
            compact
          />
          <AdminTableState
            v-else-if="listError"
            type="error"
            :colspan="4"
            :title="listError"
            description="잠시 후 다시 검색해 주세요."
          />
          <AdminTableState
            v-else-if="casters.length === 0"
            :colspan="4"
            title="검색 결과가 없습니다."
            description="캐스터 이름을 다시 확인해 주세요."
          />
          <tr v-for="caster in casters" v-else :key="caster.id">
            <td class="id-cell">{{ caster.id }}</td>
            <td>
              <div class="caster-photo">
                <img
                  v-if="caster.imageUrl && !imageErrorIds.has(caster.id)"
                  :src="caster.imageUrl"
                  :alt="`${caster.name} 캐스터 사진`"
                  @error="markImageError(caster.id)"
                />
                <span v-else class="photo-placeholder" :aria-label="`${caster.name} 캐스터 사진 없음`">
                  {{ casterInitial(caster.name) }}
                </span>
              </div>
            </td>
            <td class="caster-name">{{ caster.name }}</td>
            <td>
              <div class="action-buttons">
                <BaseButton
                  variant="danger"
                  size="sm"
                  :disabled="deletingIds.has(caster.id)"
                  @click="deleteCaster(caster, $event)"
                >
                  {{ deletingIds.has(caster.id) ? '삭제 중' : '삭제' }}
                </BaseButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </AdminTableCard>

    <BaseModal
      v-model="createModalOpen"
      title="캐스터 등록"
      size="sm"
      :close-disabled="creating"
    >
      <form class="modal-form" @submit.prevent="createCaster">
        <div class="modal-field">
          <label class="modal-label" for="caster-photo">
            캐스터 사진 <span class="modal-required">*</span>
          </label>

          <div class="photo-upload" :class="{ 'has-image': previewUrl }">
            <div class="photo-preview" aria-live="polite">
              <img v-if="previewUrl" :src="previewUrl" alt="등록할 캐스터 사진 미리보기" />
              <span v-else aria-hidden="true">사진</span>
            </div>
            <div class="upload-copy">
              <strong>{{ newCaster.image ? newCaster.image.name : '사진을 선택해 주세요.' }}</strong>
              <p>JPG, PNG, WEBP · 최대 5MB</p>
              <label class="file-picker" for="caster-photo">
                {{ newCaster.image ? '사진 변경' : '파일 선택' }}
                <input
                  id="caster-photo"
                  ref="fileInput"
                  class="visually-hidden-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  :disabled="creating"
                  @change="selectImage"
                />
              </label>
            </div>
          </div>
          <p v-if="fileError" class="modal-error" role="alert">{{ fileError }}</p>
        </div>

        <div class="modal-field">
          <label class="modal-label" for="new-caster-name">
            캐스터명 <span class="modal-required">*</span>
          </label>
          <BaseInput
            id="new-caster-name"
            v-model="newCaster.name"
            maxlength="50"
            placeholder="캐스터명을 입력해 주세요."
            :disabled="creating"
          />
          <p class="modal-help">목록과 경기 중계 화면에 표시될 이름입니다.</p>
        </div>

        <p v-if="formError" class="modal-error form-error" role="alert">{{ formError }}</p>
      </form>

      <template #footer>
        <BaseButton variant="outline" size="md" :disabled="creating" @click="createModalOpen = false">
          취소
        </BaseButton>
        <BaseButton variant="primary" size="md" :disabled="!isNewCasterValid || creating" @click="createCaster">
          {{ creating ? '등록 중' : '캐스터 등록' }}
        </BaseButton>
      </template>
    </BaseModal>

    <div v-if="toastMessage" class="toast" :class="toastType" role="status">
      <span>{{ toastType === 'error' ? '!' : '✓' }}</span>{{ toastMessage }}
    </div>
  </AdminListPage>
</template>

<script setup>
import { useAdminConfirm } from '@/composables/useAdminConfirm'
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { createAdminCaster, deleteAdminCaster, getAdminCasters } from '@/api/caster'
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
import BaseModal from '@/components/common/BaseModal.vue'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const pageSizeOptions = [10, 20, 50]

const casters = ref([])
const loading = ref(false)
const creating = ref(false)
const deletingIds = ref(new Set())
const imageErrorIds = ref(new Set())
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const totalElements = ref(0)
const listError = ref('')
const searchForm = reactive({ casterName: '' })
const appliedSearch = reactive({ casterName: '' })
const createModalOpen = ref(false)
const newCaster = reactive(emptyNewCaster())
const fileInput = ref(null)
const previewUrl = ref('')
const fileError = ref('')
const formError = ref('')
const toastMessage = ref('')
const toastType = ref('success')
let toastTimer

const maxPage = computed(() => Math.max(1, totalPages.value))
const isNewCasterValid = computed(() => Boolean(
  newCaster.name.trim() && newCaster.image && !fileError.value,
))

onMounted(fetchCasters)

onBeforeUnmount(() => {
  revokePreviewUrl()
  window.clearTimeout(toastTimer)
})

watch(createModalOpen, (isOpen) => {
  if (!isOpen && !creating.value) resetCreateForm()
})

function emptyNewCaster() {
  return { name: '', image: null }
}

function normalizeCaster(caster) {
  return {
    ...caster,
    id: caster.id ?? caster.casterId,
    name: caster.name ?? caster.casterName ?? '',
    imageUrl: caster.imageUrl ?? caster.photoUrl ?? caster.profileImageUrl ?? '',
  }
}

function casterInitial(name) {
  return name?.trim().charAt(0) || '?'
}

function markImageError(casterId) {
  imageErrorIds.value = new Set([...imageErrorIds.value, casterId])
}

async function searchCasters() {
  appliedSearch.casterName = searchForm.casterName.trim()
  page.value = 1
  await fetchCasters()
}

async function resetSearch() {
  searchForm.casterName = ''
  appliedSearch.casterName = ''
  page.value = 1
  await fetchCasters()
}

async function fetchCasters() {
  loading.value = true
  listError.value = ''

  try {
    const params = {
      page: page.value - 1,
      size: Number(pageSize.value),
      sort: 'id,asc',
    }
    if (appliedSearch.casterName) params.casterName = appliedSearch.casterName

    const result = await getAdminCasters(params)
    const content = Array.isArray(result) ? result : result?.content
    casters.value = Array.isArray(content) ? content.map(normalizeCaster) : []
    totalElements.value = Number(result?.totalElements ?? casters.value.length)
    totalPages.value = Math.max(1, Number(result?.totalPages ?? 1))
    page.value = Math.min(
      Math.max(1, Number(result?.number ?? page.value - 1) + 1),
      totalPages.value,
    )
    imageErrorIds.value = new Set()
  } catch (error) {
    casters.value = []
    totalElements.value = 0
    totalPages.value = 1
    listError.value = apiErrorMessage(error, '캐스터 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function changePage(nextPage) {
  if (nextPage < 1 || nextPage > maxPage.value || nextPage === page.value) return
  page.value = nextPage
  await fetchCasters()
}

async function changePageSize() {
  page.value = 1
  await fetchCasters()
}

function openCreateModal() {
  resetCreateForm()
  createModalOpen.value = true
}

function selectImage(event) {
  const [file] = event.target.files || []
  fileError.value = ''
  formError.value = ''

  if (!file) {
    setSelectedImage(null)
    return
  }

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    setSelectedImage(null)
    fileError.value = 'JPG, PNG, WEBP 형식의 이미지 파일만 등록할 수 있습니다.'
    event.target.value = ''
    return
  }

  if (file.size > MAX_IMAGE_SIZE) {
    setSelectedImage(null)
    fileError.value = '5MB 이하의 이미지 파일을 선택해 주세요.'
    event.target.value = ''
    return
  }

  setSelectedImage(file)
}

function setSelectedImage(file) {
  revokePreviewUrl()
  newCaster.image = file
  if (file) previewUrl.value = URL.createObjectURL(file)
}

function revokePreviewUrl() {
  if (!previewUrl.value) return
  URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
}

function resetCreateForm() {
  Object.assign(newCaster, emptyNewCaster())
  fileError.value = ''
  formError.value = ''
  revokePreviewUrl()
  if (fileInput.value) fileInput.value.value = ''
}

async function createCaster() {
  if (!isNewCasterValid.value || creating.value) return

  creating.value = true
  formError.value = ''
  const casterName = newCaster.name.trim()

  try {
    await createAdminCaster({ casterName, image: newCaster.image })
    createModalOpen.value = false
    showToast(`${casterName} 캐스터를 등록했습니다.`)
    await resetSearch()
  } catch (error) {
    formError.value = apiErrorMessage(error, '캐스터를 등록하지 못했습니다.')
  } finally {
    creating.value = false
    if (!createModalOpen.value) resetCreateForm()
  }
}

const requestConfirmation = useAdminConfirm()

async function deleteCaster(caster, event) {
  if (!await requestConfirmation({
    title: '캐스터 삭제',
    message: `${caster.name} 캐스터를 삭제하시겠습니까?`,
    confirmLabel: '삭제',
    confirmVariant: 'danger',
  }, event?.currentTarget)) return

  setDeleting(caster.id, true)
  try {
    await deleteAdminCaster(caster.id)
    showToast(`${caster.name} 캐스터를 삭제했습니다.`)
    if (casters.value.length === 1 && page.value > 1) page.value -= 1
    await fetchCasters()
  } catch (error) {
    showToast(apiErrorMessage(error, '캐스터를 삭제하지 못했습니다.'), 'error')
  } finally {
    setDeleting(caster.id, false)
  }
}

function setDeleting(casterId, deleting) {
  const nextIds = new Set(deletingIds.value)
  if (deleting) nextIds.add(casterId)
  else nextIds.delete(casterId)
  deletingIds.value = nextIds
}

function apiErrorMessage(error, fallback) {
  return error?.response?.data?.error?.message
    || error?.response?.data?.message
    || fallback
}

function showToast(message, type = 'success') {
  toastMessage.value = message
  toastType.value = type
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastMessage.value = '' }, 3200)
}
</script>

<style scoped>
.name-search {
  width: 360px;
}

.col-id {
  width: 120px;
}

.col-photo {
  width: 150px;
}

.col-name {
  width: auto;
}

.col-actions {
  width: 130px;
}

.caster-photo {
  display: grid;
  width: 44px;
  height: 44px;
  margin: 0 auto;
  overflow: hidden;
  place-items: center;
  background: var(--admin-color-table-heading-surface);
  border: 1px solid var(--admin-color-border);
  border-radius: 50%;
}

.caster-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  color: var(--admin-color-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.caster-name {
  color: var(--admin-color-text-body);
  font-size: 12px;
  font-weight: 700;
  text-align: left !important;
}

.photo-upload {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 112px;
  padding: 14px;
  background: var(--admin-color-surface-subtle);
  border: 1px dashed var(--admin-color-control-border);
  border-radius: 8px;
}

.photo-upload.has-image {
  background: #fff;
  border-style: solid;
}

.photo-preview {
  display: grid;
  width: 82px;
  height: 82px;
  flex: 0 0 82px;
  overflow: hidden;
  place-items: center;
  color: var(--admin-color-text-subtle);
  font-size: 11px;
  background: var(--admin-color-table-heading-surface);
  border: 1px solid var(--admin-color-border);
  border-radius: 50%;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-copy {
  min-width: 0;
}

.upload-copy strong {
  display: block;
  max-width: 270px;
  overflow: hidden;
  color: var(--admin-color-text-body);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-copy p {
  margin: 5px 0 10px;
  color: var(--admin-color-text-muted);
  font-size: 10px;
}

.file-picker {
  display: inline-flex;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  color: #4b5563;
  font-size: 11px;
  font-weight: 600;
  background: var(--admin-color-surface);
  border: 1px solid #d1d5db;
  border-radius: var(--admin-control-radius);
  cursor: pointer;
}

.file-picker:hover {
  background: var(--admin-color-table-heading-surface);
}

.file-picker:focus-within {
  outline: 2px solid var(--admin-color-primary);
  outline-offset: 2px;
}

.file-picker:has(.visually-hidden-file:disabled) {
  cursor: not-allowed;
  opacity: .5;
}

.visually-hidden-file {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.form-error {
  padding: 9px 10px;
  background: #fff6f6;
  border: 1px solid #f3d3d6;
  border-radius: var(--admin-control-radius);
}

@container admin-content (max-width: 600px) {
  .name-search {
    width: 100%;
  }
}

@media (max-width: 420px) {
  .photo-upload {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
