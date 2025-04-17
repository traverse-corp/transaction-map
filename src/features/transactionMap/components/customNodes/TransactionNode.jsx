import React from 'react'
import { NodeBase } from '@features/transactionMap/components/customNodes/NodeBase.jsx'

function TransactionNode({ data }) {
  return (
    <NodeBase data={data} isAddressNode={false}>
      <div
        className={`max-w-[20px] w-[20px] h-[20px] rounded-[8px] border-2 border-transight-gray-4 bg-white shadow-sm ${data?.isMain && 'border-2'}`}
      >
        <div className='flex justify-start text-xs'>TX</div>
      </div>
    </NodeBase>
  )
}

export default TransactionNode
