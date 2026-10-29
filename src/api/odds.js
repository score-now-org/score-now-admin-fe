import client from './client'

const overseasOddsPath = (matchId) => `/api/v1/admin/matches/${matchId}/odds/overseas`

export const getOverseasOddsManagementOverview = async (matchId) => {
  const response = await client.get(overseasOddsPath(matchId))

  return response.data?.data ?? response.data
}

export const registerOverseasManualOdds = async (matchId, payload) => {
  const response = await client.post(`${overseasOddsPath(matchId)}/manual-histories`, payload)

  return response.data?.data ?? response.data
}

export const getOverseasManualOddsHistories = async (matchId, { page = 0, marketTypes = [] } = {}) => {
  const params = { page }

  if (marketTypes.length) {
    params.marketTypes = marketTypes.join(',')
  }

  const response = await client.get(`${overseasOddsPath(matchId)}/manual-histories`, { params })

  return response.data?.data ?? response.data
}

export const invalidateOverseasManualOddsHistory = async (matchId, historyId) => {
  const response = await client.delete(`${overseasOddsPath(matchId)}/manual-histories/${historyId}`)

  return response.data?.data ?? response.data
}

export const invalidateAllOverseasManualOddsHistories = async (matchId) => {
  const response = await client.delete(`${overseasOddsPath(matchId)}/manual-histories`)

  return response.data?.data ?? response.data
}

export const changeOverseasOddsDisplayMode = async (matchId, displayMode) => {
  const response = await client.patch(`${overseasOddsPath(matchId)}/display-mode`, { displayMode })

  return response.data?.data ?? response.data
}
