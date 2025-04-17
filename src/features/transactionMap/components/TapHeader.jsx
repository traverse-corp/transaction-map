import { useMapStore } from '@features/transactionMap/stores/useMapStore'

const TabHeader = () => {
  const tabs = useMapStore((state) => state.tabs)
  const activeTab = useMapStore((state) => state.activeTab)
  const setActiveTab = useMapStore((state) => state.setActiveTab)
  const removeTab = useMapStore((state) => state.removeTab)

  const tabEntries = Object.entries(tabs)

  if (tabEntries.length < 2) return null

  return (
    <div className='flex space-x-1 bg-white pt-1 absolute z-1 top-[-17px]'>
      {tabEntries.map(([tabName]) => (
        <div
          key={tabName}
          className={`flex items-center px-2 py-[2px] text-sm rounded-t-md cursor-pointer border border-ts-gray-4 ${
            activeTab === tabName
              ? 'bg-ts-bg border-b-transparent font-semibold'
              : 'bg-bg text-gray-500'
          }`}
        >
          <button
            onClick={() => {
              setActiveTab(tabName)
            }}
            className='max-w-[120px]  truncate overflow-hidden whitespace-nowrap'
          >
            {tabName}
          </button>
          <button
            onClick={() => {
              removeTab(tabName)
            }}
            className='ml-2 text-gray-400'
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default TabHeader
