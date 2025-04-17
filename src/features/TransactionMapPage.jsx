import React, { useCallback, useEffect } from 'react'
import ToolBar from '@features/transactionMap/components/ToolBar'
import TransactionMap from '@features/transactionMap/components/TransactionMap'
import SlidingPanel from '@features/transactionMap/components/SlidingPanel'
import Header from '@/components/header/Header.jsx'
import SearchBar from '@features/transactionMap/components/SearchBar.jsx'
import { useMapStore } from '@features/transactionMap/stores/useMapStore.js'

const TransactionMapPage = () => {
  const undo = useMapStore((state) => state.undo)
  const redo = useMapStore((state) => state.redo)
  const activeTab = useMapStore((state) => state.activeTab)

  // --- 키보드 이벤트 핸들러 (Undo/Redo) ---
  const handleKeyDown = useCallback(
    (event) => {
      // 활성 탭이 없으면 아무것도 안 함
      if (!activeTab) return

      // 운영체제(Mac)에 따른 Meta 키 확인 (Cmd) 또는 Ctrl 키 확인
      const isModifierKey = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase() // 키 값 소문자로 통일

      // Ctrl/Cmd + Z (Undo)
      if (isModifierKey && key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo(activeTab)
      }
      // Ctrl/Cmd + Shift + Z (Redo)
      else if (isModifierKey && event.shiftKey && key === 'z') {
        event.preventDefault()
        redo(activeTab)
      }
    },
    [activeTab, undo, redo]
  )

  useEffect(() => {
    // console.log('Adding keydown listener');
    document.addEventListener('keydown', handleKeyDown)

    // 클린업 함수: 컴포넌트 언마운트 시 리스너 제거
    return () => {
      // console.log('Removing keydown listener');
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown]) // handleKeyDown 함수가 변경될 때 리스너 재등록

  return (
    <div className='flex flex-row h-screen overflow-hidden w-full'>
      <Header />
      <div className='flex flex-col mt-[55px] w-full'>
        <SearchBar />
        <ToolBar />
        <div className='flex flex-1 relative min-h-0'>
          <TransactionMap />
        </div>
      </div>
      <SlidingPanel />
    </div>
  )
}

export default TransactionMapPage
