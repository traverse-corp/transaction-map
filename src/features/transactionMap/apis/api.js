import GraphApiService from '/src/common/ApiService'
import ApiService from '/src/common/ApiService'
import {
  DEFAULT_GRAPH_LIMIT,
  ERC_USDT_TOKEN_ID,
  RECENT_TX_LIMIT
} from '@features/transactionMap/config/constants.js'

// --- 헬퍼 함수 ---
/**
 * 코인 타입과 API 타입을 올바른 엔드포인트 경로로 매핑합니다.
 * @param {string} coin - 코인 심볼 (예: 'BTC', 'ETH', 'ERC'). 대소문자 구분 안 함.
 * @param {string} apiType - API 타입 (예: 'addressInfo', 'graph', 'txInfo').
 * @returns {string} API 엔드포인트 경로.
 * @throws {Error} 코인/apiType 조합을 지원하지 않을 경우 에러 발생.
 */
const getApiEndpoint = (coin, apiType) => {
  const coinUpper = coin?.toUpperCase()
  if (!coinUpper) throw new Error('코인 타입은 필수입니다.')

  const endpoints = {
    BTC: {
      addressInfo: 'btc/address',
      graph: 'btc/transaction-map',
      txInfo: 'btc/transaction',
      graphRecent: 'btc/transaction-map/recent'
    },
    ETH: {
      addressInfo: 'eth/address',
      graph: 'eth/map',
      txInfo: 'eth/transaction'
    },
    ERC: {
      addressInfo: 'eth/address',
      graph: 'eth/map/internal',
      txInfo: 'eth/transaction'
    },
    TRX: {
      addressInfo: 'trx/address',
      graph: 'trx/map',
      txInfo: 'trx/transaction'
    },
    XRP: {
      addressInfo: 'xrp/address',
      graph: 'xrp/map',
      txInfo: 'xrp/transaction'
    }
  }

  const path = endpoints[coinUpper]?.[apiType]

  if (!path) {
    throw new Error(`"${coinUpper}" 코인에 대해 지원하지 않는 API 타입 "${apiType}"`)
  }
  return path
}

/**
 * 타입과 옵션에 따라 API 호출을 위한 파라미터 객체를 생성합니다.
 * @param {string} apiType - API 호출 타입.
 * @param {object} options - 잠재적 파라미터를 포함하는 객체.
 * @returns {object} API 호출을 위한 구조화된 파라미터 객체.
 */
const buildApiParams = (apiType, options = {}) => {
  const {
    address,
    txId,
    count,
    startTime,
    endTime,
    direction = 'ALL',
    page = 0,
    limit,
    start,
    end,
    coin
  } = options

  switch (apiType) {
    case 'addressInfo':
      return { address }
    case 'txInfo':
      return { tx_id: txId }
    case 'graph': {
      const graphLimit = limit ?? DEFAULT_GRAPH_LIMIT
      const params = {
        address,
        offset: page * graphLimit,
        limit: graphLimit,
        count,
        start: startTime,
        end: endTime,
        direction
      }
      if (coin?.toUpperCase() === 'ERC') {
        params.tokenId = ERC_USDT_TOKEN_ID
      }
      // 필요시 null/undefined 시간 값 제거
      if (params.start === null || params.start === undefined) delete params.start
      if (params.end === null || params.end === undefined) delete params.end
      return params
    }
    case 'graphRecent': {
      // BTC 최근 거래용
      const recentLimit = limit ?? RECENT_TX_LIMIT
      const params = {
        address,
        offset: page * recentLimit,
        limit: recentLimit,
        start,
        end
      }
      if (params.start === null || params.start === undefined) delete params.start
      if (params.end === null || params.end === undefined) delete params.end
      return params
    }
    case 'list': {
      // ETH 목록 조회용
      const listLimit = limit ?? RECENT_TX_LIMIT
      const params = {
        address,
        offset: Math.floor((page * listLimit) / 2),
        limit: Math.floor(listLimit / 2),
        start: startTime,
        end: endTime
      }
      if (params.start === undefined) params.start = null
      if (params.end === undefined) params.end = null
      return params
    }
    default:
      throw new Error(`파라미터 생성 중 알 수 없는 apiType: ${apiType}`)
  }
}

// --- 제네릭 API 함수 ---

/**
 * 제네릭 주소 정보 조회 API
 * @param {Object} params - { coin, address }
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getAddressInfoApi = async ({ coin, address }) => {
  const apiType = 'addressInfo'
  const endpoint = getApiEndpoint(coin, apiType)
  const params = buildApiParams(apiType, { address })
  return (await GraphApiService.sendPostToGraph(endpoint, params)).data
}

/**
 * 제네릭 거래 맵 데이터 조회 API (BTC, ETH, ERC, TRX, XRP)
 * @param {Object} params - { coin, address, count, startTime, endTime, direction?, page?, limit? }
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getGraphApi = async ({
  coin,
  address,
  count,
  startTime,
  endTime,
  direction = 'ALL',
  page = 0,
  limit // 기본 limit 재정의 허용
}) => {
  // 코인에 따라 특정 apiType 결정 (엔드포인트/파라미터 매핑용)
  const apiType = 'graph'
  const endpoint = getApiEndpoint(coin, apiType) // ERC 엔드포인트 차이 처리
  const params = buildApiParams(apiType, {
    coin, // buildApiParams의 ERC tokenId 로직을 위해 coin 전달
    address,
    count,
    startTime,
    endTime,
    direction,
    page,
    limit
  })
  return (await GraphApiService.sendPostToGraph(endpoint, params)).data
}

/**
 * 제네릭 거래 상세 정보 조회 API
 * @param {Object} params - { coin, txId }
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getTransactionInfoApi = async ({ coin, txId }) => {
  const apiType = 'txInfo'
  const endpoint = getApiEndpoint(coin, apiType)
  const params = buildApiParams(apiType, { txId })
  return (await GraphApiService.sendPostToGraph(endpoint, params)).data
}

// --- 기타 API 함수 ---

/**
 * BTC 최근 거래 맵 데이터 조회 API
 * 엔드포인트: /btc/transaction-map/recent
 * @param {Object} params - { address, start?, end?, limit?, page? }
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getTransactionMapBtcApi = async ({ address, start, end, limit, page = 0 }) => {
  const coin = 'BTC'
  const apiType = 'graphRecent'
  const endpoint = getApiEndpoint(coin, apiType)
  // limit 직접 전달, buildApiParams가 사용하거나 기본값 사용
  const params = buildApiParams(apiType, { address, start, end, limit, page })
  return (await GraphApiService.sendPostToGraph(endpoint, params)).data
}

/**
 * Denylist 데이터 조회 API (고유 - 다른 서비스 및 구조 사용)
 * 엔드포인트: /wallet/highRiskSearch1
 * @param {Object} param - { walletAddress }
 * @returns {Promise<Object>} API 응답 데이터
 */
export const getDenylistDataApi = async ({ walletAddress }) => {
  const date = new Date()
  const currentTime = date
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14)
  const body = {
    walletAddress,
    tranDtm: currentTime,
    tranNo: 'transight_web_page' // 설정 가능하게 만드는 것을 고려
  }
  // Denylist는 GraphApiService가 아닌 기본 ApiService를 사용한다고 가정
  return (await ApiService.sendPost('wallet/highRiskSearch1', body)).data
}
