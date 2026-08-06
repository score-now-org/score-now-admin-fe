<template>
  <BaseModal v-model="visible" :title="modalTitle" width="500px">
    <div class="modal-content">
      <table class="summary-table">
        <tbody>
          <tr>
            <th>경기 ID</th>
            <td>{{ match?.id || '-' }}</td>
            <th>경기일시</th>
            <td>{{ matchTime }}</td>
          </tr>
          <tr>
            <th>홈팀</th>
            <td>{{ match?.homeTeam?.name || '-' }}</td>
            <th>원정팀</th>
            <td>{{ match?.awayTeam?.name || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <div class="form">
        <div class="form-row">
          <label class="form-label">경기장명</label>
          <BaseInput v-model="form.stadiumName" placeholder="경기장명 입력" />
        </div>
        <div class="form-row">
          <label class="form-label">지역</label>
          <BaseInput v-model="form.region" placeholder="지역 입력" />
        </div>
        <div class="form-row">
          <label class="form-label">매핑 상태</label>
          <BaseSelect v-model="form.mappingStatus">
            <option value="mapped">매핑 완료</option>
            <option value="pending">미매핑</option>
          </BaseSelect>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="outline" @click="visible = false">닫기</BaseButton>
      <BaseButton variant="primary" @click="visible = false">저장</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  match: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const visible = ref(props.modelValue)
const form = ref(defaultForm())

const modalTitle = computed(() => (
  props.match ? `경기장 매핑 #${props.match.id}` : '경기장 매핑'
))

const matchTime = computed(() => {
  if (!props.match) return '-'
  return `${props.match.startDate} ${props.match.startTime}`
})

watch(
  () => props.modelValue,
  (value) => {
    visible.value = value
    if (value) form.value = defaultForm()
  },
)

watch(visible, (value) => emit('update:modelValue', value))

function defaultForm() {
  return {
    stadiumName: '',
    region: '',
    mappingStatus: 'pending',
  }
}
</script>

<style scoped>
.modal-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.summary-table th {
  width: 80px;
  padding: 8px 10px;
  color: #4b5563;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.summary-table td {
  padding: 8px 10px;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  color: #4b5563;
  font-size: 12px;
  font-weight: 600;
}
</style>
