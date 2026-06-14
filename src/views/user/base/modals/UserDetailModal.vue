<template>
  <BaseModal v-model="visible" :title="`회원 상세 #${userId}`" width="600px">
    <!-- 탭 -->
    <div class="detail-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="detail-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 탭 컨텐츠 -->
    <UserDetailBasic v-if="activeTab === 'basic'" :userId="userId" />
    <UserDetailSecurity v-if="activeTab === 'security'" :userId="userId" />
    <UserDetailWarning v-if="activeTab === 'warning'" :userId="userId" />
    <UserDetailActivity v-if="activeTab === 'activity'" :userId="userId" />

    <template #footer>
      <BaseButton variant="outline" @click="visible = false">닫기</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from "vue";
import UserDetailBasic from "./tabs/UserDetailBasic.vue";
import UserDetailSecurity from "./tabs/UserDetailSecurity.vue";
import UserDetailWarning from "./tabs/UserDetailWarning.vue";
//import UserDetailActivity from './tabs/UserDetailActivity.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  userId: { type: Number, default: null },
});
const emit = defineEmits(["update:modelValue"]);

const visible = ref(props.modelValue);
watch(
  () => props.modelValue,
  (val) => (visible.value = val),
);
watch(visible, (val) => emit("update:modelValue", val));

const tabs = [
  { key: "basic", label: "기본정보" },
  { key: "security", label: "보안정보" },
  { key: "warning", label: "경고정보" },
  { key: "activity", label: "활동정보" },
];
const activeTab = ref("basic");

// 모달 열릴 때마다 첫 탭으로 초기화
watch(
  () => props.modelValue,
  (val) => {
    if (val) activeTab.value = "basic";
  },
);
</script>

<style scoped>
.detail-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
}
.detail-tab {
  padding: 7px 16px;
  font-size: 12px;
  border: 1px solid #d1d5db;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
}
.detail-tab:hover {
  background: #e5e7eb;
}
.detail-tab.active {
  background: #1c67ff;
  color: #fff;
  border-color: #1c67ff;
  font-weight: 600;
}
</style>
