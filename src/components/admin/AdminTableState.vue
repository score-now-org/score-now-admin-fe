<template>
  <tr class="table-state-row">
    <td :colspan="colspan" class="empty-state" :class="[{ compact }, type]">
      <div class="table-state-content" :role="type === 'error' ? 'alert' : type === 'loading' ? 'status' : undefined">
        <span v-if="type === 'loading'" class="loading-mark" aria-hidden="true" />
        <span v-else class="empty-icon" aria-hidden="true">{{ type === 'error' ? '!' : '○' }}</span>
        <strong>{{ title }}</strong>
        <small v-if="description">{{ description }}</small>
      </div>
    </td>
  </tr>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'empty',
    validator: (value) => ['loading', 'empty', 'error'].includes(value),
  },
  colspan: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
/* 로딩·빈 결과·조회 실패를 현재 보이는 테이블 폭의 중앙에 표시한다. */
td.empty-state {
  height: 230px;
  padding: 0;
  text-align: center;
}

td.empty-state.compact {
  height: 150px;
}

.table-state-content {
  position: sticky;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100cqw;
  height: 230px;
  padding: 24px;
  flex-direction: column;
  box-sizing: border-box;
}

.compact .table-state-content {
  height: 150px;
}

.empty-icon {
  margin-bottom: 9px;
  color: var(--admin-color-info-border);
  font-size: 24px;
}

strong {
  color: var(--admin-color-text-empty-title);
  font-size: var(--admin-font-size-description);
}

small {
  margin-top: 5px;
  color: var(--admin-color-text-empty-description);
  font-size: var(--admin-font-size-table-heading);
}

.error .empty-icon,
.error strong {
  color: #b43b48;
}

.loading-mark {
  width: 20px;
  height: 20px;
  margin-bottom: 10px;
  border: 2px solid #dbe6fa;
  border-top-color: var(--admin-color-primary);
  border-radius: 50%;
  animation: admin-table-state-spin .8s linear infinite;
}

@keyframes admin-table-state-spin {
  to { transform: rotate(360deg); }
}
</style>
