import client from './client';

// 경기 리스트 진입 시, 검색 옵션 조회 API
export const getMatchSearchOptions = async () => {
  const response = await client.get('/api/v1/admin/matches/search-options');

  return response.data?.data ?? response.data;
};

export const getAdminMatches = async (params) => {
  const response = await client.get('/api/v1/admin/matches', { params });

  return response.data?.data ?? response.data;
};
