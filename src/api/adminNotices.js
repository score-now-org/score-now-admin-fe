import client from './client.js'

const url = '/api/v1/admin/notices'
export const getNotices = params => client.get(url, { params })
export const getNoticeStatus = () => client.get(`${url}/status`)
export const createNotice = data => client.post(url, data)
export const updateNotice = (id, data) => client.put(`${url}/${id}`, data)
export const deleteNotice = id => client.delete(`${url}/${id}`)
export const moveNotice = (id, sortOrder) => client.put(`${url}/${id}/order`, { sortOrder })
export const setNoticeVisibility = (id, visible) => client.patch(`${url}/${id}/visibility`, { visible })
export const publishNotices = () => client.post(`${url}/publish`)
