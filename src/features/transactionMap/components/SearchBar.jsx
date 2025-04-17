import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert'

import BtcLogo from '@assets/images/btc.svg'
import EthLogo from '@assets/images/eth.svg'
import XrpLogo from '@assets/images/xrp.svg'
import TrxLogo from '@assets/images/trx.svg'
import SearchIcon from '@assets/images/search.svg'

import { useSearchStore } from '@features/transactionMap/stores/useSearchStore'
import { useMapStore } from '@features/transactionMap/stores/useMapStore'
import { useExpandGraph } from '@features/transactionMap/hooks/useExpandGraph'

const mainNets = [
  { value: 'BTC', label: 'BTC', img: BtcLogo },
  { value: 'ETH', label: 'ETH', img: EthLogo },
  { value: 'XRP', label: 'XRP', img: XrpLogo },
  { value: 'TRX', label: 'TRX', img: TrxLogo }
]

const SearchBar = () => {
  const {
    searchTerm,
    selectedNet,
    setSearchTerm,
    setSelectedNet,
    recentSearches,
    addRecentSearch,
    count,
    startTime,
    endTime
  } = useSearchStore()
  const { tabs, createTab, activeTab, setActiveTab } = useMapStore()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const { expandGraph, isLoading, isError, error } = useExpandGraph(selectedNet)

  const handleSearch = useCallback(async () => {
    if (!searchTerm || !selectedNet || !expandGraph) {
      console.warn('검색어, 네트워크 선택, 그리고 확장 함수는 필수입니다.')
      return
    }

    if (Object.keys(tabs).length >= 5 && !tabs[searchTerm]) {
      alert('최대 5개의 탭만 열 수 있습니다.')
      return
    }

    const targetTabId = searchTerm
    setIsDropdownOpen(false)

    if (!tabs[targetTabId]) {
      createTab(targetTabId)
      addRecentSearch(targetTabId)
    }
    setActiveTab(targetTabId)

    // --- 가상 currentNode 생성 ---
    const dummyCurrentNode = {
      id: searchTerm,
      position: { x: 0, y: 0 },
      data: {
        address: searchTerm,
        isMain: true,
        mainNet: selectedNet
      }
    }

    // API 호출 파라미터
    const queryParams = {
      count: count || 10,
      startTime: startTime || null,
      endTime: endTime || null,
      direction: 'ALL',
      page: 0
    }

    // 그래프 확장 함수 호출 (가상 노드와 쿼리 파라미터 전달)
    expandGraph({
      tabId: targetTabId,
      currentNode: dummyCurrentNode,
      queryParams
    })
  }, [
    searchTerm,
    selectedNet,
    expandGraph,
    tabs,
    createTab,
    addRecentSearch,
    setActiveTab,
    count,
    startTime,
    endTime
  ])

  // 키 입력 핸들러
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        handleSearch()
      }
    },
    [handleSearch]
  )

  // 입력 필드 포커스 핸들러
  const handleFocus = () => {
    setIsDropdownOpen(true)
  }

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [])

  return (
    <div className='flex flex-col px-[30px] my-2 z-20'>
      <div className='flex items-center gap-4'>
        <div className='text-lg font-bold whitespace-nowrap'>트랜잭션 맵</div>
        <div className='flex flex-grow items-center gap-2 relative' ref={dropdownRef}>
          <Select value={selectedNet} onValueChange={setSelectedNet}>
            <SelectTrigger className='w-[100px]'>
              <SelectValue placeholder='네트워크' />
            </SelectTrigger>
            <SelectContent>
              {mainNets.map((net) => (
                <SelectItem key={net.value} value={net.value}>
                  <div className='flex items-center gap-2'>
                    <img src={net.img} alt={net.label} className='w-4 h-4' />
                    <span>{net.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 검색 입력 */}
          <div className='relative flex-grow'>
            <Input
              type='text'
              placeholder='주소(Address) 또는 트랜잭션 해시(Tx Hash)를 검색하세요'
              onFocus={handleFocus}
              value={searchTerm}
              onKeyDown={handleKeyDown}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full focus:outline-none border-0 focus-visible:ring-0'
              disabled={isLoading}
            />
            {/* 최근 검색어 */}
            {recentSearches && recentSearches.length > 0 && (
              <div
                className={`absolute top-full mt-1 left-0 right-0 bg-white rounded-md shadow-lg transition-all duration-300 overflow-hidden z-30 border ${
                  isDropdownOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                <div className='p-2 text-sm text-gray-500'>최근 검색어:</div>
                {recentSearches.map((value, index) => (
                  <div
                    key={index}
                    className='px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm truncate'
                    onClick={() => {
                      setSearchTerm(value)
                      setIsDropdownOpen(false)
                    }}
                    title={value}
                  >
                    {value}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 검색 버튼 */}
          <Button
            onClick={handleSearch}
            className='px-4 flex-shrink-0'
            disabled={isLoading || !searchTerm || !selectedNet}
            aria-label='검색'
          >
            {isLoading ? (
              <div
                className='animate-spin rounded-full h-4 w-4 border-b-2 border-current'
                role='status'
                aria-live='polite'
              ></div>
            ) : (
              <img src={SearchIcon} alt='검색' className='w-4 h-4' />
            )}
          </Button>
        </div>
      </div>

      {/* 에러 메시지, 향후 삭제 요망 */}
      {isError && error && (
        <Alert variant='destructive' className='mt-4'>
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>
            검색 중 오류가 발생했습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해 주세요.
            (상세: {error.message})
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default SearchBar
