import client from './client.js';

const baseUrl = '/api/v1/admin/members';

// 로그인 API
export const loginApi = (data) => {
  return client.post('/api/v1/admin/login', data);
};

export const logoutApi = () => client.post('/api/v1/admin/logout');

// 회원목록 조회 API
export const getMembersList = (params) => {
  return client.get(baseUrl, { params });
};
export const getMemberDetail = (id) => client.get(`${baseUrl}/${id}`);
export const getMemberSecurity = (id) => client.get(`${baseUrl}/${id}/security`);

export const getMemberModerationHistory = (id) => client.get(`${baseUrl}/${id}/moderation-history`);
export const updateMember = (id, data) => client.patch(`${baseUrl}/${id}`, data);
export const applyMemberAction = (id, data) => client.post(`${baseUrl}/${id}/actions`, data);
