import { computed, ref } from 'vue'
import { getAdminChatMessages } from '../../../api/adminChat.js'
import { getMembersList } from '../../../api/admin.js'

export function useChatMngr() {
  const tabs = ['채팅', '신고 채팅', '채팅 사진', '프로필 사진']
  const tab = ref(tabs[0]), items = ref([]), loading = ref(false), error = ref('')
  const filter = ref({ socialId: '', nickname: '', memberId: '', matchId: '', sportId: '' })
  const pagination = ref({ currentPage: 0, size: 15, totalPages: 0, totalElements: 0 })
  const profile = computed(() => tab.value === '프로필 사진')
  const photos = computed(() => profile.value || tab.value === '채팅 사진')
  let requestId = 0
  async function fetchItems() {
    const current = ++requestId
    loading.value = true; error.value = ''
    const params = Object.fromEntries(Object.entries(filter.value).filter(([, value]) => value !== ''))
    if (profile.value) { delete params.matchId; delete params.sportId; params.hasProfileImage = true }
    else { params.reportedOnly = tab.value === '신고 채팅'; params.imageOnly = tab.value === '채팅 사진' }
    Object.assign(params, { page: pagination.value.currentPage, size: pagination.value.size })
    try {
      const response = profile.value ? await getMembersList(params) : await getAdminChatMessages(params)
      if (current !== requestId) return
      const page = response.data.data
      if (page.totalPages > 0 && page.number >= page.totalPages) {
        pagination.value.currentPage = page.totalPages - 1
        return fetchItems()
      }
      items.value = page.content
      pagination.value = { currentPage: page.totalPages ? page.number : 0, size: page.size, totalPages: page.totalPages, totalElements: page.totalElements }
    } catch (err) { if (current === requestId) error.value = '목록을 불러오지 못했습니다.' }
    finally { if (current === requestId) loading.value = false }
  }
  function search() { pagination.value.currentPage = 0; return fetchItems() }
  function reset() { filter.value = { socialId: '', nickname: '', memberId: '', matchId: '', sportId: '' }; return search() }
  function setTab(value) { tab.value = value; return reset() }
  function changePage(page) { if (page < 0 || page >= pagination.value.totalPages) return; pagination.value.currentPage = page; return fetchItems() }
  function changePageSize(size) { pagination.value.size = size; return search() }
  return { tabs, tab, items, loading, error, filter, pagination, profile, photos, fetchItems, search, reset, setTab, changePage, changePageSize }
}
