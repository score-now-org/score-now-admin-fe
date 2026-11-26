import client from './client.js'

const url = '/api/v1/admin/app-versions'
export const getAppVersions = params => client.get(url, { params })
export const createAppVersion = data => client.post(url, data)
export const updateAppVersion = (id, data) => client.put(`${url}/${id}`, data)
export const deleteAppVersion = id => client.delete(`${url}/${id}`)
