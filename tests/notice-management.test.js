import test from 'node:test'
import assert from 'node:assert/strict'
import client from '../src/api/client.js'
import { useNoticeMngr } from '../src/views/user/notice/useNoticeMngr.js'

function result(config, data) { return { config, status: 200, statusText: 'OK', headers: {}, data: { data } } }
function page(config, overrides = {}) { return { content: [], number: config.params.page, size: config.params.size, totalPages: 1, totalElements: 0, ...overrides } }

test('filters server results by OS and reads pending publication status', async () => {
  const view = useNoticeMngr(); const requests = []
  client.defaults.adapter = async config => { requests.push(config); return result(config, config.url.endsWith('/status') ? { pending: true } : page(config)) }
  await view.setPlatform('IOS')
  assert.equal(requests.find(x => x.params).params.platform, 'IOS')
  assert.equal(view.pending.value, true)
})

test('finds an adjacent filtered notice on the next page for ordering', async () => {
  const view = useNoticeMngr(); const requests = []
  client.defaults.adapter = async config => { requests.push(config); return result(config, page(config, { content: [{ id: 2, sortOrder: 5 }] })) }
  view.platform.value = 'ANDROID'; view.items.value = [{ id: 1, sortOrder: 2 }]; view.totalPages.value = 2
  assert.equal((await view.neighbor(0, 1)).sortOrder, 5)
  assert.equal(requests[0].params.page, 1)
  assert.equal(requests[0].params.platform, 'ANDROID')
})

test('a late result cannot overwrite a newer filter', async () => {
  const view = useNoticeMngr(); const deferred = []
  client.defaults.adapter = config => config.url.endsWith('/status') ? Promise.resolve(result(config, { pending: false })) : new Promise(resolve => deferred.push(() => resolve(result(config, page(config, { content: [config.params.platform] })))) )
  const old = view.setPlatform('IOS'); const current = view.setPlatform('ANDROID')
  deferred[1](); await current; deferred[0](); await old
  assert.deepEqual(view.items.value, ['ANDROID'])
})
