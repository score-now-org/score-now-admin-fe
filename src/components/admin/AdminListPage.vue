<template>
  <div class="admin-list-page">
    <header class="page-header">
      <div class="title-row">
        <h1>{{ title }}</h1>
        <slot name="title-after" />
      </div>
      <slot name="header-actions" />
    </header>

    <slot name="summary" />
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
/* 관리자 목록 페이지 전체: 제목과 본문 슬롯의 공통 폭·여백 */
.admin-list-page {
  width: 100%;
  min-width: 0;
  padding: var(--admin-page-padding);
  color: var(--admin-color-text-body);
}

/* 페이지 제목과 선택적인 우측 액션 영역 */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--admin-page-header-gap);
  margin-bottom: var(--admin-page-header-margin-bottom);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

h1 {
  margin: 0;
  color: var(--admin-color-text-title);
  font-size: var(--admin-font-size-page-title);
  line-height: 1.35;
  letter-spacing: -.04em;
}

@container admin-content (max-width: 960px) {
  .admin-list-page {
    padding-inline: var(--admin-page-padding-inline-compact);
  }
}

@container admin-content (max-width: 600px) {
  .admin-list-page {
    padding: 20px 12px 32px;
  }
}
</style>
