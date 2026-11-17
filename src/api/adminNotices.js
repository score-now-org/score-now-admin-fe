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

const newsUrl = '/api/v1/admin/news-tickers'
export const newsApi = {
  list: params => client.get(newsUrl, { params }),
  status: () => client.get(`${newsUrl}/status`),
  create: data => client.post(newsUrl, data),
  update: (id, data) => client.put(`${newsUrl}/${id}`, data),
  remove: id => client.delete(`${newsUrl}/${id}`),
  move: (id, sortOrder) => client.put(`${newsUrl}/${id}/order`, { sortOrder }),
  visibility: (id, visible) => client.patch(`${newsUrl}/${id}/visibility`, { visible }),
  publish: () => client.post(`${newsUrl}/publish`),
}
