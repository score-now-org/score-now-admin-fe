import client from './client';

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