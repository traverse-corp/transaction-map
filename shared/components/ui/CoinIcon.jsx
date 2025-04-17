import React from 'react'

export default function CoinIcon({ coinType, size = 24, className = '', ...props }) {
  const key = (coinType || 'default').toLowerCase()
  // import.meta.url 기준으로 이미지 URL 계산
  const src = new URL(`../../shared/assets/images/${key}.svg`, import.meta.url).href

  return (
    <img
      src={src}
      alt={coinType || 'icon'}
      width={size}
      height={size}
      className={className}
      onError={(e) => {
        // 없으면 default.svg 로 대체
        e.currentTarget.src = new URL(
          `../../shared/assets/images/loading.svg`,
          import.meta.url
        ).href
      }}
      {...props}
    />
  )
}
