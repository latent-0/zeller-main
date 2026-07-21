import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// import RoomScene from './RoomScene'          // ← old chandelier hero (preserved in RoomScene.jsx)
// import SideRays from './SideRays'            // ← old side rays (preserved in SideRays.jsx)
// import LuxuryRoomScene from './LuxuryRoomScene'  // ← procedural room backup
// import InteriorScene from './InteriorScene'  // ← old 3D room hero (preserved in InteriorScene.jsx)
// import CrystalHero from './CrystalHero'      // ← crystal hero variant (preserved in CrystalHero.jsx)
import FilmSection from './FilmSection'
import Configurator from './Configurator'
import BlurText from './BlurText'
import DomeGallery from './DomeGallery'
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
    img: '/gallery/chandelier-glasswork.jpg',
  },
  {
    n: '02',
    label: 'Bespoke',
    title: 'Custom Chandeliers',
    desc: 'Each chandelier an epiphany of a shooting star — sculpted dreams rendered in crystalline light. Commission yours and illuminate your world with the cosmos.',
    img: '/gallery/chandelier-dome.jpg',
  },
]

export default function App() {
  const framesRef    = useRef(null)
  const frame1Ref    = useRef(null)
  const frame2Ref    = useRef(null)
  const frame3Ref    = useRef(null)
  const hScrollRef   = useRef(null)
  const hTrackRef    = useRef(null)

  const [isAtelier, setIsAtelier] = useState(() => window.location.hash === '#atelier')
  useEffect(() => {
    const onHash = () => {
      const atelier = window.location.hash === '#atelier'
      // un-pin before React unmounts — a pinned section lives inside a
      // ScrollTrigger pin-spacer div, and removing it mid-pin crashes the commit
      if (atelier) {
        ScrollTrigger.getAll().forEach((t) => t.kill())
        window.scrollTo(0, 0)
      }
      setIsAtelier(atelier)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (isAtelier) return

    const ctx = gsap.context(() => {
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
      const hTween = gsap.to(track, {
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

      // background numerals drift slower than their panels
      gsap.utils.toArray('.h-panel').forEach((panel) => {
        const num = panel.querySelector('.h-panel__bg-num')
        if (!num) return
        gsap.fromTo(num,
          { xPercent: 16 },
          {
            xPercent: -16, ease: 'none',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: hTween,
              start: 'left right',
              end:   'right left',
              scrub: true,
            },
          }
        )
      })
    }

    // ── Stats — staggered blur rise ──
    gsap.fromTo('.stat-item',
      { opacity: 0, y: 44, filter: 'blur(8px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 0.9, stagger: 0.12, ease: 'power3.out',
        scrollTrigger: { trigger: '.stats-row', start: 'top 82%' },
      }
    )

    // ── Dividers grow from the left ──
    gsap.utils.toArray('.divider').forEach((d) => {
      gsap.fromTo(d,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 1.1, ease: 'power3.inOut',
          scrollTrigger: { trigger: d, start: 'top 88%' } }
      )
    })

    // ── Product cards — staggered rise, images settle from a zoom ──
    const cards = gsap.utils.toArray('.product-card')
    if (cards.length) {
      gsap.fromTo(cards,
        { opacity: 0, y: 70 },
        {
          opacity: 1, y: 0, duration: 1, stagger: 0.16, ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: '.product-grid', start: 'top 80%' },
        }
      )
      cards.forEach((card) => {
        const img = card.querySelector('.product-card__frame img')
        if (!img) return
        gsap.fromTo(img,
          { scale: 1.22 },
          { scale: 1, duration: 1.5, ease: 'power2.out', clearProps: 'transform',
            scrollTrigger: { trigger: card, start: 'top 80%' } }
        )
      })
    }

    // ── Quote — soft blur reveal ──
    gsap.fromTo('.quote-section blockquote, .quote-section cite',
      { opacity: 0, y: 28, filter: 'blur(10px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1.1, stagger: 0.25, ease: 'power3.out',
        scrollTrigger: { trigger: '.quote-section', start: 'top 75%' },
      }
    )

    // ── À la carte cards — rise with a settling tilt ──
    gsap.utils.toArray('.alacarte-card').forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 60, rotate: i % 2 ? 2 : -2 },
        { opacity: 1, y: 0, rotate: 0, duration: 1, ease: 'power3.out',
          clearProps: 'transform',
          scrollTrigger: { trigger: card, start: 'top 85%' } }
      )
    })

    // ── remaining .reveal elements ──
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
      })
    })

    })

    return () => ctx.revert()
  }, [isAtelier])

  if (isAtelier) return <Configurator />

  return (
    <>
      {/* ── Navbar ── */}
      <nav>
        <a href="#" className="nav-logo">Zeller</a>
        <ul className="nav-links">
          <li><a href="#story">Story</a></li>
          <li><a href="#collection">Collection</a></li>
          <li><a href="#alacarte">À La Carte</a></li>
          <li><a href="#atelier">Atelier</a></li>
          <li><a href="#contact">Connect</a></li>
        </ul>
      </nav>

      {/* ── Hero — scroll-scrubbed film ── */}
      <FilmSection />

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
      <section id="story" className="fragment-section grain-section">
        <div className="fragment-text">
          <BlurText text="Who We Are" as="span" className="section-label" animateBy="words" delay={80} stepDuration={0.4} />
          <h2 className="heading-duo">
            <BlurText text="India's Crystal" as="span" className="h-duo__bold" animateBy="words" delay={100} stepDuration={0.45} />
            <BlurText text="Couture Entourage" as="span" className="h-duo__serif" animateBy="words" delay={200} stepDuration={0.45} />
          </h2>
          <div className="divider" />
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
            <img src="/gallery/chandelier-cubes.jpg" alt="Geometric cube chandelier glowing in the dark" />
          </div>
          <div ref={frame2Ref} className="frame frame--2">
            <img src="/gallery/chandelier-dome.jpg" alt="Crystal dome chandelier beneath an ornate ceiling" />
          </div>
          <div ref={frame3Ref} className="frame frame--3">
            <img src="/gallery/chandelier-glasswork.jpg" alt="Twisted glasswork chandelier arms in warm light" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-row grain-section">
        {[
          { num: '1st',  unit: '',   label: 'In India' },
          { num: '100',  unit: '%',  label: 'Handcrafted' },
          { num: '02',   unit: '',   label: 'Product Lines' },
          { num: '∞',    unit: '',   label: 'Cosmic Stories' },
        ].map(({ num, unit, label }) => (
          <div key={label} className="stat-item">
            <span className="stat-number">{num}<span className="stat-unit">{unit}</span></span>
            <span className="stat-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Horizontal scroll — what sets us apart ── */}
      <div className="h-scroll-wrapper grain-section" ref={hScrollRef}>
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
          <h2 className="heading-duo" style={{ marginBottom: '3rem' }}>
            <BlurText text="Our" as="span" className="h-duo__bold" animateBy="words" delay={110} stepDuration={0.45} />
            <BlurText text="Offerings" as="span" className="h-duo__serif" animateBy="words" delay={210} stepDuration={0.45} />
          </h2>
        </div>
        <div className="product-grid product-grid--2">
          {PRODUCTS.map(({ n, label, title, desc, img }) => (
            <div key={n} className="product-card product-card--rich">
              <div className="product-card__frame">
                <img src={img} alt={title} />
              </div>
              <span className="product-number">{n} — {label}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cosmic quote ── */}
      <div className="quote-section grain-section">
        <blockquote>
          &ldquo;Indulge in Crystal Couture. Celebrate the universe within you.&rdquo;
        </blockquote>
        <cite>— Zeller Brand Ethos</cite>
      </div>

      {/* ── Dome Gallery — chandelier collection ── */}
      <section id="gallery" className="dome-gallery-section">
        <div className="dome-gallery-header">
          <BlurText text="The Collection" as="span" className="section-label" animateBy="words" delay={80} stepDuration={0.4} />
          <h2 className="heading-duo">
            <BlurText text="Chandeliers" as="span" className="h-duo__bold" animateBy="words" delay={110} stepDuration={0.45} />
            <BlurText text="in Every Facet" as="span" className="h-duo__serif" animateBy="words" delay={210} stepDuration={0.45} />
          </h2>
          <p className="reveal dome-gallery-hint">Drag to explore — tap any piece to illuminate it.</p>
        </div>
        <div className="dome-gallery-canvas">
          <DomeGallery
            overlayBlurColor="#0f0b1a"
            grayscale={false}
            imageBorderRadius="20px"
            openedImageBorderRadius="24px"
            openedImageWidth="360px"
            openedImageHeight="480px"
            fit={0.52}
            dragDampening={1.6}
          />
        </div>
      </section>

      {/* ── À La Carte services ── */}
      <section id="alacarte">
        <div className="section">
          <div className="section-intro">
            <div>
              <BlurText text="À La Carte" as="span" className="section-label" stagger={0.04} />
              <h2 className="heading-duo">
                <BlurText text="Bespoke" as="span" className="h-duo__bold" animateBy="words" delay={100} stepDuration={0.45} />
                <BlurText text="Services" as="span" className="h-duo__serif" animateBy="words" delay={190} stepDuration={0.45} />
              </h2>
              <div className="divider" />
              <p className="reveal">
                With artisanal craftsmanship as our celestial wand, we immerse you in the avant-garde experience of Crystal Couture — paving way for a new revelation in India.
              </p>
            </div>
            <div className="alacarte-cards">
              <div className="alacarte-card">
                <span className="alacarte-card__num">01</span>
                <h3>Customisation &amp; Consultation</h3>
                <p>From a single crystal to a bespoke chandelier — every piece conceived around you. Your cosmos, your creation.</p>
              </div>
              <div className="alacarte-card">
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
