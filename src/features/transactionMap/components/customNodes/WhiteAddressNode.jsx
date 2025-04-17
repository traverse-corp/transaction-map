import BlueCheck from '@assets/images/blueCheck.png'
import React from 'react'
import { NodeBase } from '@features/transactionMap/components/customNodes/NodeBase.jsx'

function WhiteAddressNode({ data }) {
  return (
    <NodeBase data={data}>
      <div
        className={`w-[128px] h-[52px] rounded-[8px] border-2 border-transight-gray-4 bg-white shadow-sm ${data?.isMain && 'border-2'}`}
      >
        <img className='symbol ml-2' src={BlueCheck} alt='' />
        <div className='w-11/12 ml-1 mt-1 flex justify-start text-xs'>
          {<span className='truncate'>{data.address}</span>}
        </div>
      </div>
    </NodeBase>
  )
}

export default WhiteAddressNode
