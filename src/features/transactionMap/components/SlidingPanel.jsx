import React from 'react'
import { useUIStore } from '@features/transactionMap/stores/useUIStore.js'

const SlidingPanel = () => {
  const { isSidePanelOpen, toggleSidePanel } = useUIStore()

  return (
    <div
      className={`transition-all duration-300 ease-in-out overflow-hidden bg-white border-l border-gray-300 shadow-xl mt-[55px] ${
        isSidePanelOpen ? 'w-80' : 'w-0'
      }`}
    >
      {isSidePanelOpen && (
        <div>
          <button
            className='mb-4 p-1 border rounded'
            onClick={() => {
              toggleSidePanel(false)
            }}
          >
            닫기
          </button>
          <h3 className='text-lg font-bold mb-2'>주소 정보</h3>
          <p>여기에 주소/노드 상세 정보 표시</p>
        </div>
      )}
    </div>
  )
}

export default SlidingPanel
