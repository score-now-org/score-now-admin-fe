<template>
  <AdminFilterCard aria-label="응원글 검색 조건">
    <div class="field-group"><label for="chat-social">아이디</label><BaseInput id="chat-social" :model-value="filter.socialId" @update:model-value="update('socialId', $event)" @enter="$emit('search')" /></div>
    <div class="field-group"><label for="chat-nickname">닉네임</label><BaseInput id="chat-nickname" :model-value="filter.nickname" @update:model-value="update('nickname', $event)" @enter="$emit('search')" /></div>
    <div class="field-group"><label for="chat-member">회원번호</label><BaseInput id="chat-member" :model-value="filter.memberId" @update:model-value="update('memberId', $event)" @enter="$emit('search')" /></div>
    <div v-if="!profile" class="field-group"><label for="chat-sport">종목</label><BaseSelect v-if="!sportsError" id="chat-sport" :model-value="filter.sportId" @update:model-value="update('sportId', $event)"><option value="">전체</option><option v-for="sport in sports" :key="sport.id" :value="String(sport.id)">{{ sport.name }}</option></BaseSelect><template v-else><BaseInput id="chat-sport" :model-value="filter.sportId" @update:model-value="update('sportId', $event)" placeholder="종목 ID" /><small role="alert">종목 목록을 불러오지 못했습니다.</small></template></div>
    <div v-if="!profile" class="field-group"><label for="chat-match">경기 ID</label><BaseInput id="chat-match" :model-value="filter.matchId" @update:model-value="update('matchId', $event)" @enter="$emit('search')" /></div>
    <template #actions><BaseButton @click="$emit('search')">조회</BaseButton><BaseButton variant="outline" @click="$emit('reset')">초기화</BaseButton></template>
  </AdminFilterCard>
</template>
<script setup>
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
const props = defineProps({ filter: { type: Object, required: true }, profile: Boolean, sportsError: Boolean, sports: { type: Array, default: () => [] } })
const emit = defineEmits(['update:filter', 'search', 'reset'])
function update(key, value) { emit('update:filter', { ...props.filter, [key]: value }) }
</script>
