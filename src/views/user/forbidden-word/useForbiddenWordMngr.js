import { ref } from 'vue'
import { getForbiddenWords } from '../../../api/forbiddenWord.js'

export function useForbiddenWordMngr() {
  const keyword = ref(''), appliedKeyword = ref(''), items = ref([]), loading = ref(false), error = ref('')
  const page = ref(0), size = ref(20), totalPages = ref(0), totalElements = ref(0)
  let requestId = 0
  async function fetchWords() {
    const current = ++requestId; loading.value = true; error.value = ''
    try {
      const result = (await getForbiddenWords({ keyword: appliedKeyword.value, page: page.value, size: size.value })).data.data
      if (current !== requestId) return
      if (result.totalPages > 0 && result.number >= result.totalPages) { page.value = result.totalPages - 1; return fetchWords() }
      items.value = result.content; page.value = result.totalPages ? result.number : 0; size.value = result.size; totalPages.value = result.totalPages; totalElements.value = result.totalElements
    } catch { if (current === requestId) error.value = '금칙어 목록을 불러오지 못했습니다.' }
    finally { if (current === requestId) loading.value = false }
  }
  function search() { appliedKeyword.value = keyword.value.trim(); page.value = 0; return fetchWords() }
  function reset() { keyword.value = ''; return search() }
  function changePage(value) { page.value = value - 1; return fetchWords() }
  function changeSize(value) { size.value = value; page.value = 0; return fetchWords() }
  return { keyword, items, loading, error, page, size, totalPages, totalElements, fetchWords, search, reset, changePage, changeSize }
}
