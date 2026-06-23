import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import RoomScene from './RoomScene'
import SideRays from './SideRays'
import LoadingScreen from './LoadingScreen'
import BlurText from './BlurText'
import './index.css'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const sectionRef   = useRef(null)
  const wordmarkRef  = useRef(null)
  const taglineRef   = useRef(null)
  const scrollCueRef = useRef(null)
  const card1Ref     = useRef(null)
  const card2Ref     = useRef(null)
  const card3Ref     = useRef(null)
  const [sceneLoaded, setSceneLoaded] = useState(false)
  const [splashDone,  setSplashDone]  = useState(false)
  const sceneReady = sceneLoaded && splashDone

  /* Hero + card animations — run once scene is loaded */
  useEffect(() => {
    if (!sceneReady) return

    const sec = sectionRef.current

    // ── Hero wordmark: per-letter blur-in on scroll ──
    const hwSpans = wordmarkRef.current?.querySelectorAll('.hw')
    if (hwSpans?.length) {
      gsap.fromTo(hwSpans,
        { opacity: 0, filter: 'blur(22px)', y: 16 },
        {
          opacity: 1, filter: 'blur(0px)', y: 0,
          duration: 0.9, stagger: 0.07, ease: 'power3.out',
          scrollTrigger: {
            trigger: sec,
            start: 'top+=3% top',
            end:   'top+=18% top',
            scrub: 1.2,
          },
        }
      )
    }

    // ── Tagline blur-in ──
    gsap.fromTo(taglineRef.current,
      { opacity: 0, filter: 'blur(10px)', y: 10 },
      {
        opacity: 1, filter: 'blur(0px)', y: 0,
        duration: 0.8, ease: 'power3.out',
        scrollTrigger: {
          trigger: sec,
          start: 'top+=10% top',
          end:   'top+=22% top',
          scrub: 1,
        },
      }
    )

    // ── Scroll cue ──
    gsap.to(scrollCueRef.current, { opacity: 1, duration: 1.4, delay: 0.6, ease: 'power2.out' })
    gsap.to(scrollCueRef.current, {
      opacity: 0,
      scrollTrigger: { trigger: sec, start: 'top+=4% top', end: 'top+=13% top', scrub: true },
    })

    // ── Glassmorphism brand cards ──
    // Section is 500vh; usable scroll = 400vh (500 - 100 for sticky)
    // Cards appear / disappear at specific orbit phases
    const cardAnims = [
      {
        ref: card1Ref,
        inS:  'top+=14% top', inE:  'top+=22% top',
        outS: 'top+=30% top', outE: 'top+=36% top',
      },
      {
        ref: card2Ref,
        inS:  'top+=38% top', inE:  'top+=46% top',
        outS: 'top+=54% top', outE: 'top+=60% top',
      },
      {
        ref: card3Ref,
        inS:  'top+=58% top', inE:  'top+=66% top',
        outS: 'top+=76% top', outE: 'top+=83% top',
      },
    ]

    cardAnims.forEach(({ ref, inS, inE, outS, outE }) => {
      const el = ref.current
      if (!el) return
      gsap.fromTo(el,
        { opacity: 0, y: 28, filter: 'blur(12px)' },
        { opacity: 1, y: 0,  filter: 'blur(0px)',
          scrollTrigger: { trigger: sec, start: inS, end: inE, scrub: 1.5 } }
      )
      gsap.fromTo(el,
        { opacity: 1, y: 0 },
        { opacity: 0, y: -20,
          scrollTrigger: { trigger: sec, start: outS, end: outE, scrub: 1.5 } }
      )
    })

    return () => ScrollTrigger.getAll().forEach((t) => t.kill())
  }, [sceneReady])

  /* Content reveal animations */
  useEffect(() => {
    if (!sceneReady) return
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    })
  }, [sceneReady])

  return (
    <>
      {/* Navbar */}
      <nav>
        <a href="#" className="nav-logo">Zeller</a>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#collection">Collection</a></li>
          <li><a href="#craft">Craft</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      {/* Sparkle loading splash — shown until animation + scene both done */}
      {!sceneReady && (
        <LoadingScreen onComplete={() => setSplashDone(true)} />
      )}

      {/* ── Hero: Three.js room ── */}
      <div className="video-scroll-section" ref={sectionRef}>
        <div className="video-sticky">
          <RoomScene sectionRef={sectionRef} onReady={() => setSceneLoaded(true)} />
          <SideRays
            speed={2.5}
            rayColor1="#EAB308"
            rayColor2="#96c8ff"
            intensity={4.5}
            spread={2.8}
            origin="top-right"
            tilt={0}
            saturation={1.5}
            blend={0.57}
            falloff={1.2}
            opacity={1.0}
          />

          <div className="vignette" />

          {/* ── Brand story cards (orbit-synced) ── */}
          <div ref={card1Ref} className="brand-card brand-card--tl">
            <span className="brand-card__label">Heritage</span>
            <div className="brand-card__title">Est. 1997</div>
            <p className="brand-card__body">Three decades of precision crystal craftsmanship. Each piece carries the hallmarks of its maker.</p>
          </div>

          <div ref={card2Ref} className="brand-card brand-card--tr">
            <span className="brand-card__label">Craft</span>
            <div className="brand-card__title">Handcast Crystal</div>
            <p className="brand-card__body">Every leaf individually formed, polished and assembled by hand. No two chandeliers identical.</p>
          </div>

          <div ref={card3Ref} className="brand-card brand-card--bl">
            <span className="brand-card__label">Origin</span>
            <div className="brand-card__title">Zürich Atelier</div>
            <p className="brand-card__body">Conceived in Switzerland. Finished by twelve pairs of hands. Compromised by none.</p>
          </div>

          <div className="hero-overlay">
            <h1 ref={wordmarkRef} className="hero-wordmark">
              {'ZELLER'.split('').map((ch, i) => (
                <span key={i} className="hw">{ch}</span>
              ))}
            </h1>
            <p ref={taglineRef} className="hero-tagline">Designed for the Discerning</p>
          </div>

          <div ref={scrollCueRef} className="scroll-cue">
            <span className="scroll-cue-label">Scroll</span>
            <div className="scroll-cue-line" />
          </div>
        </div>
      </div>

      {/* ── About ── */}
      <section id="about" className="paper-section">
        <div className="section">
          <div className="section-intro">
            <div>
              <BlurText text="Our Philosophy" as="span" className="section-label" stagger={0.04} />
              <h2><BlurText text="Crafted with Intent" wordLevel stagger={0.12} /></h2>
              <div className="divider reveal" />
            </div>
            <div>
              <p className="reveal">
                At Zeller, every detail is considered. We source the finest materials
                from artisan partners across three continents, ensuring that each piece
                carries not just quality, but a story worth telling.
              </p>
              <br />
              <p className="reveal">
                Our process is slow by design. Precision cannot be rushed, and neither
                can the relationship between maker and material.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="stats-row">
        {[
          { num: '28',  unit: '',   label: 'Years of Craft' },
          { num: '14',  unit: 'k+', label: 'Pieces Made' },
          { num: '03',  unit: '',   label: 'Continents Sourced' },
          { num: '100', unit: '%',  label: 'Handfinished' },
        ].map(({ num, unit, label }) => (
          <div key={label} className="stat-item">
            <span className="stat-number reveal">
              {num}<span className="stat-unit">{unit}</span>
            </span>
            <span className="stat-label reveal">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Collection ── */}
      <section id="collection">
        <div className="section">
          <BlurText text="The Collection" as="span" className="section-label" stagger={0.04} />
          <h2 style={{ marginBottom: '3rem' }}><BlurText text="Current Season" wordLevel stagger={0.12} /></h2>
        </div>
        <div className="product-grid">
          {[
            { n: '01', title: 'The Meridian',  desc: 'A study in architectural restraint. Full-grain leather, hand-stitched welt construction.' },
            { n: '02', title: 'The Solstice',  desc: 'Named for the longest day. Open-weave linen, natural dye process, unlined.' },
            { n: '03', title: 'The Nordvik',   desc: 'Scandinavian heritage meets contemporary cut. Boiled wool, mother-of-pearl closure.' },
            { n: '04', title: 'The Crest',     desc: 'A structured silhouette for the considered wardrobe. Japanese selvedge, stone-washed.' },
            { n: '05', title: 'The Atelier',   desc: 'Bespoke program. Each piece made to measure. Lead time: 8–12 weeks.' },
            { n: '06', title: 'The Archive',   desc: 'Past season favourites, reissued in limited numbers. First come, first served.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="product-card">
              <span className="product-number reveal">{n}</span>
              <h3 className="reveal">{title}</h3>
              <p className="reveal">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quote ── */}
      <div className="quote-section">
        <blockquote className="reveal">
          &ldquo;The best things in life are made once, made well, and kept for a lifetime.&rdquo;
        </blockquote>
        <cite className="reveal">— Zeller Atelier, Est. 1997</cite>
      </div>

      {/* ── Craft ── */}
      <section id="craft">
        <div className="section">
          <div className="section-intro">
            <div>
              <BlurText text="Our Craft" as="span" className="section-label" stagger={0.04} />
              <h2><BlurText text="The Making of Things" wordLevel stagger={0.12} /></h2>
              <div className="divider reveal" />
              <p className="reveal">
                Each Zeller piece passes through twelve pairs of hands before it reaches
                yours. We believe the journey matters as much as the destination.
              </p>
            </div>
            <div>
              <p className="reveal">
                Our atelier in the Swiss countryside operates on a single principle:
                never compromise. The moment a concession is made to speed or cost,
                the integrity of the work is lost.
              </p>
              <br />
              <p className="reveal">
                We invite you to visit us. See the looms, meet the makers, understand
                the process behind what you wear.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer id="contact">
        <div>
          <p className="footer-brand">Zeller Atelier</p>
          <p style={{ fontSize: '0.65rem', color: '#3a3a3a', marginTop: '0.5rem', letterSpacing: '0.1em' }}>
            Zürich · London · Tokyo
          </p>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Zeller. All rights reserved.</p>
      </footer>
    </>
  )
}
