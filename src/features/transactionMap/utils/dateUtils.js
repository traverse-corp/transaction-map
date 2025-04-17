/**
 * formatDateTime
 * 주어진 UNIX 타임스탬프(초 단위)를 지정된 시간대에 맞게 포매팅하여 반환합니다.
 *
 * @param {number} timestamp - 초 단위의 UNIX 타임스탬프
 * @param {string} [timeZone='UTC'] - 시간대 (예: 'UTC', 'KST')
 * @returns {string} - 포매팅된 날짜 및 시간 문자열
 */
export const formatDateTime = (timestamp, timeZone = 'UTC') => {
  const date = new Date(timestamp * 1000)

  if (timeZone === 'KST') {
    date.setHours(date.getHours() + 9)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} (${timeZone})`
}
