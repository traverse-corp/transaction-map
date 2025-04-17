import { create } from 'zustand'

const DEFAULT_COUNT = 10

export const useSearchStore = create((set) => ({
  searchTerm: '',
  selectedNet: 'BTC',
  count: DEFAULT_COUNT, // 최대 검색 건수

  transferAmountType: '',
  minAmount: 0.0,
  maxAmount: 0.0,
  startTime: null,
  endTime: null,
  timezone: 'UTC',

  recentSearches: [],

  addRecentSearch: (term) =>
    set((state) => {
      let updated = state.recentSearches.filter((t) => t !== term)
      if (updated.length >= 10) {
        updated.pop()
      }
      return { recentSearches: [term, ...updated] }
    }),

  // === 액션 ===
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedNet: (net) => set({ selectedNet: net }),

  setStartTime: (startTime) => set(() => ({ startTime })),
  setEndTime: (endTime) => set(() => ({ endTime })),
  setCount: (count) => set(() => ({ count })),

  setTransferAmountType: (transferAmountType) => set(() => ({ transferAmountType })),
  setMinAmount: (minAmount) => set(() => ({ minAmount })),
  setMaxAmount: (maxAmount) => set(() => ({ maxAmount })),
  setTimezone: (timezone) => set(() => ({ timezone })),

  // 검색 설정 초기화
  resetSearchSettings: () =>
    set(() => ({
      searchTerm: '',
      selectedNet: 'BTC',
      startTime: null,
      endTime: null,
      count: DEFAULT_COUNT,
      transferAmountType: '',
      minAmount: 0.0,
      maxAmount: 0.0,
      timezone: 'UTC'
    }))
}))
