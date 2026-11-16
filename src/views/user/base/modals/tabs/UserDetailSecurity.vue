<template>
  <div>
    <div v-if="loading" class="tab-loading">불러오는 중...</div>

    <div v-else-if="error" class="tab-loading" role="alert">{{ error }}</div>
    <div v-else>
      <!-- 계정 보안 정보 -->
      <table class="detail-table">
        <tbody>
          <tr>
            <th>계정상태</th>
            <td>
              <BaseBadge :variant="statusVariant(data?.status)">
                {{ statusLabel(data?.status) }}
              </BaseBadge>
            </td>
            <th>최근 로그인 성공일</th>
            <td>{{ data?.lastLoginAt || "-" }}</td>
          </tr>
          <tr>
            <th>비밀번호 변경일</th>
            <td colspan="3">{{ data?.passwordChangedAt || "-" }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 로그인 이력 -->
      <div class="section-title">로그인 이력 (최근 10건)</div>
      <table class="detail-table">
        <thead>
          <tr>
            <th>일시</th>
            <th>결과</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(log, idx) in data?.loginHistories" :key="idx">
            <td class="muted">{{ log.lastLoginAt }}</td>
            <td>
              <BaseBadge variant="green">성공</BaseBadge>
            </td>
            <td class="mono">{{ log.lastLoginIp }}</td>
          </tr>
          <tr v-if="!data?.loginHistories?.length">
            <td colspan="3" class="empty">이력이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { getMemberDetail, getMemberSecurity } from "@/api/admin";

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
    const [securityResponse, memberResponse] = await Promise.all([getMemberSecurity(id), getMemberDetail(id)]);
    if (!cancelled) {
      const history = securityResponse.data.data.loginHistories || [];
      data.value = { status: memberResponse.data.data.status?.toLowerCase(), lastLoginAt: history[0]?.lastLoginAt, loginHistories: history };
    }
  } catch {
    if (!cancelled) error.value = '보안 정보를 불러오지 못했습니다.';
  } finally {
    if (!cancelled) loading.value = false;
  }
}, { immediate: true });

function statusLabel(status) {
  return (
    { active: "활동중", inactive: "비활동", banned: "정지" }[status] || status
  );
}
function statusVariant(status) {
  return { active: "green", inactive: "gray", banned: "red" }[status] || "gray";
}
</script>

<style scoped>
.tab-loading {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-size: 13px;
}

/* ── 섹션 타이틀 ── */
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin: 16px 0 8px;
  padding-left: 4px;
  border-left: 3px solid #1c67ff;
}

/* ── 테이블 ── */
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.detail-table th {
  padding: 8px 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  font-weight: 600;
  color: #4b5563;
  white-space: nowrap;
  text-align: left;
  width: 130px;
}
.detail-table td {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  color: #374151;
}
.detail-table thead th {
  background: #f3f4f6;
  color: #374151;
  width: auto;
}

/* ── IP 고정폭 폰트 ── */
.mono {
  font-family: "Courier New", monospace;
  font-size: 12px;
}

.muted {
  color: #9ca3af;
}
.empty {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
}
</style>
