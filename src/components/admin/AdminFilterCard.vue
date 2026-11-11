<template>
  <section class="filter-card" :aria-label="ariaLabel">
    <slot />
    <div v-if="$slots.actions" class="filter-actions">
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup>
defineProps({
  ariaLabel: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
/* 검색 조건 필드와 초기화·조회 액션을 담는 공통 카드 */
.filter-card {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--admin-filter-gap);
  padding: var(--admin-card-padding);
  margin-bottom: var(--admin-section-margin-bottom);
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}

:deep(.field-group) {
  display: flex;
  flex-direction: column;
  gap: var(--admin-field-gap);
}

:deep(.field-group label),
:deep(.field-label) {
  color: var(--admin-color-text-label);
  font-size: var(--admin-font-size-label);
  font-weight: 700;
}

.filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--admin-action-gap);
}

@container admin-content (max-width: 600px) {
  :deep(.field-group) {
    width: 100%;
    min-width: 0;
  }

  .filter-actions {
    width: 100%;
    flex-wrap: wrap;
    margin-left: 0;
  }

  .filter-actions :deep(.base-btn) {
    flex: 1 1 auto;
    padding-inline: 10px;
  }
}
</style>
