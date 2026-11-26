import test from 'node:test'
import assert from 'node:assert/strict'
import { attachmentName, imageContentType } from '../src/views/user/inquiry/inquiryFile.js'

test('download uses the current server filename and safely handles missing or malformed headers', () => {
  assert.equal(attachmentName("attachment; filename*=UTF-8''%EC%95%88%EB%82%B4.pdf", 'fallback.bin'), '안내.pdf')
  assert.equal(attachmentName("attachment; filename*=UTF-8''new.png", 'old.pdf'), 'new.png')
  assert.equal(attachmentName("attachment; filename*=UTF-8''%ZZ", 'fallback.bin'), 'fallback.bin')
  assert.equal(attachmentName(null, 'fallback.bin'), 'fallback.bin')
})

test('only supported image filenames are rendered as image previews', () => {
  assert.equal(imageContentType('new.PNG'), 'image/png')
  assert.equal(imageContentType('new.jpeg'), 'image/jpeg')
  assert.equal(imageContentType('new.pdf'), '')
  assert.equal(imageContentType('new.png.pdf'), '')
})
