import test from 'node:test'
import assert from 'node:assert/strict'
import client from '../src/api/client.js'
import { deleteAdminChatImage, deleteAdminChatMessage } from '../src/api/adminChat.js'
import { deleteAdminCommunityImage } from '../src/api/adminCommunity.js'
import { useChatMngr } from '../src/views/user/chat/useChatMngr.js'
function response(config, content = []) { return { config, status: 200, statusText: 'OK', headers: {}, data: { data: { content, number: 0, size: 15, totalPages: 1, totalElements: content.length } } } }
test('chat tabs request server filters and profile images from member API', async () => {
  const page = useChatMngr(); let sent
  client.defaults.adapter = async config => { sent = config; return response(config) }
  await page.setTab('신고 채팅'); assert.equal(sent.params.reportedOnly, true); assert.equal(sent.url, '/api/v1/admin/chat/messages')
  await page.setTab('채팅 사진'); assert.equal(sent.params.imageOnly, true)
  await page.setTab('게시판 사진'); assert.equal(sent.url, '/api/v1/admin/community/images'); assert.equal(sent.params.imageOnly, undefined)
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

test('photo deletion uses a separate endpoint from deleting the whole chat', async () => {
  const urls = []
  client.defaults.adapter = async config => { urls.push(config.url); return response(config) }
  await deleteAdminChatImage(7, 'image reason')
  await deleteAdminChatMessage(7, 'message reason')
  await deleteAdminCommunityImage(9)
  assert.deepEqual(urls, ['/api/v1/admin/chat/messages/7/image/delete', '/api/v1/admin/chat/messages/7/delete', '/api/v1/admin/community/images/9'])
})

test('removing the last photo on a page returns to the previous page', async () => {
  const page = useChatMngr(); const requested = []
  client.defaults.adapter = async config => {
    requested.push(config.params.page)
    const result = response(config)
    Object.assign(result.data.data, { number: config.params.page, totalPages: 2, totalElements: 16 })
    return result
  }
  page.pagination.value.currentPage = 2
  await page.fetchItems()
  assert.deepEqual(requested, [2, 1])
  assert.equal(page.pagination.value.currentPage, 1)
})
