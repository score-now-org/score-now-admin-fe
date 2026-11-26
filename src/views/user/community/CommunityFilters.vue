<template>
  <AdminFilterCard aria-label="게시판 검색 조건">
    <div class="field-group"><label for="community-keyword">{{ isPost ? '게시글 제목' : '제목 또는 댓글 내용' }}</label><BaseInput id="community-keyword" :model-value="filter.keyword" maxlength="100" @update:model-value="update('keyword', $event)" @enter="$emit('search')" /></div>
    <div class="field-group"><label for="community-social">아이디</label><BaseInput id="community-social" :model-value="filter.socialId" maxlength="100" @update:model-value="update('socialId', $event)" @enter="$emit('search')" /></div>
    <div class="field-group"><label for="community-nickname">닉네임</label><BaseInput id="community-nickname" :model-value="filter.nickname" maxlength="100" @update:model-value="update('nickname', $event)" @enter="$emit('search')" /></div>
    <div class="field-group"><label for="community-member">회원번호</label><BaseInput id="community-member" :model-value="filter.memberId" type="number" min="1" @update:model-value="update('memberId', $event)" @enter="$emit('search')" /></div>
    <div v-if="!isPost" class="field-group"><label for="community-post-id">게시글 번호</label><BaseInput id="community-post-id" :model-value="filter.postId" type="number" min="1" @update:model-value="update('postId', $event)" @enter="$emit('search')" /></div>
    <template #actions><BaseButton variant="secondary" @click="$emit('reset')">초기화</BaseButton><BaseButton variant="primary" @click="$emit('search')">조회</BaseButton></template>
  </AdminFilterCard>
</template>
<script setup>
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
const props = defineProps({ filter: { type: Object, required: true }, isPost: Boolean })
const emit = defineEmits(['update:filter', 'search', 'reset'])
function update(key, value) { emit('update:filter', { ...props.filter, [key]: value }) }
</script>
