<template>
  <div class="editor-toolbar" role="toolbar" aria-label="답변 서식">
    <button v-for="tool in tools" :key="tool.command" type="button" :disabled="disabled || (tool.extended && !extended)" :aria-label="tool.label" @mousedown.prevent @click="format(tool.command)">{{ tool.text }}</button>
    <label>글꼴
      <select :disabled="disabled || !extended" aria-label="글꼴" @change="applySelect($event, 'fontName')">
        <option value="">선택</option><option v-for="font in fonts" :key="font" :value="font">{{ font }}</option>
      </select>
    </label>
    <label>크기
      <select :disabled="disabled || !extended" aria-label="글꼴 크기" @change="applySelect($event, 'fontSize')">
        <option value="">선택</option><option v-for="size in sizes" :key="size.value" :value="size.value">{{ size.label }}</option>
      </select>
    </label>
    <label>글자 색상 <input type="color" aria-label="글자 색상" :disabled="disabled || !extended" @change="format('foreColor', $event.target.value)" /></label>
    <label>배경 색상 <input type="color" aria-label="배경 색상" value="#ffff00" :disabled="disabled || !extended" @change="format('hiliteColor', $event.target.value)" /></label>
    <div class="insert-group">
      <label for="answer-table-rows">행</label><input id="answer-table-rows" v-model.number="rows" type="number" min="1" max="10" :disabled="disabled || !extended" />
      <label for="answer-table-columns">열</label><input id="answer-table-columns" v-model.number="columns" type="number" min="1" max="10" :disabled="disabled || !extended" />
      <button type="button" :disabled="disabled || !extended" @mousedown.prevent @click="insertTable">표 삽입</button>
    </div>
    <div class="insert-group link-group">
      <label for="answer-link">링크</label><input id="answer-link" v-model="link" type="url" placeholder="https://" :disabled="disabled || !extended" />
      <button type="button" :disabled="disabled || !extended" @mousedown.prevent @click="insertLink">링크 삽입</button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
const props = defineProps({ editor: { type: Object, default: null }, disabled: Boolean, extended: Boolean })
const emit = defineEmits(['change', 'error'])
const rows = ref(2), columns = ref(2), link = ref('')
const fonts = ['Arial', 'Verdana', 'Georgia', 'Tahoma', 'Courier New', 'Malgun Gothic']
const sizes = [1, 2, 3, 4, 5, 6, 7].map((value, index) => ({ value, label: `${[10, 13, 16, 18, 24, 32, 48][index]}px` }))
const tools = [
  { command: 'undo', label: '실행 취소', text: '↶' }, { command: 'redo', label: '다시 실행', text: '↷' },
  { command: 'bold', label: '굵게', text: 'B' }, { command: 'italic', label: '기울임', text: 'I' },
  { command: 'underline', label: '밑줄', text: 'U' }, { command: 'strikeThrough', label: '취소선', text: 'S' },
  { command: 'removeFormat', label: '서식 지우기', text: '서식 지우기' },
  { command: 'justifyLeft', label: '왼쪽 정렬', text: '왼쪽', extended: true }, { command: 'justifyCenter', label: '가운데 정렬', text: '가운데', extended: true },
  { command: 'justifyRight', label: '오른쪽 정렬', text: '오른쪽', extended: true },
  { command: 'insertUnorderedList', label: '글머리 목록', text: '• 목록' }, { command: 'insertOrderedList', label: '번호 목록', text: '1. 목록' },
]
let savedRange = null
function rememberSelection() {
  const selection = window.getSelection()
  if (selection?.rangeCount && props.editor?.contains(selection.anchorNode) && props.editor.contains(selection.focusNode)) savedRange = selection.getRangeAt(0).cloneRange()
}
function restoreSelection() {
  if (!props.editor) return false
  const range = savedRange
  props.editor.focus()
  if (range && props.editor.contains(range.commonAncestorContainer)) {
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range)
  }
  return true
}
function format(command, value = null) {
  if (props.disabled || !restoreSelection()) return
  document.execCommand('styleWithCSS', false, props.extended)
  document.execCommand(command, false, value)
  rememberSelection(); emit('error', ''); emit('change')
}
function applySelect(event, command) {
  if (event.target.value) format(command, event.target.value)
  event.target.value = ''
}
function insertTable() {
  if (![rows.value, columns.value].every(value => Number.isInteger(value) && value >= 1 && value <= 10)) {
    emit('error', '표의 행과 열은 각각 1~10 사이로 입력해 주세요.'); return
  }
  const cells = '<td><br></td>'.repeat(columns.value)
  format('insertHTML', `<table><tbody>${`<tr>${cells}</tr>`.repeat(rows.value)}</tbody></table><p><br></p>`)
}
function insertLink() {
  let url
  try { url = new URL(link.value.trim()) } catch { emit('error', '올바른 링크 주소를 입력해 주세요.'); return }
  if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) { emit('error', 'http, https 또는 mailto 링크만 사용할 수 있습니다.'); return }
  if (!savedRange || savedRange.collapsed || !props.editor?.contains(savedRange.commonAncestorContainer)) {
    emit('error', '링크를 적용할 답변 텍스트를 먼저 선택해 주세요.'); return
  }
  format('createLink', url.href)
  link.value = ''
}
onMounted(() => document.addEventListener('selectionchange', rememberSelection))
onBeforeUnmount(() => document.removeEventListener('selectionchange', rememberSelection))
</script>

<style scoped>
.editor-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 6px; background: var(--admin-color-table-heading-surface); border: 1px solid var(--admin-color-control-border); }
button, select, input { min-height: 28px; padding: 3px 6px; color: var(--admin-color-text-control); background: var(--admin-color-surface); border: 1px solid var(--admin-color-control-border); border-radius: var(--admin-control-radius); font: inherit; }
button { cursor: pointer; }
button:disabled, select:disabled, input:disabled { cursor: not-allowed; opacity: .6; }
button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid var(--admin-color-primary); outline-offset: 1px; }
label, .insert-group { display: inline-flex; align-items: center; gap: 4px; }
input[type='color'] { width: 34px; padding: 2px; }
input[type='number'] { width: 45px; }
.link-group { flex-wrap: wrap; min-width: 0; }
input[type='url'] { width: 170px; max-width: 100%; }
</style>
