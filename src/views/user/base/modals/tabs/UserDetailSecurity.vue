<template>
  <div>
    <div v-if="loading" class="tab-loading">불러오는 중...</div>

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
          <tr v-for="(log, idx) in data?.loginHistory" :key="idx">
            <td class="muted">{{ log.datetime }}</td>
            <td>
              <BaseBadge :variant="log.result === '성공' ? 'green' : 'red'">
                {{ log.result }}
              </BaseBadge>
            </td>
            <td class="mono">{{ log.ip }}</td>
          </tr>
          <tr v-if="!data?.loginHistory?.length">
            <td colspan="3" class="empty">이력이 없습니다.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  userId: { type: Number, default: null },
});

const loading = ref(false);
const data = ref(null);

watch(
  () => props.userId,
  async (id) => {
    if (!id) return;
    loading.value = true;
    try {
      // TODO: 실제 API 연결 시 교체
      // const res = await api.get(`/admin/users/${id}/security`)
      // data.value = res.data
      await new Promise((r) => setTimeout(r, 300));
      data.value = {
        status: "active",
        lastLoginAt: "2026-06-14 08:32:00",
        passwordChangedAt: "2026-03-01 14:22:00",
        loginHistory: [
          { datetime: "2026-06-14 08:32", result: "성공", ip: "211.234.12.1" },
          { datetime: "2026-06-13 21:10", result: "실패", ip: "211.234.12.1" },
          { datetime: "2026-06-13 20:58", result: "실패", ip: "211.234.12.1" },
          { datetime: "2026-06-12 17:44", result: "성공", ip: "125.131.77.4" },
          { datetime: "2026-06-11 09:01", result: "성공", ip: "125.131.77.4" },
          { datetime: "2026-06-10 22:15", result: "성공", ip: "211.234.12.1" },
          { datetime: "2026-06-09 13:30", result: "실패", ip: "59.6.45.200" },
          { datetime: "2026-06-08 08:05", result: "성공", ip: "125.131.77.4" },
          { datetime: "2026-06-07 19:22", result: "성공", ip: "211.234.12.1" },
          { datetime: "2026-06-06 11:48", result: "성공", ip: "125.131.77.4" },
        ],
      };
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

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
