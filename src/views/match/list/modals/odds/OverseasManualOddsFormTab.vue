<template>
  <div class="manual-odds-form">
    <div class="form-intro">
      <div>
        <strong>등록할 마켓을 선택해 배당률을 입력해 주세요.</strong>
        <p>등록만으로 앱 노출 방식이 수동으로 변경되지는 않습니다.</p>
      </div>
      <BaseBadge variant="yellow">수동 등록</BaseBadge>
    </div>

    <section class="market-section" :class="{ selected: selectedMarkets.winDrawLoss }">
      <div class="market-heading">
        <label class="market-selector">
          <input v-model="selectedMarkets.winDrawLoss" type="checkbox" :disabled="saving" />
          <span>{{ winDrawLossLabel }}</span>
        </label>
        <small>{{ isBaseball ? '야구는 무승부 배당률을 사용하지 않습니다.' : '홈·무·원정 배당률을 등록합니다.' }}</small>
      </div>

      <div class="odds-comparison">
        <div class="comparison-row input-row">
          <strong>등록할 배당률</strong>
          <label class="odds-field">
            <span>홈</span>
            <BaseInput
              v-model="forms.winDrawLoss.homeOdds"
              type="number"
              inputmode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              :disabled="saving || !selectedMarkets.winDrawLoss"
            />
          </label>
          <label class="odds-field">
            <span>무</span>
            <BaseInput
              v-model="forms.winDrawLoss.drawOdds"
              type="number"
              inputmode="decimal"
              min="0.01"
              step="0.01"
              :placeholder="isBaseball ? '해당 없음' : '0.00'"
              :disabled="saving || !selectedMarkets.winDrawLoss || isBaseball"
            />
          </label>
          <label class="odds-field">
            <span>원정</span>
            <BaseInput
              v-model="forms.winDrawLoss.awayOdds"
              type="number"
              inputmode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              :disabled="saving || !selectedMarkets.winDrawLoss"
            />
          </label>
        </div>

        <div class="comparison-row recent-row">
          <strong>
            최근 수동 배당률
            <small>{{ formatPublishedAt(latestByMarket.WIN_DRAW_LOSS?.publishedAt) }}</small>
          </strong>
          <OddsReadOnlyField label="홈" :value="latestByMarket.WIN_DRAW_LOSS?.homeOdds" />
          <OddsReadOnlyField label="무" :value="isBaseball ? null : latestByMarket.WIN_DRAW_LOSS?.drawOdds" :not-applicable="isBaseball" />
          <OddsReadOnlyField label="원정" :value="latestByMarket.WIN_DRAW_LOSS?.awayOdds" />
        </div>
      </div>
      <p v-if="errors.winDrawLoss" class="market-error" role="alert">{{ errors.winDrawLoss }}</p>
    </section>

    <section class="market-section" :class="{ selected: selectedMarkets.handicap }">
      <div class="market-heading">
        <label class="market-selector">
          <input v-model="selectedMarkets.handicap" type="checkbox" :disabled="saving" />
          <span>핸디캡</span>
        </label>
        <small>홈·기준점·원정 배당률을 등록합니다.</small>
      </div>

      <div class="odds-comparison">
        <div class="comparison-row input-row">
          <strong>등록할 배당률</strong>
          <label class="odds-field">
            <span>홈</span>
            <BaseInput
              v-model="forms.handicap.homeOdds"
              type="number"
              inputmode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              :disabled="saving || !selectedMarkets.handicap"
            />
          </label>
          <label class="odds-field">
            <span>기준점</span>
            <BaseInput
              v-model="forms.handicap.handicapLine"
              type="number"
              inputmode="decimal"
              step="0.01"
              placeholder="0.00"
              :disabled="saving || !selectedMarkets.handicap"
            />
          </label>
          <label class="odds-field">
            <span>원정</span>
            <BaseInput
              v-model="forms.handicap.awayOdds"
              type="number"
              inputmode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              :disabled="saving || !selectedMarkets.handicap"
            />
          </label>
        </div>

        <div class="comparison-row recent-row">
          <strong>
            최근 수동 배당률
            <small>{{ formatPublishedAt(latestByMarket.HANDICAP?.publishedAt) }}</small>
          </strong>
          <OddsReadOnlyField label="홈" :value="latestByMarket.HANDICAP?.homeOdds" />
          <OddsReadOnlyField label="기준점" :value="latestByMarket.HANDICAP?.handicapLine" />
          <OddsReadOnlyField label="원정" :value="latestByMarket.HANDICAP?.awayOdds" />
        </div>
      </div>
      <p v-if="errors.handicap" class="market-error" role="alert">{{ errors.handicap }}</p>
    </section>

    <section class="market-section" :class="{ selected: selectedMarkets.underOver }">
      <div class="market-heading">
        <label class="market-selector">
          <input v-model="selectedMarkets.underOver" type="checkbox" :disabled="saving" />
          <span>언더/오버</span>
        </label>
        <small>언더·기준점·오버 배당률을 등록합니다.</small>
      </div>

      <div class="odds-comparison">
        <div class="comparison-row input-row">
          <strong>등록할 배당률</strong>
          <label class="odds-field">
            <span>언더</span>
            <BaseInput
              v-model="forms.underOver.underOdds"
              type="number"
              inputmode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              :disabled="saving || !selectedMarkets.underOver"
            />
          </label>
          <label class="odds-field">
            <span>기준점</span>
            <BaseInput
              v-model="forms.underOver.underOverLine"
              type="number"
              inputmode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              :disabled="saving || !selectedMarkets.underOver"
            />
          </label>
          <label class="odds-field">
            <span>오버</span>
            <BaseInput
              v-model="forms.underOver.overOdds"
              type="number"
              inputmode="decimal"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              :disabled="saving || !selectedMarkets.underOver"
            />
          </label>
        </div>

        <div class="comparison-row recent-row">
          <strong>
            최근 수동 배당률
            <small>{{ formatPublishedAt(latestByMarket.UNDER_OVER?.publishedAt) }}</small>
          </strong>
          <OddsReadOnlyField label="언더" :value="latestByMarket.UNDER_OVER?.underOdds" />
          <OddsReadOnlyField label="기준점" :value="latestByMarket.UNDER_OVER?.underOverLine" />
          <OddsReadOnlyField label="오버" :value="latestByMarket.UNDER_OVER?.overOdds" />
        </div>
      </div>
      <p v-if="errors.underOver" class="market-error" role="alert">{{ errors.underOver }}</p>
    </section>

    <p v-if="errors.form" class="form-error" role="alert">{{ errors.form }}</p>
    <p v-if="submitError" class="form-error" role="alert">{{ submitError }}</p>
    <p v-if="successMessage" class="form-success" role="status">{{ successMessage }}</p>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { registerOverseasManualOdds } from '@/api/odds'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import OddsReadOnlyField from './OddsReadOnlyField.vue'

const props = defineProps({
  match: { type: Object, required: true },
  latestManualMarketOdds: { type: Array, default: () => [] },
})

const emit = defineEmits(['saved', 'state-change'])

const selectedMarkets = reactive(emptySelectedMarkets())
const forms = reactive(emptyForms())
const errors = reactive(emptyErrors())
const saving = ref(false)
const submitError = ref('')
const successMessage = ref('')

const isBaseball = computed(() => String(props.match?.sportCode ?? '').toUpperCase() === 'BASEBALL')
const winDrawLossLabel = computed(() => (isBaseball.value ? '승패' : '승무패'))
const latestByMarket = computed(() => Object.fromEntries(
  props.latestManualMarketOdds.map((odds) => [odds.marketType, odds]),
))

const dirty = computed(() => (
  Object.values(selectedMarkets).some(Boolean)
  || Object.values(forms).some((market) => Object.values(market).some((value) => value !== ''))
))
const canSubmit = computed(() => Object.values(selectedMarkets).some(Boolean) && !saving.value)

watch(
  [dirty, canSubmit, saving],
  () => emitState(),
  { immediate: true },
)

watch(isBaseball, (baseball) => {
  if (baseball) forms.winDrawLoss.drawOdds = ''
})

async function submit() {
  clearMessages()
  if (!validate()) return false

  saving.value = true
  emitState()

  try {
    await registerOverseasManualOdds(props.match.id, buildPayload())
    resetForm()
    successMessage.value = '수동 배당률을 등록했습니다.'
    emit('saved')
    return true
  } catch (error) {
    console.error('해외 수동 배당률 등록에 실패했습니다.', error)
    submitError.value = apiErrorMessage(error, '수동 배당률 등록에 실패했습니다.')
    return false
  } finally {
    saving.value = false
    emitState()
  }
}

function validate() {
  Object.assign(errors, emptyErrors())

  if (!Object.values(selectedMarkets).some(Boolean)) {
    errors.form = '등록할 마켓을 하나 이상 선택해 주세요.'
    return false
  }

  if (selectedMarkets.winDrawLoss) {
    const values = forms.winDrawLoss
    if (!isPositive(values.homeOdds) || !isPositive(values.awayOdds)) {
      errors.winDrawLoss = '홈과 원정 배당률은 0보다 큰 값이어야 합니다.'
    } else if (!isBaseball.value && !isPositive(values.drawOdds)) {
      errors.winDrawLoss = '축구의 무승부 배당률은 0보다 큰 값이어야 합니다.'
    }
  }

  if (selectedMarkets.handicap) {
    const values = forms.handicap
    if (!isPositive(values.homeOdds) || !isFiniteNumber(values.handicapLine) || !isPositive(values.awayOdds)) {
      errors.handicap = '홈·기준점·원정 값을 모두 올바르게 입력해 주세요.'
    }
  }

  if (selectedMarkets.underOver) {
    const values = forms.underOver
    const normalizedLine = truncateToTwoDecimals(values.underOverLine)
    if (
      !isPositive(values.underOdds)
      || !Number.isFinite(normalizedLine)
      || normalizedLine <= 0
      || !isPositive(values.overOdds)
    ) {
      errors.underOver = '언더·기준점·오버 값은 모두 0보다 커야 합니다.'
    } else if (Number.isInteger(normalizedLine)) {
      errors.underOver = '언더/오버 기준점은 정수일 수 없습니다.'
    }
  }

  return !Object.values(errors).some(Boolean)
}

function buildPayload() {
  return {
    winDrawLoss: selectedMarkets.winDrawLoss
      ? {
          homeOdds: Number(forms.winDrawLoss.homeOdds),
          drawOdds: isBaseball.value ? null : Number(forms.winDrawLoss.drawOdds),
          awayOdds: Number(forms.winDrawLoss.awayOdds),
        }
      : null,
    handicap: selectedMarkets.handicap
      ? {
          homeOdds: Number(forms.handicap.homeOdds),
          handicapLine: Number(forms.handicap.handicapLine),
          awayOdds: Number(forms.handicap.awayOdds),
        }
      : null,
    underOver: selectedMarkets.underOver
      ? {
          underOdds: Number(forms.underOver.underOdds),
          underOverLine: Number(forms.underOver.underOverLine),
          overOdds: Number(forms.underOver.overOdds),
        }
      : null,
  }
}

function resetForm() {
  Object.assign(selectedMarkets, emptySelectedMarkets())
  Object.assign(forms.winDrawLoss, emptyForms().winDrawLoss)
  Object.assign(forms.handicap, emptyForms().handicap)
  Object.assign(forms.underOver, emptyForms().underOver)
  Object.assign(errors, emptyErrors())
  submitError.value = ''
  emitState()
}

function clearMessages() {
  submitError.value = ''
  successMessage.value = ''
  Object.assign(errors, emptyErrors())
}

function emitState() {
  emit('state-change', {
    dirty: dirty.value,
    canSubmit: canSubmit.value,
    saving: saving.value,
  })
}

function emptySelectedMarkets() {
  return { winDrawLoss: false, handicap: false, underOver: false }
}

function emptyForms() {
  return {
    winDrawLoss: { homeOdds: '', drawOdds: '', awayOdds: '' },
    handicap: { homeOdds: '', handicapLine: '', awayOdds: '' },
    underOver: { underOdds: '', underOverLine: '', overOdds: '' },
  }
}

function emptyErrors() {
  return { form: '', winDrawLoss: '', handicap: '', underOver: '' }
}

function isPositive(value) {
  return value !== '' && Number.isFinite(Number(value)) && Number(value) > 0
}

function isFiniteNumber(value) {
  return value !== '' && Number.isFinite(Number(value))
}

function truncateToTwoDecimals(value) {
  const text = String(value).trim()
  const decimal = text.match(/^\+?(\d+)(?:\.(\d*))?$/)

  if (decimal) {
    const integerPart = Number(decimal[1])
    const decimalPart = Number((decimal[2] || '').padEnd(2, '0').slice(0, 2))
    return integerPart + decimalPart / 100
  }

  const number = Number(value)
  return Number.isFinite(number) ? Math.trunc(number * 100) / 100 : Number.NaN
}

function formatPublishedAt(value) {
  if (!value) return '등록된 값 없음'
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function apiErrorMessage(error, fallback) {
  return error?.response?.data?.message
    || error?.response?.data?.error?.message
    || fallback
}

defineExpose({ submit, resetForm })
</script>

<style scoped>
.manual-odds-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-intro,
.market-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.form-intro {
  padding: 12px 14px;
  background: var(--admin-color-table-heading-surface);
  border: 1px solid var(--admin-color-divider);
  border-radius: var(--admin-control-radius);
}

.form-intro strong,
.market-selector span {
  color: var(--admin-color-text-title);
  font-size: 12px;
}

.form-intro p,
.market-heading small {
  margin: 4px 0 0;
  color: var(--admin-color-text-muted);
  font-size: 11px;
}

.market-section {
  padding: 14px;
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}

.market-section.selected {
  border-color: #b9ccf7;
  box-shadow: var(--admin-focus-ring);
}

.market-selector {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.market-selector input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: var(--admin-color-primary);
}

.odds-comparison {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 12px;
}

.comparison-row {
  display: grid;
  grid-template-columns: minmax(124px, 1.15fr) repeat(3, minmax(100px, 1fr));
  gap: 8px;
  align-items: end;
}

.comparison-row > strong {
  align-self: center;
  color: var(--admin-color-text-label);
  font-size: 11px;
}

.comparison-row > strong small {
  display: block;
  margin-top: 4px;
  color: var(--admin-color-text-subtle);
  font-size: 10px;
  font-weight: 500;
}

.odds-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
}

.odds-field > span {
  color: var(--admin-color-text-muted);
  font-size: 10px;
  font-weight: 700;
}

.recent-row {
  padding-top: 9px;
  border-top: 1px dashed var(--admin-color-divider);
}

.market-error,
.form-error,
.form-success {
  margin: 9px 0 0;
  font-size: 11px;
}

.market-error,
.form-error {
  color: #c53c46;
}

.form-success {
  color: #18734b;
}

@media (max-width: 700px) {
  .comparison-row {
    grid-template-columns: repeat(3, minmax(90px, 1fr));
  }

  .comparison-row > strong {
    grid-column: 1 / -1;
  }

  .form-intro,
  .market-heading {
    flex-direction: column;
  }
}
</style>
