<template>
  <AdminListPage title="리그 관리">
    <template #header-actions>
      <BaseButton
        v-if="activeTab === 'leagues'"
        variant="success"
        size="md"
        @click="openCreateLeagueModal"
      >
        + 리그 등록
      </BaseButton>
      <BaseButton
        v-else-if="activeTab === 'seasons'"
        variant="success"
        size="md"
        @click="openCreateSeasonModal"
      >
        + 시즌 등록
      </BaseButton>
      <BaseButton
        v-else
        variant="success"
        size="md"
        @click="openCreateStandingsModal"
      >
        + 순위 관리 설정 등록
      </BaseButton>
    </template>

    <nav class="tab-bar" aria-label="리그 관리 메뉴" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeTab === tab.value }"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.value"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </nav>

    <section v-if="activeTab === 'leagues'" class="admin-section">
      <AdminFilterCard aria-label="리그 검색 조건">
        <div class="field-group filter-id">
          <label for="league-id">리그 ID</label>
          <BaseInput
            id="league-id"
            v-model="leagueSearch.leagueId"
            placeholder="단일 검색"
            @enter="fetchLeagues"
          />
        </div>

        <div class="field-group filter-keyword">
          <label for="league-keyword">리그명</label>
          <BaseInput
            id="league-keyword"
            v-model="leagueSearch.keyword"
            placeholder="한글/영문 리그명"
            @enter="fetchLeagues"
          />
        </div>

        <template #actions>
          <BaseButton variant="secondary" size="md" :disabled="leagueLoading" @click="resetLeagueSearch">
            초기화
          </BaseButton>
          <BaseButton variant="primary" size="md" :disabled="leagueLoading" @click="fetchLeagues">
            {{ leagueLoading ? '검색중' : '검색' }}
          </BaseButton>
        </template>
      </AdminFilterCard>

      <AdminTableCard scroll-label="리그 목록" table-min-width="1160px">
        <template #summary>
          <strong>검색 결과</strong>
          <span>총 {{ leagues.length }}건</span>
        </template>

        <table class="league-table">
          <colgroup>
            <col class="col-id" />
            <col class="col-sport" />
            <col class="col-name" />
            <col class="col-short" />
            <col class="col-order" />
            <col class="col-origin" />
            <col class="col-linked" />
            <col class="col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>리그 ID</th>
              <th>종목</th>
              <th>리그명</th>
              <th>숏네임</th>
              <th>팀 표기 순서</th>
              <th>데이터 원천</th>
              <th>외부 연동</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <AdminTableState
              v-if="leagueLoading"
              type="loading"
              :colspan="8"
              title="리그 목록을 불러오는 중입니다."
              compact
            />
            <AdminTableState
              v-else-if="leagueError"
              type="error"
              :colspan="8"
              :title="leagueError"
              description="잠시 후 다시 검색해 주세요."
            />
            <AdminTableState
              v-else-if="leagues.length === 0"
              :colspan="8"
              title="검색 결과가 없습니다."
              description="리그 ID 또는 리그명을 다시 확인해 주세요."
            />
            <tr v-for="league in leagues" v-else :key="league.id">
              <td class="id-cell">{{ league.id }}</td>
              <td>
                <AdminSportBadge
                  :sport-code="league.sportCode"
                  :sport-name="sportLabel(league)"
                />
              </td>
              <td class="league-name-cell">
                <div class="name-stack">
                  <strong>{{ displayLeagueName(league) }}</strong>
                  <span>{{ leagueEName(league) || '-' }}</span>
                </div>
              </td>
              <td>{{ leagueSName(league) || '-' }}</td>
              <td>
                <BaseBadge :variant="teamDisplayOrderVariant(league.teamDisplayOrder)">
                  {{ teamDisplayOrderLabel(league.teamDisplayOrder) }}
                </BaseBadge>
              </td>
              <td>
                <AdminDataOriginBadge :data-origin="league.dataOrigin" />
              </td>
              <td>
                <BaseBadge :variant="leagueSyncVariant(league)">
                  {{ leagueSyncLabel(league) }}
                </BaseBadge>
              </td>
              <td>
                <div class="action-buttons row-action-layout">
                  <BaseButton
                    variant="outline"
                    size="sm"
                    class="row-action-primary"
                    @click="openEditLeagueModal(league)"
                  >
                    수정
                  </BaseButton>
                  <div class="row-action-group" role="group" aria-label="외부 연동 관리">
                    <BaseButton
                      variant="outline"
                      size="sm"
                      class="row-action-secondary"
                      :disabled="!isExternalLeague(league)"
                      @click="openLeagueApiModal(league)"
                    >
                      API ID
                    </BaseButton>
                    <BaseButton
                      variant="outline"
                      size="sm"
                      class="row-action-secondary"
                      :disabled="!isExternalLeague(league)"
                      @click="openLeagueSyncModal(league)"
                    >
                      동기화 여부
                    </BaseButton>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </AdminTableCard>
    </section>

    <section v-else-if="activeTab === 'seasons'" class="admin-section">
      <AdminFilterCard aria-label="리그 시즌 검색 조건">
        <div class="field-group filter-id">
          <label for="season-league-id">리그 ID</label>
          <BaseInput
            id="season-league-id"
            v-model="seasonSearch.leagueId"
            placeholder="리그 ID"
            @enter="searchLeagueSeasons"
          />
        </div>

        <div class="field-group filter-keyword">
          <label for="season-league-name">리그명</label>
          <BaseInput
            id="season-league-name"
            v-model="seasonSearch.leagueName"
            placeholder="한글/영문 리그명"
            @enter="searchLeagueSeasons"
          />
        </div>

        <template #actions>
          <BaseButton variant="secondary" size="md" :disabled="seasonLoading" @click="resetSeasonSearch">
            초기화
          </BaseButton>
          <BaseButton variant="primary" size="md" :disabled="seasonLoading" @click="searchLeagueSeasons">
            {{ seasonLoading ? '검색중' : '검색' }}
          </BaseButton>
        </template>
      </AdminFilterCard>

      <AdminTableCard scroll-label="리그 시즌 목록" table-min-width="1100px">
        <template #summary>
          <strong>검색 결과</strong>
          <span>총 {{ seasonTotalElements }}건</span>
        </template>
        <template #toolbar-actions>
          <AdminTablePagination
            v-model:page-size="seasonPageSize"
            :page-size-options="pageSizeOptions"
            :page="seasonPage"
            :total-pages="seasonMaxPage"
            :loading="seasonLoading"
            @change-page="changeSeasonPage"
          />
        </template>

        <table class="season-table">
          <colgroup>
            <col class="col-id" />
            <col class="col-id" />
            <col class="col-name" />
            <col class="col-name" />
            <col class="col-period" />
            <col class="col-current" />
            <col class="col-actions-compact" />
          </colgroup>
          <thead>
            <tr>
              <th>시즌 ID</th>
              <th>리그 ID</th>
              <th>리그명</th>
              <th>시즌명</th>
              <th>기간</th>
              <th>현재 시즌</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <AdminTableState
              v-if="seasonLoading"
              type="loading"
              :colspan="7"
              title="리그 시즌 목록을 불러오는 중입니다."
              compact
            />
            <AdminTableState
              v-else-if="seasonError"
              type="error"
              :colspan="7"
              :title="seasonError"
              description="잠시 후 다시 검색해 주세요."
            />
            <AdminTableState
              v-else-if="leagueSeasons.length === 0"
              :colspan="7"
              :title="seasonEmptyMessage"
              :description="seasonSearched ? '검색 조건을 변경한 뒤 다시 검색해 주세요.' : ''"
            />
            <tr v-for="season in leagueSeasons" v-else :key="season.leagueSeasonId">
              <td class="id-cell">{{ season.leagueSeasonId }}</td>
              <td>{{ season.leagueId }}</td>
              <td>{{ season.leagueName || '-' }}</td>
              <td class="emphasis-cell">{{ season.leagueSeasonName || '-' }}</td>
              <td class="muted-cell period-cell">
                {{ formatPeriod(season.leagueSeasonStartAt, season.leagueSeasonEndAt) }}
              </td>
              <td>
                <BaseBadge :variant="isCurrentSeason(season) ? 'green' : 'gray'">
                  {{ isCurrentSeason(season) ? '현재' : '아님' }}
                </BaseBadge>
              </td>
              <td>
                <div class="action-buttons row-action-layout">
                  <BaseButton
                    variant="outline"
                    size="sm"
                    class="row-action-primary"
                    @click="openEditSeasonModal(season)"
                  >
                    수정
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </AdminTableCard>
    </section>

    <section v-else class="admin-section">
      <AdminFilterCard aria-label="리그 시즌 순위 검색 조건">
        <div class="field-group filter-id">
          <label for="standings-league-id">리그 ID</label>
          <BaseInput
            id="standings-league-id"
            v-model="standingsSearch.leagueId"
            placeholder="리그 ID"
            @enter="searchStandings"
          />
        </div>

        <div class="field-group filter-keyword">
          <label for="standings-league-name">리그명</label>
          <BaseInput
            id="standings-league-name"
            v-model="standingsSearch.leagueName"
            placeholder="한글/영문 리그명"
            @enter="searchStandings"
          />
        </div>

        <template #actions>
          <BaseButton variant="secondary" size="md" :disabled="standingsLoading" @click="resetStandingsSearch">
            초기화
          </BaseButton>
          <BaseButton variant="primary" size="md" :disabled="standingsLoading" @click="searchStandings">
            {{ standingsLoading ? '검색중' : '검색' }}
          </BaseButton>
        </template>
      </AdminFilterCard>

      <AdminTableCard scroll-label="리그 시즌 순위 관리 목록" table-min-width="1360px">
        <template #summary>
          <strong>검색 결과</strong>
          <span>총 {{ standingsTotalElements }}건</span>
        </template>
        <template #toolbar-actions>
          <AdminTablePagination
            v-model:page-size="standingsPageSize"
            :page-size-options="pageSizeOptions"
            :page="standingsPage"
            :total-pages="standingsMaxPage"
            :loading="standingsLoading"
            @change-page="changeStandingsPage"
          />
        </template>

        <table class="standings-table">
          <colgroup>
            <col class="col-id" />
            <col class="col-id" />
            <col class="col-name" />
            <col class="col-name" />
            <col class="col-current" />
            <col class="col-type" />
            <col class="col-current" />
            <col class="col-actions-wide" />
          </colgroup>
          <thead>
            <tr>
              <th>순위 ID</th>
              <th>시즌 ID</th>
              <th>리그명</th>
              <th>시즌명</th>
              <th>현재 시즌</th>
              <th>관리 타입</th>
              <th>이미지</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <AdminTableState
              v-if="standingsLoading"
              type="loading"
              :colspan="8"
              title="순위 관리 목록을 불러오는 중입니다."
              compact
            />
            <AdminTableState
              v-else-if="standingsError"
              type="error"
              :colspan="8"
              :title="standingsError"
              description="잠시 후 다시 검색해 주세요."
            />
            <AdminTableState
              v-else-if="leagueSeasonStandings.length === 0"
              :colspan="8"
              :title="standingsEmptyMessage"
              :description="standingsSearched ? '검색 조건을 변경한 뒤 다시 검색해 주세요.' : ''"
            />
            <tr
              v-for="standing in leagueSeasonStandings"
              v-else
              :key="standing.leagueSeasonStandingsId"
            >
              <td class="id-cell">{{ standing.leagueSeasonStandingsId }}</td>
              <td>{{ standing.leagueSeasonId }}</td>
              <td>{{ standing.leagueName || '-' }}</td>
              <td class="emphasis-cell">{{ standing.seasonName || '-' }}</td>
              <td>
                <BaseBadge :variant="isCurrentSeason(standing) ? 'green' : 'gray'">
                  {{ isCurrentSeason(standing) ? '현재' : '아님' }}
                </BaseBadge>
              </td>
              <td>
                <BaseBadge :variant="standingsTypeVariant(standingTypeValue(standing))">
                  {{ standingsTypeLabel(standingTypeValue(standing)) }}
                </BaseBadge>
              </td>
              <td>
                <BaseBadge :variant="standing.standingImageRegistered ? 'green' : 'gray'">
                  {{ standing.standingImageRegistered ? '등록됨' : '미등록' }}
                </BaseBadge>
              </td>
              <td>
                <div class="action-buttons row-action-layout">
                  <BaseButton
                    variant="outline"
                    size="sm"
                    class="row-action-primary"
                    @click="openEditStandingsTypeModal(standing)"
                  >
                    타입 수정
                  </BaseButton>
                  <div class="row-action-group" role="group" aria-label="순위 추가 관리">
                    <BaseButton
                      variant="outline"
                      size="sm"
                      class="row-action-secondary"
                      :disabled="standingTypeValue(standing) !== 'IMAGE'"
                      @click="openUploadImageModal(standing)"
                    >
                      이미지 업로드
                    </BaseButton>
                    <BaseButton
                      variant="outline"
                      size="sm"
                      class="row-action-secondary"
                      :disabled="standingTypeValue(standing) !== 'EXTERNAL_DATA'"
                      @click="syncStandingsData(standing)"
                    >
                      외부 동기화
                    </BaseButton>
                    <BaseButton
                      variant="outline"
                      size="sm"
                      class="row-action-secondary"
                      :disabled="standingTypeValue(standing) !== 'EXTERNAL_DATA'"
                      @click="openGroupMappingsModal(standing)"
                    >
                      그룹 설정
                    </BaseButton>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </AdminTableCard>
    </section>

    <BaseModal
      v-model="createLeagueModal.visible"
      title="리그 등록"
      size="lg"
      :close-disabled="createLeagueModal.saving"
    >
      <div class="modal-form">
        <div class="form-grid">
          <div class="form-row">
            <label class="form-label">종목</label>
            <BaseSelect v-model="leagueForm.sportId" :disabled="leagueOptionsLoading">
              <option value="">선택</option>
              <option
                v-for="sport in sportOptions"
                :key="sport.id"
                :value="String(sport.id)"
              >
                {{ sport.label }}
              </option>
            </BaseSelect>
          </div>
          <div class="form-row">
            <label class="form-label">팀 표기 순서</label>
            <BaseSelect v-model="leagueForm.teamDisplayOrder" :disabled="leagueOptionsLoading">
              <option
                v-for="option in teamDisplayOrderOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </BaseSelect>
          </div>
          <div class="form-row">
            <label class="form-label">한글 리그명</label>
            <BaseInput v-model="leagueForm.kName" placeholder="예) 프리미어리그" />
          </div>
          <div class="form-row">
            <label class="form-label">영문 리그명</label>
            <BaseInput v-model="leagueForm.eName" placeholder="예) Premier League" />
          </div>
          <div class="form-row">
            <label class="form-label">숏네임</label>
            <BaseInput v-model="leagueForm.sName" placeholder="예) EPL" />
          </div>
          <div class="form-row">
            <label class="form-label">외부데이터 연동</label>
            <BaseSelect v-model="leagueForm.externalLinked">
              <option value="false">미연동</option>
              <option value="true">연동</option>
            </BaseSelect>
          </div>
          <div class="form-row">
            <label class="form-label">데이터 원천</label>
            <BaseSelect
              v-model="leagueForm.dataOrigin"
              :disabled="leagueForm.externalLinked !== 'true' || leagueOptionsLoading"
            >
              <option value="">외부 연동 시 선택</option>
              <option
                v-for="option in dataOriginOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </BaseSelect>
          </div>
          <div class="form-row">
            <label class="form-label">외부 API 리그 ID</label>
            <BaseInput
              v-model="leagueForm.apiLeagueId"
              :disabled="leagueForm.externalLinked !== 'true'"
              placeholder="예) 94"
            />
          </div>
          <div class="form-row">
            <label class="form-label">외부 경기 동기화</label>
            <BaseSelect v-model="leagueForm.syncEnabled" :disabled="leagueForm.externalLinked !== 'true'">
              <option value="false">비활성</option>
              <option value="true">활성</option>
            </BaseSelect>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" :disabled="createLeagueModal.saving" @click="createLeagueModal.visible = false">
          취소
        </BaseButton>
        <BaseButton
          variant="primary"
          :disabled="createLeagueModal.saving || leagueOptionsLoading"
          @click="saveNewLeague"
        >
          {{ createLeagueModal.saving ? '등록중' : leagueOptionsLoading ? '옵션 로딩중' : '등록' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model="editLeagueModal.visible"
      title="리그 정보 수정"
      size="lg"
      :close-disabled="editLeagueModal.saving"
    >
      <div class="modal-form">
        <div class="form-grid">
          <div class="form-row">
            <label class="form-label">리그 ID</label>
            <BaseInput v-model="leagueEditForm.id" disabled />
          </div>
          <div class="form-row">
            <label class="form-label">종목 ID</label>
            <BaseInput v-model="leagueEditForm.sportId" placeholder="예) 1" />
          </div>
          <div class="form-row">
            <label class="form-label">한글 리그명</label>
            <BaseInput v-model="leagueEditForm.kName" />
          </div>
          <div class="form-row">
            <label class="form-label">영문 리그명</label>
            <BaseInput v-model="leagueEditForm.eName" />
          </div>
          <div class="form-row">
            <label class="form-label">숏네임</label>
            <BaseInput v-model="leagueEditForm.sName" />
          </div>
          <div class="form-row">
            <label class="form-label">팀 표기 순서</label>
            <BaseSelect v-model="leagueEditForm.teamDisplayOrder">
              <option value="HOME_AWAY">홈팀 먼저</option>
              <option value="AWAY_HOME">원정팀 먼저</option>
            </BaseSelect>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" :disabled="editLeagueModal.saving" @click="editLeagueModal.visible = false">
          취소
        </BaseButton>
        <BaseButton variant="primary" :disabled="editLeagueModal.saving" @click="saveLeagueEdit">
          {{ editLeagueModal.saving ? '저장중' : '저장' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model="leagueApiModal.visible"
      title="외부 API 리그 ID 수정"
      size="sm"
      :close-disabled="leagueApiModal.saving"
    >
      <div class="modal-form">
        <div class="form-row">
          <label class="form-label">리그 ID</label>
          <BaseInput v-model="leagueApiForm.id" disabled />
        </div>
        <div class="form-row">
          <label class="form-label">외부 API 리그 ID</label>
          <BaseInput v-model="leagueApiForm.apiLeagueId" placeholder="변경할 API 리그 ID" />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" :disabled="leagueApiModal.saving" @click="leagueApiModal.visible = false">
          취소
        </BaseButton>
        <BaseButton variant="primary" :disabled="leagueApiModal.saving" @click="saveLeagueApiId">
          {{ leagueApiModal.saving ? '저장중' : '저장' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model="leagueSyncModal.visible"
      title="외부 API 동기화 여부 수정"
      size="sm"
      :close-disabled="leagueSyncModal.saving"
    >
      <div class="modal-form">
        <div class="form-row">
          <label class="form-label">리그 ID</label>
          <BaseInput v-model="leagueSyncForm.id" disabled />
        </div>
        <div class="form-row">
          <label class="form-label">외부 경기 동기화</label>
          <BaseSelect v-model="leagueSyncForm.syncEnabled">
            <option value="">선택</option>
            <option value="false">비활성</option>
            <option value="true">활성</option>
          </BaseSelect>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" :disabled="leagueSyncModal.saving" @click="leagueSyncModal.visible = false">
          취소
        </BaseButton>
        <BaseButton variant="primary" :disabled="leagueSyncModal.saving" @click="saveLeagueSyncEnabled">
          {{ leagueSyncModal.saving ? '저장중' : '저장' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model="createSeasonModal.visible"
      title="리그 시즌 등록"
      size="lg"
      :close-disabled="createSeasonModal.saving"
    >
      <div class="modal-form">
        <div class="form-grid">
          <div class="form-row form-row-wide">
            <label class="form-label">리그</label>
            <BaseInput
              v-model="seasonForm.leagueKeyword"
              placeholder="리그명 2글자 이상 검색"
              @update:modelValue="handleSeasonLeagueKeywordInput"
            />
            <div class="league-result-panel">
              <div v-if="selectedSeasonLeague" class="selected-league-card">
                <span class="selected-league-label">선택됨</span>
                <strong>{{ selectedSeasonLeague.name }}</strong>
                <span>{{ selectedSeasonLeague.meta }}</span>
              </div>
              <template v-else>
                <button
                  v-for="league in seasonLeagueCandidates"
                  :key="league.id"
                  class="league-result-item"
                  type="button"
                  @click="selectSeasonLeague(league)"
                >
                  <span class="league-result-name">{{ displayLeagueName(league) }}</span>
                  <span class="league-result-sub">{{ seasonLeagueMeta(league) }}</span>
                </button>
                <p v-if="seasonLeagueLoading" class="league-search-guide">
                  리그를 검색하는 중입니다.
                </p>
                <p v-else-if="showSeasonLeagueSearchGuide" class="league-search-guide">
                  리그명을 2글자 이상 입력해주세요.
                </p>
                <p v-else-if="seasonLeagueSearchError" class="league-search-guide error">
                  {{ seasonLeagueSearchError }}
                </p>
                <p v-else-if="showSeasonLeagueEmptyResult" class="league-search-guide">
                  검색 결과가 없습니다. 리그명을 더 상세하게 입력해주세요.
                </p>
                <p v-if="showSeasonLeagueLimitGuide" class="league-search-note">
                  검색 결과는 최대 10개까지 표시됩니다. 원하는 리그가 보이지 않으면 리그명을 더 상세하게 입력해주세요.
                </p>
              </template>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">시즌명</label>
            <BaseInput v-model="seasonForm.seasonName" placeholder="예) 2025/26" />
          </div>
          <div class="form-row form-row-wide">
            <div class="date-row">
              <div class="form-row">
                <label class="form-label">시즌 시작일</label>
                <BaseInput v-model="seasonForm.seasonStartAt" type="date" />
              </div>
              <div class="form-row">
                <label class="form-label">시즌 종료일</label>
                <BaseInput v-model="seasonForm.seasonEndAt" type="date" />
              </div>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">현재 시즌 여부</label>
            <div class="checkbox-field">
              <input v-model="seasonForm.isCurrent" type="checkbox" />
              <span>현재 시즌으로 설정</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" :disabled="createSeasonModal.saving" @click="createSeasonModal.visible = false">
          취소
        </BaseButton>
        <BaseButton variant="primary" :disabled="createSeasonModal.saving" @click="saveNewSeason">
          {{ createSeasonModal.saving ? '등록중' : '등록' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model="editSeasonModal.visible"
      title="리그 시즌 수정"
      size="md"
      :close-disabled="editSeasonModal.saving"
    >
      <div class="modal-form">
        <div class="form-grid">
          <div class="form-row">
            <label class="form-label">시즌 ID</label>
            <BaseInput v-model="seasonEditForm.leagueSeasonId" disabled />
          </div>
          <div class="form-row">
            <label class="form-label">시즌명</label>
            <BaseInput v-model="seasonEditForm.seasonName" />
          </div>
          <div class="form-row">
            <label class="form-label">시즌 시작일</label>
            <BaseInput v-model="seasonEditForm.seasonStartAt" type="date" />
          </div>
          <div class="form-row">
            <label class="form-label">시즌 종료일</label>
            <BaseInput v-model="seasonEditForm.seasonEndAt" type="date" />
          </div>
          <div class="form-row">
            <label class="form-label">현재 시즌</label>
            <BaseSelect v-model="seasonEditForm.isCurrent">
              <option value="false">아님</option>
              <option value="true">현재</option>
            </BaseSelect>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" :disabled="editSeasonModal.saving" @click="editSeasonModal.visible = false">
          취소
        </BaseButton>
        <BaseButton variant="primary" :disabled="editSeasonModal.saving" @click="saveSeasonEdit">
          {{ editSeasonModal.saving ? '저장중' : '저장' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model="createStandingsModal.visible"
      title="리그 시즌 순위 등록"
      size="sm"
      :close-disabled="createStandingsModal.saving"
    >
      <div class="modal-form">
        <div class="form-row">
          <label class="form-label">리그 시즌 ID</label>
          <BaseInput v-model="standingsForm.leagueSeasonId" placeholder="예) 10" />
        </div>
        <div class="form-row">
          <label class="form-label">순위 관리 타입</label>
          <BaseSelect v-model="standingsForm.standingsType">
            <option value="IMAGE">이미지</option>
            <option value="EXTERNAL_DATA">외부 데이터</option>
          </BaseSelect>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" :disabled="createStandingsModal.saving" @click="createStandingsModal.visible = false">
          취소
        </BaseButton>
        <BaseButton variant="primary" :disabled="createStandingsModal.saving" @click="saveNewStandings">
          {{ createStandingsModal.saving ? '등록중' : '등록' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model="editStandingsTypeModal.visible"
      title="순위 관리 타입 수정"
      size="sm"
      :close-disabled="editStandingsTypeModal.saving"
    >
      <div class="modal-form">
        <div class="form-row">
          <label class="form-label">리그 시즌 ID</label>
          <BaseInput v-model="standingsTypeForm.leagueSeasonId" disabled />
        </div>
        <div class="form-row">
          <label class="form-label">순위 관리 타입</label>
          <BaseSelect v-model="standingsTypeForm.standingsType">
            <option value="IMAGE">이미지</option>
            <option value="EXTERNAL_DATA">외부 데이터</option>
          </BaseSelect>
        </div>
      </div>
      <template #footer>
        <BaseButton
          variant="outline"
          :disabled="editStandingsTypeModal.saving"
          @click="editStandingsTypeModal.visible = false"
        >
          취소
        </BaseButton>
        <BaseButton variant="primary" :disabled="editStandingsTypeModal.saving" @click="saveStandingsType">
          {{ editStandingsTypeModal.saving ? '저장중' : '저장' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model="uploadImageModal.visible"
      title="순위 이미지 업로드"
      size="sm"
      :close-disabled="uploadImageModal.saving"
    >
      <div class="modal-form">
        <div class="form-row">
          <label class="form-label">리그 시즌 ID</label>
          <BaseInput v-model="imageUploadForm.leagueSeasonId" disabled />
        </div>
        <div class="form-row">
          <label class="form-label">이미지 파일</label>
          <input class="file-input" type="file" accept="image/*" @change="onStandingImageChange" />
          <span class="file-name">{{ imageUploadForm.fileName || '선택된 파일 없음' }}</span>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="outline" :disabled="uploadImageModal.saving" @click="uploadImageModal.visible = false">
          취소
        </BaseButton>
        <BaseButton variant="primary" :disabled="uploadImageModal.saving" @click="saveStandingImage">
          {{ uploadImageModal.saving ? '업로드중' : '업로드' }}
        </BaseButton>
      </template>
    </BaseModal>

    <BaseModal
      v-model="groupMappingsModal.visible"
      title="순위 그룹 설정"
      size="xl"
      :close-disabled="groupMappingsModal.loading || groupMappingsModal.saving"
    >
      <div v-if="groupMappingsModal.loading" class="group-mapping-empty">
        순위 그룹 설정을 불러오는 중입니다.
      </div>
      <div v-else-if="groupMappingsForm.groups.length === 0" class="group-mapping-empty">
        설정할 순위 그룹이 없습니다. 먼저 외부 동기화를 진행해주세요.
      </div>
      <div v-else class="group-mapping-list">
        <div
          v-for="group in groupMappingsForm.groups"
          :key="group.groupKey"
          class="group-mapping-card"
        >
          <div class="group-mapping-source">
            <strong>{{ group.externalGroupName || group.externalName || '외부 그룹명 없음' }}</strong>
            <span>{{ group.externalName || '-' }}</span>
            <code>{{ group.groupKey }}</code>
          </div>
          <div class="group-mapping-fields">
            <div class="form-row">
              <label class="form-label">표시명</label>
              <BaseInput v-model="group.displayName" placeholder="예) 동부, 서부, 통합" />
            </div>
            <div class="form-row group-order-field">
              <label class="form-label">표시 순서</label>
              <BaseInput v-model="group.displayOrder" type="number" min="0" />
            </div>
            <label class="checkbox-field group-visibility-field">
              <input v-model="group.visibleInMatchList" type="checkbox" />
              앱 경기 목록에 노출
            </label>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton
          variant="outline"
          :disabled="groupMappingsModal.loading || groupMappingsModal.saving"
          @click="groupMappingsModal.visible = false"
        >
          취소
        </BaseButton>
        <BaseButton
          variant="primary"
          :disabled="groupMappingsModal.loading || groupMappingsModal.saving || groupMappingsForm.groups.length === 0"
          @click="saveGroupMappings"
        >
          {{ groupMappingsModal.saving ? '저장중' : '저장' }}
        </BaseButton>
      </template>
    </BaseModal>
  </AdminListPage>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AdminFilterCard from '@/components/admin/AdminFilterCard.vue'
import AdminListPage from '@/components/admin/AdminListPage.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import AdminTableCard from '@/components/admin/AdminTableCard.vue'
import AdminTablePagination from '@/components/admin/AdminTablePagination.vue'
import AdminTableState from '@/components/admin/AdminTableState.vue'
import AdminDataOriginBadge from '@/components/common/AdminDataOriginBadge.vue'
import AdminSportBadge from '@/components/common/AdminSportBadge.vue'
import {
  createAdminLeague,
  createLeagueSeason,
  createLeagueSeasonStandings,
  deleteAdminLeague,
  deleteLeagueSeason,
  deleteLeagueSeasonStandings,
  getAdminLeagues,
  getLeagueAdminOptions,
  getLeagueSeasonStandingsGroupMappings,
  getLeagueSeasonStandings,
  getLeagueSeasons,
  syncLeagueSeasonStandingsData,
  updateAdminLeague,
  updateLeagueApiLeagueId,
  updateLeagueSeason,
  updateLeagueSeasonStandingsGroupMappings,
  updateLeagueSeasonStandingsType,
  updateLeagueSyncEnabled,
  uploadLeagueSeasonStandingsImage,
} from '../../../api/league'

const tabs = [
  { value: 'leagues', label: '리그' },
  { value: 'seasons', label: '시즌' },
  { value: 'standings', label: '순위 관리' },
]

const pageSizeOptions = [10, 20, 50]
const activeTab = ref('leagues')
const sportOptions = ref([])
const teamDisplayOrderOptions = ref(defaultTeamDisplayOrderOptions())
const dataOriginOptions = ref([])
const leagueOptionsLoading = ref(false)

const leagueSearch = ref({ leagueId: '', keyword: '' })
const leagues = ref([])
const leagueLoading = ref(false)
const leagueError = ref('')

const seasonSearch = ref({ leagueId: '', leagueName: '' })
const leagueSeasons = ref([])
const seasonLeagueCandidates = ref([])
const seasonPage = ref(1)
const seasonPageSize = ref(10)
const seasonTotalElements = ref(0)
const seasonTotalPages = ref(1)
const seasonLoading = ref(false)
const seasonError = ref('')
const seasonSearched = ref(false)
const seasonLeagueLoading = ref(false)
const seasonLeagueSearchError = ref('')
let seasonLeagueSearchTimer = null
let seasonLeagueSearchRequestId = 0

const standingsSearch = ref({ leagueId: '', leagueName: '' })
const leagueSeasonStandings = ref([])
const standingsPage = ref(1)
const standingsPageSize = ref(10)
const standingsTotalElements = ref(0)
const standingsTotalPages = ref(1)
const standingsLoading = ref(false)
const standingsError = ref('')
const standingsSearched = ref(false)

const createLeagueModal = ref({ visible: false, saving: false })
const editLeagueModal = ref({ visible: false, saving: false })
const leagueApiModal = ref({ visible: false, saving: false })
const leagueSyncModal = ref({ visible: false, saving: false })
const createSeasonModal = ref({ visible: false, saving: false })
const editSeasonModal = ref({ visible: false, saving: false })
const createStandingsModal = ref({ visible: false, saving: false })
const editStandingsTypeModal = ref({ visible: false, saving: false })
const uploadImageModal = ref({ visible: false, saving: false })
const groupMappingsModal = ref({ visible: false, loading: false, saving: false })

const defaultLeagueForm = () => ({
  sportId: '',
  kName: '',
  eName: '',
  sName: '',
  teamDisplayOrder: firstTeamDisplayOrderValue(),
  externalLinked: 'false',
  dataOrigin: '',
  apiLeagueId: '',
  syncEnabled: 'false',
})

const defaultLeagueEditForm = () => ({
  id: '',
  sportId: '',
  kName: '',
  eName: '',
  sName: '',
  teamDisplayOrder: 'HOME_AWAY',
})

const defaultSeasonForm = () => ({
  leagueId: '',
  leagueName: '',
  leagueKeyword: '',
  leagueSportName: '',
  seasonName: '',
  seasonStartAt: '',
  seasonEndAt: '',
  isCurrent: false,
})

const defaultSeasonEditForm = () => ({
  leagueSeasonId: '',
  seasonName: '',
  seasonStartAt: '',
  seasonEndAt: '',
  isCurrent: 'false',
})

const defaultStandingsForm = () => ({
  leagueSeasonId: '',
  standingsType: 'IMAGE',
})

const leagueForm = ref(defaultLeagueForm())
const leagueEditForm = ref(defaultLeagueEditForm())
const leagueApiForm = ref({ id: '', apiLeagueId: '' })
const leagueSyncForm = ref({ id: '', syncEnabled: '' })
const seasonForm = ref(defaultSeasonForm())
const seasonEditForm = ref(defaultSeasonEditForm())
const standingsForm = ref(defaultStandingsForm())
const standingsTypeForm = ref(defaultStandingsForm())
const imageUploadForm = ref({ leagueSeasonId: '', image: null, fileName: '' })
const groupMappingsForm = ref({ leagueSeasonId: '', leagueName: '', groups: [] })

const seasonMaxPage = computed(() => Math.max(1, seasonTotalPages.value))
const standingsMaxPage = computed(() => Math.max(1, standingsTotalPages.value))
const standingsEmptyMessage = computed(() => (
  standingsSearched.value
    ? '검색 결과가 없습니다.'
    : '리그 ID 또는 리그명을 검색하면 순위 관리 목록이 표시됩니다.'
))
const seasonEmptyMessage = computed(() => (
  seasonSearched.value
    ? '검색 결과가 없습니다.'
    : '리그 ID 또는 리그명을 검색하면 시즌 목록이 표시됩니다.'
))
const selectedSeasonLeague = computed(() => {
  if (!seasonForm.value.leagueId) return null

  return {
    id: seasonForm.value.leagueId,
    name: seasonForm.value.leagueName || seasonForm.value.leagueKeyword || '-',
    meta: seasonLeagueMeta({
      id: seasonForm.value.leagueId,
      sportName: seasonForm.value.leagueSportName,
    }),
  }
})
const showSeasonLeagueSearchGuide = computed(() => (
  !seasonForm.value.leagueId && hasShortKeyword(seasonForm.value.leagueKeyword)
))
const showSeasonLeagueEmptyResult = computed(() => (
  !seasonForm.value.leagueId
    && !seasonLeagueLoading.value
    && !seasonLeagueSearchError.value
    && hasEnoughKeyword(seasonForm.value.leagueKeyword)
    && seasonLeagueCandidates.value.length === 0
))
const showSeasonLeagueLimitGuide = computed(() => (
  !seasonForm.value.leagueId && seasonLeagueCandidates.value.length >= 10
))

onMounted(async () => {
  await loadLeagueOptions()
  await Promise.all([
    fetchLeagues(),
  ])
})

watch(
  () => leagueForm.value.externalLinked,
  (externalLinked) => {
    if (externalLinked === 'true') {
      if (!leagueForm.value.dataOrigin || leagueForm.value.dataOrigin === 'MANUAL') {
        leagueForm.value.dataOrigin = firstExternalDataOriginValue()
      }
      return
    }

    leagueForm.value.dataOrigin = ''
    leagueForm.value.apiLeagueId = ''
    leagueForm.value.syncEnabled = 'false'
  },
)

watch(seasonPageSize, async () => {
  seasonPage.value = 1
  if (seasonSearched.value && hasSeasonSearchCondition()) {
    await fetchLeagueSeasons()
  }
})

watch(
  () => createSeasonModal.value.visible,
  (visible) => {
    if (!visible) {
      clearSeasonLeagueSearchTimer()
      resetSeasonLeagueSearchResult()
    }
  },
)

watch(standingsPageSize, async () => {
  standingsPage.value = 1
  if (standingsSearched.value && hasStandingsSearchCondition()) {
    await fetchStandings()
  }
})

async function loadLeagueOptions() {
  leagueOptionsLoading.value = true

  try {
    const options = await getLeagueAdminOptions()
    sportOptions.value = ensureArray(options?.sports)
      .map((sport) => ({
        id: sport.id ?? sport.value,
        label: sport.label ?? sport.name ?? String(sport.id ?? sport.value ?? ''),
      }))
      .filter((sport) => sport.id != null && sport.label)
    teamDisplayOrderOptions.value = normalizeOptionList(
      options?.teamDisplayOrders ?? options?.teamDisplayOrderOptions,
      defaultTeamDisplayOrderOptions(),
    )
    dataOriginOptions.value = normalizeOptionList(options?.dataOrigins ?? options?.dataOriginOptions)
      .filter((option) => option.value !== 'MANUAL')

    if (!leagueForm.value.teamDisplayOrder) {
      leagueForm.value.teamDisplayOrder = firstTeamDisplayOrderValue()
    }
    if (
      leagueForm.value.externalLinked === 'true'
      && (!leagueForm.value.dataOrigin || leagueForm.value.dataOrigin === 'MANUAL')
    ) {
      leagueForm.value.dataOrigin = firstExternalDataOriginValue()
    }
  } catch (error) {
    console.error('리그 관리 옵션 조회에 실패했습니다.', error)
    teamDisplayOrderOptions.value = defaultTeamDisplayOrderOptions()
  }
  finally {
    leagueOptionsLoading.value = false
  }
}

async function fetchLeagues() {
  leagueLoading.value = true
  leagueError.value = ''

  try {
    const leagueId = leagueSearch.value.leagueId.trim()

    if (leagueId) {
      const parsedLeagueId = parsePositiveInteger(leagueId)
      if (!parsedLeagueId) {
        alert('리그 ID는 양의 정수로 입력해주세요.')
        return
      }

      leagues.value = ensureArray(await getAdminLeagues({ leagueId: parsedLeagueId }))
        .map(normalizeLeagueResponse)
      return
    }

    const keyword = leagueSearch.value.keyword.trim()
    leagues.value = ensureArray(await getAdminLeagues(compactQueryParams({ keyword })))
      .map(normalizeLeagueResponse)
  } catch (error) {
    console.error('리그 목록 조회에 실패했습니다.', error)
    leagues.value = []
    leagueError.value = extractApiErrorMessage(error, '리그 목록 조회에 실패했습니다.')
  } finally {
    leagueLoading.value = false
  }
}

async function resetLeagueSearch() {
  leagueSearch.value = { leagueId: '', keyword: '' }
  await fetchLeagues()
}

async function openCreateLeagueModal() {
  leagueForm.value = defaultLeagueForm()
  createLeagueModal.value = { visible: true, saving: false }
  await loadLeagueOptions()
}

async function saveNewLeague() {
  const payload = buildLeagueCreatePayload()
  if (!payload || createLeagueModal.value.saving) return

  createLeagueModal.value.saving = true

  try {
    await createAdminLeague(payload)
    createLeagueModal.value.visible = false
    await fetchLeagues()
    await loadLeagueOptions()
  } catch (error) {
    console.error('리그 등록에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '리그 등록에 실패했습니다.'))
  } finally {
    createLeagueModal.value.saving = false
  }
}

function buildLeagueCreatePayload() {
  const form = leagueForm.value
  const sportId = parsePositiveInteger(form.sportId)
  const eName = form.eName.trim()
  const sName = form.sName.trim()
  const externalLinked = form.externalLinked === 'true'
  const dataOrigin = externalLinked ? form.dataOrigin : 'MANUAL'
  const apiLeagueId = form.apiLeagueId.trim()

  if (!sportId) {
    alert('종목 ID는 양의 정수로 입력해주세요.')
    return null
  }
  if (!eName) {
    alert('영문 리그명을 입력해주세요.')
    return null
  }
  if (!sName) {
    alert('숏네임을 입력해주세요.')
    return null
  }
  if (externalLinked && (!dataOrigin || dataOrigin === 'MANUAL')) {
    alert('외부 연동 리그의 데이터 원천을 선택해주세요.')
    return null
  }
  if (externalLinked && !apiLeagueId) {
    alert('외부 API 리그 ID를 입력해주세요.')
    return null
  }

  return {
    sportId,
    eName,
    kName: normalizeOptionalText(form.kName),
    sName,
    teamDisplayOrder: form.teamDisplayOrder || null,
    externalLinked,
    dataOrigin,
    apiLeagueId: externalLinked ? apiLeagueId : null,
    syncEnabled: externalLinked ? form.syncEnabled === 'true' : false,
  }
}

function openEditLeagueModal(league) {
  const normalizedLeague = normalizeLeagueResponse(league)

  leagueEditForm.value = {
    id: String(normalizedLeague.id ?? ''),
    sportId: String(normalizedLeague.sportId ?? ''),
    kName: normalizedLeague.kName ?? '',
    eName: normalizedLeague.eName ?? '',
    sName: normalizedLeague.sName ?? '',
    teamDisplayOrder: normalizedLeague.teamDisplayOrder || 'HOME_AWAY',
  }
  editLeagueModal.value = { visible: true, saving: false }
}

async function saveLeagueEdit() {
  const payload = buildLeagueEditPayload()
  if (!payload || editLeagueModal.value.saving) return

  editLeagueModal.value.saving = true

  try {
    await updateAdminLeague(leagueEditForm.value.id, payload)
    editLeagueModal.value.visible = false
    await fetchLeagues()
    await loadLeagueOptions()
  } catch (error) {
    console.error('리그 정보 수정에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '리그 정보 수정에 실패했습니다.'))
  } finally {
    editLeagueModal.value.saving = false
  }
}

function buildLeagueEditPayload() {
  const form = leagueEditForm.value
  const leagueId = parsePositiveInteger(form.id)
  const sportId = parsePositiveInteger(form.sportId)
  const eName = form.eName.trim()
  const sName = form.sName.trim()

  if (!leagueId) {
    alert('수정할 리그 ID가 올바르지 않습니다.')
    return null
  }
  if (!sportId) {
    alert('종목 ID는 양의 정수로 입력해주세요.')
    return null
  }
  if (!eName) {
    alert('영문 리그명을 입력해주세요.')
    return null
  }
  if (!sName) {
    alert('숏네임을 입력해주세요.')
    return null
  }

  return {
    sportId,
    eName,
    kName: normalizeOptionalText(form.kName),
    sName,
    teamDisplayOrder: form.teamDisplayOrder || null,
  }
}

function openLeagueApiModal(league) {
  leagueApiForm.value = { id: String(league.id ?? ''), apiLeagueId: '' }
  leagueApiModal.value = { visible: true, saving: false }
}

async function saveLeagueApiId() {
  const leagueId = parsePositiveInteger(leagueApiForm.value.id)
  const apiLeagueId = leagueApiForm.value.apiLeagueId.trim()

  if (!leagueId) {
    alert('수정할 리그 ID가 올바르지 않습니다.')
    return
  }
  if (!apiLeagueId) {
    alert('외부 API 리그 ID를 입력해주세요.')
    return
  }
  if (leagueApiModal.value.saving) return

  leagueApiModal.value.saving = true

  try {
    await updateLeagueApiLeagueId(leagueId, { apiLeagueId })
    leagueApiModal.value.visible = false
    await fetchLeagues()
  } catch (error) {
    console.error('외부 API 리그 ID 수정에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '외부 API 리그 ID 수정에 실패했습니다.'))
  } finally {
    leagueApiModal.value.saving = false
  }
}

function openLeagueSyncModal(league) {
  leagueSyncForm.value = {
    id: String(league.id ?? ''),
    syncEnabled: leagueSyncEnabled(league) === true ? 'true' : 'false',
  }
  leagueSyncModal.value = { visible: true, saving: false }
}

async function saveLeagueSyncEnabled() {
  const leagueId = parsePositiveInteger(leagueSyncForm.value.id)

  if (!leagueId) {
    alert('수정할 리그 ID가 올바르지 않습니다.')
    return
  }
  if (!['true', 'false'].includes(leagueSyncForm.value.syncEnabled)) {
    alert('외부 경기 동기화 여부를 선택해주세요.')
    return
  }
  if (leagueSyncModal.value.saving) return

  leagueSyncModal.value.saving = true

  try {
    await updateLeagueSyncEnabled(leagueId, {
      syncEnabled: leagueSyncForm.value.syncEnabled === 'true',
    })
    leagueSyncModal.value.visible = false
    await fetchLeagues()
  } catch (error) {
    console.error('외부 API 동기화 여부 수정에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '외부 API 동기화 여부 수정에 실패했습니다.'))
  } finally {
    leagueSyncModal.value.saving = false
  }
}

async function removeLeague(league) {
  if (!confirm(`리그 ${displayLeagueName(league)}을 삭제하시겠습니까?`)) return

  try {
    await deleteAdminLeague(league.id)
    await fetchLeagues()
    await loadLeagueOptions()
  } catch (error) {
    console.error('리그 삭제에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '리그 삭제에 실패했습니다.'))
  }
}

async function searchLeagueSeasons() {
  seasonPage.value = 1
  await fetchLeagueSeasons()
}

async function fetchLeagueSeasons() {
  if (!hasSeasonSearchCondition()) {
    clearSeasonResults()
    alert('리그 ID 또는 리그명을 입력 후 검색해주세요.')
    return
  }

  const params = buildPagedSearchParams(seasonSearch.value, seasonPage.value, seasonPageSize.value)
  if (!params) return

  seasonLoading.value = true
  seasonError.value = ''
  seasonSearched.value = true

  try {
    const pageResult = normalizePageResult(await getLeagueSeasons(params))
    leagueSeasons.value = pageResult.content
    seasonTotalElements.value = pageResult.totalElements
    seasonTotalPages.value = pageResult.totalPages
    seasonPage.value = pageResult.page
  } catch (error) {
    console.error('리그 시즌 목록 조회에 실패했습니다.', error)
    leagueSeasons.value = []
    seasonTotalElements.value = 0
    seasonTotalPages.value = 1
    seasonError.value = extractApiErrorMessage(error, '리그 시즌 목록 조회에 실패했습니다.')
  } finally {
    seasonLoading.value = false
  }
}

async function resetSeasonSearch() {
  seasonSearch.value = { leagueId: '', leagueName: '' }
  seasonPage.value = 1
  clearSeasonResults()
}

async function changeSeasonPage(nextPage) {
  if (nextPage < 1 || nextPage > seasonMaxPage.value || nextPage === seasonPage.value) return
  if (!seasonSearched.value || !hasSeasonSearchCondition()) return

  seasonPage.value = nextPage
  await fetchLeagueSeasons()
}

function openCreateSeasonModal() {
  seasonForm.value = defaultSeasonForm()
  resetSeasonLeagueSearchResult()
  createSeasonModal.value = { visible: true, saving: false }
}

async function saveNewSeason() {
  const payload = buildSeasonCreatePayload()
  if (!payload || createSeasonModal.value.saving) return

  createSeasonModal.value.saving = true

  try {
    await createLeagueSeason(payload)
    createSeasonModal.value.visible = false
    seasonSearch.value = { leagueId: String(payload.leagueId), leagueName: '' }
    seasonPage.value = 1
    await fetchLeagueSeasons()
  } catch (error) {
    console.error('리그 시즌 등록에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '리그 시즌 등록에 실패했습니다.'))
  } finally {
    createSeasonModal.value.saving = false
  }
}

function buildSeasonCreatePayload() {
  const form = seasonForm.value
  const leagueId = parsePositiveInteger(form.leagueId)
  const seasonName = form.seasonName.trim()
  const seasonStartAt = normalizeDate(form.seasonStartAt)
  const seasonEndAt = normalizeDate(form.seasonEndAt)
  const isCurrent = form.isCurrent === 'true'
    || form.isCurrent === true

  if (!leagueId) {
    alert('리그를 검색 후 선택해주세요.')
    return null
  }
  if (!seasonName) {
    alert('시즌명을 입력해주세요.')
    return null
  }
  if (!seasonStartAt || !seasonEndAt) {
    alert('시즌 시작일과 종료일을 선택해주세요.')
    return null
  }
  if (seasonStartAt > seasonEndAt) {
    alert('시즌 종료일은 시작일보다 빠를 수 없습니다.')
    return null
  }

  return {
    leagueId,
    seasonName,
    seasonStartAt,
    seasonEndAt,
    isCurrent,
    current: isCurrent,
  }
}

function handleSeasonLeagueKeywordInput() {
  seasonForm.value.leagueId = ''
  seasonForm.value.leagueName = ''
  seasonForm.value.leagueSportName = ''
  scheduleSeasonLeagueSearch()
}

function selectSeasonLeague(league) {
  const normalizedLeague = normalizeLeagueResponse(league)
  const leagueName = displayLeagueName(normalizedLeague)

  seasonForm.value.leagueId = String(normalizedLeague.id ?? '')
  seasonForm.value.leagueName = leagueName
  seasonForm.value.leagueKeyword = leagueName
  seasonForm.value.leagueSportName = sportLabel(normalizedLeague)
  seasonLeagueCandidates.value = []
  seasonLeagueSearchError.value = ''
}

function scheduleSeasonLeagueSearch() {
  clearSeasonLeagueSearchTimer()
  resetSeasonLeagueSearchResult()

  const keyword = seasonForm.value.leagueKeyword

  if (!hasEnoughKeyword(keyword)) return

  seasonLeagueSearchTimer = window.setTimeout(() => {
    fetchSeasonLeagueCandidates()
  }, 250)
}

async function fetchSeasonLeagueCandidates() {
  const requestId = ++seasonLeagueSearchRequestId
  const keyword = seasonForm.value.leagueKeyword.trim()

  if (!hasEnoughKeyword(keyword)) return

  seasonLeagueLoading.value = true
  seasonLeagueSearchError.value = ''

  try {
    const candidates = ensureArray(await getAdminLeagues({ keyword }))
      .map(normalizeLeagueResponse)
      .slice(0, 10)

    if (requestId !== seasonLeagueSearchRequestId) return

    seasonLeagueCandidates.value = candidates
  } catch (error) {
    if (requestId !== seasonLeagueSearchRequestId) return

    console.error('리그 후보 검색에 실패했습니다.', error)
    seasonLeagueCandidates.value = []
    seasonLeagueSearchError.value = '리그 검색에 실패했습니다. 잠시 후 다시 시도해주세요.'
  } finally {
    if (requestId === seasonLeagueSearchRequestId) {
      seasonLeagueLoading.value = false
    }
  }
}

function resetSeasonLeagueSearchResult() {
  seasonLeagueSearchRequestId += 1
  seasonLeagueCandidates.value = []
  seasonLeagueLoading.value = false
  seasonLeagueSearchError.value = ''
}

function clearSeasonLeagueSearchTimer() {
  if (!seasonLeagueSearchTimer) return

  window.clearTimeout(seasonLeagueSearchTimer)
  seasonLeagueSearchTimer = null
}

function openEditSeasonModal(season) {
  seasonEditForm.value = {
    leagueSeasonId: String(season.leagueSeasonId ?? ''),
    seasonName: season.leagueSeasonName ?? '',
    seasonStartAt: season.leagueSeasonStartAt ?? '',
    seasonEndAt: season.leagueSeasonEndAt ?? '',
    isCurrent: isCurrentSeason(season) ? 'true' : 'false',
  }
  editSeasonModal.value = { visible: true, saving: false }
}

async function saveSeasonEdit() {
  const payload = buildSeasonEditPayload()
  if (!payload || editSeasonModal.value.saving) return

  editSeasonModal.value.saving = true

  try {
    await updateLeagueSeason(seasonEditForm.value.leagueSeasonId, payload)
    editSeasonModal.value.visible = false
    await fetchLeagueSeasons()
  } catch (error) {
    console.error('리그 시즌 수정에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '리그 시즌 수정에 실패했습니다.'))
  } finally {
    editSeasonModal.value.saving = false
  }
}

function buildSeasonEditPayload() {
  const form = seasonEditForm.value
  const leagueSeasonId = parsePositiveInteger(form.leagueSeasonId)
  const seasonName = form.seasonName.trim()
  const seasonStartAt = normalizeDate(form.seasonStartAt)
  const seasonEndAt = normalizeDate(form.seasonEndAt)

  if (!leagueSeasonId) {
    alert('수정할 리그 시즌 ID가 올바르지 않습니다.')
    return null
  }
  if (!seasonName) {
    alert('시즌명을 입력해주세요.')
    return null
  }
  if (!seasonStartAt || !seasonEndAt) {
    alert('시즌 시작일과 종료일을 선택해주세요.')
    return null
  }
  if (seasonStartAt > seasonEndAt) {
    alert('시즌 종료일은 시작일보다 빠를 수 없습니다.')
    return null
  }

  return {
    seasonName,
    seasonStartAt,
    seasonEndAt,
    isCurrent: form.isCurrent === 'true',
  }
}

async function removeLeagueSeason(season) {
  if (!confirm(`리그 시즌 ${season.leagueSeasonName || season.leagueSeasonId}을 삭제하시겠습니까?`)) return

  try {
    await deleteLeagueSeason(season.leagueSeasonId)
    await fetchLeagueSeasons()
  } catch (error) {
    console.error('리그 시즌 삭제에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '리그 시즌 삭제에 실패했습니다.'))
  }
}

async function searchStandings() {
  standingsPage.value = 1
  await fetchStandings()
}

async function fetchStandings() {
  if (!hasStandingsSearchCondition()) {
    clearStandingsResults()
    alert('리그 ID 또는 리그명을 입력 후 검색해주세요.')
    return
  }

  const params = buildPagedSearchParams(standingsSearch.value, standingsPage.value, standingsPageSize.value)
  if (!params) return

  standingsLoading.value = true
  standingsError.value = ''
  standingsSearched.value = true

  try {
    const pageResult = normalizePageResult(await getLeagueSeasonStandings(params))
    leagueSeasonStandings.value = pageResult.content
    standingsTotalElements.value = pageResult.totalElements
    standingsTotalPages.value = pageResult.totalPages
    standingsPage.value = pageResult.page
  } catch (error) {
    console.error('순위 관리 목록 조회에 실패했습니다.', error)
    leagueSeasonStandings.value = []
    standingsTotalElements.value = 0
    standingsTotalPages.value = 1
    standingsError.value = extractApiErrorMessage(error, '순위 관리 목록 조회에 실패했습니다.')
  } finally {
    standingsLoading.value = false
  }
}

async function resetStandingsSearch() {
  standingsSearch.value = { leagueId: '', leagueName: '' }
  standingsPage.value = 1
  clearStandingsResults()
}

async function changeStandingsPage(nextPage) {
  if (nextPage < 1 || nextPage > standingsMaxPage.value || nextPage === standingsPage.value) return
  if (!standingsSearched.value || !hasStandingsSearchCondition()) return

  standingsPage.value = nextPage
  await fetchStandings()
}

function openCreateStandingsModal() {
  standingsForm.value = defaultStandingsForm()
  createStandingsModal.value = { visible: true, saving: false }
}

async function saveNewStandings() {
  const payload = buildStandingsPayload(standingsForm.value)
  if (!payload || createStandingsModal.value.saving) return

  createStandingsModal.value.saving = true

  try {
    await createLeagueSeasonStandings(payload)
    createStandingsModal.value.visible = false
    await refreshStandingsIfSearchable()
  } catch (error) {
    console.error('순위 관리 등록에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '순위 관리 등록에 실패했습니다.'))
  } finally {
    createStandingsModal.value.saving = false
  }
}

function openEditStandingsTypeModal(standing) {
  standingsTypeForm.value = {
    leagueSeasonId: String(standing.leagueSeasonId ?? ''),
    standingsType: standingTypeValue(standing) || 'IMAGE',
  }
  editStandingsTypeModal.value = { visible: true, saving: false }
}

async function saveStandingsType() {
  const payload = buildStandingsPayload(standingsTypeForm.value)
  if (!payload || editStandingsTypeModal.value.saving) return

  editStandingsTypeModal.value.saving = true

  try {
    await updateLeagueSeasonStandingsType(payload.leagueSeasonId, {
      standingsType: payload.standingsType,
    })
    editStandingsTypeModal.value.visible = false
    await refreshStandingsIfSearchable()
  } catch (error) {
    console.error('순위 관리 타입 수정에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '순위 관리 타입 수정에 실패했습니다.'))
  } finally {
    editStandingsTypeModal.value.saving = false
  }
}

function buildStandingsPayload(form) {
  const leagueSeasonId = parsePositiveInteger(form.leagueSeasonId)
  const standingsType = form.standingsType

  if (!leagueSeasonId) {
    alert('리그 시즌 ID는 양의 정수로 입력해주세요.')
    return null
  }
  if (!['IMAGE', 'EXTERNAL_DATA'].includes(standingsType)) {
    alert('순위 관리 타입을 선택해주세요.')
    return null
  }

  return { leagueSeasonId, standingsType }
}

function openUploadImageModal(standing) {
  imageUploadForm.value = {
    leagueSeasonId: String(standing.leagueSeasonId ?? ''),
    image: null,
    fileName: '',
  }
  uploadImageModal.value = { visible: true, saving: false }
}

function onStandingImageChange(event) {
  const image = event.target.files?.[0] ?? null
  imageUploadForm.value.image = image
  imageUploadForm.value.fileName = image?.name ?? ''
}

async function saveStandingImage() {
  const leagueSeasonId = parsePositiveInteger(imageUploadForm.value.leagueSeasonId)

  if (!leagueSeasonId) {
    alert('리그 시즌 ID가 올바르지 않습니다.')
    return
  }
  if (!imageUploadForm.value.image) {
    alert('업로드할 이미지 파일을 선택해주세요.')
    return
  }
  if (uploadImageModal.value.saving) return

  uploadImageModal.value.saving = true

  try {
    await uploadLeagueSeasonStandingsImage(leagueSeasonId, imageUploadForm.value.image)
    uploadImageModal.value.visible = false
    await refreshStandingsIfSearchable()
  } catch (error) {
    console.error('순위 이미지 업로드에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '순위 이미지 업로드에 실패했습니다.'))
  } finally {
    uploadImageModal.value.saving = false
  }
}

async function syncStandingsData(standing) {
  if (!confirm(`${standing.leagueName || standing.leagueSeasonId} 순위 데이터를 동기화하시겠습니까?`)) return

  try {
    await syncLeagueSeasonStandingsData(standing.leagueSeasonId)
    await refreshStandingsIfSearchable()
  } catch (error) {
    console.error('순위 외부 데이터 동기화에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '순위 외부 데이터 동기화에 실패했습니다.'))
  }
}

async function openGroupMappingsModal(standing) {
  const leagueSeasonId = parsePositiveInteger(standing.leagueSeasonId)

  if (!leagueSeasonId) {
    alert('리그 시즌 ID가 올바르지 않습니다.')
    return
  }

  groupMappingsForm.value = {
    leagueSeasonId,
    leagueName: standing.leagueName || '',
    groups: [],
  }
  groupMappingsModal.value = { visible: true, loading: true, saving: false }

  try {
    const response = await getLeagueSeasonStandingsGroupMappings(leagueSeasonId)
    groupMappingsForm.value.groups = ensureArray(response?.groups).map((group, index) => ({
      groupKey: String(group?.groupKey || ''),
      externalName: String(group?.externalName || ''),
      externalGroupName: String(group?.externalGroupName || ''),
      displayName: String(group?.displayName || ''),
      displayOrder: group?.displayOrder == null ? String(index) : String(group.displayOrder),
      visibleInMatchList: group?.visibleInMatchList === true,
    }))
  } catch (error) {
    console.error('순위 그룹 설정 조회에 실패했습니다.', error)
    groupMappingsModal.value.visible = false
    alert(extractApiErrorMessage(error, '순위 그룹 설정 조회에 실패했습니다.'))
  } finally {
    groupMappingsModal.value.loading = false
  }
}

async function saveGroupMappings() {
  if (groupMappingsModal.value.saving) return

  const groups = groupMappingsForm.value.groups.map((group) => ({
    groupKey: String(group.groupKey || ''),
    displayName: String(group.displayName || '').trim(),
    displayOrder: Number(group.displayOrder),
    visibleInMatchList: group.visibleInMatchList === true,
  }))

  if (groups.some((group) => !group.groupKey || !group.displayName)) {
    alert('모든 그룹의 표시명을 입력해주세요.')
    return
  }

  const orders = groups.map((group) => group.displayOrder)
  const expectedOrders = groups.map((_, index) => index)
  const sortedOrders = [...orders].sort((left, right) => left - right)

  if (
    orders.some((order) => !Number.isInteger(order) || order < 0)
    || sortedOrders.some((order, index) => order !== expectedOrders[index])
  ) {
    alert(`표시 순서는 0부터 ${Math.max(0, groups.length - 1)}까지 중복 없이 입력해주세요.`)
    return
  }

  groupMappingsModal.value.saving = true

  try {
    await updateLeagueSeasonStandingsGroupMappings(
      groupMappingsForm.value.leagueSeasonId,
      { groups },
    )
    groupMappingsModal.value.visible = false
  } catch (error) {
    console.error('순위 그룹 설정 수정에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '순위 그룹 설정 수정에 실패했습니다.'))
  } finally {
    groupMappingsModal.value.saving = false
  }
}

async function removeStandings(standing) {
  if (!confirm(`리그 시즌 ${standing.seasonName || standing.leagueSeasonId}의 순위 관리를 삭제하시겠습니까?`)) return

  try {
    await deleteLeagueSeasonStandings(standing.leagueSeasonId)
    await refreshStandingsIfSearchable()
  } catch (error) {
    console.error('순위 관리 삭제에 실패했습니다.', error)
    alert(extractApiErrorMessage(error, '순위 관리 삭제에 실패했습니다.'))
  }
}

function defaultTeamDisplayOrderOptions() {
  return [
    { value: 'HOME_AWAY', label: '홈팀 먼저' },
    { value: 'AWAY_HOME', label: '원정팀 먼저' },
  ]
}

function normalizeOptionList(options, fallback = []) {
  const normalizedOptions = ensureArray(options)
    .map((option) => {
      const value = option?.value ?? option?.id ?? option?.name ?? option
      const label = option?.label ?? option?.name ?? String(value ?? '')

      return {
        value: value == null ? '' : String(value),
        label,
      }
    })
    .filter((option) => option.value && option.label)

  return normalizedOptions.length > 0 ? normalizedOptions : fallback
}

function firstTeamDisplayOrderValue() {
  return teamDisplayOrderOptions.value[0]?.value || 'HOME_AWAY'
}

function firstExternalDataOriginValue() {
  return dataOriginOptions.value[0]?.value || ''
}

function buildPagedSearchParams(search, page, size) {
  const leagueId = String(search.leagueId || '').trim()

  if (leagueId && !parsePositiveInteger(leagueId)) {
    alert('리그 ID는 양의 정수로 입력해주세요.')
    return null
  }

  return compactQueryParams({
    leagueId: leagueId ? parsePositiveInteger(leagueId) : null,
    leagueName: String(search.leagueName || '').trim(),
    page: Math.max(0, page - 1),
    size: Number(size) || pageSizeOptions[0],
  })
}

function hasSeasonSearchCondition() {
  return Boolean(
    String(seasonSearch.value.leagueId || '').trim()
      || String(seasonSearch.value.leagueName || '').trim(),
  )
}

function clearSeasonResults() {
  leagueSeasons.value = []
  seasonTotalElements.value = 0
  seasonTotalPages.value = 1
  seasonPage.value = 1
  seasonError.value = ''
  seasonSearched.value = false
}

function hasStandingsSearchCondition() {
  return Boolean(
    String(standingsSearch.value.leagueId || '').trim()
      || String(standingsSearch.value.leagueName || '').trim(),
  )
}

function clearStandingsResults() {
  leagueSeasonStandings.value = []
  standingsTotalElements.value = 0
  standingsTotalPages.value = 1
  standingsPage.value = 1
  standingsError.value = ''
  standingsSearched.value = false
}

async function refreshStandingsIfSearchable() {
  if (hasStandingsSearchCondition()) {
    await fetchStandings()
    return
  }

  clearStandingsResults()
}

function normalizePageResult(result) {
  const content = ensureArray(result?.content ?? result)
  const totalElements = Number(result?.totalElements ?? content.length)
  const totalPages = Math.max(1, Number(result?.totalPages ?? 1))
  const page = Number.isFinite(Number(result?.number)) ? Number(result.number) + 1 : 1

  return {
    content,
    totalElements,
    totalPages,
    page,
  }
}

function normalizeLeagueResponse(league = {}) {
  return {
    ...league,
    kName: league.kName ?? league.kname ?? league.KName ?? '',
    eName: league.eName ?? league.ename ?? league.EName ?? '',
    sName: league.sName ?? league.sname ?? league.SName ?? '',
    sportCode: league.sportCode ?? '',
    syncEnabled: normalizeBoolean(league.syncEnabled ?? league.sync_enabled ?? league.SyncEnabled),
  }
}

function sportLabel(league) {
  if (league?.sportName) return league.sportName

  const sportId = league?.sportId
  const sport = sportOptions.value.find((option) => String(option.id) === String(sportId))

  return sport?.label || '-'
}

function seasonLeagueMeta(league) {
  return sportLabel(league)
}

function displayLeagueName(league) {
  return leagueKName(league) || leagueEName(league) || leagueSName(league) || '-'
}

function leagueKName(league) {
  return league?.kName ?? league?.kname ?? league?.KName ?? ''
}

function leagueEName(league) {
  return league?.eName ?? league?.ename ?? league?.EName ?? ''
}

function leagueSName(league) {
  return league?.sName ?? league?.sname ?? league?.SName ?? ''
}

function isExternalLeague(league) {
  return Boolean(league?.dataOrigin && league.dataOrigin !== 'MANUAL')
}

function leagueSyncLabel(league) {
  const syncEnabled = leagueSyncEnabled(league)

  if (syncEnabled === true) return '연동'
  if (!isExternalLeague(league)) return '수동 관리'
  return '연동 비활성'
}

function leagueSyncVariant(league) {
  const syncEnabled = leagueSyncEnabled(league)

  if (syncEnabled === true) return 'green'
  if (!isExternalLeague(league)) return 'gray'
  return 'yellow'
}

function leagueSyncEnabled(league) {
  return normalizeBoolean(league?.syncEnabled ?? league?.sync_enabled ?? league?.SyncEnabled)
}

function teamDisplayOrderLabel(teamDisplayOrder) {
  return {
    HOME_AWAY: '홈-원정',
    AWAY_HOME: '원정-홈',
  }[teamDisplayOrder] || '-'
}

function teamDisplayOrderVariant(teamDisplayOrder) {
  if (!teamDisplayOrder || teamDisplayOrder === 'HOME_AWAY') return 'gray'
  return 'blue'
}

function isCurrentSeason(row) {
  return Boolean(row?.isCurrentSeason ?? row?.currentSeason ?? row?.isCurrent ?? row?.current)
}

function standingTypeValue(standing) {
  return standing?.standingType ?? standing?.standingsType ?? ''
}

function standingsTypeLabel(standingsType) {
  return {
    IMAGE: '이미지',
    EXTERNAL_DATA: '외부 데이터',
  }[standingsType] || standingsType || '-'
}

function standingsTypeVariant(standingsType) {
  return standingsType === 'EXTERNAL_DATA' ? 'blue' : 'yellow'
}

function formatPeriod(startAt, endAt) {
  if (!startAt && !endAt) return '-'

  return `${startAt || '-'} ~ ${endAt || '-'}`
}

function normalizeOptionalText(value) {
  const text = String(value ?? '').trim()

  return text || null
}

function normalizeDate(value) {
  const date = String(value || '').trim()

  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

function hasShortKeyword(keyword) {
  return normalizeSearchText(keyword).length < 2
}

function hasEnoughKeyword(keyword) {
  return normalizeSearchText(keyword).length >= 2
}

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase().replace(/\s/g, '')
}

function parsePositiveInteger(value) {
  const number = Number(value)

  return Number.isSafeInteger(number) && number > 0 ? number : null
}

function normalizeBoolean(value) {
  if (value === true || value === false) return value
  if (value === 'true') return true
  if (value === 'false') return false

  return null
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function compactQueryParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null && !Number.isNaN(value)),
  )
}

function extractApiErrorMessage(error, fallbackMessage) {
  const responseData = error?.response?.data

  return toErrorMessage(responseData?.message)
    || toErrorMessage(responseData?.error?.message)
    || toErrorMessage(responseData?.error?.details)
    || toErrorMessage(responseData?.error)
    || toErrorMessage(error?.message)
    || fallbackMessage
}

function toErrorMessage(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(toErrorMessage).filter(Boolean).join('\n')
  if (typeof value === 'object') return Object.values(value).map(toErrorMessage).filter(Boolean).join('\n')

  return String(value)
}
</script>

<style scoped>
/* 리그 페이지 전용 2차 메뉴: 카드 장식 없이 활성 항목을 밑줄로만 구분한다. */
.tab-bar {
  display: flex;
  max-width: 100%;
  min-height: 41px;
  align-items: center;
  gap: 24px;
  margin-bottom: var(--admin-section-margin-bottom);
  padding: 0 2px;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid var(--admin-color-divider);
}

.tab-btn {
  position: relative;
  flex: 0 0 auto;
  min-height: 41px;
  padding: 0 2px;
  color: var(--admin-color-text-muted);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: color 0.15s;
}

.tab-btn::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--admin-color-primary);
  content: '';
  transform: scaleX(0);
  transition: transform 0.15s;
}

.tab-btn:hover {
  color: var(--admin-color-text-title);
}

.tab-btn.active {
  color: var(--admin-color-primary);
  font-weight: 700;
}

.tab-btn.active::after {
  transform: scaleX(1);
}

.tab-btn:focus-visible {
  border-radius: 3px;
  outline: 2px solid var(--admin-color-primary);
  outline-offset: -3px;
}

.admin-section {
  min-width: 0;
}

.filter-id {
  width: 140px;
}

.filter-keyword {
  width: 280px;
}

.league-table .league-name-cell {
  text-align: left;
}

.league-table .league-name-cell .name-stack {
  align-items: flex-start;
}

.name-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.name-stack strong {
  color: var(--admin-color-text-title);
}

.name-stack span {
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-table-heading);
}

.emphasis-cell {
  font-weight: 700;
}

.muted-cell {
  color: var(--admin-color-text-muted);
}

.period-cell {
  white-space: nowrap;
}

.row-action-layout {
  align-items: center;
}

.row-action-group {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

:deep(.base-btn.row-action-primary) {
  color: #3864bd;
  background: var(--admin-color-surface);
  border-color: #b9c9e8;
}

:deep(.base-btn.row-action-primary:hover:not(.disabled)) {
  color: var(--admin-color-primary);
  background: #f6f9ff;
  border-color: #8eafea;
}

:deep(.base-btn.row-action-secondary) {
  height: 28px;
  padding-inline: 8px;
  color: var(--admin-color-text-muted);
  background: var(--admin-color-surface);
  border-color: #d1d5db;
}

:deep(.base-btn.row-action-secondary:hover:not(.disabled)) {
  color: var(--admin-color-text-body);
  background: #f3f4f6;
  border-color: #c4cad3;
}

.group-mapping-list {
  display: flex;
  max-height: 520px;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
}

.group-mapping-card {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 18px;
  padding: 14px 16px;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-card-radius);
}

.group-mapping-source {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
}

.group-mapping-source strong {
  color: var(--admin-color-text-title);
  font-size: 13px;
}

.group-mapping-source span,
.group-mapping-source code {
  overflow: hidden;
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-label);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-mapping-source code {
  width: fit-content;
  padding: 4px 7px;
  color: #5f6878;
  background: #eef1f5;
  border-radius: 999px;
}

.group-mapping-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px;
  gap: 14px 10px;
}

.group-visibility-field {
  grid-column: 1 / -1;
}

.group-mapping-empty {
  display: grid;
  min-height: 120px;
  padding: 24px 16px;
  place-items: center;
  color: var(--admin-color-text-empty-description);
  text-align: center;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}

@media (max-width: 720px) {
  .group-mapping-card,
  .group-mapping-fields {
    grid-template-columns: 1fr;
  }
}

.date-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.checkbox-field {
  display: inline-flex;
  min-height: 32px;
  align-items: center;
  gap: 8px;
  color: var(--admin-color-text-body);
  font-size: var(--admin-font-size-description);
  cursor: default;
}

.checkbox-field input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--admin-color-primary);
  cursor: pointer;
}

.league-result-panel {
  height: 152px;
  overflow: auto;
  background: var(--admin-color-surface-subtle);
  border: 1px solid var(--admin-color-border);
  border-radius: var(--admin-control-radius);
}

.league-result-item {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 10px;
  color: var(--admin-color-text-body);
  font-family: inherit;
  font-size: var(--admin-font-size-description);
  text-align: left;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--admin-color-divider);
  cursor: pointer;
}

.league-result-item:last-child {
  border-bottom: none;
}

.league-result-item:hover {
  background: var(--admin-color-table-row-hover);
}

.league-result-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.league-result-sub {
  flex: 0 0 auto;
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-label);
}

.league-search-guide {
  display: flex;
  min-height: 100%;
  align-items: center;
  box-sizing: border-box;
  justify-content: center;
  margin: 0;
  padding: 0 16px;
  color: var(--admin-color-text-empty-description);
  font-size: var(--admin-font-size-description);
  line-height: 1.5;
  text-align: center;
}

.league-search-guide.error {
  color: #c53c46;
}

.league-search-note {
  margin: 0;
  padding: 8px 10px;
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-label);
  line-height: 1.5;
  background: var(--admin-color-surface);
  border-top: 1px solid var(--admin-color-divider);
}

.selected-league-card {
  display: flex;
  height: 100%;
  align-items: center;
  box-sizing: border-box;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
  padding: 16px;
  color: var(--admin-color-text-body);
  background: var(--admin-color-surface);
}

.selected-league-card strong {
  max-width: 100%;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-league-card span:last-child {
  color: var(--admin-color-text-muted);
  font-size: var(--admin-font-size-label);
}

.selected-league-label {
  padding: 5px 8px;
  color: #3864bd;
  font-size: var(--admin-font-size-table-heading);
  font-weight: 700;
  background: #edf3ff;
  border-radius: 999px;
}

.col-id {
  width: 96px;
}

.col-sport,
.col-order,
.col-origin,
.col-linked,
.col-current,
.col-type {
  width: 128px;
}

.col-name {
  width: 220px;
}

.col-short {
  width: 110px;
}

.col-period {
  width: 220px;
}

.col-actions {
  width: 220px;
}

.col-actions-compact {
  width: 120px;
}

.col-actions-wide {
  width: 340px;
}

@container admin-content (min-width: 601px) and (max-width: 960px) {
  .filter-id,
  .filter-keyword {
    width: calc(50% - 6px);
  }
}

@media (max-width: 900px) {
  .date-row {
    grid-template-columns: 1fr;
  }
}
</style>
