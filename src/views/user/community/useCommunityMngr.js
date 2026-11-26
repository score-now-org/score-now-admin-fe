import { ref } from 'vue'
import { getAdminPosts, getAdminComments } from '../../../api/adminCommunity.js'

const emptyFilter = () => ({ keyword: '', socialId: '', nickname: '', memberId: '', postId: '' })
export function useCommunityMngr() {
  const tab = ref('게시글'), hotOnly = ref(false), filter = ref(emptyFilter()), applied = ref(emptyFilter())
  const items = ref([]), loading = ref(false), error = ref(''), todayCount = ref(0)
  const pagination = ref({ currentPage: 0, size: 15, totalPages: 0, totalElements: 0 })
  let requestId = 0
  async function fetchItems() {
    const current = ++requestId; loading.value = true; error.value = ''
    const params = Object.fromEntries(Object.entries(applied.value).filter(([, value]) => value !== ''))
    const isPost = tab.value === '게시글'
    if (isPost) { params.title = params.keyword; delete params.keyword; delete params.postId; params.hotOnly = hotOnly.value }
    Object.assign(params, { page: pagination.value.currentPage, size: pagination.value.size })
    try {
      const result = (await (isPost ? getAdminPosts(params) : getAdminComments(params))).data.data
      if (current !== requestId) return
      const page = isPost ? result.page : result
      if (page.totalPages > 0 && page.number >= page.totalPages) { pagination.value.currentPage = page.totalPages - 1; return fetchItems() }
      items.value = page.content
      pagination.value = { currentPage: page.totalPages ? page.number : 0, size: page.size, totalPages: page.totalPages, totalElements: page.totalElements }
      if (isPost) todayCount.value = result.todayCount
    } catch { if (current === requestId) error.value = '목록을 불러오지 못했습니다.' }
    finally { if (current === requestId) loading.value = false }
  }
  function search() { applied.value = Object.fromEntries(Object.entries(filter.value).map(([key, value]) => [key, value.trim()])); pagination.value.currentPage = 0; return fetchItems() }
  function reset() { filter.value = emptyFilter(); return search() }
  function setTab(value) { tab.value = value; hotOnly.value = false; return reset() }
  function setHot(value) { hotOnly.value = value; pagination.value.currentPage = 0; return fetchItems() }
  function changePage(value) { if (value < 0 || value >= pagination.value.totalPages) return; pagination.value.currentPage = value; return fetchItems() }
  function changePageSize(value) { pagination.value.size = value; pagination.value.currentPage = 0; return fetchItems() }
  return { tab, hotOnly, filter, items, loading, error, todayCount, pagination, fetchItems, search, reset, setTab, setHot, changePage, changePageSize }
}
