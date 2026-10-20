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

// 중계 패널 경기 예정 시각 업데이트 API
export const updateAdminMatchScheduledStartAt = async (matchId, payload) => {
  const response = await client.put(`/api/v1/admin/matches/${matchId}/detail/scheduled-start-at`, payload);

  return response.data?.data ?? response.data;
};

// 중계 패널 경기 상태 업데이트 API
export const updateAdminMatchStatus = async (matchId, payload) => {
  const response = await client.put(`/api/v1/admin/matches/${matchId}/detail/status`, payload);

  return response.data?.data ?? response.data;
};

// 중계 패널 경기 점수 업데이트 API
export const updateAdminMatchScore = async (matchId, payload) => {
  const response = await client.put(`/api/v1/admin/matches/${matchId}/detail/score`, payload);

  return response.data?.data ?? response.data;
};

// 축구 추가시간 업데이트 API
export const updateFootballAdditionalTime = async (matchId, payload) => {
  const response = await client.put(`/api/v1/admin/matches/${matchId}/detail/football/additional-time`, payload);

  return response.data?.data ?? response.data;
};

// 축구 경기 스탯 업데이트 API
export const updateFootballStatistics = async (matchId, payload) => {
  const response = await client.put(`/api/v1/admin/matches/${matchId}/detail/football/statistics`, payload);

  return response.data?.data ?? response.data;
};

// 축구 승부차기 점수 업데이트 API
export const updateFootballShootOutScore = async (matchId, payload) => {
  const response = await client.put(`/api/v1/admin/matches/${matchId}/detail/football/shoot-out-score`, payload);

  return response.data?.data ?? response.data;
};

// 축구 경기 구간 전환 API
export const transitionFootballPhase = async (matchId, payload) => {
  const response = await client.post(`/api/v1/admin/matches/${matchId}/detail/football/clock/phase-transitions`, payload);

  return response.data?.data ?? response.data;
};

// 축구 경기 시간 보정 API
export const correctFootballClock = async (matchId, payload) => {
  const response = await client.post(`/api/v1/admin/matches/${matchId}/detail/football/clock/corrections`, payload);

  return response.data?.data ?? response.data;
};

// 축구 경기 타이머 일시정지 API
export const pauseFootballClock = async (matchId) => {
  const response = await client.post(`/api/v1/admin/matches/${matchId}/detail/football/clock/pause`);

  return response.data?.data ?? response.data;
};

// 축구 경기 타이머 재개 API
export const resumeFootballClock = async (matchId) => {
  const response = await client.post(`/api/v1/admin/matches/${matchId}/detail/football/clock/resume`);

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

  const response = await client.post(`/api/v1/admin/matches/${matchId}/commentaries`, formData);

  return response.data?.data ?? response.data;
};

// 중계 멘트 목록 조회 API
export const getMatchCommentaries = async (matchId) => {
  const response = await client.get(`/api/v1/admin/matches/${matchId}/commentaries`);

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

// 경기의 현재 경기장 매핑 조회 API
export const getMatchStadiumMapping = async (matchId) => {
  const response = await client.get(`/api/v1/admin/matches/${matchId}/stadium`);

  return response.data?.data ?? response.data;
};

// 등록 경기장 배정 API
export const assignMatchStadium = async (matchId, payload) => {
  const response = await client.patch(`/api/v1/admin/matches/${matchId}/stadium`, payload);

  return response.data?.data ?? response.data;
};

// 임시 경기장 배정 API
export const assignMatchTemporaryStadium = async (matchId, payload) => {
  const response = await client.patch(`/api/v1/admin/matches/${matchId}/temporary-stadium`, payload);

  return response.data?.data ?? response.data;
};

// 임시 경기장 매핑 해제 API
export const removeMatchTemporaryStadium = async (matchId) => {
  const response = await client.delete(`/api/v1/admin/matches/${matchId}/temporary-stadium`);

  return response.data?.data ?? response.data;
};
