<template>
  <BaseModal :model-value="modelValue" title="신고 내역" size="md" @update:model-value="$emit('update:modelValue', $event)">
    <p v-if="loading" role="status">신고 내역을 불러오는 중입니다.</p><p v-else-if="error" role="alert">{{ error }}</p><p v-else-if="!items.length">신고 내역이 없습니다.</p>
    <ul v-else class="reports"><li v-for="report in items" :key="report.id"><strong>{{ report.reason }}</strong><span>{{ report.createdAt?.replace('T', ' ').slice(0, 19) }}</span></li></ul>
    <template #footer><BaseButton variant="outline" :disabled="loading || page === 0" @click="load(page - 1)">이전</BaseButton><span>{{ page + 1 }} / {{ Math.max(1, totalPages) }}</span><BaseButton variant="outline" :disabled="loading || page + 1 >= totalPages" @click="load(page + 1)">다음</BaseButton><BaseButton variant="outline" @click="$emit('update:modelValue', false)">닫기</BaseButton></template>
  </BaseModal>
</template>
<script setup>
import { ref, watch } from 'vue'
import { getChatReports } from '@/api/adminChat'
const props = defineProps({ modelValue: Boolean, chatId: Number })
defineEmits(['update:modelValue'])
const items = ref([]), loading = ref(false), error = ref(''), page = ref(0), totalPages = ref(0)
let sequence = 0
async function load(next) {
  const current = ++sequence; loading.value = true; error.value = ''
  try { const result = await getChatReports(props.chatId, next); if (current === sequence) { items.value = result.data.data.content; page.value = result.data.data.number; totalPages.value = result.data.data.totalPages } }
  catch { if (current === sequence) error.value = '신고 내역을 불러오지 못했습니다.' }
  finally { if (current === sequence) loading.value = false }
}
watch(() => [props.modelValue, props.chatId], ([open, id]) => { if (open && id) { items.value = []; load(0) } else sequence++ })
</script>
<style scoped>
.reports { list-style: none; margin: 0; padding: 0; }
.reports li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; padding: 12px; border-bottom: 1px solid var(--admin-color-divider); }
.reports span { color: var(--admin-color-text-muted); }
</style>
