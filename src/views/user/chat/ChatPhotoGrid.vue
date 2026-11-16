<template>
  <section class="photo-section" aria-label="사진 목록">
    <div class="toolbar"><strong>검색 결과</strong><span>총 {{ pagination.totalElements }}건</span>
      <AdminTablePagination :page="pagination.currentPage + 1" :total-pages="Math.max(1, pagination.totalPages)" :page-size="pagination.size" :page-size-options="[15, 30, 50]" :loading="loading" @change-page="$emit('change-page', $event - 1)" @change-page-size="$emit('change-page-size', $event)" />
    </div>
    <p v-if="loading" role="status" class="state">불러오는 중입니다.</p><p v-else-if="error" role="alert" class="state">{{ error }}</p><p v-else-if="!items.length" class="state">검색 결과가 없습니다.</p>
    <div v-else class="grid">
      <article v-for="item in items" :key="profile ? item.memberId : item.chatId" class="card">
        <img :src="profile ? item.profileImageUrl : item.imageUrl" :alt="profile ? '프로필 사진' : '채팅 사진'" />
        <div class="actions">
          <BaseButton variant="danger" size="sm" @click="profile ? $emit('action', item.memberId, 'DELETE_PROFILE_IMAGE') : $emit('delete', item)">삭제</BaseButton>
          <template v-if="item.memberId"><BaseButton variant="outline" size="sm" @click="$emit('action', item.memberId, 'PERMANENT_WITHDRAWAL')">영구탈퇴</BaseButton><BaseButton variant="outline" size="sm" @click="$emit('action', item.memberId, 'WARN')">경고</BaseButton><BaseButton variant="outline" size="sm" @click="$emit('action', item.memberId, 'BAN')">정지</BaseButton></template>
        </div>
        <p>{{ item.socialId || item.nickname || '-' }}</p>
      </article>
    </div>
  </section>
</template>
<script setup>
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
defineProps({ items: { type: Array, required: true }, profile: Boolean, loading: Boolean, error: { type: String, default: '' }, pagination: { type: Object, required: true } })
defineEmits(['change-page', 'change-page-size', 'delete', 'action'])
</script>
<style scoped>
.photo-section { background: var(--admin-color-surface); border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); padding: var(--admin-card-padding); }
.toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px; }
.toolbar span { color: var(--admin-color-text-muted); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; }
.card { min-width: 0; border: 1px solid var(--admin-color-border); border-radius: var(--admin-card-radius); overflow: hidden; }
.card img { width: 100%; aspect-ratio: 1; object-fit: cover; }
.actions { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; }
.card p { margin: 0; padding: 8px; overflow-wrap: anywhere; }
.state { text-align: center; padding: 48px 0; color: var(--admin-color-text-muted); }
</style>
