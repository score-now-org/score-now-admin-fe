import { ref } from 'vue'
import { getNotices, getNoticeStatus, newsApi } from '../../../api/adminNotices.js'

export function useNoticeMngr(news = false) {
  const list = news ? newsApi.list : getNotices
  const getStatus = news ? newsApi.status : getNoticeStatus
  const platform = ref(''), items = ref([]), page = ref(0), size = ref(20)
  const totalPages = ref(0), totalElements = ref(0), pending = ref(null), loading = ref(false), error = ref('')
  let requestId = 0
  const params = (index = page.value) => ({ page: index, size: size.value, ...(platform.value ? { platform: platform.value } : {}) })
  async function fetchNotices() {
    const current = ++requestId; loading.value = true; error.value = ''
    try {
      const [result, status] = await Promise.all([list(params()), getStatus().catch(() => null)])
      if (current !== requestId) return
      const data = result.data.data
      if (data.totalPages > 0 && data.number >= data.totalPages) { page.value = data.totalPages - 1; return fetchNotices() }
      items.value = data.content; page.value = data.totalPages ? data.number : 0; size.value = data.size
      totalPages.value = data.totalPages; totalElements.value = data.totalElements
      pending.value = status?.data?.data?.pending ?? null
    } catch { if (current === requestId) error.value = news ? '뉴스·알림을 불러오지 못했습니다.' : '공지사항을 불러오지 못했습니다.' }
    finally { if (current === requestId) loading.value = false }
  }
  function setPlatform(value) { platform.value = value; page.value = 0; return fetchNotices() }
  function changePage(value) { page.value = value - 1; return fetchNotices() }
  function changeSize(value) { page.value = 0; size.value = value; return fetchNotices() }
  async function neighbor(index, delta) {
    const target = index + delta
    if (target >= 0 && target < items.value.length) return items.value[target]
    const nextPage = page.value + delta
    if (nextPage < 0 || nextPage >= totalPages.value) return null
    const data = (await list(params(nextPage))).data.data.content
    return delta < 0 ? data.at(-1) : data[0]
  }
  return { platform, items, page, size, totalPages, totalElements, pending, loading, error, fetchNotices, setPlatform, changePage, changeSize, neighbor }
}
