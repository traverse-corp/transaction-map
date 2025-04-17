import React, { useState } from 'react'

export default function CopyWrapper({ text, children }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('복사 실패:', err)
    }
  }

  return (
    <div onClick={handleClick} style={{ display: 'inline-block', cursor: 'pointer' }}>
      {children}
      {copied && <span className='tooltip'>복사됨!</span>}
    </div>
  )
}
