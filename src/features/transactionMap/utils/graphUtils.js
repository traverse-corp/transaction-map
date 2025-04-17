import { MarkerType } from 'reactflow'

// --- 그래프 요소 생성 헬퍼 함수 ---
/**
 * createEdge
 * 노드 간 연결 엣지(간선) 객체를 생성합니다.
 *
 * @param {string} id - 엣지 고유 ID
 * @param {string} source - 시작 노드 ID
 * @param {string} target - 끝 노드 ID
 * @param {number} value - 거래 값 (엣지에 표시될 수 있음)
 * @param {number|string|null} time - 거래 시간 (엣지에 표시될 수 있음)
 * @param {string} token - 관련 네트워크 또는 토큰 (예: 'BTC', 'ETH')
 * @returns {Object} 생성된 엣지 객체
 */
export function createEdge(id, source, target, value, time, token) {
  return {
    id,
    source,
    target,
    markerEnd: {
      // 화살표 마커 설정
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#000000' // 기본 마커 색상
    },
    data: { value, time, token }, // 엣지에 전달될 데이터
    type: 'timeValueEdge', // 커스텀 엣지 타입 지정 (렌더링 로직 분리 위함)
    style: { stroke: '#000000' } // 기본 엣지 스타일
  }
}

/**
 * createAddrNode
 * 주소 노드 객체를 생성합니다.
 *
 * @param {string} address - 주소 (노드 ID로 사용됨)
 * @param {boolean} isRight - 노드의 방향성 (메인 노드 기준, true: 우측, false: 좌측) - 레이아웃 계산에 사용될 수 있음
 * @param {string} motherNode - 이 주소 노드와 연결된 거래(tx) 노드의 ID
 * @param {string} mainNet - 해당 주소의 네트워크 (예: 'BTC', 'ETH')
 * @param {Object} [addressData={}] - 주소 관련 추가 정보 (API 응답 등), 예: { whitelistYn, blacklistYn }
 * @returns {Object} 생성된 주소 노드 객체
 */
export function createAddrNode(address, isRight, motherNode, mainNet, addressData = {}) {
  // addressData를 기반으로 노드 타입 결정
  const nodeType = checkType(addressData) // 아래 checkType 함수 사용

  return {
    id: address,
    type: nodeType, // 노드 타입 (addressNode, blacklistNode, whitelistNode)
    data: { address, isRight, motherNode, mainNet, ...addressData }, // 노드에 전달될 데이터
    position: null // 초기 위치는 null (레이아웃 계산 후 설정됨)
  }
}

/**
 * createTxNode
 * 거래(트랜잭션) 노드 객체를 생성합니다.
 *
 * @param {string} txId - 거래 ID (노드 ID로 사용됨)
 * @param {boolean} isRight - 노드의 방향성 (메인 노드 기준, true: 우측, false: 좌측)
 * @param {number|string|null} block - 거래가 포함된 블록 번호
 * @param {number} value - 거래 값
 * @param {number|string|null} time - 거래 시간 (타임스탬프)
 * @param {Array<string>} childNodes - 이 거래 노드와 연결된 주소 노드들의 ID 배열
 * @param {string} motherNode - 이 거래 노드와 연결된 메인 주소 노드의 ID
 * @returns {Object} 생성된 거래 노드 객체
 */
export function createTxNode(txId, isRight, block, value, time, childNodes, motherNode) {
  return {
    id: txId,
    type: 'transactionNode', // 거래 노드 타입
    data: { txId, isRight, block, value, time, childNodes, motherNode }, // 노드에 전달될 데이터
    position: null // 초기 위치는 null
  }
}

/**
 * checkType
 * 주소 데이터를 기반으로 주소 노드의 타입을 결정합니다.
 * (예: 블랙리스트, 화이트리스트 여부 확인)
 * 정보가 없으면 기본 'addressNode' 타입을 반환합니다.
 *
 * @param {Object} [addressData={}] - 주소 관련 데이터 (예: { whitelistYn, blacklistYn })
 * @returns {string} 주소 노드 타입 ('addressNode', 'blacklistNode', 'whitelistNode')
 */
export function checkType(addressData = {}) {
  if (addressData.whitelistYn === 'Y') return 'whiteAddressNode'
  return 'addressNode' // 기본 타입
}
