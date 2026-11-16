import client from './client.js'
const baseUrl = '/api/v1/admin/chat/messages'
export const getAdminChatMessages = (params) => client.get(baseUrl, { params })
export const deleteAdminChatMessage = (id, reason) => client.post(`${baseUrl}/${id}/delete`, { reason })
export const getChatReports = (id, page = 0) => client.get(`${baseUrl}/${id}/reports`, { params: { page, size: 20 } })
