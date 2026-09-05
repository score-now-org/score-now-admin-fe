<template>
  <section class="table-card">
    <div class="table-toolbar">
      <div class="result-summary">
        <slot name="summary" />
      </div>
      <slot name="toolbar-actions" />
    </div>

    <div
      class="table-scroll"
      tabindex="0"
      :aria-label="scrollLabel"
      :style="{ '--admin-table-min-width': tableMinWidth }"
    >
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  scrollLabel: {
    type: String,
    required: true,
  },
  tableMinWidth: {
    type: String,
    default: '0px',
  },
})
</script>

<style scoped>
/* 결과 요약, 보조 액션, 데이터 테이블을 묶는 공통 목록 카드 */
.table-card {
  min-width: 0;
  overflow: hidden;
  background: var(--admin-color-surface);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}

.table-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  min-height: 48px;
  padding: 8px var(--admin-card-padding);
  border-bottom: 1px solid var(--admin-color-divider);
}

.result-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.result-summary :deep(strong) {
  font-size: 13px;
}

.result-summary :deep(span) {
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-label);
}

/* 열이 많은 목록은 페이지 전체가 아닌 이 영역 안에서만 가로 스크롤된다. */
.table-scroll {
  max-width: 100%;
  overflow-x: auto;
  container-type: inline-size;
}

.table-scroll:focus-visible {
  outline: 2px solid var(--admin-color-primary);
  outline-offset: -2px;
}

.table-scroll :deep(table) {
  width: 100%;
  min-width: var(--admin-table-min-width);
  table-layout: fixed;
  border-collapse: collapse;
}

.table-scroll :deep(th) {
  height: 39px;
  padding: 0 10px;
  color: var(--admin-color-text-table-heading);
  font-size: var(--admin-font-size-table-heading);
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  background: var(--admin-color-table-heading-surface);
  border-bottom: 1px solid var(--admin-color-table-heading-border);
}

.table-scroll :deep(td) {
  height: 64px;
  padding: 8px 10px;
  color: var(--admin-color-text-table-body);
  font-size: var(--admin-font-size-table-body);
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid var(--admin-color-table-row-border);
}

.table-scroll :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

.table-scroll :deep(tbody tr:hover:not(:has(.empty-state))) {
  background: var(--admin-color-table-row-hover);
}

.table-scroll :deep(tbody tr.dirty) {
  background: #fffdf5;
}

.table-scroll :deep(tbody tr.dirty:hover) {
  background: #fffaf0;
}

.table-scroll :deep(.id-cell) {
  color: #2e3b52;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.table-scroll :deep(.row-control) {
  width: 100%;
  height: 32px;
  padding: 0 9px;
  color: #303b50;
  font: inherit;
  font-size: var(--admin-font-size-table-body);
  text-align: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 5px;
  outline: none;
}

.table-scroll :deep(.row-control:hover:not(:disabled)) {
  background: var(--admin-color-surface);
  border-color: #e1e6ed;
}

.table-scroll :deep(.row-control:focus) {
  background: var(--admin-color-surface);
  border-color: var(--admin-color-primary);
  box-shadow: 0 0 0 2px rgb(28 103 255 / 8%);
}

.table-scroll :deep(.row-control:disabled) {
  opacity: .65;
}

.table-scroll :deep(.action-buttons) {
  display: flex;
  justify-content: center;
  gap: 5px;
}

@container admin-content (max-width: 600px) {
  .table-toolbar {
    padding-block: 10px;
  }
}
</style>
