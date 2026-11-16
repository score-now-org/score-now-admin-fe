<template>
<!-- Search -->
        <div class="search-box">
          <div class="filter-row">
            <!-- 닉네임 -->
            <div class="filter-item">
              <label class="filter-label">닉네임</label>
              <BaseInput :model-value="filter.nickname" @update:model-value="update('nickname', $event)" placeholder="닉네임 입력" aria-label="닉네임" />
            </div>

            <!-- 회원번호 -->
            <div class="filter-item">
              <label class="filter-label">회원번호</label>
              <BaseInput :model-value="filter.memberId" @update:model-value="update('memberId', $event)" placeholder="회원번호 입력" aria-label="회원번호" />
            </div>

            <!-- 제공자 -->
            <div class="filter-item">
              <label class="filter-label">제공자</label>
              <BaseSelect :model-value="filter.provider" @update:model-value="update('provider', $event)" aria-label="제공자">
                <option value="">전체</option>
                <option value="kakao">kakao</option>
                <option value="google">google</option>
              </BaseSelect>
            </div>

            <!-- 가입일 -->
            <div class="filter-item">
              <label class="filter-label">가입일</label>
              <div class="date-range">
                <input
                  class="date-input"
                  type="date"
                  aria-label="가입 시작일"
                  :value="filter.createdFrom" @input="update('createdFrom', $event.target.value)"
                />
                <span class="date-sep">~</span>
                <input
                  class="date-input"
                  type="date"
                  aria-label="가입 종료일"
                  :value="filter.createdTo" @input="update('createdTo', $event.target.value)"
                />
              </div>
            </div>

            <!-- 활동상태 -->
            <div class="filter-item">
              <label class="filter-label">활동상태</label>
              <BaseSelect :model-value="filter.status" @update:model-value="update('status', $event)" aria-label="활동상태">
                <option value="">전체</option>
                <option value="active">활동중</option>
                <option value="inactive">비활동</option>
                <option value="banned">정지</option>
              </BaseSelect>
            </div>

            <!-- 버튼 -->
            <div class="filter-item filter-btns">
              <BaseButton variant="primary" size="md" @click="$emit('search')"
                >조회</BaseButton
              >
              <BaseButton variant="outline" size="md" @click="$emit('reset')"
                >초기화</BaseButton
              >
            </div>
          </div>
        </div>
</template>

<script setup>
const props = defineProps({ filter: { type: Object, required: true } })
const emit = defineEmits(['update:filter', 'search', 'reset'])
function update(key, value) { emit('update:filter', { ...props.filter, [key]: value }) }
</script>

<style scoped>
.search-box {
  background: #fff;
  border: 1px solid #d1d5db;
  margin: 12px 12px 8px;
  border-radius: 6px;
  padding: 14px 16px;
}
.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.filter-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
}
.filter-btns {
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: flex-end;
  margin-left: auto;
}
.filter-btn {
  width: 88px;
}
.date-input {
  border: 1px solid #e9e9e9;
  border-radius: 4px;
  padding: 7px 12px;
  font-size: 12px;
  color: #232323;
  background: #f3f3f3;
  outline: none;
  font-family: inherit;
  transition:
    border-color 0.15s,
    background 0.15s;
  box-sizing: border-box;
  cursor: pointer;
}
.date-input:focus {
  border-color: #1c67ff;
  background: #fff;
}
</style>
