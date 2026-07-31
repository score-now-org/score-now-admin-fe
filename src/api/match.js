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

// 중계 패널 경기 상세 조회 API
export const getAdminMatchDetail = async (matchId) => {
  const response = await client.get(`/api/v1/admin/matches/${matchId}/detail`);

  return response.data?.data ?? response.data;
};

// 중계 멘트 등록 API
export const createMatchCommentary = async (matchId, payload) => {
  const formData = new FormData();
  const { image, ...data } = payload;

  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  if (image) {
    formData.append('image', image);
  }

  const response = await client.post(`/api/v1/matches/${matchId}/commentaries`, formData);

  return response.data?.data ?? response.data;
};

// 중계 멘트 목록 조회 API
export const getMatchCommentaries = async (matchId) => {
  const response = await client.get(`/api/v1/matches/${matchId}/commentaries`);

  return response.data?.data ?? response.data;
};

// 경기 등록 API
export const createAdminMatch = async (payload) => {
  const response = await client.post('/api/v1/admin/matches', payload);

  return response.data?.data ?? response.data;
};

// 경기 정보 업데이트 API
export const updateAdminMatch = async (matchId, payload) => {
  const response = await client.patch(`/api/v1/admin/matches/${matchId}`, payload);

  return response.data?.data ?? response.data;
};

// 경기 등록 팀 후보 검색 API
export const getMatchTeamCandidates = async (params) => {
  const response = await client.get('/api/v1/admin/matches/team-candidates', { params });

  return response.data?.data ?? response.data;
};
