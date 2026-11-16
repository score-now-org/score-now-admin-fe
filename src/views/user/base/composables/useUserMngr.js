import { ref } from 'vue';
import { getMembersList } from '../../../../api/admin.js';

export function useUserMngr() {
  const users = ref([]);
  const loading = ref(false);
  const error = ref(null);
  let latestRequest = 0;

  const tabs = ['회원', '경고회원', '영구탈퇴회원', '탈퇴 회원'];
  const activeTab = ref('회원');

  const tabFilterMap = {
    '회원': {
      status: '',
      minWarningCnt: 0,
    },
    '경고회원': {
      status: '',
      minWarningCnt: 1,
    },
    '영구탈퇴회원': {
      status: 'permanently_withdrawn',
      minWarningCnt: 0,
    },
    '탈퇴 회원': {
      status: 'deleted',
      minWarningCnt: 0,
    },
  };

  const filter = ref({
    nickname: '',
    socialId: '',
    memberId: '',
    provider: '',
    createdFrom: '',
    createdTo: '',
    status: '',
    minWarningCnt: 0,
  });

  const pagination = ref({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    size: 15,
  });

  // 회원 목록 조회
  async function fetchUsers() {
    const requestId = ++latestRequest;
    loading.value = true;
    error.value = null;

    try {

      // 필터 조건 (빈 값 제거) 
      const filterParams  = Object.fromEntries(
        Object.entries(filter.value).filter(
          ([_, value]) => value !== '' && value !== 0
        )
      );

      // 페이지 정보 합치기 
      const params = { 
        ...filterParams,
      page: pagination.value.currentPage,   // 0-based
      size: pagination.value.size || 15,
      };
      

      const response = await getMembersList(params);

      if (requestId !== latestRequest) return;
      const pageData = response.data.data;
      const raw = pageData.content;

      // 백엔드 데이터를 화면에서 사용할 형태로 변환
      users.value = raw.map((u) => ({
        memberId: u.memberId,
        provider: u.provider?.toLowerCase(),
        nickname: u.nickname,
        socialId: u.socialId,
        warningCnt: u.warningCnt,
        countryCode: u.countryCode,
        createdAt: u.createdAt?.slice(0, 10),
        updatedAt: u.updatedAt?.slice(0, 10),
        status: u.status?.toLowerCase(),
        profileImageUrl: u.profileImageUrl || null,
      }));

      // 페이징 정보 갱신 
      pagination.value = {
        totalElements: pageData.totalElements,
        totalPages: pageData.totalPages,
        currentPage: pageData.number,
        size: pageData.size,
      };



    } catch (e) {
      if (requestId !== latestRequest) return;
      error.value = '목록을 불러오지 못했습니다.';
      console.error('회원목록 조회 실패:', e);
    } finally {
      if (requestId === latestRequest) loading.value = false;
    }
  }

  function changePage(page) {
  // 범위 벗어나면 무시 (이전/다음 버튼 안전장치)
  if (page < 0 || page > pagination.value.totalPages - 1) return;

  pagination.value.currentPage = page;   // ref 이므로 .value 필수!
  return fetchUsers();
}

  function changePageSize(size) {
    pagination.value.size = size;
    pagination.value.currentPage = 0;
    return fetchUsers();
  }

  // 탭 변경
  function onTabChange(tab) {
    activeTab.value = tab;

    filter.value = {
      nickname: '',
      socialId: '',
      memberId: '',
      provider: '',
      createdFrom: '',
      createdTo: '',
      ...tabFilterMap[tab],
    };

    pagination.value.currentPage = 0;
    return fetchUsers();
  }

  // 검색조건 초기화
  function resetFilter() {
    filter.value = {
      nickname: '',
      socialId: '',
      memberId: '',
      provider: '',
      createdFrom: '',
      createdTo: '',
      ...tabFilterMap[activeTab.value],
    };

    pagination.value.currentPage = 0;
    return fetchUsers();
  }

  // 검색
  function doSearch() {
    pagination.value.currentPage = 0;
    return fetchUsers();
  }

  function statusLabel(status) {
    return {
      active: '활동중',
      inactive: '비활동',
      deleted: '탈퇴',
      banned: '정지',
      permanently_withdrawn: '영구탈퇴',
    }[status] || status;
  }

  function statusVariant(status) {
    return {
      active: 'green',
      inactive: 'gray',
      deleted: 'gray',
      banned: 'red',
      permanently_withdrawn: 'red',
    }[status] || 'gray';
  }

    return {
    users,
    loading,
    error,
    tabs,
    activeTab,
    filter,
    pagination,
    changePage,
    changePageSize,
    fetchUsers,
    onTabChange,
    resetFilter,
    doSearch,
    statusLabel,
    statusVariant,
  };

}