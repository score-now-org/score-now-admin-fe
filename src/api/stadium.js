import client from './client'

const unwrapData = (response) => response.data?.data ?? response.data

export const getStadiumAdminOptions = async () => {
  const response = await client.get('/api/v1/admin/stadiums/search-options')
  return unwrapData(response)
}

export const getAdminStadiums = async (params) => {
  const response = await client.get('/api/v1/admin/stadiums', { params })
  return unwrapData(response)
}

export const createAdminStadium = async (payload) => {
  const response = await client.post('/api/v1/admin/stadiums', payload)
  return unwrapData(response)
}

export const updateAdminStadium = async (stadiumId, payload) => {
  const response = await client.patch(`/api/v1/admin/stadiums/${stadiumId}`, payload)
  return unwrapData(response)
}

export const deleteAdminStadium = async (stadiumId) => {
  const response = await client.delete(`/api/v1/admin/stadiums/${stadiumId}`)
  return unwrapData(response)
}
