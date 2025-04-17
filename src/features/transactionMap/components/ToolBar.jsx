import React from 'react'
import { useSearchStore } from '@features/transactionMap/stores/useSearchStore'
import { useMapStore } from '@features/transactionMap/stores/useMapStore'
import { useUIStore } from '@features/transactionMap/stores/useUIStore'
import { DateTimeSelector } from '@components/ui/DateTimeSelector'
import CalendarEndIcon from '@assets/icons/CalendarEndIcon'

const ToolBar = () => {
  const {
    minAmount,
    maxAmount,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    setMinAmount,
    setMaxAmount
  } = useSearchStore()
  const { activeTab, tabs, setZoomLevel, redo, undo } = useMapStore()
  const { isSidePanelOpen, toggleSidePanel } = useUIStore()

  const handleZoomIn = () => {
    setZoomLevel(activeTab, tabs[activeTab]?.zoomLevel + 0.1)
  }
  const handleZoomOut = () => {
    setZoomLevel(activeTab, tabs[activeTab]?.zoomLevel - 0.1)
  }
  const handleRedo = () => {
    redo(activeTab)
  }
  const handleUndo = () => {
    undo(activeTab)
  }

  return (
    <div className='px-[30px] flex items-center gap-4'>
      <div>
        {/* <div>date </div> */}
        <div className='flex flex-row gap-2'>
          <DateTimeSelector
            timeValue={startTime}
            setTimeValue={setStartTime}
            label='시작일시'
            Icon={CalendarEndIcon}
          />
          <DateTimeSelector
            timeValue={endTime}
            setTimeValue={setEndTime}
            label='종료일시'
            Icon={CalendarEndIcon}
          />
        </div>
      </div>
      <div>
        <div>전송량 범위:</div>
        <div>
          <input
            type='number'
            value={minAmount}
            className='w-30'
            onChange={(e) => setMinAmount(Number(e.target.value))}
          />
          {' ~ '}
          <input
            type='number'
            value={maxAmount}
            className='w-30'
            onChange={(e) => setMaxAmount(Number(e.target.value))}
          />
        </div>
      </div>

      {/* 툴 버튼들 */}
      <button onClick={handleRedo}>redo</button>
      <button onClick={handleUndo}>undo</button>
      <button onClick={handleZoomOut}>fitview</button>
      <button onClick={handleZoomOut}>load</button>
      <button onClick={handleZoomOut}>download</button>
      <button onClick={handleZoomOut}>save</button>
      <button
        onClick={() => {
          toggleSidePanel(!isSidePanelOpen)
        }}
      >
        패널 열기/닫기
      </button>
    </div>
  )
}

export default ToolBar
