export const TRANSACTION_MAX_COUNT = 10
export const QUERY_ARRAY = [100, 200, 300, 500, 1000]
export const TRANSACTION_DATE_FORMAT = 'YY.MM.DD HH:mm'
export const TRANSACTION_DATE_ERROR_POPUP = '시작/종료 일자를 확인해주세요.'
export const SESSION_TRANSACTION_SETTING_START_TIME = '@TransactionStartTime'
export const SESSION_TRANSACTION_SETTING_END_TIME = '@TransactionEndTime'
export const SESSION_TRANSACTION_SETTING_TRACE = '@TransactionTrace'
export const SESSION_TRANSACTION_SETTING_VOLUME = '@TransactionVolume'
export const SESSION_TRANSACTION_SETTING_COUNT = '@TransactionCount'
export const SESSION_TRANSACTION_SETTING_HIGH_RISK = '@TransactionHighRisk'
export const SESSION_TRANSACTION_SETTING_IS_NEW_SEARCH = '@TransactionIsNewSearch'
export const TRANSACTION_MAX_DAY = 999999999999999
export const TRANSACTION_TIMEOUT_ERROR_POPUP =
  '트랜잭션 조회 시간이 초과되었습니다. 다시 한 번 시도해주세요.기간 내 트랜잭션이 지나치게 많은 경우 해당 오류가 발생될 수 있습니다.조회 기간을 짧게 설정하여 조회해 주시기 바랍니다.'
export const TRANSACTION_MAX_UNDISPLAYED = 1000
export const WALLET_DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss'
export const DEFAULT_MAIN_NET = 'BTC'
export const MAIN_NET_LIST = ['btc', 'eth', 'usdt', 'trx', 'xrp']
export const DEFAULT_TRANSFER_AMOUNT_TYPE = 'USD'
export const TRANSFER_AMOUNT_TYPE = ['USD', 'Token']
export const MAX_TRANSFER_AMOUNT = 10000000000
export const MIN_TRANSFER_AMOUNT = 0
export const MIN_ERROR_POPUP = 'Min value must > 0'
export const MAX_ERROR_POPUP = 'Max value must < 10^7'
export const SLIDER_MAX_WIDTH = 650
export const SLIDER_MIN_WIDTH = 240
export const E_FILE_TYPE = Object.freeze({
  PDF: 'PDF',
  JPG: 'JPG'
})
export const MAX_TAG_INFO_LEN = 30
export const E_RA_CODE = Object.freeze({
  SERVE: '#C20000',
  HIGH: '#FF0000',
  MEDIUM: '#F7931A',
  LOW: '#F7931A',
  WHITE: '#00C200'
})
export const MAX_NOTE_LEN = 1000
export const E_SLIDING_PANEL_TYPE = Object.freeze({
  WB_DETAIL: 'WB_DETAIL',
  WB_TRANSFER: 'WB_TRANSFER',
  TX_TRANSFER: 'TX_TRANSFER'
})

export const FLOW_MAP_DEFAULT_X = 0
export const FLOW_MAP_DEFAULT_Y = 0
export const FLOW_MAP_INIT_Y = 7
export const FLOW_MAP_DEFAULT_X_GAP = 300
export const FLOW_MAP_DEFAULT_X_GAP_NOT_BTC = 300
export const FLOW_MAP_DEFAULT_Y_GAP = 80
export const TRANSACTION_LOADING_TEXT =
  '트랜잭션을 조회 중입니다.<br />최대 1분이 소요될 수 있습니다.'
export const TRANSACTION_QUERY_TIMEOUT = 60 * 1000
export const BREAK_LINE = '<br/>'
export const MAX_OPTION_TAB = 5
export const ID_DELIMITER = '_'
export const MAX_HISTORY = 11
