import client from './client'

const unwrapData = (response) => response.data?.data ?? response.data

export const getTeamAdminOptions = async () => {
  const response = await client.get('/api/v1/admin/teams/search-options')
  return unwrapData(response)
}

export const getAdminTeams = async (params) => {
  const response = await client.get('/api/v1/admin/teams', { params })
  return unwrapData(response)
}

export const createAdminTeam = async (payload) => {
  const response = await client.post('/api/v1/admin/teams', payload)
  return unwrapData(response)
}

export const updateAdminTeam = async (teamId, payload) => {
  const response = await client.patch(`/api/v1/admin/teams/${teamId}`, payload)
  return unwrapData(response)
}

export const deleteAdminTeam = async (teamId) => {
  const response = await client.delete(`/api/v1/admin/teams/${teamId}`)
  return unwrapData(response)
}
