import test from 'node:test'
import assert from 'node:assert/strict'
import client from '../src/api/client.js'
import { useForbiddenWordMngr } from '../src/views/user/forbidden-word/useForbiddenWordMngr.js'

function response(config, values = {}) {
  return { config, status: 200, statusText: 'OK', headers: {}, data: { data: { content: [], number: config.params.page, size: 20, totalPages: 1, totalElements: 0, ...values } } }
}

test('search sends the keyword to the server before paging', async () => {
  const page = useForbiddenWordMngr(); let sent
  client.defaults.adapter = async config => { sent = config; return response(config) }
  page.page.value = 2; page.keyword.value = '  검색어  '
  await page.search()
  assert.equal(sent.url, '/api/v1/admin/forbidden-words')
  assert.equal(sent.params.keyword, '검색어')
  assert.equal(sent.params.page, 0)
})

test('a removed last row returns to the previous page', async () => {
  const page = useForbiddenWordMngr(); const requested = []
  client.defaults.adapter = async config => { requested.push(config.params.page); return response(config, { totalPages: 2 }) }
  page.page.value = 2
  await page.fetchWords()
  assert.deepEqual(requested, [2, 1])
  assert.equal(page.page.value, 1)
})

test('an older response cannot replace a newer search', async () => {
  const page = useForbiddenWordMngr(); const pending = []
  client.defaults.adapter = config => new Promise(resolve => pending.push(() => resolve(response(config, { content: [config.params.keyword] }))))
  page.keyword.value = '이전'; const old = page.search()
  page.keyword.value = '현재'; const current = page.search()
  pending[1](); await current; pending[0](); await old
  assert.deepEqual(page.items.value, ['현재'])
})
