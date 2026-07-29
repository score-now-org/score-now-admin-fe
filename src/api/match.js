import client from './client';

// 검색 옵션 조회 API
export const getMatchSearchOptions = async () => {
  const response = await client.get('/api/v1/admin/matches/search-options');

  return response.data?.data ?? response.data;
};

// 경기 목록 조회 API
export const getAdminMatches = async (params) => {
  const response = await client.get('/api/v1/admin/matches', { params });

  return response.data?.data ?? response.data;
};

// 경기 정보 업데이트 API
export const updateAdminMatch = async (matchId, payload) => {
  const response = await client.patch(`/api/v1/admin/matches/${matchId}`, payload);

  return response.data?.data ?? response.data;
};
