import {
  useEffect,
  type RefObject,
} from 'react'

export function useAutoGrowTextarea(
  ref: RefObject<HTMLTextAreaElement | null>,
  value: string
) {
  useEffect(() => {
    const editor = ref.current

    if (!editor) {
      return
    }

    editor.style.height = 'auto'
    editor.style.height =
      `${editor.scrollHeight}px`
  }, [ref, value])
}