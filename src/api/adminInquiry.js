import client from './client.js'

const base = '/api/v1/admin/inquiries'
const config = () => ({ headers: { Authorization: localStorage.getItem('adminToken') || '' } })
export const getInquiries = params => client.get(base, { ...config(), params })
export const getInquiry = id => client.get(`${base}/${id}`, config())
export const getInquiryImage = id => client.get(`${base}/${id}/image`, { ...config(), responseType: 'blob' })
export const saveInquiryAnswer = (id, data) => client.put(`${base}/${id}/answer`, data, config())
