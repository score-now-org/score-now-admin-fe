<template>
  <BaseModal :model-value="modelValue" :title="`${title} · 회원 #${userId}`" size="sm" :close-disabled="saving"
    @update:model-value="$emit('update:modelValue', $event)">
    <div v-if="loading" role="status">회원 정보를 불러오는 중입니다.</div>
    <div v-else class="action-form">
      <template v-if="action === 'EDIT'">
        <label for="member-edit-name">이름</label>
        <BaseInput id="member-edit-name" v-model="name" maxlength="100" />
        <label for="member-edit-country">국가 코드</label>
        <BaseInput id="member-edit-country" v-model="countryCode" maxlength="3" />
      </template>
      <template v-else>
        <p>{{ title }} 처리하시겠습니까?</p>
        <template v-if="action === 'BAN'">
          <label for="member-ban-duration">정지 기간</label>
          <BaseSelect id="member-ban-duration" v-model="duration">
            <option value="">직접 해제할 때까지</option>
            <option value="WEEK">1주</option>
            <option value="MONTH">1개월</option>
          </BaseSelect>
        </template>
        <label for="member-action-reason">사유{{ action === 'RESTORE' ? ' (선택)' : '' }}</label>
        <BaseTextarea id="member-action-reason" v-model="reason" maxlength="500" placeholder="사유를 입력하세요." />
      </template>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    </div>
    <template #footer>
      <BaseButton variant="outline" :disabled="saving" @click="$emit('update:modelValue', false)">취소</BaseButton>
      <BaseButton :disabled="saving || loading || !ready" @click="submit">{{ saving ? '처리 중...' : '확인' }}</BaseButton>
    </template>
  </BaseModal>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { applyMemberAction, getMemberDetail, updateMember } from '@/api/admin'
const props = defineProps({ modelValue: Boolean, userId: Number, action: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue', 'completed'])
const labels = { EDIT: '회원 정보 수정', WARN: '경고', BAN: '이용정지', PERMANENT_WITHDRAWAL: '영구탈퇴', RESTORE: '복구', DELETE_PROFILE_IMAGE: '프로필 사진 삭제' }
const title = computed(() => labels[props.action] || '회원 처리')
const name = ref(''), countryCode = ref(''), reason = ref(''), duration = ref(''), saving = ref(false), loading = ref(false), ready = ref(false), error = ref('')
watch(() => [props.modelValue, props.userId, props.action], async ([open, id, action], _, onCleanup) => {
  if (!open || !id) return
  error.value = ''; reason.value = ''; duration.value = ''; name.value = ''; countryCode.value = ''; loading.value = false; ready.value = action !== 'EDIT'
  if (action !== 'EDIT') return
  let cancelled = false
  onCleanup(() => { cancelled = true })
  loading.value = true
  try { const result = await getMemberDetail(id); if (!cancelled) { name.value = result.data.data.name || ''; countryCode.value = result.data.data.countryCode || ''; ready.value = true } }
  catch { if (!cancelled) error.value = '회원 정보를 불러오지 못했습니다.' }
  finally { if (!cancelled) loading.value = false }
}, { immediate: true })
async function submit() {
  if (saving.value) return
  error.value = ''
  if (props.action !== 'EDIT' && props.action !== 'RESTORE' && !reason.value.trim()) { error.value = '사유를 입력해 주세요.'; return }
  saving.value = true
  try {
    if (props.action === 'EDIT') await updateMember(props.userId, { name: name.value, countryCode: countryCode.value })
    // Older servers reject the new action instead of silently treating a timed ban as indefinite.
    else await applyMemberAction(props.userId, { action: props.action === 'BAN' && duration.value ? `BAN_${duration.value}` : props.action, reason: reason.value })
    emit('update:modelValue', false); emit('completed')
  } catch (err) { error.value = err.response?.data?.error?.message || '처리하지 못했습니다. 다시 시도해 주세요.' }
  finally { saving.value = false }
}
</script>
<style scoped>
.action-form { display: flex; flex-direction: column; gap: 10px; }
.action-form label { font-size: var(--admin-font-size-label); font-weight: 700; }
.action-form p { margin: 0; }
.form-error { color: #b43b48; }
</style>
