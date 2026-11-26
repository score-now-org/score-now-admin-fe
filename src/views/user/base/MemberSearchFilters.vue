<template>
  <AdminFilterCard aria-label="회원 검색 조건" class="member-filter">
    <div class="field-group">
      <label for="member-social-id">아이디</label>
      <BaseInput id="member-social-id" :model-value="filter.socialId" @update:model-value="update('socialId', $event)" placeholder="소셜 로그인 아이디" @enter="$emit('search')" />
    </div>
    <div class="field-group">
      <label for="member-number">회원번호</label>
      <BaseInput id="member-number" :model-value="filter.memberId" @update:model-value="update('memberId', $event)" placeholder="회원번호" @enter="$emit('search')" />
    </div>
    <div class="field-group">
      <label for="member-nickname">닉네임</label>
      <BaseInput id="member-nickname" :model-value="filter.nickname" @update:model-value="update('nickname', $event)" placeholder="닉네임" @enter="$emit('search')" />
    </div>
    <template #actions>
      <BaseButton variant="primary" @click="$emit('search')">조회</BaseButton>
      <BaseButton variant="outline" @click="$emit('reset')">초기화</BaseButton>
    </template>
  </AdminFilterCard>
</template>

<script setup>
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
const props = defineProps({ filter: { type: Object, required: true } })
const emit = defineEmits(['update:filter', 'search', 'reset'])
function update(key, value) { emit('update:filter', { ...props.filter, [key]: value }) }
</script>

<style scoped>
.member-filter { margin: 12px; }
</style>
