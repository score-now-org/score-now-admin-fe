import client from './client.js'

const url = '/api/v1/admin/forbidden-words'
export const getForbiddenWords = params => client.get(url, { params })
export const createForbiddenWord = data => client.post(url, data)
export const deleteForbiddenWord = id => client.delete(`${url}/${id}`)
