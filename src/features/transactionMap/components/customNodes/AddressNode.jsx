import React, { useCallback } from 'react'
import { NodeBase } from '@features/transactionMap/components/customNodes/NodeBase'

import btc from '@assets/images/btc.svg'
import eth from '@assets/images/eth.svg'
import usdt from '@assets/images/usdt.svg'
import trx from '@assets/images/trx.svg'
import xrp from '@assets/images/xrp.svg'
import WalletImg from '@assets/images/wallet.svg'
import CopyImg from '@assets/images/copy.svg'

// 네트워크별 이미지 매핑 객체
const networkMapping = {
  btc,
  eth,
  usdt,
  trx,
  xrp
}

function AddressNode({ data }) {
  const walletImg = React.useMemo(() => {
    const net = data?.mainNet?.toLowerCase()
    return net && networkMapping[net] ? networkMapping[net] : WalletImg
  }, [data?.mainNet])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(data.address).catch(console.error)
  }, [data.address])

  return (
    <NodeBase data={data}>
      <div
        className={`max-w-[100px] h-[52px] rounded-[8px] border-2 border-transight-gray-4 bg-white shadow-sm ${data?.isMain && 'border-2'}`}>
        <img className='symbol ml-2' src={walletImg} alt='' />
        <div className='w-11/12 ml-1 mt-1 flex justify-start text-xs'>
          {<span className='truncate'>{data.address}</span>}
        </div>
        <img className='symbol ml-2 cursor-pointer' src={CopyImg} alt='copy' onClick={handleCopy} />
      </div>
    </NodeBase>
  )
}

export default AddressNode
