import client from './client'

const BASE_PATH = '/api/v1/admin/casters'

function unwrapData(response) {
  return response.data?.data ?? response.data
}

export async function getAdminCasters(params) {
  const response = await client.get(BASE_PATH, { params })
  return unwrapData(response)
}

export async function createAdminCaster({ casterName, image }) {
  const formData = new FormData()
  formData.append(
    'data',
    new Blob([JSON.stringify({ casterName })], { type: 'application/json' }),
  )
  formData.append('image', image)

  const response = await client.post(BASE_PATH, formData)
  return unwrapData(response)
}

export async function deleteAdminCaster(casterId) {
  const response = await client.delete(`${BASE_PATH}/${casterId}`)
  return unwrapData(response)
}
