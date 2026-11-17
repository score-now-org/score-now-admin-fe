<template>
  <aside class="sidebar">
    <div class="sidebar-title">{{ title }}</div>
    <nav>
      <button
        v-for="item in menuItems"
        :key="item.label"
        class="sidebar-btn"
        :class="{ active: modelValue === item.label }"
        @click="$emit('update:modelValue', item.label)"
      >
        {{ item.label }}
      </button>
    </nav>
  </aside>
</template>

<script setup>
const DEFAULT_ITEMS = [
  { label: '회원' },
  { label: '채팅' },
  { label: '금칙어' },
  { label: '게시판/댓글' },
  { label: '도움말' },
  { label: '버전 관리' },
  { label: '공지사항' },
  { label: '뉴스/알림' },
  { label: '약관' },
]

const props = defineProps({
  title:      { type: String, default: '유저' },
  modelValue: { type: String, default: '회원' },
  items:      { type: Array,  default: null },
})
defineEmits(['update:modelValue'])

const menuItems = props.items ?? DEFAULT_ITEMS  // ← computed 없이 직접 처리
</script>

<style scoped>
.sidebar {
  width: 200px;
  background: #fff;
  border-right: 1px solid #d1d5db;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}
.sidebar-title {
  text-align: center;
  padding: 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: #6b7280;
  border-bottom: 1px solid #9ca3af;
}
.sidebar-btn {
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  font-size: 12px;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}
.sidebar-btn:hover  { background: #eff6ff; }
.sidebar-btn.active { background: #2563eb; color: #fff; font-weight: 600; }
</style>
