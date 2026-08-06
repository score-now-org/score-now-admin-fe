<template>
  <div>
    <div v-if="loading" class="tab-loading">불러오는 중...</div>

    <div v-else>
      <!-- 경고 요약 -->
      <table class="detail-table">
        <tbody>
          <tr>
            <th>누적 경고 횟수</th>
            <td>
              <span
                :class="
                  data?.warningCnt > 0 ? 'warn-count red' : 'warn-count muted'
                "
              >
                {{ data?.warningCnt }}회
              </span>
            </td>
            <th>최근 경고일</th>
            <td>{{ data?.lastWarningAt || "-" }}</td>
          </tr>
          <tr>
            <th>현재 제재 상태</th>
            <td colspan="3">
              <BaseBadge :variant="sanctionVariant(data?.sanctionStatus)">
                {{ sanctionLabel(data?.sanctionStatus) }}
              </BaseBadge>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 경고 이력 -->
      <div class="section-title">경고 이력</div>
      <table class="detail-table">
        <thead>
          <tr>
            <th>경고일시</th>
            <th>경고사유</th>
            <th>처리자</th>
            <th>비고</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(log, idx) in data?.warningHistory" :key="idx">
            <td class="muted">{{ log.datetime }}</td>
            <td>{{ log.reason }}</td>
            <td>
              <BaseBadge variant="gray">{{ log.admin }}</BaseBadge>
            </td>
            <td class="muted">{{ log.note || "-" }}</td>
          </tr>
          <tr v-if="!data?.warningHistory?.length">
            <td colspan="4" class="empty">경고 이력이 없습니다.</td>
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
      // const res = await api.get(`/admin/users/${id}/warning`)
      // data.value = res.data
      await new Promise((r) => setTimeout(r, 300));
      data.value = {
        warningCnt: 3,
        lastWarningAt: "2026-06-10",
        sanctionStatus: "normal",
        warningHistory: [
          {
            datetime: "2026-06-10",
            reason: "욕설",
            admin: "admin01",
            note: "",
          },
          {
            datetime: "2026-05-20",
            reason: "광고성 게시글",
            admin: "admin02",
            note: "",
          },
          {
            datetime: "2026-04-01",
            reason: "도배",
            admin: "admin03",
            note: "",
          },
        ],
      };
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

function sanctionLabel(status) {
  return (
    {
      normal: "정상",
      limited: "이용제한",
      banned: "영구정지",
    }[status] || "-"
  );
}
function sanctionVariant(status) {
  return (
    {
      normal: "green",
      limited: "orange",
      banned: "red",
    }[status] || "gray"
  );
}
</script>

<style scoped>
.tab-loading {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-size: 13px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin: 16px 0 8px;
  padding-left: 4px;
  border-left: 3px solid #1c67ff;
}

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

.warn-count {
  font-weight: 700;
  font-size: 13px;
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
.empty {
  text-align: center;
  padding: 24px;
  color: #9ca3af;
}
</style>
