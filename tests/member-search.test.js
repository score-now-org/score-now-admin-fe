import test from 'node:test'
import assert from 'node:assert/strict'
import client from '../src/api/client.js'
import { useUserMngr } from '../src/views/user/base/composables/useUserMngr.js'

function response(config, values = {}) {
  return { status: 200, statusText: 'OK', headers: {}, config,
    data: { data: { content: [], totalElements: 0, totalPages: 0, number: 0, size: 15, ...values } } }
}

test('search and tab filters are sent to the server before pagination', async () => {
  const page = useUserMngr()
  let sent
  client.defaults.adapter = async (config) => { sent = config; return response(config, { totalElements: 27, totalPages: 2 }) }
  page.pagination.value.currentPage = 1
  page.filter.value.nickname = 'fan'
  await page.doSearch()
  assert.equal(sent.url, '/api/v1/admin/members')
  assert.equal(sent.params.nickname, 'fan')
  assert.equal(sent.params.page, 0)
  assert.equal(page.pagination.value.totalElements, 27)
  page.pagination.value.currentPage = 1
  await page.onTabChange('탈퇴 회원')
  assert.equal(sent.params.status, 'deleted')
  assert.equal(sent.params.page, 0)
  assert.equal(sent.params.nickname, undefined)
})

test('a slow old response cannot overwrite a newer search', async () => {
  const page = useUserMngr()
  const requests = []
  client.defaults.adapter = (config) => new Promise((resolve) => requests.push(() => resolve(response(config, {
    content: [{ memberId: config.params.memberId, status: 'ACTIVE' }], totalElements: 1, totalPages: 1,
  }))))
  page.filter.value.memberId = 1
  const old = page.doSearch()
  page.filter.value.memberId = 2
  const current = page.doSearch()
  requests[1]()
  await current
  requests[0]()
  await old
  assert.equal(page.users.value[0].memberId, 2)
  assert.equal(page.loading.value, false)
})
