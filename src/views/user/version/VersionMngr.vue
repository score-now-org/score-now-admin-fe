<template>
  <div class="version-wrap">

    <!-- 헤더 -->
    <div class="tab-bar">
      <span class="page-title">버전 관리</span>
    </div>

    <!-- 툴바 -->
    <div class="table-wrap">
      <div class="toolbar">
        <span class="total-count">총 <strong>{{ versions.length }}</strong>건</span>
        <div class="toolbar-right">
          <BaseButton variant="primary" size="sm" @click="openAddModal">
            + 버전 추가
          </BaseButton>
        </div>
      </div>

      <!-- 테이블 -->
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th>순서</th>
              <th>버전 정보</th>
              <th>OS</th>
              <th>업데이트 일시</th>
              <th>업데이트 내용</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(ver, idx) in versions"
              :key="ver.id"
              :class="{ 'row-even': idx % 2 === 1 }"
            >
              <td class="center">{{ idx + 1 }}</td>
              <td class="bold">{{ ver.version }}</td>
              <td>
                <BaseBadge variant="blue">{{ ver.os }}</BaseBadge>
              </td>
              <td class="muted">{{ ver.updatedAt }}</td>
              <td>{{ ver.content }}</td>
              <td>
                <div class="action-btns">
                  <BaseButton variant="outline" size="sm" @click="openEditModal(ver)">
                    수정
                  </BaseButton>
                  <BaseButton variant="danger" size="sm" @click="deleteVersion(ver.id)">
                    삭제
                  </BaseButton>
                </div>
              </td>
            </tr>
            <tr v-if="versions.length === 0">
              <td colspan="6" class="empty">등록된 버전이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 버전 추가/수정 모달 -->
    <BaseModal v-model="modal.visible" :title="modal.isEdit ? '버전 수정' : '버전 추가'" width="420px">
      <div class="form modal-form">
        <div class="form-row">
          <label class="form-label">버전 정보</label>
          <BaseInput v-model="form.version" placeholder="예) 51.0.4" />
        </div>
        <div class="form-row">
          <label class="form-label">OS</label>
          <BaseSelect v-model="form.os">
            <option value="공통">공통</option>
            <option value="iOS">iOS</option>
            <option value="Android">Android</option>
          </BaseSelect>
        </div>
        <div class="form-row">
          <label class="form-label">업데이트 일시</label>
          <BaseInput v-model="form.updatedAt" type="date" />
        </div>
        <div class="form-row">
          <label class="form-label">업데이트 내용</label>
          <BaseTextarea
            v-model="form.content"
            placeholder="업데이트 내용을 입력하세요"
            rows="3"
          />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" @click="modal.visible = false">취소</BaseButton>
        <BaseButton variant="primary" @click="saveVersion">저장</BaseButton>
      </template>
    </BaseModal>

  </div>
</template>

<script setup>
import { ref } from 'vue'

const versions = ref([
  { id: 1, version: '51.0.3', os: '공통', updatedAt: '2025/12/31', content: '계산기 업데이트' },
  { id: 2, version: '51.0.2', os: '공통', updatedAt: '2025/11/21', content: '도토리스드 진입 불가 오류 수정' },
  { id: 3, version: '51.0.1', os: '공통', updatedAt: '2025/10/1',  content: '라인업 아이콘 변경' },
])

const modal = ref({ visible: false, isEdit: false, editId: null })
const form  = ref({ version: '', os: '공통', updatedAt: '', content: '' })

function openAddModal() {
  form.value  = { version: '', os: '공통', updatedAt: '', content: '' }
  modal.value = { visible: true, isEdit: false, editId: null }
}

function openEditModal(ver) {
  form.value  = { version: ver.version, os: ver.os, updatedAt: ver.updatedAt, content: ver.content }
  modal.value = { visible: true, isEdit: true, editId: ver.id }
}

function saveVersion() {
  if (modal.value.isEdit) {
    // 수정
    const target = versions.value.find(v => v.id === modal.value.editId)
    if (target) Object.assign(target, form.value)
  } else {
    // 추가
    const newId = Math.max(...versions.value.map(v => v.id), 0) + 1
    versions.value.unshift({ id: newId, ...form.value })
  }
  modal.value.visible = false
}

function deleteVersion(id) {
  if (!confirm('삭제하시겠습니까?')) return
  versions.value = versions.value.filter(v => v.id !== id)
}
</script>

<style scoped>
.version-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: auto;
}
.page-title {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  padding: 10px 12px;
}
.tab-bar {
  background: #fff;
  border-bottom: 1px solid #d1d5db;
  display: flex;
  align-items: center;
  padding: 0 12px;
  min-height: 40px;
}
.table-wrap {
  background: #fff;
  border: 1px solid #d1d5db;
  margin: 12px;
  border-radius: 6px;
  overflow: hidden;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}
.total-count { font-size: 12px; color: #6b7280; }
.total-count strong { color: #374151; }
.toolbar-right { display: flex; gap: 8px; }
.table-scroll { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; font-size: 12px; }
thead tr { background: #f3f4f6; border-bottom: 1px solid #d1d5db; }
th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}
tbody tr { border-bottom: 1px solid #f3f4f6; transition: background 0.1s; }
tbody tr:hover { background: #eff6ff; }
tbody tr.row-even { background: #f9fafb; }
tbody tr.row-even:hover { background: #eff6ff; }
td { padding: 8px 12px; color: #374151; white-space: nowrap; }
td.bold  { font-weight: 600; }
td.muted { color: #9ca3af; }
td.center { text-align: center; }
.empty { text-align: center; padding: 40px; color: #9ca3af; }

.action-btns { display: flex; gap: 6px; }

/* ── 폼 ── */
.form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; flex-direction: column; gap: 5px; }
.form-label { font-size: 12px; font-weight: 600; color: #4b5563; }
</style>
