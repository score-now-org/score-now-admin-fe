import { ref } from 'vue'
import { getAppVersions } from '../../../api/adminVersions.js'

export function useVersionMngr() {
  const items = ref([]), loading = ref(false), error = ref('')
  const page = ref(0), size = ref(20), totalPages = ref(0), totalElements = ref(0)
  let requestId = 0
  async function fetchVersions() {
    const current = ++requestId
    loading.value = true; error.value = ''
    try {
      const result = (await getAppVersions({ page: page.value, size: size.value })).data.data
      if (current !== requestId) return
      if (result.totalPages > 0 && result.number >= result.totalPages) {
        page.value = result.totalPages - 1
        return fetchVersions()
      }
      items.value = result.content; page.value = result.totalPages ? result.number : 0
      size.value = result.size; totalPages.value = result.totalPages; totalElements.value = result.totalElements
    } catch {
      if (current === requestId) error.value = '버전 이력을 불러오지 못했습니다.'
    } finally {
      if (current === requestId) loading.value = false
    }
  }
  function changePage(value) { page.value = value - 1; return fetchVersions() }
  function changeSize(value) { size.value = value; page.value = 0; return fetchVersions() }
  return { items, loading, error, page, size, totalPages, totalElements, fetchVersions, changePage, changeSize }
}
