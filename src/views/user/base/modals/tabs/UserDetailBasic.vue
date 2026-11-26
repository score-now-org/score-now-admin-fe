<template>
  <div>
    <!-- 로딩 -->
    <div v-if="loading" class="tab-loading">불러오는 중...</div>

    <!-- 테이블 -->
    <div v-else-if="error" class="tab-loading" role="alert">{{ error }}</div>
    <table v-else class="detail-table">
      <tbody>
        <tr>
          <th>회원번호</th>
          <td>{{ data?.memberId }}</td>
          <th>제공자</th>
          <td>
            <BaseBadge
              :variant="data?.provider === 'google' ? 'red' : 'yellow'"
            >
              {{ data?.provider }}
            </BaseBadge>
          </td>
        </tr>
        <tr>
          <th>닉네임</th>
          <td>{{ data?.nickname || "-" }}</td>
          <th>이름</th>
          <td>{{ data?.name || "-" }}</td>
        </tr>
        <tr>
          <th>이메일</th>
          <td colspan="3">{{ data?.email || "-" }}</td>
        </tr>
        <tr>
          <th>소셜 아이디</th>
          <td colspan="3">{{ data?.socialId || "-" }}</td>
        </tr>
        <tr>
          <th>국가</th>
          <td>
            <BaseBadge variant="blue">{{ data?.countryCode }}</BaseBadge>
          </td>
          <th>경고횟수</th>
          <td>
            <span
              :class="
                data?.warningCnt > 0 ? 'warn-count red' : 'warn-count muted'
              "
            >
              {{ data?.warningCnt }}
            </span>
          </td>
        </tr>
        <tr>
          <th>활동상태</th>
          <td>
            <BaseBadge :variant="statusVariant(data?.status)">
              {{ statusLabel(data?.status) }}
            </BaseBadge>
          </td>
          <th>프로필 사진</th>
          <td>
            <img
              v-if="data?.profileImageUrl"
              :src="data.profileImageUrl"
              class="profile-img"
              alt="프로필"
              @click="previewImg = data.profileImageUrl"
            />
            <span v-else class="muted">없음</span>
          </td>
        </tr>
        <tr>
          <th>정지 종료일</th>
          <td colspan="3">{{ data?.banExpiresAt ? new Date(data.banExpiresAt).toLocaleString('ko-KR') : '-' }}</td>
        </tr>
        <tr>
          <th>가입일</th>
          <td>{{ data?.createdAt }}</td>
          <th>최근수정일</th>
          <td>{{ data?.updatedAt }}</td>
        </tr>
      </tbody>
    </table>
    <Teleport to="body">
      <div
        v-if="previewImg"
        class="img-viewer-overlay"
        @click="previewImg = null"
      >
        <div class="img-viewer-box" @click.stop>
          <button class="img-viewer-close" @click="previewImg = null">✕</button>
          <img :src="previewImg" class="img-viewer-img" alt="프로필 확대" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { getMemberDetail } from "@/api/admin";

const previewImg = ref(null);
const props = defineProps({
  userId: { type: Number, default: null },
});

const loading = ref(false);
const error = ref('');
const data = ref(null);

watch(() => props.userId, async (id, _, onCleanup) => {
  data.value = null;
  error.value = '';
  if (!id) return;
  let cancelled = false;
  onCleanup(() => { cancelled = true; });
  loading.value = true;
  try {
    const response = await getMemberDetail(id);
    if (!cancelled) {
      const member = response.data.data;
      data.value = { ...member, status: member.status?.toLowerCase(), provider: member.provider?.toLowerCase() };
    }
  } catch {
    if (!cancelled) error.value = '회원 정보를 불러오지 못했습니다.';
  } finally {
    if (!cancelled) loading.value = false;
  }
}, { immediate: true });

function statusLabel(status) {
  return (
    { active: "활동중", inactive: "비활동", banned: "정지", deleted: "탈퇴", permanently_withdrawn: "영구탈퇴" }[status] || status
  );
}
function statusVariant(status) {
  return { active: "green", inactive: "gray", banned: "red", permanently_withdrawn: "red" }[status] || "gray";
}
</script>

<style scoped>
.tab-loading {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-size: 13px;
}
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.detail-table th {
  width: 100px;
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-weight: 600;
  color: #4b5563;
  white-space: nowrap;
}
.detail-table td {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  color: #374151;
}
.profile-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.warn-count {
  font-weight: 600;
}
.warn-count.red {
  color: #ef4444;
}
.warn-count.muted {
  color: #9ca3af;
}
.muted {
  color: #9ca3af;
}
/* ── 프로필 썸네일 ── */
.profile-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: zoom-in;
  transition:
    opacity 0.15s,
    transform 0.15s;
  border: 2px solid #e5e7eb;
}
.profile-img:hover {
  opacity: 0.85;
  transform: scale(1.1);
}

/* ── 이미지 뷰어 ── */
.img-viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: zoom-out;
  backdrop-filter: blur(4px);
}
.img-viewer-box {
  position: relative;
  cursor: default;
}
.img-viewer-close {
  position: absolute;
  top: -14px;
  right: -14px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #fff;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: background 0.15s;
}
.img-viewer-close:hover {
  background: #f3f4f6;
}
.img-viewer-img {
  width: 280px;
  height: 280px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
</style>
