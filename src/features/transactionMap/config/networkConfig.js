import {
  getGraphApi,
  getAddressInfoApi,
  getDenylistDataApi
} from '@features/transactionMap/apis/api'
import {
  processBtcGraphData,
  processDenyListGraph,
  processNonBtcGraphData
} from '@features/transactionMap/services/graphService'

// 각 네트워크별 API 호출 및 데이터 처리 함수 정의
export const networkConfigs = {
  BTC: {
    coin: 'BTC',
    getGraphApiFn: getGraphApi,
    getAddressInfoApiFn: getAddressInfoApi,
    getDenylistDataApiFn: getDenylistDataApi,
    processGraphDataFn: processBtcGraphData,
    processDenylistGraphFn: (denyList, currentNodes) =>
      processDenyListGraph(denyList, currentNodes, 'BTC')
  },
  ETH: {
    coin: 'ETH',
    getGraphApiFn: getGraphApi,
    getAddressInfoApiFn: getAddressInfoApi,
    getDenylistDataApiFn: getDenylistDataApi,
    processGraphDataFn: (rawData, mainAddressId, direction) =>
      processNonBtcGraphData(rawData, mainAddressId, 'ETH', direction),
    processDenylistGraphFn: (denyList, currentNodes) =>
      processDenyListGraph(denyList, currentNodes, 'ETH')
  },
  TRX: {
    coin: 'TRX',
    getGraphApiFn: getGraphApi,
    getAddressInfoApiFn: getAddressInfoApi,
    getDenylistDataApiFn: getDenylistDataApi,
    processGraphDataFn: (rawData, mainAddressId, direction) =>
      processNonBtcGraphData(rawData, mainAddressId, 'TRX', direction),
    processDenylistGraphFn: (denyList, currentNodes) =>
      processDenyListGraph(denyList, currentNodes, 'TRX')
  },
  XRP: {
    coin: 'XRP',
    getGraphApiFn: getGraphApi,
    getAddressInfoApiFn: getAddressInfoApi,
    getDenylistDataApiFn: getDenylistDataApi,
    processGraphDataFn: (rawData, mainAddressId, direction) =>
      processNonBtcGraphData(rawData, mainAddressId, 'XRP', direction),
    processDenylistGraphFn: (denyList, currentNodes) =>
      processDenyListGraph(denyList, currentNodes, 'XRP')
  }
}

export const getNetworkConfig = (network) => {
  const upperNet = network?.toUpperCase()
  if (!upperNet || !networkConfigs[upperNet]) {
    console.warn(`Unsupported network: ${network}. Falling back to BTC config.`)
    return networkConfigs.BTC
  }
  return networkConfigs[upperNet]
}
