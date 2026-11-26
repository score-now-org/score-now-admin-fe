<template>
  <p v-if="loading" role="status">경고 이력을 불러오는 중입니다.</p>
  <p v-else-if="error" role="alert">{{ error }}</p>
  <p v-else-if="!warnings.length">기록된 경고 이력이 없습니다.</p>
  <ul v-else class="warning-list">
    <li v-for="item in warnings" :key="item.id"><strong>{{ item.reason }}</strong><span>{{ item.createdAt?.replace('T', ' ').slice(0, 19) }}</span></li>
  </ul>
</template>
<script setup>
import { ref, watch } from 'vue'
import { getMemberModerationHistory } from '@/api/admin'
const props = defineProps({ userId: { type: Number, default: null } })
const warnings = ref([]), loading = ref(false), error = ref('')
watch(() => props.userId, async (id, _, onCleanup) => {
  warnings.value = []; error.value = ''
  if (!id) return
  let cancelled = false
  onCleanup(() => { cancelled = true })
  loading.value = true
  try {
    const result = await getMemberModerationHistory(id)
    if (!cancelled) warnings.value = (result.data.data || []).filter(item => item.action === 'WARN')
  } catch { if (!cancelled) error.value = '경고 이력을 불러오지 못했습니다.' }
  finally { if (!cancelled) loading.value = false }
}, { immediate: true })
</script>
<style scoped>
.warning-list { list-style: none; margin: 0; padding: 0; }
.warning-list li { display: flex; justify-content: space-between; gap: 12px; padding: 12px; border-bottom: 1px solid var(--admin-color-divider); }
.warning-list span { color: var(--admin-color-text-muted); }
</style>
