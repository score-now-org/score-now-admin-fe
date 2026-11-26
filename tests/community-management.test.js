import test from 'node:test'
import assert from 'node:assert/strict'
import client from '../src/api/client.js'
import { useCommunityMngr } from '../src/views/user/community/useCommunityMngr.js'
import { deleteAdminPost, deleteAdminComment } from '../src/api/adminCommunity.js'

function response(config, values = {}) {
  const page = { content: [], number: config.params?.page ?? 0, size: 15, totalPages: 1, totalElements: 0, ...values }
  return { config, status: 200, statusText: 'OK', headers: {}, data: { data: config.url.endsWith('/posts') ? { page, todayCount: 3 } : page } }
}

test('post, HOT and comment searches use the appropriate server filters', async () => {
  const state = useCommunityMngr(); let sent
  client.defaults.adapter = async config => { sent = config; return response(config) }
  state.filter.value.keyword = ' 제목 '; state.filter.value.socialId = 'social'; await state.search()
  assert.equal(sent.url, '/api/v1/admin/community/posts'); assert.equal(sent.params.title, '제목')
  assert.equal(sent.params.socialId, 'social'); assert.equal(state.todayCount.value, 3)
  await state.setHot(true); assert.equal(sent.params.hotOnly, true)
  await state.setTab('댓글'); assert.equal(sent.url, '/api/v1/admin/community/comments')
  state.filter.value.keyword = '댓글'; state.filter.value.postId = '17'; await state.search(); assert.equal(sent.params.keyword, '댓글'); assert.equal(sent.params.postId, '17')
})

test('an old response cannot overwrite the current tab', async () => {
  const state = useCommunityMngr(); const pending = []
  client.defaults.adapter = config => new Promise(resolve => pending.push(() => resolve(response(config, { content: [config.url] }))))
  const old = state.fetchItems(); const current = state.setTab('댓글')
  pending[1](); await current; pending[0](); await old
  assert.deepEqual(state.items.value, ['/api/v1/admin/community/comments'])
})

test('a deleted last-page result returns to the previous page and deletion targets are separate', async () => {
  const state = useCommunityMngr(); const calls = []
  client.defaults.adapter = async config => { calls.push({ url: config.url, page: config.params?.page, method: config.method }); return response(config, { totalPages: 2 }) }
  state.pagination.value.currentPage = 2; await state.fetchItems()
  assert.deepEqual(calls.map(call => call.page), [2, 1])
  await deleteAdminPost(5); await deleteAdminComment(8)
  assert.equal(calls[2].url, '/api/v1/admin/community/posts/5'); assert.equal(calls[2].method, 'delete')
  assert.equal(calls[3].url, '/api/v1/admin/community/comments/8'); assert.equal(calls[3].method, 'delete')
})
