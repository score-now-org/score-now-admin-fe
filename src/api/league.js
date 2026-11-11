import client from './client';

const unwrapData = (response) => response.data?.data ?? response.data;

const buildLeagueMultipartForm = (payload, image) => {
  const formData = new FormData();
  formData.append(
    'request',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  );

  if (image) {
    formData.append('image', image);
  }

  return formData;
};

// 리그 검색 옵션 조회 API
export const getLeagueAdminOptions = async () => {
  const response = await client.get('/api/v1/admin/leagues/search-options');

  return unwrapData(response);
};

// 리그 목록 조회 API
export const getAdminLeagues = async (params) => {
  const response = await client.get('/api/v1/admin/leagues', { params });

  return unwrapData(response);
};

// 리그 단건 조회 API
export const getAdminLeague = async (leagueId) => {
  const response = await client.get(`/api/v1/admin/leagues/${leagueId}`);

  return unwrapData(response);
};

// 리그 등록 API
export const createAdminLeague = async (payload, image = null) => {
  const response = await client.post(
    '/api/v1/admin/leagues',
    buildLeagueMultipartForm(payload, image),
  );

  return unwrapData(response);
};

// 리그 정보 수정 API
export const updateAdminLeague = async (leagueId, payload, image = null) => {
  const response = await client.put(
    `/api/v1/admin/leagues/${leagueId}`,
    buildLeagueMultipartForm(payload, image),
  );

  return unwrapData(response);
};

// 리그 외부 API ID 수정 API
export const updateLeagueApiLeagueId = async (leagueId, payload) => {
  const response = await client.patch(
    `/api/v1/admin/leagues/${leagueId}/external-mapping/api-league-id`,
    payload,
  );

  return unwrapData(response);
};

// 리그 외부 API 동기화 여부 수정 API
export const updateLeagueSyncEnabled = async (leagueId, payload) => {
  const response = await client.patch(
    `/api/v1/admin/leagues/${leagueId}/external-mapping/sync-enabled`,
    payload,
  );

  return unwrapData(response);
};

// 리그 삭제 API
export const deleteAdminLeague = async (leagueId) => {
  const response = await client.delete(`/api/v1/admin/leagues/${leagueId}`);

  return unwrapData(response);
};

// 리그 시즌 등록 API
export const createLeagueSeason = async (payload) => {
  const response = await client.post('/api/v1/admin/league-seasons', payload);

  return unwrapData(response);
};

// 리그 시즌 검색 API
export const getLeagueSeasons = async (params) => {
  const response = await client.get('/api/v1/admin/league-seasons', { params });

  return unwrapData(response);
};

// 리그 시즌 수정 API
export const updateLeagueSeason = async (leagueSeasonId, payload) => {
  const response = await client.patch(`/api/v1/admin/league-seasons/${leagueSeasonId}`, payload);

  return unwrapData(response);
};

// 리그 시즌 삭제 API
export const deleteLeagueSeason = async (leagueSeasonId) => {
  const response = await client.delete(`/api/v1/admin/league-seasons/${leagueSeasonId}`);

  return unwrapData(response);
};

// 리그 시즌 순위 등록 API
export const createLeagueSeasonStandings = async (payload) => {
  const response = await client.post('/api/v1/admin/league-season-standings', payload);

  return unwrapData(response);
};

// 리그 시즌 순위 검색 API
export const getLeagueSeasonStandings = async (params) => {
  const response = await client.get('/api/v1/admin/league-season-standings', { params });

  return unwrapData(response);
};

// 리그 시즌 순위 타입 수정 API
export const updateLeagueSeasonStandingsType = async (leagueSeasonId, payload) => {
  const response = await client.patch(
    `/api/v1/admin/league-season-standings/${leagueSeasonId}/type`,
    payload,
  );

  return unwrapData(response);
};

// 리그 시즌 순위 삭제 API
export const deleteLeagueSeasonStandings = async (leagueSeasonId) => {
  const response = await client.delete(`/api/v1/admin/league-season-standings/${leagueSeasonId}`);

  return unwrapData(response);
};

// 리그 시즌 순위 이미지 업로드 API
export const uploadLeagueSeasonStandingsImage = async (leagueSeasonId, image) => {
  const formData = new FormData();
  formData.append('image', image);

  const response = await client.post(
    `/api/v1/admin/league-season-standings/${leagueSeasonId}/image`,
    formData,
  );

  return unwrapData(response);
};

// 리그 시즌 순위 외부 데이터 동기화 API
export const syncLeagueSeasonStandingsData = async (leagueSeasonId) => {
  const response = await client.post(`/api/v1/admin/league-season-standings/${leagueSeasonId}/sync`);

  return unwrapData(response);
};

// 리그 시즌 순위 그룹 표시 설정 조회 API
export const getLeagueSeasonStandingsGroupMappings = async (leagueSeasonId) => {
  const response = await client.get(
    `/api/v1/admin/league-season-standings/${leagueSeasonId}/group-mappings`,
  );

  return unwrapData(response);
};

// 리그 시즌 순위 그룹 표시 설정 수정 API
export const updateLeagueSeasonStandingsGroupMappings = async (leagueSeasonId, payload) => {
  const response = await client.put(
    `/api/v1/admin/league-season-standings/${leagueSeasonId}/group-mappings`,
    payload,
  );

  return unwrapData(response);
};
