import { useEffect, useRef } from 'react'

/**
 * Splits text into per-character spans that blur-in with a stagger
 * once the element enters the viewport.
 *
 * Props:
 *  text       — string to animate
 *  as         — wrapper tag (default 'span')
 *  className  — forwarded to the wrapper
 *  stagger    — delay between each character in seconds (default 0.038)
 *  duration   — animation duration per char (default 0.65s, set via CSS var)
 *  wordLevel  — if true, animate whole words instead of chars
 */
export default function BlurText({
  text,
  as: Tag = 'span',
  className = '',
  stagger = 0.038,
  wordLevel = false,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.querySelectorAll('.bl').forEach((span, i) => {
          span.style.animationDelay = `${i * stagger}s`
          span.classList.add('bl--go')
        })
        observer.disconnect()
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [text, stagger])

  const units = wordLevel
    ? text.split(' ').map((word, i, arr) => (
        <span key={i} className="bl" style={{ display: 'inline-block', whiteSpace: 'pre' }}>
          {word}{i < arr.length - 1 ? ' ' : ''}
        </span>
      ))
    : text.split('').map((ch, i) => (
        <span key={i} className="bl" style={{ display: 'inline-block' }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))

  return <Tag ref={ref} className={className}>{units}</Tag>
}
