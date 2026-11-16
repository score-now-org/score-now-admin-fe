import test from 'node:test'
import assert from 'node:assert/strict'
import client from '../src/api/client.js'
import { useChatMngr } from '../src/views/user/chat/useChatMngr.js'
function response(config, content = []) { return { config, status: 200, statusText: 'OK', headers: {}, data: { data: { content, number: 0, size: 15, totalPages: 1, totalElements: content.length } } } }
test('chat tabs request server filters and profile images from member API', async () => {
  const page = useChatMngr(); let sent
  client.defaults.adapter = async config => { sent = config; return response(config) }
  await page.setTab('신고 채팅'); assert.equal(sent.params.reportedOnly, true); assert.equal(sent.url, '/api/v1/admin/chat/messages')
  await page.setTab('채팅 사진'); assert.equal(sent.params.imageOnly, true)
  await page.setTab('프로필 사진'); assert.equal(sent.params.hasProfileImage, true); assert.equal(sent.url, '/api/v1/admin/members')
  page.filter.value.socialId = 'fan'; await page.search(); assert.equal(sent.params.socialId, 'fan')
})
test('a previous chat response cannot overwrite a newer tab', async () => {
  const page = useChatMngr(); const pending = []
  client.defaults.adapter = config => new Promise(resolve => pending.push(() => resolve(response(config, [{ id: config.url }]))))
  const old = page.fetchItems(); const current = page.setTab('프로필 사진')
  pending[1](); await current; pending[0](); await old
  assert.equal(page.items.value[0].id, '/api/v1/admin/members')
})
