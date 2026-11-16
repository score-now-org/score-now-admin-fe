import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import client from '../src/api/client.js'

const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
}
const { useAuthStore } = await import('../src/stores/auth.js')

test('session verification is cached and logout clears stored credentials', async () => {
  storage.clear()
  setActivePinia(createPinia())
  const auth = useAuthStore()
  auth.setToken('first-token', { id: 'admin' })
  assert.equal(localStorage.getItem('adminToken'), 'first-token')
  auth.verified = false
  let requests = 0
  client.defaults.adapter = async (config) => {
    requests++
    assert.equal(config.url, '/api/v1/admin/session')
    return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config }
  }
  assert.equal(await auth.verifySession(), true)
  assert.equal(await auth.verifySession(), true)
  assert.equal(requests, 1)
  auth.logout()
  assert.equal(auth.token, null)
  assert.equal(localStorage.getItem('adminToken'), null)
  assert.equal(localStorage.getItem('adminUser'), null)
})

test('an old session response cannot verify a different token', async () => {
  storage.clear()
  setActivePinia(createPinia())
  const auth = useAuthStore()
  auth.setToken('first-token')
  auth.verified = false
  let respond
  client.defaults.adapter = (config) => new Promise((resolve) => {
    respond = () => resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config })
  })
  const pending = auth.verifySession()
  auth.setToken('second-token')
  respond()
  assert.equal(await pending, false)
  assert.equal(auth.token, 'second-token')
})
