import client from './client'

const detailPath = (matchId) => `/api/v1/admin/matches/${matchId}/detail/baseball`

export async function getBaseballMatchDetail(matchId) {
  const response = await client.get(detailPath(matchId))
  return response.data?.data ?? response.data
}

const updateSection = (section) => async (matchId, payload) => {
  await client.put(`${detailPath(matchId)}/${section}`, payload)
}

export const updateBaseballScheduledStartAt = updateSection('scheduled-start-at')
export const updateBaseballStatus = updateSection('status')
export const updateBaseballHalfInning = updateSection('half-inning')
export const updateBaseballInningScores = updateSection('inning-scores')
export const updateBaseballStatistics = updateSection('statistics')
export const updateBaseballCount = updateSection('count')
export const updateBaseballBaseStates = updateSection('base-states')
export const updateBaseballPitcher = updateSection('pitcher')
export const updateBaseballBatter = updateSection('batter')
export const updateBaseballDetailedBroadcast = updateSection('detailed-broadcast')
