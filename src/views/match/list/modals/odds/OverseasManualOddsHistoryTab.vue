<template>
  <div class="manual-history-tab">
    <div class="market-filters" role="group" aria-label="마켓타입 필터">
      <label
        v-for="market in marketOptions"
        :key="market.value"
        class="filter-option"
        :class="{ selected: selectedMarketTypes.includes(market.value), disabled: deleting }"
      >
        <input
          v-model="selectedMarketTypes"
          type="checkbox"
          :value="market.value"
          :disabled="deleting"
        />
        <span class="filter-check" aria-hidden="true">✓</span>
        <span>{{ market.label }}</span>
      </label>
    </div>

    <div class="history-summary">
      <div>
        <strong>수동 배당률 내역</strong>
        <span>총 {{ totalElements }}건</span>
        <span class="refresh-status" :class="{ visible: refreshing }" role="status" aria-live="polite">
          <i aria-hidden="true"></i>조회 중
        </span>
      </div>
      <div class="history-summary-actions">
        <AdminTablePagination
          v-model:page-size="pageSize"
          :page-size-options="[10]"
          :page="page"
          :total-pages="totalPages"
          :loading="loading || deleting"
          @change-page="changePage"
        />
        <span class="history-action-divider" aria-hidden="true"></span>
        <BaseButton
          variant="danger"
          size="sm"
          :disabled="loading || deleting || allHistoryCount === 0"
          @click="invalidateHistory(null, $event)"
        >
          전체 삭제
        </BaseButton>
      </div>
    </div>

    <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>

    <div class="history-table-scroll" role="region" aria-label="해외 수동 배당률 내역" tabindex="0">
      <table class="history-table">
        <colgroup>
          <col class="col-time" />
          <col class="col-market" />
          <col class="col-value" />
          <col class="col-value" />
          <col class="col-value" />
          <col class="col-timing" />
          <col class="col-status" />
          <col class="col-action" />
        </colgroup>
        <thead>
          <tr>
            <th>등록시간</th>
            <th>마켓타입</th>
            <th>홈/언더</th>
            <th>무/기준점</th>
            <th>원정/오버</th>
            <th>시작 전/후</th>
            <th>상태</th>
            <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          <AdminTableState
            v-if="initialLoading"
            type="loading"
            :colspan="8"
            title="수동 배당률 내역을 불러오는 중입니다."
            compact
          />
          <AdminTableState
            v-else-if="loadError"
            type="error"
            :colspan="8"
            :title="loadError"
            description="잠시 후 다시 조회해 주세요."
          />
          <AdminTableState
            v-else-if="selectedMarketTypes.length === 0"
            :colspan="8"
            title="선택된 마켓이 없습니다."
            description="조회할 마켓을 하나 이상 선택해 주세요."
          />
          <AdminTableState
            v-else-if="histories.length === 0"
            :colspan="8"
            title="수동 배당률 내역이 없습니다."
            description="선택한 마켓에 등록된 내역이 없습니다."
          />
          <template v-else>
            <tr v-for="history in histories" :key="history.id">
              <td class="published-at">{{ formatPublishedAt(history.publishedAt) }}</td>
              <td><BaseBadge variant="blue">{{ marketLabel(history.marketType) }}</BaseBadge></td>
              <td class="number-cell">{{ leftValue(history) }}</td>
              <td class="number-cell">{{ centerValue(history) }}</td>
              <td class="number-cell">{{ rightValue(history) }}</td>
              <td>
                <BaseBadge :variant="timingBadgeVariant(history.registeredBeforeMatchStart)">
                  {{ timingLabel(history.registeredBeforeMatchStart) }}
                </BaseBadge>
              </td>
              <td>
                <BaseBadge :variant="history.status === 'ACTIVE' ? 'green' : 'gray'">
                  {{ history.status === 'ACTIVE' ? '활성' : '무효화' }}
                </BaseBadge>
              </td>
              <td>
                <BaseButton
                  variant="danger"
                  size="sm"
                  :disabled="deleting || history.status !== 'ACTIVE'"
                  @click="invalidateHistory(history, $event)"
                >
                  {{ history.status === 'ACTIVE' ? '삭제' : '삭제됨' }}
                </BaseButton>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { useAdminConfirm } from '@/composables/useAdminConfirm'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import {
  getOverseasManualOddsHistories,
  invalidateAllOverseasManualOddsHistories,
  invalidateOverseasManualOddsHistory,
} from '@/api/odds'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  matchId: { type: [String, Number], required: true },
  sportCode: { type: String, default: '' },
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['changed', 'state-change'])

const allMarketTypes = ['WIN_DRAW_LOSS', 'HANDICAP', 'UNDER_OVER']

const selectedMarketTypes = ref([...allMarketTypes])
const histories = ref([])
const pageSize = ref(10)
const page = ref(1)
const totalPages = ref(1)
const totalElements = ref(0)
const allHistoryCount = ref(0)
const loading = ref(false)
const loadError = ref('')
const actionError = ref('')
const deleting = ref(false)
const loaded = ref(false)
const requestConfirmation = useAdminConfirm()
let requestSequence = 0

const marketOptions = computed(() => [
  { value: 'WIN_DRAW_LOSS', label: String(props.sportCode).toUpperCase() === 'BASEBALL' ? '승패' : '승무패' },
  { value: 'HANDICAP', label: '핸디캡' },
  { value: 'UNDER_OVER', label: '언더/오버' },
])
const allMarketsSelected = computed(() => selectedMarketTypes.value.length === allMarketTypes.length)
const initialLoading = computed(() => loading.value && !loaded.value)
const refreshing = computed(() => loading.value && loaded.value)
watch(
  () => props.active,
  (active) => {
    if (active && !loaded.value) fetchHistories()
  },
  { immediate: true },
)

watch(
  deleting,
  (value) => emit('state-change', { deleting: value }),
  { immediate: true },
)

watch(
  () => [...selectedMarketTypes.value].sort().join(','),
  () => {
    if (!props.active) return
    page.value = 1

    if (selectedMarketTypes.value.length === 0) {
      requestSequence += 1
      loading.value = false
      histories.value = []
      totalElements.value = 0
      totalPages.value = 1
      loadError.value = ''
      return
    }

    fetchHistories()
  },
)

onBeforeUnmount(() => {
  requestSequence += 1
})

async function fetchHistories() {
  if (!selectedMarketTypes.value.length) return

  const currentRequest = ++requestSequence
  loading.value = true
  loadError.value = ''

  try {
    const result = await getOverseasManualOddsHistories(props.matchId, {
      page: page.value - 1,
      marketTypes: selectedMarketTypes.value,
    })
    if (currentRequest !== requestSequence) return

    histories.value = Array.isArray(result?.content) ? result.content : []
    totalElements.value = Number(result?.totalElements ?? histories.value.length)
    if (allMarketsSelected.value) allHistoryCount.value = totalElements.value
    totalPages.value = Math.max(1, Number(result?.totalPages ?? 1))
    page.value = Number.isFinite(Number(result?.number)) ? Number(result.number) + 1 : page.value
    loaded.value = true
  } catch (error) {
    if (currentRequest !== requestSequence) return
    console.error('해외 수동 배당률 내역 조회에 실패했습니다.', error)
    histories.value = []
    totalElements.value = 0
    totalPages.value = 1
    loadError.value = apiErrorMessage(error, '수동 배당률 내역 조회에 실패했습니다.')
  } finally {
    if (currentRequest === requestSequence) loading.value = false
  }
}

async function changePage(nextPage) {
  if (nextPage < 1 || nextPage > totalPages.value || nextPage === page.value) return
  page.value = nextPage
  await fetchHistories()
}

async function invalidateHistory(history, event) {
  if (deleting.value || !props.matchId) return
  actionError.value = ''
  const confirmed = await requestConfirmation({
    title: history ? '선택한 수동 배당률을 삭제할까요?' : '모든 활성 수동 배당률을 삭제할까요?',
    message: history
      ? '무효화된 내역은 앱에 노출되지 않으며 내역에는 삭제 상태로 보존됩니다.'
      : '수동 노출 중이라면 앱에서 배당률이 보이지 않을 수 있습니다. 내역은 삭제 상태로 보존됩니다.',
    confirmLabel: '삭제',
    confirmVariant: 'danger',
  }, event?.currentTarget)
  if (!confirmed || deleting.value) return

  deleting.value = true
  actionError.value = ''

  try {
    if (history) {
      await invalidateOverseasManualOddsHistory(props.matchId, history.id)
    } else {
      await invalidateAllOverseasManualOddsHistories(props.matchId)
    }
    await fetchHistories()
    emit('changed')
  } catch (error) {
    console.error('해외 수동 배당률 무효화에 실패했습니다.', error)
    actionError.value = apiErrorMessage(error, '수동 배당률 무효화에 실패했습니다.')
  } finally {
    deleting.value = false
  }
}

function marketLabel(marketType) {
  return marketOptions.value.find((market) => market.value === marketType)?.label ?? marketType
}

function leftValue(history) {
  return formatNumber(history.marketType === 'UNDER_OVER' ? history.underOdds : history.homeOdds)
}

function centerValue(history) {
  if (history.marketType === 'HANDICAP') return formatNumber(history.handicapLine)
  if (history.marketType === 'UNDER_OVER') return formatNumber(history.underOverLine)
  return formatNumber(history.drawOdds)
}

function rightValue(history) {
  return formatNumber(history.marketType === 'UNDER_OVER' ? history.overOdds : history.awayOdds)
}

function formatNumber(value) {
  if (value == null || !Number.isFinite(Number(value))) return '-'
  return Number(value).toFixed(2)
}

function formatPublishedAt(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

function timingLabel(value) {
  if (value === true) return '시작 전'
  if (value === false) return '시작 후'
  return '확인 불가'
}

function timingBadgeVariant(value) {
  if (value === true) return 'green'
  if (value === false) return 'yellow'
  return 'gray'
}

function apiErrorMessage(error, fallback) {
  return error?.response?.data?.message
    || error?.response?.data?.error?.message
    || fallback
}
</script>

<style scoped>
.manual-history-tab {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
}

.history-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.market-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-option {
  position: relative;
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 5px;
  padding: 0 10px;
  color: var(--admin-color-text-muted);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: 999px;
  cursor: pointer;
}

.filter-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.filter-check {
  display: inline-grid;
  width: 14px;
  height: 14px;
  place-items: center;
  box-sizing: border-box;
  color: transparent;
  font-size: 10px;
  line-height: 1;
  border: 1px solid var(--admin-color-control-border);
  border-radius: 4px;
}

.filter-option.selected {
  color: var(--admin-color-primary);
  background: #edf3ff;
  border-color: #b9ccf7;
}

.filter-option.selected .filter-check {
  color: #fff;
  background: var(--admin-color-primary);
  border-color: var(--admin-color-primary);
}

.filter-option:focus-within {
  outline: 2px solid var(--admin-color-primary);
  outline-offset: 2px;
}

.filter-option.disabled {
  cursor: not-allowed;
  opacity: .55;
}

.action-error {
  margin: 0;
  color: #c53c46;
  font-size: 11px;
}

.history-summary {
  padding-top: 10px;
  border-top: 1px solid var(--admin-color-divider);
}

.history-summary > div:first-child {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.history-summary-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.history-action-divider {
  width: 1px;
  height: 22px;
  background: var(--admin-color-divider);
}

.history-summary strong {
  color: var(--admin-color-text-title);
  font-size: 12px;
}

.history-summary span {
  color: var(--admin-color-text-muted);
  font-size: 11px;
}

.history-summary .refresh-status {
  display: inline-flex;
  min-width: 54px;
  align-items: center;
  gap: 5px;
  visibility: hidden;
}

.history-summary .refresh-status.visible {
  visibility: visible;
}

.refresh-status i {
  width: 10px;
  height: 10px;
  box-sizing: border-box;
  border: 1.5px solid #d5e1f5;
  border-top-color: var(--admin-color-primary);
  border-radius: 50%;
  animation: history-spin .8s linear infinite;
}

.history-table-scroll {
  height: clamp(300px, 46vh, 580px);
  max-width: 100%;
  overflow: auto;
  container-type: inline-size;
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}

.history-table-scroll:focus-visible {
  outline: 2px solid var(--admin-color-primary);
  outline-offset: 2px;
}

.history-table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
  table-layout: fixed;
}

.history-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 39px;
  padding: 0 9px;
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-table-heading);
  text-align: center;
  background: var(--admin-color-table-heading-surface);
  border-bottom: 1px solid var(--admin-color-divider);
}

.history-table td {
  height: 54px;
  padding: 7px 9px;
  color: var(--admin-color-text-body);
  font-size: var(--admin-font-size-table-body);
  text-align: center;
  border-bottom: 1px solid var(--admin-color-divider);
}

.history-table tbody tr:last-child td {
  border-bottom: 0;
}

.history-table tbody tr:hover {
  background: var(--admin-color-table-row-hover);
}

.col-time { width: 128px; }
.col-market { width: 94px; }
.col-value { width: 92px; }
.col-timing { width: 82px; }
.col-status { width: 76px; }
.col-action { width: 80px; }

.published-at,
.number-cell {
  font-variant-numeric: tabular-nums;
}

@keyframes history-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .history-summary {
    align-items: stretch;
  }

  .history-summary-actions {
    width: 100%;
    justify-content: space-between;
  }

  .history-summary-actions > :deep(.paging-toolbar) {
    flex: 1 1 100%;
  }

  .history-action-divider {
    display: none;
  }
}
</style>
