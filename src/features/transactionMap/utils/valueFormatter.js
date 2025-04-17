import Decimal from 'decimal.js'

/**
 * formatTokenValue
 * 토큰 값(value)을 해당 네트워크(token)에 맞게 포매팅합니다.
 *
 * @param {number|string} value - 원시 토큰 값.
 * @param {string} token - 네트워크 타입 (예: 'BTC', 'ETH', 'erc', 'TRX', 'XRP').
 * @returns {string} - 포매팅 된 토큰 값 문자열.
 */
export const formatTokenValue = (value, token) => {
  const decValue = new Decimal(value)
  switch (token) {
    case 'BTC':
      return decValue.toFixed(5)
    case 'ETH':
      return decValue.dividedBy('1000000000000000000').toFixed(5)
    case 'erc':
      return decValue.dividedBy('100000').toFixed(5)
    case 'TRX':
      return decValue.dividedBy('1000000').toFixed(5)
    case 'XRP':
      return decValue.dividedBy('1000000').toFixed(5)
    default:
      return decValue.toFixed(5)
  }
}
