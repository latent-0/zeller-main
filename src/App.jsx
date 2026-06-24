import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// import RoomScene from './RoomScene'          // ← old chandelier hero (preserved in RoomScene.jsx)
// import SideRays from './SideRays'            // ← old side rays (preserved in SideRays.jsx)
// import LuxuryRoomScene from './LuxuryRoomScene'  // ← procedural room backup
// import InteriorScene from './InteriorScene'       // ← interior scene backup
import CrystalHero from './CrystalHero'
import LoadingScreen from './LoadingScreen'
import BlurText from './BlurText'
import './index.css'

gsap.registerPlugin(ScrollTrigger)

const DIFFERENTIATORS = [
  {
    num: '01',
    label: 'Conceptual Storytelling',
    title: 'A Fragment\nof the Cosmos',
    body: 'We draw inspiration from the cosmos, offering products that are not just beautiful but tell a unique story. Each piece is designed to be a fragment of the cosmos — resonating with your fascination with the universe.',
  },
  {
    num: '02',
    label: 'Artisanal Craftsmanship',
    title: 'Meticulously\nHandcrafted',
    body: 'Every Zeller crystal is meticulously handcrafted by master artisans, ensuring each piece is a unique work of art. This focus on artisanal craftsmanship distinguishes us from mass-produced alternatives.',
  },
  {
    num: '03',
    label: 'Personalised Experiences',
    title: 'Bespoke to\nYour Cosmos',
    body: 'We offer bespoke creations and personalised experiences, making each purchase a unique journey. This personalised approach enhances the luxury appeal and creates a deeper connection with the cosmos within you.',
  },
  {
    num: '04',
    label: 'Cosmic Engagement',
    title: 'Wonder &\nConnection',
    body: 'By positioning our products as cosmic storytellers, we engage our customers on a deeper level — fostering a sense of wonder and connection that transcends mere ownership. Celebrate the universe within you.',
  },
]

const PRODUCTS = [
  {
    n: '01',
    label: 'Home',
    title: 'Crystal Home Accessories',
    desc: 'Celestial adornments for your living space. Each piece a cosmic companion that bejewels your reality and transforms the everyday into the extraordinary.',
    img: '/room/glass_texture.jpg',
  },
  {
    n: '02',
    label: 'Jewellery',
    title: 'Zeller Jewellery',
    desc: 'Wearable crystal couture — carry a piece of the cosmos wherever you go. Turning every moment into a cosmic celebration of your unique essence.',
    img: null,
  },
  {
    n: '03',
    label: 'Bespoke',
    title: 'Custom Chandeliers',
    desc: 'Each chandelier an epiphany of a shooting star — sculpted dreams rendered in crystalline light. Commission yours and illuminate your world with the cosmos.',
    img: '/room/Leaves_chandelier_Dirt.jpg',
  },
]

export default function App() {
  const sectionRef   = useRef(null)
  const wordmarkRef  = useRef(null)
  const taglineRef   = useRef(null)
  const scrollCueRef = useRef(null)
  const framesRef    = useRef(null)
  const frame1Ref    = useRef(null)
  const frame2Ref    = useRef(null)
  const frame3Ref    = useRef(null)
  const hScrollRef   = useRef(null)
  const hTrackRef    = useRef(null)

  const [sceneLoaded, setSceneLoaded] = useState(false)
  const [splashDone,  setSplashDone]  = useState(false)
  const sceneReady = sceneLoaded && splashDone

  useEffect(() => {
    if (!sceneReady) return
    const sec = sectionRef.current

    // ── Hero wordmark letter blur ──
    const hwSpans = wordmarkRef.current?.querySelectorAll('.hw')
    if (hwSpans?.length) {
      gsap.fromTo(hwSpans,
        { opacity: 0, filter: 'blur(22px)', y: 16 },
        {
          opacity: 1, filter: 'blur(0px)', y: 0,
          duration: 0.9, stagger: 0.07, ease: 'power3.out',
          scrollTrigger: { trigger: sec, start: 'top+=3% top', end: 'top+=18% top', scrub: 1.2 },
        }
      )
    }

    gsap.fromTo(taglineRef.current,
      { opacity: 0, filter: 'blur(10px)', y: 10 },
      {
        opacity: 1, filter: 'blur(0px)', y: 0,
        scrollTrigger: { trigger: sec, start: 'top+=10% top', end: 'top+=22% top', scrub: 1 },
      }
    )

    gsap.to(scrollCueRef.current, { opacity: 1, duration: 1.4, delay: 0.6, ease: 'power2.out' })
    gsap.to(scrollCueRef.current, {
      opacity: 0,
      scrollTrigger: { trigger: sec, start: 'top+=4% top', end: 'top+=13% top', scrub: true },
    })


    // ── Diagonal frames — staggered parallax entry ──
    if (framesRef.current) {
      ;[frame1Ref, frame2Ref, frame3Ref].forEach((ref, i) => {
        const el = ref.current; if (!el) return
        // Fade in with staggered start
        gsap.fromTo(el,
          { opacity: 0, y: 70 + i * 25 },
          {
            opacity: 1, y: 0,
            scrollTrigger: {
              trigger: framesRef.current,
              start: `top ${88 - i * 10}%`,
              end:   `top ${52 - i * 8}%`,
              scrub: 1.4,
            },
          }
        )
        // Parallax: each frame drifts at different rate while section scrolls
        gsap.to(el, {
          y: -35 - i * 20,
          ease: 'none',
          scrollTrigger: {
            trigger: framesRef.current,
            start: 'top bottom',
            end:   'bottom top',
            scrub: true,
          },
        })
      })
    }

    // ── Horizontal scroll — differentiators ──
    if (hScrollRef.current && hTrackRef.current) {
      const track = hTrackRef.current
      gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger:  hScrollRef.current,
          start:    'top top',
          end:      () => `+=${track.scrollWidth - window.innerWidth}`,
          pin:      true,
          scrub:    1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
    }

    // ── .reveal elements ──
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
      })
    })

    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  }, [sceneReady])

  return (
    <>
      {/* ── Navbar ── */}
      <nav>
        <a href="#" className="nav-logo">Zeller</a>
        <ul className="nav-links">
          <li><a href="#story">Story</a></li>
          <li><a href="#collection">Collection</a></li>
          <li><a href="#alacarte">À La Carte</a></li>
          <li><a href="#contact">Connect</a></li>
        </ul>
      </nav>

      {!sceneReady && <LoadingScreen onComplete={() => setSplashDone(true)} />}

      {/* ── Hero — luxury room 3D walk-through ── */}
      <div className="video-scroll-section" ref={sectionRef}>
        <div className="video-sticky">
          <CrystalHero sectionRef={sectionRef} onReady={() => setSceneLoaded(true)} />
          <div className="vignette" />

          <div className="hero-overlay">
            <h1 ref={wordmarkRef} className="hero-wordmark">
              {'ZELLER'.split('').map((ch, i) => <span key={i} className="hw">{ch}</span>)}
            </h1>
            <p ref={taglineRef} className="hero-tagline">Celebrate You</p>
          </div>

          <div ref={scrollCueRef} className="scroll-cue">
            <span className="scroll-cue-label">Scroll</span>
            <div className="scroll-cue-line" />
          </div>
        </div>
      </div>

      {/*
        ── OLD HERO — chandelier orbit (preserved below, uncomment to restore) ──
        <div className="video-scroll-section" ref={sectionRef}>
          <div className="video-sticky">
            <RoomScene sectionRef={sectionRef} onReady={() => setSceneLoaded(true)} />
            <SideRays
              speed={2.5} rayColor1="#EAB308" rayColor2="#96c8ff"
              intensity={4.5} spread={2.8} origin="top-right"
              tilt={0} saturation={1.5} blend={0.57} falloff={1.2} opacity={1.0}
            />
            <div className="vignette" />
            <div ref={card1Ref} className="brand-card brand-card--tl">...</div>
            <div ref={card2Ref} className="brand-card brand-card--tr">...</div>
            <div ref={card3Ref} className="brand-card brand-card--bl">...</div>
            <div className="hero-overlay">
              <h1 ref={wordmarkRef} className="hero-wordmark">
                {'ZELLER'.split('').map((ch, i) => <span key={i} className="hw">{ch}</span>)}
              </h1>
              <p ref={taglineRef} className="hero-tagline">Celebrate You</p>
            </div>
            <div ref={scrollCueRef} className="scroll-cue">
              <span className="scroll-cue-label">Scroll</span>
              <div className="scroll-cue-line" />
            </div>
          </div>
        </div>
      */}

      {/* ── Fragment of the Cosmos — diagonal frames ── */}
      <section id="story" className="fragment-section">
        <div className="fragment-text">
          <BlurText text="Who We Are" as="span" className="section-label" animateBy="words" delay={80} stepDuration={0.4} />
          <BlurText text="India's Crystal Couture Entourage" as="h2" animateBy="words" delay={100} stepDuration={0.45} />
          <div className="divider reveal" />
          <p className="reveal">
            A saga reminiscent of a glimpse of the ethereal beyond — sculpting dreams, cosmos &amp; everything in between. A poetic dance of stardust &amp; aspirations, unfurling into a souvenir of indulgent celebrations.
          </p>
          <p className="reveal" style={{ marginTop: '1.4rem' }}>
            Each crystal is not just an adornment but a fragment of the cosmos. We emerge as an epiphany of a shooting star — whispering to celebrate the universe within you.
          </p>
          <p className="reveal cosmic-pull" style={{ marginTop: '2rem' }}>
            &ldquo;Each facet — a universe of its own.&rdquo;
          </p>
        </div>

        <div className="frames-gallery" ref={framesRef}>
          <div ref={frame1Ref} className="frame frame--1">
            <img src="/room/Leaves_chandelier_Dirt.jpg" alt="Crystal chandelier leaves" />
          </div>
          <div ref={frame2Ref} className="frame frame--2">
            <img src="/room/glass_texture.jpg" alt="Crystal glass texture" />
          </div>
          <div ref={frame3Ref} className="frame frame--3">
            <div className="frame-art" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-row">
        {[
          { num: '1st',  unit: '',   label: 'In India' },
          { num: '100',  unit: '%',  label: 'Handcrafted' },
          { num: '03',   unit: '',   label: 'Product Lines' },
          { num: '∞',    unit: '',   label: 'Cosmic Stories' },
        ].map(({ num, unit, label }) => (
          <div key={label} className="stat-item">
            <span className="stat-number reveal">{num}<span className="stat-unit">{unit}</span></span>
            <span className="stat-label reveal">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Horizontal scroll — what sets us apart ── */}
      <div className="h-scroll-wrapper" ref={hScrollRef}>
        <div className="h-scroll-track" ref={hTrackRef}>
          {DIFFERENTIATORS.map((d) => (
            <div className="h-panel" key={d.num}>
              <span className="h-panel__bg-num">{d.num}</span>
              <span className="h-panel__label">{d.label}</span>
              <h3 className="h-panel__title">
                {d.title.split('\n').map((line, i) => <span key={i} style={{ display: 'block' }}>{line}</span>)}
              </h3>
              <p className="h-panel__body">{d.body}</p>
            </div>
          ))}
        </div>
        <div className="h-scroll-progress">
          <span className="h-scroll-label">What Sets Us Apart — Drag to Explore</span>
        </div>
      </div>

      {/* ── Product Range ── */}
      <section id="collection">
        <div className="section">
          <BlurText text="Product Range" as="span" className="section-label" animateBy="words" delay={80} stepDuration={0.4} />
          <BlurText text="Our Offerings" as="h2" animateBy="words" delay={110} stepDuration={0.45} style={{ marginBottom: '3rem' }} />
        </div>
        <div className="product-grid product-grid--3">
          {PRODUCTS.map(({ n, label, title, desc, img }) => (
            <div key={n} className="product-card product-card--rich">
              <div className="product-card__frame">
                {img
                  ? <img src={img} alt={title} />
                  : <div className="product-card__art" />}
              </div>
              <span className="product-number reveal">{n} — {label}</span>
              <h3 className="reveal">{title}</h3>
              <p className="reveal">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cosmic quote ── */}
      <div className="quote-section">
        <blockquote className="reveal">
          &ldquo;Indulge in Crystal Couture. Celebrate the universe within you.&rdquo;
        </blockquote>
        <cite className="reveal">— Zeller Brand Ethos</cite>
      </div>

      {/* ── À La Carte services ── */}
      <section id="alacarte">
        <div className="section">
          <div className="section-intro">
            <div>
              <BlurText text="À La Carte" as="span" className="section-label" stagger={0.04} />
              <h2><BlurText text="Bespoke Services" wordLevel stagger={0.12} /></h2>
              <div className="divider reveal" />
              <p className="reveal">
                With artisanal craftsmanship as our celestial wand, we immerse you in the avant-garde experience of Crystal Couture — paving way for a new revelation in India.
              </p>
            </div>
            <div className="alacarte-cards">
              <div className="alacarte-card reveal">
                <span className="alacarte-card__num">01</span>
                <h3>Customisation &amp; Consultation</h3>
                <p>From a single crystal to a bespoke chandelier — every piece conceived around you. Your cosmos, your creation.</p>
              </div>
              <div className="alacarte-card reveal">
                <span className="alacarte-card__num">02</span>
                <h3>Corporate &amp; Wedding Gifting</h3>
                <p>Gift a fragment of the cosmos. Curated crystal collections for milestones, celebrations, and the moments that matter.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact">
        <div>
          <p className="footer-brand">Zeller Crystals</p>
          <p style={{ fontSize: '0.62rem', color: 'var(--clr-muted)', marginTop: '0.5rem', letterSpacing: '0.12em' }}>
            www.zellercrystals.com
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--clr-accent)', letterSpacing: '0.38em', textTransform: 'uppercase', fontFamily: 'var(--font-display)' }}>
            Celebrate You
          </p>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Zeller. support@zellercrystals.com</p>
      </footer>
    </>
  )
}
