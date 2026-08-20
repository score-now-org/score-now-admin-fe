import client from './client'

const BASE_PATH = '/api/v1/admin/featured-matches'

function unwrap(response) {
  return response.data?.data ?? response.data
}

export async function getFeaturedMatches(date) {
  const response = await client.get(BASE_PATH, { params: { date } })
  return unwrap(response)
}

export async function getFeaturedMatchCandidates(date) {
  const response = await client.get(`${BASE_PATH}/candidates`, { params: { date } })
  return unwrap(response)
}

export async function createFeaturedMatches(payload) {
  await client.post(BASE_PATH, payload)
}

export async function updateFeaturedMatchesOrder(payload) {
  const response = await client.patch(`${BASE_PATH}/order`, payload)
  return unwrap(response)
}

export async function deleteFeaturedMatch(featuredMatchId) {
  const response = await client.delete(`${BASE_PATH}/${featuredMatchId}`)
  return unwrap(response)
}
