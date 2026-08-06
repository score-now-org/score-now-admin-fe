import client from './client';

// 로그인 API
export const loginApi = (data) => {
  return client.post('/api/v1/admin/login', data);
};

// 관리자 데이터 조회 API
export const getAdminData = () => {
  return client.get('/api/v1/admin/test');
};