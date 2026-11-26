<template>
  <BaseModal
    :model-value="modelValue"
    title="해외 배당률 관리"
    size="xl"
    :close-disabled="busy"
    @update:model-value="(_, event) => requestClose(event)"
  >
    <div class="odds-modal">
      <MatchContextSummary :match="match" />

      <div v-if="overviewLoading" class="modal-state" role="status">
        <span class="state-spinner"></span>
        <strong>해외 배당률 관리 현황을 불러오는 중입니다.</strong>
      </div>

      <div v-else-if="overviewError" class="modal-state error" role="alert">
        <strong>{{ overviewError }}</strong>
        <BaseButton variant="outline" size="sm" @click="loadOverview">다시 조회</BaseButton>
      </div>

      <template v-else>
        <section class="display-mode-section" aria-labelledby="display-mode-title">
          <div class="display-mode-copy">
            <span id="display-mode-title">현재 앱 노출 방식</span>
            <strong>{{ displayMode === 'MANUAL' ? '수동 배당률' : '자동 배당률' }}</strong>
            <small>노출 방식을 변경해도 자동 배당률 수집은 계속됩니다.</small>
          </div>
          <div class="display-mode-toggle" role="group" aria-label="해외 배당률 앱 노출 방식">
            <button
              type="button"
              :class="{ active: displayMode === 'AUTOMATIC' }"
              :aria-pressed="displayMode === 'AUTOMATIC'"
              :disabled="busy"
              @click="requestDisplayModeChange('AUTOMATIC', $event)"
            >
              자동 배당률
            </button>
            <button
              type="button"
              :class="{ active: displayMode === 'MANUAL' }"
              :aria-pressed="displayMode === 'MANUAL'"
              :disabled="busy"
              @click="requestDisplayModeChange('MANUAL', $event)"
            >
              수동 배당률
            </button>
          </div>
        </section>

        <p v-if="modeError" class="mode-error" role="alert">{{ modeError }}</p>
        <p v-if="overviewRefreshError" class="mode-error" role="alert">{{ overviewRefreshError }}</p>

        <div class="odds-tabs" role="tablist" aria-label="해외 배당률 관리 메뉴">
          <button
            id="manual-odds-form-tab"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'form'"
            aria-controls="manual-odds-form-panel"
            :class="{ active: activeTab === 'form' }"
            :disabled="busy"
            @click="activeTab = 'form'"
          >
            수동배당률 추가
          </button>
          <button
            id="manual-odds-history-tab"
            type="button"
            role="tab"
            :aria-selected="activeTab === 'history'"
            aria-controls="manual-odds-history-panel"
            :class="{ active: activeTab === 'history' }"
            :disabled="busy"
            @click="activeTab = 'history'"
          >
            수동배당률 내역
          </button>
        </div>

        <div
          v-show="activeTab === 'form'"
          id="manual-odds-form-panel"
          role="tabpanel"
          aria-labelledby="manual-odds-form-tab"
        >
          <OverseasManualOddsFormTab
            ref="formTabRef"
            :match="match"
            :latest-manual-market-odds="latestManualMarketOdds"
            @saved="handleManualOddsSaved"
            @state-change="updateFormState"
          />
        </div>

        <div
          v-show="activeTab === 'history'"
          id="manual-odds-history-panel"
          role="tabpanel"
          aria-labelledby="manual-odds-history-tab"
        >
          <OverseasManualOddsHistoryTab
            :key="`${match?.id}-${historyRefreshToken}`"
            :match-id="match?.id"
            :sport-code="match?.sportCode"
            :active="activeTab === 'history'"
            @changed="handleManualOddsChanged"
            @state-change="updateHistoryState"
          />
        </div>
      </template>
    </div>

    <template #footer>
      <template v-if="activeTab === 'form' && !overviewLoading && !overviewError">
        <BaseButton variant="outline" size="md" :disabled="busy" @click="requestClose">취소</BaseButton>
        <BaseButton
          variant="primary"
          size="md"
          :disabled="!formState.canSubmit || busy"
          @click="submitManualOdds"
        >
          {{ formState.saving ? '저장 중' : '수동 배당률 저장' }}
        </BaseButton>
      </template>
      <BaseButton v-else variant="outline" size="md" :disabled="busy" @click="requestClose">닫기</BaseButton>
    </template>
  </BaseModal>

  <AdminUnsavedChangesModal
    :action="pendingAction"
    :return-focus="pendingTrigger"
    @confirm="confirmDiscard"
    @cancel="cancelDiscard"
  />
</template>

<script setup>
import { useAdminConfirm } from '@/composables/useAdminConfirm'
import { computed, reactive, ref, watch } from 'vue'
import {
  changeOverseasOddsDisplayMode,
  getOverseasOddsManagementOverview,
} from '@/api/odds'
import AdminUnsavedChangesModal from '@/components/admin/AdminUnsavedChangesModal.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import MatchContextSummary from './components/MatchContextSummary.vue'
import OverseasManualOddsFormTab from './odds/OverseasManualOddsFormTab.vue'
import OverseasManualOddsHistoryTab from './odds/OverseasManualOddsHistoryTab.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  match: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const activeTab = ref('form')
const overviewLoading = ref(false)
const overviewLoaded = ref(false)
const overviewError = ref('')
const overviewRefreshError = ref('')
const displayMode = ref('AUTOMATIC')
const latestManualMarketOdds = ref([])
const modeSaving = ref(false)
const modeError = ref('')
const requestConfirmation = useAdminConfirm()
const formTabRef = ref(null)
const formState = reactive({ dirty: false, canSubmit: false, saving: false })
const historyState = reactive({ deleting: false })
const historyRefreshToken = ref(0)

const busy = computed(() => (
  overviewLoading.value
  || modeSaving.value
  || formState.saving
  || historyState.deleting
))
const hasUnsavedChanges = computed(() => formState.dirty)
const {
  pendingAction,
  pendingTrigger,
  requestDiscard,
  confirmDiscard,
  cancelDiscard,
} = useUnsavedChangesGuard(hasUnsavedChanges, busy)

watch(
  () => [props.modelValue, props.match?.id],
  async ([visible]) => {
    if (visible && props.match?.id) {
      activeTab.value = 'form'
      modeError.value = ''
      overviewRefreshError.value = ''
      overviewLoaded.value = false
      await loadOverview()
    }

    if (!visible) {
      formTabRef.value?.resetForm()
      Object.assign(formState, { dirty: false, canSubmit: false, saving: false })
    }
  },
)

async function loadOverview({ silent = false } = {}) {
  if (!props.match?.id) return

  if (!silent || !overviewLoaded.value) overviewLoading.value = true
  if (!silent) overviewError.value = ''
  overviewRefreshError.value = ''

  try {
    const result = await getOverseasOddsManagementOverview(props.match.id)
    displayMode.value = result?.displayMode || 'AUTOMATIC'
    latestManualMarketOdds.value = Array.isArray(result?.latestManualMarketOdds)
      ? result.latestManualMarketOdds
      : []
    overviewLoaded.value = true
  } catch (error) {
    console.error('해외 배당률 관리 현황 조회에 실패했습니다.', error)
    const message = apiErrorMessage(error, '해외 배당률 관리 현황 조회에 실패했습니다.')
    if (silent && overviewLoaded.value) {
      overviewRefreshError.value = `변경 내용은 처리됐지만 최신 현황을 다시 불러오지 못했습니다. ${message}`
    } else {
      overviewError.value = message
    }
  } finally {
    overviewLoading.value = false
  }
}

function requestClose(event) {
  requestDiscard('close', closeModal, event)
}

function closeModal() {
  formTabRef.value?.resetForm()
  emit('update:modelValue', false)
}

async function requestDisplayModeChange(nextMode, event) {
  if (nextMode === displayMode.value || busy.value || !props.match?.id) return
  modeError.value = ''
  const manual = nextMode === 'MANUAL'
  const confirmed = await requestConfirmation({
    title: manual ? '수동 배당률로 전환할까요?' : '자동 배당률로 전환할까요?',
    message: manual
      ? '활성 수동 값이 없는 마켓은 앱에 표시되지 않습니다.'
      : '현재 수집된 자동 배당률만 앱에 표시됩니다.',
    confirmLabel: '노출 방식 변경',
    initialFocus: 'confirm',
  }, event?.currentTarget)
  if (!confirmed || busy.value) return

  modeSaving.value = true
  modeError.value = ''

  try {
    await changeOverseasOddsDisplayMode(props.match.id, nextMode)
    displayMode.value = nextMode
  } catch (error) {
    console.error('해외 배당률 노출 방식 변경에 실패했습니다.', error)
    modeError.value = apiErrorMessage(error, '배당률 노출 방식 변경에 실패했습니다.')
  } finally {
    modeSaving.value = false
  }
}

function updateFormState(state) {
  Object.assign(formState, state)
}

function updateHistoryState(state) {
  Object.assign(historyState, state)
}

function submitManualOdds() {
  formTabRef.value?.submit()
}

async function handleManualOddsChanged() {
  await loadOverview({ silent: true })
}

async function handleManualOddsSaved() {
  historyRefreshToken.value += 1
  await handleManualOddsChanged()
}

function apiErrorMessage(error, fallback) {
  return error?.response?.data?.message
    || error?.response?.data?.error?.message
    || fallback
}
</script>

<style scoped>
.odds-modal {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 14px;
}

.modal-state {
  display: flex;
  min-height: 180px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--admin-color-text-muted);
}

.modal-state.error {
  flex-direction: column;
  color: #c53c46;
}

.state-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #dce2eb;
  border-top-color: var(--admin-color-primary);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}

.display-mode-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 13px 14px;
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}

.display-mode-copy span,
.display-mode-copy strong,
.display-mode-copy small {
  display: block;
}

.display-mode-copy span {
  color: var(--admin-color-text-muted);
  font-size: 10px;
  font-weight: 700;
}

.display-mode-copy strong {
  margin-top: 4px;
  color: var(--admin-color-text-title);
  font-size: 14px;
}

.display-mode-copy small {
  margin-top: 4px;
  color: var(--admin-color-text-subtle);
  font-size: 10px;
}

.display-mode-toggle {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px;
  width: 230px;
  padding: 2px;
  background: #f1f4f8;
  border-radius: 7px;
}

.display-mode-toggle button {
  height: 30px;
  padding: 0 12px;
  color: var(--admin-color-text-muted);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
}

.display-mode-toggle button.active {
  color: var(--admin-color-primary);
  background: var(--admin-color-surface);
  box-shadow: 0 1px 4px rgb(15 23 42 / 12%);
}

.display-mode-toggle button:focus-visible,
.odds-tabs button:focus-visible {
  outline: 2px solid var(--admin-color-primary);
  outline-offset: 2px;
}

.display-mode-toggle button:disabled {
  cursor: not-allowed;
  opacity: .55;
}

.mode-error {
  margin: 0;
  color: #c53c46;
  font-size: 11px;
}

.odds-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--admin-color-divider);
}

.odds-tabs button {
  min-height: 34px;
  padding: 0 14px;
  color: var(--admin-color-text-muted);
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.odds-tabs button.active {
  color: var(--admin-color-primary);
  border-bottom-color: var(--admin-color-primary);
}

.odds-tabs button:disabled {
  cursor: not-allowed;
  opacity: .55;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .display-mode-toggle {
    width: 100%;
  }
}
</style>
