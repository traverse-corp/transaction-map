import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { applyEdgeChanges, applyNodeChanges, Controls, MiniMap } from 'reactflow'
import 'reactflow/dist/style.css'
import { useMapStore } from '@features/transactionMap/stores/useMapStore'
import { computeClosestAvailablePosition } from '@features/transactionMap/utils/positionUtils'
import WhiteAddressNode from '@features/transactionMap/components/customNodes/WhiteAddressNode'
import TransactionNode from '@features/transactionMap/components/customNodes/TransactionNode'
import AddressNode from '@features/transactionMap/components/customNodes/AddressNode'
import TimeValueEdge from '@features/transactionMap/components/customEdges/TimeValueEdge'
import TabHeader from '@features/transactionMap/components/TapHeader.jsx'
import { HORIZONTAL_GAP, VERTICAL_GAP } from '@features/transactionMap/config/constants.js'

// 커스텀 노드/엣지 타입
const nodeTypes = {
  addressNode: AddressNode,
  transactionNode: TransactionNode,
  whitelistNode: WhiteAddressNode
}

const edgeTypes = {
  timeValueEdge: TimeValueEdge
}

const TransactionMap = () => {
  const { tabs, activeTab, updateNodes, removeOccupiedPosition } = useMapStore()

  const reactFlowInstanceRef = useRef(null)

  const currentTabData = useMemo(() => tabs?.[activeTab]?.data ?? {}, [tabs, activeTab])
  const storeNodes = useMemo(() => currentTabData?.nodes ?? [], [currentTabData])
  const storeEdges = useMemo(() => currentTabData?.edges ?? [], [currentTabData])
  const [localNodes, setLocalNodes] = useState(storeNodes) // 로컬 상태
  const [localEdges, setLocalEdges] = useState(storeEdges) // 로컬 상태
  const occupied = useMemo(() => tabs?.[activeTab]?.occupied ?? {}, [tabs, activeTab])

  const onNodesChange = useCallback(
    (changes) => {
      setLocalNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setLocalNodes]
  )

  const onEdgesChange = useCallback(
    (changes) => {
      setLocalEdges((eds) => applyEdgeChanges(changes, eds))
    },
    [setLocalEdges]
  )

  // 노드 드래그가 멈췄을 때, 가장 가까운 그리드 위치로 스냅하여 업데이트
  const onNodeDragStop = useCallback(
    (event, node) => {
      console.log(node)
      if (!(occupied instanceof Set)) {
        console.error(
          `onNodesDragStop: Occupied data for tab ${activeTab} is not a valid Set. Cannot calculate position.`
        )
        return
      }

      const newPos = computeClosestAvailablePosition(
        node.position,
        HORIZONTAL_GAP,
        VERTICAL_GAP,
        occupied
      )

      const nodeUpdatePayload = {
        id: node.id,
        updates: {
          position: newPos // 변경된 position 정보만 포함
        }
      }

      if (activeTab) {
        updateNodes(activeTab, [nodeUpdatePayload])
      } else {
        console.error('onNodesDragStop: Cannot update node position without a valid tabId.')
      }
    },
    [activeTab, occupied, updateNodes]
  )

  // 드래그 시작 시: 해당 노드의 현재 위치를 occupied Set 에서 제거
  const onNodeDragStart = useCallback(
    (event, node) => {
      if (activeTab && node.position) {
        // console.log(`Dragging node ${node.id}, removing position from occupied:`, node.position);
        removeOccupiedPosition(activeTab, node.position)
      }
    },
    [activeTab, removeOccupiedPosition]
  )

  useEffect(() => {
    // 스토어 노드가 변경되면 로컬 노드 상태 업데이트
    setLocalNodes(storeNodes)
  }, [storeNodes]) // storeNodes 참조가 바뀔 때만 실행

  useEffect(() => {
    setLocalEdges(storeEdges)
  }, [storeEdges]) // storeEdges 참조가 바뀔 때만 실행.

  return (
    <div className='py-3 px-[30px] w-full h-full relative'>
      <TabHeader />
      <ReactFlow
        className='border border-ts-gray-3 bg-ts-bg'
        ref={reactFlowInstanceRef}
        nodes={localNodes}
        edges={localEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        minZoom={0.01}
        maxZoom={10}
        nodeOrigin={[0.5, 0.5]}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  )
}

export default TransactionMap
