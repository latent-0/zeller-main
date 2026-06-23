import { useEffect, useRef } from 'react'

export default function LoadingScreen({ onComplete }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const W = canvas.width
    const H = canvas.height

    const fontSize      = Math.min(W * 0.115, 108)
    const letterSpacing = fontSize * 0.36

    ctx.font = `200 ${fontSize}px Inter, system-ui, sans-serif`

    // Measure each character for exact positioning
    const CHARS = 'ZELLER'.split('')
    const charWidths = CHARS.map(c => ctx.measureText(c).width)
    const totalW = charWidths.reduce((s, w, i) =>
      s + w + (i < CHARS.length - 1 ? letterSpacing : 0), 0)

    let cx = (W - totalW) / 2
    const charPos = charWidths.map(w => {
      const p = { x: cx, center: cx + w * 0.5, w }
      cx += w + letterSpacing
      return p
    })

    const baseY = H * 0.5 + fontSize * 0.36

    // ── Path helpers ──────────────────────────────────────────────────────
    const easeInOut = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    const cubic = (t, a, b, c, d) =>
      (1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t**2*c + t**3*d

    // Entry bezier: top-right → swoop → land on 'Z'
    const E0 = { x: W * 0.72,  y: -H * 0.12 }
    const E1 = { x: W * 0.58,  y:  H * 0.22 }
    const E2 = { x: charPos[0].center - fontSize * 0.2, y: baseY - fontSize * 0.65 }
    const E3 = { x: charPos[0].center, y: baseY - fontSize * 0.28 }

    const sweepEndX = charPos[5].x + charPos[5].w

    const getCometPos = (prog) => {
      if (prog < 0.18) {
        const s = prog / 0.18
        return {
          x: cubic(s, E0.x, E1.x, E2.x, E3.x),
          y: cubic(s, E0.y, E1.y, E2.y, E3.y),
        }
      }
      const s = easeInOut((prog - 0.18) / 0.82)
      return {
        x: charPos[0].x + (sweepEndX - charPos[0].x) * s,
        y: baseY - fontSize * 0.3 + Math.sin(s * Math.PI * 1.8) * fontSize * 0.035,
      }
    }

    // ── Particle system ───────────────────────────────────────────────────
    const particles = []

    const spawnBurst = (x, y, count) => {
      for (let i = 0; i < count; i++) {
        const a     = Math.random() * Math.PI * 2
        const speed = 1.2 + Math.random() * 4.5
        const isStar = Math.random() > 0.55
        particles.push({
          x, y,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed - 1.5,
          life: 1,
          decay: 0.014 + Math.random() * 0.028,
          size: isStar ? 2 + Math.random() * 2.5 : 0.7 + Math.random() * 1.6,
          isStar,
          gold: Math.random() > 0.35,
        })
      }
    }

    const spawnTrailSpark = (x, y) => {
      if (Math.random() > 0.45) return
      const a = Math.random() * Math.PI * 2
      const s = 0.3 + Math.random() * 1.1
      particles.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.4,
        life: 0.55 + Math.random() * 0.35,
        decay: 0.026 + Math.random() * 0.018,
        size: 0.5 + Math.random() * 1.1,
        isStar: false,
        gold: true,
      })
    }

    const drawStar = (x, y, r, alpha) => {
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.shadowColor = '#EAB308'
      ctx.shadowBlur  = 10
      ctx.fillStyle   = '#fffde7'
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const a  = (i / 4) * Math.PI * 2 - Math.PI / 4
        const ah = a + Math.PI / 4
        const fn = i === 0 ? 'moveTo' : 'lineTo'
        ctx[fn](x + Math.cos(a) * r, y + Math.sin(a) * r)
        ctx.lineTo(x + Math.cos(ah) * r * 0.32, y + Math.sin(ah) * r * 0.32)
      }
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }

    // ── Animation state ───────────────────────────────────────────────────
    const DURATION  = 2900
    const trail     = []
    const MAX_TRAIL = 30
    const revealed  = new Array(6).fill(false)
    const letterAlpha = new Array(6).fill(0)
    let startTime = null
    let rafId = null

    const frame = (now) => {
      if (!startTime) startTime = now
      const progress = Math.min((now - startTime) / DURATION, 1)

      ctx.clearRect(0, 0, W, H)

      const pos = getCometPos(progress)

      // Trail
      trail.push({ ...pos, age: 0 })
      if (trail.length > MAX_TRAIL) trail.shift()
      trail.forEach(p => p.age++)
      spawnTrailSpark(pos.x, pos.y)

      // Letter reveals — triggered by comet x passing each center
      for (let i = 0; i < 6; i++) {
        if (!revealed[i] && pos.x >= charPos[i].center) {
          revealed[i] = true
          spawnBurst(charPos[i].center, baseY - fontSize * 0.44, 28)
        }
        if (revealed[i]) letterAlpha[i] = Math.min(letterAlpha[i] + 0.065, 1)
      }

      // Draw trail glow
      for (let i = 0; i < trail.length; i++) {
        const p  = trail[i]
        const tf = 1 - p.age / MAX_TRAIL
        const r  = 2.5 + tf * 6
        ctx.save()
        ctx.globalAlpha = tf * tf * 0.8
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r)
        g.addColorStop(0,   'rgba(255,255,230,1)')
        g.addColorStop(0.4, 'rgba(234,179,8,0.7)')
        g.addColorStop(1,   'rgba(234,179,8,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x  += p.vx
        p.y  += p.vy
        p.vy += 0.065
        p.vx *= 0.97
        p.life -= p.decay
        if (p.life <= 0) { particles.splice(i, 1); continue }

        if (p.isStar) {
          drawStar(p.x, p.y, p.size * 3.2, p.life)
        } else {
          ctx.save()
          ctx.globalAlpha = p.life * 0.88
          const col = p.gold ? '#EAB308' : '#fffde7'
          ctx.fillStyle   = col
          ctx.shadowColor = col
          ctx.shadowBlur  = 5
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }

      // Draw text letters
      ctx.font = `200 ${fontSize}px Inter, system-ui, sans-serif`
      ctx.textBaseline = 'alphabetic'
      for (let i = 0; i < 6; i++) {
        if (letterAlpha[i] <= 0) continue
        ctx.save()
        ctx.globalAlpha = letterAlpha[i]
        ctx.fillStyle   = '#f0ece4'
        // Momentary sparkle halo on first reveal
        const halo = Math.sin(letterAlpha[i] * Math.PI)
        ctx.shadowColor = '#EAB308'
        ctx.shadowBlur  = 22 * halo
        ctx.fillText(CHARS[i], charPos[i].x, baseY)
        ctx.restore()
      }

      // Final ambient glow once all letters visible
      const allIn = letterAlpha.every(a => a >= 0.95)
      if (allIn && progress > 0.8) {
        const gT = Math.min((progress - 0.8) / 0.12, 1)
        ctx.save()
        ctx.globalAlpha  = gT * 0.28
        ctx.font = `200 ${fontSize}px Inter, system-ui, sans-serif`
        ctx.textBaseline = 'alphabetic'
        ctx.shadowColor  = '#EAB308'
        ctx.shadowBlur   = 50
        ctx.fillStyle    = 'rgba(234,179,8,0.15)'
        for (let i = 0; i < 6; i++) {
          ctx.fillText(CHARS[i], charPos[i].x, baseY)
        }
        ctx.restore()
      }

      // Comet head
      if (progress < 0.94) {
        const fade = progress > 0.86 ? 1 - (progress - 0.86) / 0.08 : 1
        ctx.save()
        ctx.globalAlpha = fade
        const r = 16
        const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r)
        grd.addColorStop(0,    'rgba(255,255,255,1)')
        grd.addColorStop(0.3,  'rgba(255,245,160,0.9)')
        grd.addColorStop(0.65, 'rgba(234,179,8,0.4)')
        grd.addColorStop(1,    'rgba(234,179,8,0)')
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = fade * 0.95
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 2.8, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(frame)
      } else {
        setTimeout(() => onComplete?.(), 350)
      }
    }

    rafId = requestAnimationFrame(frame)
    return () => { if (rafId) cancelAnimationFrame(rafId) }
  }, [onComplete])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: '#0a0a0a',
    }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, display: 'block' }}
      />
    </div>
  )
}
