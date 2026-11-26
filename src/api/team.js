import client from './client'

const unwrapData = (response) => response.data?.data ?? response.data

function buildTeamRequest(payload, image) {
  if (!image) return payload

  const formData = new FormData()
  formData.append('request', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  formData.append('image', image)
  return formData
}

export const getTeamAdminOptions = async () => {
  const response = await client.get('/api/v1/admin/teams/search-options')
  return unwrapData(response)
}

export const getAdminTeams = async (params) => {
  const response = await client.get('/api/v1/admin/teams', { params })
  return unwrapData(response)
}

export const createAdminTeam = async (payload, image) => {
  const response = await client.post('/api/v1/admin/teams', buildTeamRequest(payload, image))
  return unwrapData(response)
}

export const updateAdminTeam = async (teamId, payload, image) => {
  const response = await client.patch(`/api/v1/admin/teams/${teamId}`, buildTeamRequest(payload, image))
  return unwrapData(response)
}

export const deleteAdminTeam = async (teamId) => {
  const response = await client.delete(`/api/v1/admin/teams/${teamId}`)
  return unwrapData(response)
}
