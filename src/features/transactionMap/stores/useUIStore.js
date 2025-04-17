import { create } from 'zustand'

export const TAB_TYPES = {
  NONE: 'NONE',
  DETAIL: 'DETAIL', // 예: 노드(주소) 상세 정보
  HISTORY: 'HISTORY' // 예: 히스토리 목록
}

export const useUIStore = create((set) => ({
  // 사이드 패널 자체의 열림/닫힘
  isSidePanelOpen: false,
  sidePanelType: null,
  sidePanelData: null,

  // 다운로드 모달, 메인넷 리스트 등
  isOpenDownloadModal: false,
  showMainNetList: false,

  // === 액션 ===
  toggleSidePanel: (open, type, data = null) =>
    set({
      isSidePanelOpen: open, // 패널 열기
      sidePanelType: type, // 타입 설정
      sidePanelData: data // 데이터 설정
    }),

  // 기타 UI 토글
  setOpenDownloadModal: (isOpen) => set(() => ({ isOpenDownloadModal: isOpen })),
  setShowMainNetList: (show) => set(() => ({ showMainNetList: show })),

  // 전체 초기화 예시
  resetUI: () =>
    set(() => ({
      isSidePanelOpen: false,
      sidePanelType: null,
      sidePanelData: null,
      isOpenDownloadModal: false,
      showMainNetList: false
    }))
}))
