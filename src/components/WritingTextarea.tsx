import {
  useRef,
  type TextareaHTMLAttributes,
} from 'react'

import { useAutoGrowTextarea } from '../hooks/useAutoGrowTextarea'

type WritingTextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement>

export function WritingTextarea({
  className = '',
  value,
  ...props
}: WritingTextareaProps) {
  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null)

  useAutoGrowTextarea(
    textareaRef,
    String(value ?? '')
  )

  return (
    <textarea
      ref={textareaRef}
      className={`writing-textarea ${className}`.trim()}
      value={value}
      {...props}
    />
  )
}