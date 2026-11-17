import client from './client.js'

const url = '/api/v1/admin/help'
export const getHelp = () => client.get(url)
export const saveHelpDraft = data => client.put(url, data)
export const publishHelp = version => client.post(`${url}/publish`, { version })
export function uploadHelpImage(file) {
  const data = new FormData()
  data.append('image', file)
  return client.post(`${url}/images`, data)
}
