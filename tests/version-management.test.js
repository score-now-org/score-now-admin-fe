import test from 'node:test'
import assert from 'node:assert/strict'
import client from '../src/api/client.js'
import { useVersionMngr } from '../src/views/user/version/useVersionMngr.js'

function response(config, values = {}) {
  return { config, status: 200, statusText: 'OK', headers: {}, data: { data: { content: [], number: config.params.page, size: config.params.size, totalPages: 1, totalElements: 0, ...values } } }
}

test('requests the selected page from the admin version API', async () => {
  const view = useVersionMngr(); let sent
  client.defaults.adapter = async config => { sent = config; return response(config, { totalPages: 3 }) }
  await view.changePage(2)
  assert.equal(sent.url, '/api/v1/admin/app-versions')
  assert.deepEqual(sent.params, { page: 1, size: 20 })
  assert.equal(view.page.value, 1)
})

test('returns to the previous page when the last row is deleted', async () => {
  const view = useVersionMngr(); const pages = []
  client.defaults.adapter = async config => { pages.push(config.params.page); return response(config, { totalPages: 2 }) }
  view.page.value = 2
  await view.fetchVersions()
  assert.deepEqual(pages, [2, 1])
  assert.equal(view.page.value, 1)
})

test('does not replace a newer page with a late response', async () => {
  const view = useVersionMngr(); const pending = []
  client.defaults.adapter = config => new Promise(resolve => pending.push(() => resolve(response(config, { content: [config.params.page], totalPages: 3 }))))
  const old = view.fetchVersions(); const next = view.changePage(2)
  pending[1](); await next; pending[0](); await old
  assert.deepEqual(view.items.value, [1])
  assert.equal(view.loading.value, false)
})
