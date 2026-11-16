<template>
  <BaseModal :model-value="modelValue" :title="`회원 #${userId} 제재 이력`" size="md" @update:model-value="$emit('update:modelValue', $event)">
    <p v-if="loading" role="status">이력을 불러오는 중입니다.</p>
    <p v-else-if="error" role="alert">{{ error }}</p>
    <p v-else-if="!items.length">기록된 제재 이력이 없습니다.</p>
    <ul v-else class="history-list"><li v-for="item in items" :key="item.id"><strong>{{ label(item.action) }}</strong><span>{{ item.reason || '사유 없음' }}</span><small>{{ format(item.createdAt) }}</small></li></ul>
    <template #footer><BaseButton variant="outline" @click="$emit('update:modelValue', false)">닫기</BaseButton></template>
  </BaseModal>
</template>
<script setup>
import { ref, watch } from 'vue'
import { getMemberModerationHistory } from '@/api/admin'
const props = defineProps({ modelValue: Boolean, userId: { type: Number, default: null } })
defineEmits(['update:modelValue'])
const items = ref([]), loading = ref(false), error = ref('')
watch(() => [props.modelValue, props.userId], async ([open, userId], _, onCleanup) => {
  if (!open || !userId) return
  let cancelled = false
  onCleanup(() => { cancelled = true })
  items.value = []; loading.value = true; error.value = ''
  try { const result = await getMemberModerationHistory(userId); if (!cancelled) items.value = result.data.data || [] }
  catch { if (!cancelled) error.value = '제재 이력을 불러오지 못했습니다.' }
  finally { if (!cancelled) loading.value = false }
}, { immediate: true })
function label(action) { return ({ WARN: '경고', BAN: '정지', PERMANENT_WITHDRAWAL: '영구탈퇴', RESTORE: '복구', DELETE_PROFILE_IMAGE: '프로필 사진 삭제' })[action] || action }
function format(value) { return value ? value.replace('T', ' ').slice(0, 19) : '-' }
</script>
<style scoped>
.history-list { list-style: none; margin: 0; padding: 0; }
.history-list li { display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 12px 0; border-bottom: 1px solid var(--admin-color-divider); overflow-wrap: anywhere; }
.history-list span { flex: 1 1 200px; min-width: 0; }
.history-list small { color: var(--admin-color-text-muted); }
</style>
