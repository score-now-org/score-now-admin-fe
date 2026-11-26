import client from './client.js'

const base = '/api/v1/admin/community'
export const getAdminPosts = params => client.get(`${base}/posts`, { params })
export const getAdminComments = params => client.get(`${base}/comments`, { params })
export const deleteAdminPost = id => client.delete(`${base}/posts/${id}`)
export const deleteAdminComment = id => client.delete(`${base}/comments/${id}`)
export const getAdminCommunityImages = params => client.get(`${base}/images`, { params })
export const deleteAdminCommunityImage = id => client.delete(`${base}/images/${id}`)
