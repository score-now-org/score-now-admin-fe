<template>
  <BaseModal v-model="visible" title="경기 등록" width="520px">
    <div class="form">
      <div class="form-grid">
        <div class="form-row">
          <label class="form-label">종목</label>
          <BaseSelect v-model="form.sport">
            <option value="">선택</option>
            <option
              v-for="sport in sportOptions"
              :key="sport.value"
              :value="sport.value"
            >
              {{ sport.label }}
            </option>
          </BaseSelect>
        </div>

        <div class="form-row">
          <label class="form-label">리그</label>
          <BaseSelect v-model="form.leagueId">
            <option value="">선택</option>
            <option
              v-for="league in selectableLeagues"
              :key="league.id"
              :value="league.id"
            >
              {{ league.name }}
            </option>
          </BaseSelect>
        </div>

        <div class="form-row">
          <label class="form-label">데이터 연동</label>
          <BaseSelect v-model="form.dataSourceType">
            <option value="manual">수동</option>
            <option value="external">외부 API</option>
          </BaseSelect>
        </div>

        <div class="form-row">
          <label class="form-label">API명</label>
          <BaseInput
            v-model="form.dataSourceName"
            :disabled="form.dataSourceType === 'manual'"
            placeholder="예) Sports API"
          />
        </div>

        <div class="form-row">
          <label class="form-label">경기 타입</label>
          <BaseSelect v-model="form.matchType" disabled>
            <option value="A">A</option>
          </BaseSelect>
        </div>

        <div class="form-row">
          <label class="form-label">경기상태</label>
          <BaseSelect v-model="form.status">
            <option
              v-for="status in statusOptions"
              :key="status.value"
              :value="status.value"
            >
              {{ status.label }}
            </option>
          </BaseSelect>
        </div>

        <div class="form-row">
          <label class="form-label">시작 날짜</label>
          <input v-model="form.startDate" class="form-input" type="date" />
        </div>

        <div class="form-row">
          <label class="form-label">시작 시간</label>
          <input
            v-model="form.startTime"
            class="form-input"
            type="time"
          />
        </div>

        <div class="form-row">
          <label class="form-label">홈팀</label>
          <BaseInput v-model="form.homeTeamName" placeholder="홈팀명 입력" />
        </div>

        <div class="form-row">
          <label class="form-label">원정팀</label>
          <BaseInput v-model="form.awayTeamName" placeholder="원정팀명 입력" />
        </div>

        <div class="form-row">
          <label class="form-label">사용 유무</label>
          <BaseSelect v-model="form.useStatus">
            <option value="active">사용중</option>
            <option value="inactive">사용종료</option>
          </BaseSelect>
        </div>
      </div>

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>

    <template #footer>
      <BaseButton variant="outline" @click="visible = false">취소</BaseButton>
      <BaseButton variant="primary" @click="handleSave">등록</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  sportOptions: { type: Array, default: () => [] },
  leagueOptions: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'save'])

const visible = ref(props.modelValue)
const errorMsg = ref('')

const defaultForm = () => ({
  sport: '',
  leagueId: '',
  dataSourceType: 'manual',
  dataSourceName: '수동',
  matchType: 'A',
  startDate: '',
  startTime: '',
  status: 'NOT_STARTED',
  homeTeamName: '',
  awayTeamName: '',
  useStatus: 'active',
})

const form = ref(defaultForm())

const selectableLeagues = computed(() => (
  props.leagueOptions.filter((league) => !form.value.sport || league.sport === form.value.sport)
))

watch(
  () => props.modelValue,
  (value) => {
    visible.value = value
    if (value) {
      form.value = defaultForm()
      errorMsg.value = ''
    }
  },
)

watch(visible, (value) => emit('update:modelValue', value))

watch(
  () => form.value.sport,
  () => {
    form.value.leagueId = ''
  },
)

watch(
  () => form.value.dataSourceType,
  (value) => {
    if (value === 'manual') form.value.dataSourceName = '수동'
    if (value === 'external' && form.value.dataSourceName === '수동') {
      form.value.dataSourceName = ''
    }
  },
)

function handleSave() {
  errorMsg.value = ''

  if (!form.value.sport) {
    errorMsg.value = '종목을 선택해주세요.'
    return
  }

  if (!form.value.leagueId) {
    errorMsg.value = '리그를 선택해주세요.'
    return
  }

  if (!form.value.startDate || !form.value.startTime) {
    errorMsg.value = '경기 시작 날짜와 시간을 입력해주세요.'
    return
  }

  const normalizedTime = normalizeTime(form.value.startTime)

  if (!normalizedTime) {
    errorMsg.value = '시작 시간은 24시간 형식(HH:MM)으로 입력해주세요.'
    return
  }

  if (!form.value.homeTeamName || !form.value.awayTeamName) {
    errorMsg.value = '홈팀과 원정팀을 입력해주세요.'
    return
  }

  if (form.value.dataSourceType === 'external' && !form.value.dataSourceName) {
    errorMsg.value = '외부 API명을 입력해주세요.'
    return
  }

  emit('save', { ...form.value, startTime: normalizedTime })
  visible.value = false
}

function normalizeTime(value) {
  const match = String(value || '').trim().match(/^(\d{1,2}):(\d{1,2})$/)
  if (!match) return null

  const hour = Number(match[1])
  const minute = Number(match[2])

  if (hour > 23 || minute > 59) return null

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.form-input {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 12px;
  color: #232323;
  font-family: inherit;
  font-size: 12px;
  background: #f3f3f3;
  border: 1px solid #e9e9e9;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.form-input:focus {
  background: #fff;
  border-color: #1c67ff;
}

.error-msg {
  margin: 0;
  color: #ef4444;
  font-size: 12px;
  text-align: center;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
