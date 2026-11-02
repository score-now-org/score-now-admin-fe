
import client from './client'

const unwrapData = (response) => response.data?.data ?? response.data

export const getAdminPlayers = async (params) => {
  const response = await client.get('/api/v1/admin/players', { params })
  return unwrapData(response)
}

// 선수 정보 수정 API
export const updateAdminPlayer = async (playerId, payload) => {
  const response = await client.patch(
    `/api/v1/admin/players/${playerId}`,
    payload
  )

  return unwrapData(response)
}

// 스쿼드 on/off
export const updateAdminPlayerSquad = async (playerTeamDetailId, payload) => {
  const response = await client.patch(
    `/api/v1/admin/players/team-details/${playerTeamDetailId}/squad`,
    payload
  )
  return unwrapData(response)
}


// 선수 등록
export const createAdminPlayer = async (payload) => {
  const response = await client.post('/api/v1/admin/players', payload)
  return unwrapData(response)
}

// Provider 목록 조회
export const getPlayerProviders = async () => {
  const response = await client.get('/api/v1/admin/players/providers')
  return unwrapData(response)
}


// 선수 팀 소속 정보 삭제
export const deleteAdminPlayerTeamDetail = async (playerTeamDetailId) => {
  const response = await client.delete(
    `/api/v1/admin/players/team-details/${playerTeamDetailId}`
  )
  return unwrapData(response)
}


