import client from './client.js'

export const getTerms = () => client.get('/api/v1/admin/terms')
export const publishTerms = (expectedVersion, content) => client.post('/api/v1/admin/terms/publish', { expectedVersion, content })
