import client from './client'

const unwrapData = (response) => response.data?.data ?? response.data

// AOS/iOS 공통 PUSH 발송
export const sendCommonPush = async (payload) => {
  const response = await client.post(
    '/api/v1/admin/pushes/common',
    payload
  )
  return unwrapData(response)
}

// 플랫폼별 PUSH 발송
export const sendPlatformPush = async (platform, payload) => {
  const response = await client.post(
    `/api/v1/admin/pushes/${platform}`,
    payload
  )
  return unwrapData(response)
}

// 플랫폼별 PUSH 발송 이력 조회
export const getPushHistories = async (platform, page = 0, size = 20) => {
  const response = await client.get(
    '/api/v1/admin/pushes/histories',
    {
      params: {
        platform,
        page,
        size,
      },
    }
  )
  return unwrapData(response)
}

// PUSH 이미지 업로드
export const uploadPushImage = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await client.post(
    '/api/v1/admin/pushes/images',
    formData
  )

  return unwrapData(response)
}