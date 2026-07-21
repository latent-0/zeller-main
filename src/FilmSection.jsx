import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const CAPTIONS = [
  { label: 'The Craft',   text: 'Light, captured\nin crystal' },
  { label: 'The Detail',  text: 'Every facet,\na universe' },
  { label: 'The Reveal',  text: 'Celebrate the\ncosmos within' },
]

export default function FilmSection() {
  const sectionRef  = useRef(null)
  const videoRef    = useRef(null)
  const wordmarkRef = useRef(null)
  const taglineRef  = useRef(null)
  const cueRef      = useRef(null)
  const coverRef    = useRef(null)
  const captionRefs = useRef([])

  useEffect(() => {
    const sec   = sectionRef.current
    const video = videoRef.current
    if (!sec || !video) return

    let cleanupScrub = null

    const ctx = gsap.context(() => {
      // ── Intro — wordmark letters blur in on load ──
      const hwSpans = wordmarkRef.current?.querySelectorAll('.hw')
      if (hwSpans?.length) {
        gsap.fromTo(hwSpans,
          { opacity: 0, filter: 'blur(22px)', y: 16 },
          { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out', delay: 0.3 }
        )
      }
      gsap.fromTo(taglineRef.current,
        { opacity: 0, filter: 'blur(10px)', y: 10 },
        { opacity: 1, filter: 'blur(0px)', y: 0, duration: 1, ease: 'power3.out', delay: 1.1 }
      )
      gsap.to(cueRef.current, { opacity: 1, duration: 1.4, delay: 1.6, ease: 'power2.out' })

      // ── Scrub video playback with scroll ──
      // Exponential decay smoothing toward the scroll target so the video
      // drifts to rest rather than snapping. No seekBusy lock — the browser
      // cancels in-flight seeks when a new currentTime is assigned, so we
      // just write on every tick. This is critical for smooth reverse scrub:
      // backward H.264 seeks are slow (need prior keyframe), and a lock
      // would freeze the video until the slow seek completes.
      const buildScrub = () => {
        const duration = video.duration || 1
        const FRAME  = 1 / 24    // source is 24 fps
        const SMOOTH = 0.25      // time-constant; lower = snappier reverse
        let target   = 0
        let smoothed = 0

        ScrollTrigger.create({
          trigger: sec,
          start: 'top top',
          end:   'bottom bottom',
          onUpdate: (self) => { target = self.progress * duration },
        })

        const tick = (_time, deltaMs) => {
          smoothed += (target - smoothed) * (1 - Math.exp(-(deltaMs / 1000) / SMOOTH))
          if (Math.abs(target - smoothed) < FRAME / 4) smoothed = target
          if (Math.abs(video.currentTime - smoothed) >= FRAME / 2) {
            video.currentTime = smoothed
          }
        }
        gsap.ticker.add(tick)
        return () => gsap.ticker.remove(tick)
      }
      if (video.readyState >= 1) cleanupScrub = buildScrub()
      // ctx.add — animations created after the context callback returns
      // must be registered explicitly or ctx.revert() won't clean them up
      else video.addEventListener('loadedmetadata', () => ctx.add(() => { cleanupScrub = buildScrub() }), { once: true })

      // iOS/Safari won't seek an un-activated video — prime it silently
      const prime = () => {
        video.play().then(() => video.pause()).catch(() => {})
        window.removeEventListener('touchstart', prime)
      }
      window.addEventListener('touchstart', prime, { once: true })

      // ── One scrubbed timeline drives everything scroll-mapped ──
      // 100 units = 100% of section scroll
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: sec,
          start: 'top top',
          end:   'bottom bottom',
          scrub: 0.5,
        },
      })
      tl.to({}, { duration: 100 }, 0) // pad to full length

      // Wordmark + tagline + cue fade out as scroll begins
      tl.to([wordmarkRef.current, taglineRef.current], { opacity: 0, y: -40, duration: 10 }, 4)
      tl.to(cueRef.current, { opacity: 0, duration: 6 }, 3)

      // Letterbox bars slide open + dark cover fades out (hides green yuv frame at t=0)
      tl.to('.film-bar--top',    { yPercent: -100, duration: 14 }, 2)
      tl.to('.film-bar--bottom', { yPercent:  100, duration: 14 }, 2)
      tl.to(coverRef.current,    { opacity: 0, duration: 10 }, 2)

      // Staged captions — in/out sequenced on the same timeline
      const stages = [
        { in: 20, out: 42 },
        { in: 48, out: 68 },
        { in: 74, out: 96 },
      ]
      captionRefs.current.forEach((el, i) => {
        if (!el) return
        const { in: a, out: b } = stages[i]
        tl.fromTo(el,
          { opacity: 0, filter: 'blur(14px)', y: 30 },
          { opacity: 1, filter: 'blur(0px)', y: 0, duration: 8 },
          a
        )
        tl.to(el, { opacity: 0, filter: 'blur(14px)', y: -30, duration: 8 }, b - 8)
      })
    }, sec)

    return () => {
      cleanupScrub?.()
      ctx.revert()
    }
  }, [])

  return (
    <section className="film-section" ref={sectionRef} aria-label="Zeller film">
      <div className="film-sticky">
        <video
          ref={videoRef}
          src="/film-scrub.mp4"
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
        />
        <div className="film-bar film-bar--top" />
        <div className="film-bar film-bar--bottom" />
        <div className="film-video-cover" ref={coverRef} />
        <div className="vignette" />

        <div className="hero-overlay">
          <h1 ref={wordmarkRef} className="hero-wordmark">
            {'ZELLER'.split('').map((ch, i) => (
              <span key={i} className="hw">
                {ch}
                {i === 5 && <span className="hero-reg">®</span>}
              </span>
            ))}
          </h1>
          <p ref={taglineRef} className="hero-tagline">Celebrate You</p>
        </div>

        <div ref={cueRef} className="scroll-cue">
          <span className="scroll-cue-label">Scroll</span>
          <div className="scroll-cue-line" />
        </div>

        {CAPTIONS.map(({ label, text }, i) => (
          <div
            key={label}
            className="film-caption"
            ref={(el) => { captionRefs.current[i] = el }}
          >
            <span className="film-caption__label">{label}</span>
            <h3 className="film-caption__text">
              {text.split('\n').map((line, j) => (
                <span key={j} style={{ display: 'block' }}>{line}</span>
              ))}
            </h3>
          </div>
        ))}
      </div>
    </section>
  )
}
