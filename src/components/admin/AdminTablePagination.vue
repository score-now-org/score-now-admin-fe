<template>
  <div class="paging-toolbar">
    <label :for="selectId">페이지당</label>
    <select :id="selectId" :value="pageSize" :disabled="loading" @change="changePageSize">
      <option v-for="option in pageSizeOptions" :key="option" :value="option">{{ option }}개</option>
    </select>
    <span>{{ page }} / {{ totalPages }} 페이지</span>
    <BaseButton variant="outline" size="sm" :disabled="loading || page === 1" @click="$emit('change-page', page - 1)">
      이전
    </BaseButton>
    <BaseButton variant="outline" size="sm" :disabled="loading || page === totalPages" @click="$emit('change-page', page + 1)">
      다음
    </BaseButton>
  </div>
</template>

<script setup>
import { useId } from 'vue'
import BaseButton from '@/components/common/BaseButton.vue'

defineProps({
  pageSize: {
    type: Number,
    required: true,
  },
  pageSizeOptions: {
    type: Array,
    default: () => [10, 20, 50],
  },
  page: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:pageSize', 'change-page', 'change-page-size'])
const selectId = `admin-page-size-${useId()}`

function changePageSize(event) {
  const nextPageSize = Number(event.target.value)
  emit('update:pageSize', nextPageSize)
  emit('change-page-size', nextPageSize)
}
</script>

<style scoped>
/* 페이지 크기 선택, 현재 페이지, 이전·다음 이동 액션 */
.paging-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

label,
span {
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-label);
}

select {
  height: 28px;
  padding: 0 8px;
  color: var(--admin-color-text-control);
  font-size: var(--admin-font-size-label);
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-control-border);
  border-radius: var(--admin-control-radius);
}

@container admin-content (max-width: 600px) {
  .paging-toolbar {
    width: 100%;
  }
}
</style>
