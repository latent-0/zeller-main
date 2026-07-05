import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

// ── Crystal palettes ──
const PASTELS = [
  { name: 'Clear Quartz', hex: '#eef1f5' },
  { name: 'Rose Quartz',  hex: '#f4c6d7' },
  { name: 'Aqua Serene',  hex: '#a9ddef' },
  { name: 'Peridot Mist', hex: '#ccd996' },
  { name: 'Lilac Dawn',   hex: '#d7c4ec' },
  { name: 'Champagne',    hex: '#e9dcc3' },
]
const PRECIOUS = [
  { name: 'Amethyst',       hex: '#7c4fa8' },
  { name: 'Sapphire',       hex: '#2f5cba' },
  { name: 'Ruby',           hex: '#a82450' },
  { name: 'Emerald',        hex: '#1f7a4e' },
  { name: 'Golden Topaz',   hex: '#c99a3a' },
  { name: 'Smoke Obsidian', hex: '#565660' },
]
const FINISHES = [
  { id: 'polished', name: 'Polished',   desc: 'Mirror-bright facets, full clarity' },
  { id: 'frosted',  name: 'Frosted',    desc: 'Soft satin surface, diffused glow' },
  { id: 'aurora',   name: 'Aurora',     desc: 'Iridescent film, shifting hues' },
]
const PRESETS = [
  { id: 'blush',    name: 'Blush',    statue: '#eef1f5', lotus: '#f4c6d7' },
  { id: 'amethyst', name: 'Amethyst', statue: '#eef1f5', lotus: '#7c4fa8' },
  { id: 'pure',     name: 'Pure',     statue: '#eef1f5', lotus: '#eef1f5' },
  { id: 'peridot',  name: 'Peridot',  statue: '#eef1f5', lotus: '#ccd996' },
  { id: 'sky',      name: 'Sky',      statue: '#eef1f5', lotus: '#a9ddef' },
]
const FINISH_PROPS = {
  polished: { roughness: 0.05, transmission: 0.92, iridescence: 0 },
  frosted:  { roughness: 0.42, transmission: 0.58, iridescence: 0 },
  aurora:   { roughness: 0.08, transmission: 0.85, iridescence: 1 },
}

const swatchStyle = (hex) => ({
  background: `linear-gradient(150deg,
    color-mix(in srgb, ${hex} 45%, white) 0%,
    ${hex} 55%,
    color-mix(in srgb, ${hex} 72%, black) 100%)`,
})

// ── Procedural faceted-crystal showpiece ──
function buildShowpiece() {
  const mkCrystal = (hex) => new THREE.MeshPhysicalMaterial({
    // near-white surface, tint carried by absorption — reads as glass, not plastic
    color: new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), 0.25),
    metalness: 0, roughness: 0.05,
    transmission: 0.92, thickness: 0.7, ior: 1.52,
    clearcoat: 1, clearcoatRoughness: 0.08,
    attenuationColor: hex, attenuationDistance: 1.2,
    iridescenceIOR: 1.7, flatShading: true,
  })
  const statueMat = mkCrystal('#eef1f5')
  const lotusMat  = mkCrystal('#f4c6d7')

  const group = new THREE.Group()
  const add = (geo, mat, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1], parent = group } = {}) => {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(...p); m.rotation.set(...r); m.scale.set(...s)
    m.castShadow = true
    parent.add(m)
    return m
  }

  // base disc
  add(new THREE.CylinderGeometry(1.12, 1.22, 0.14, 12, 1), lotusMat, { p: [0, 0.07, 0] })

  // lotus petals — two rings of faceted diamonds
  const petalGeo = new THREE.OctahedronGeometry(1, 1)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const holder = new THREE.Group()
    holder.rotation.y = a
    add(petalGeo, lotusMat, {
      p: [0.88, 0.28, 0], r: [0, 0, -1.32], s: [0.62, 0.11, 0.34], parent: holder,
    })
    group.add(holder)
  }
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.4
    const holder = new THREE.Group()
    holder.rotation.y = a
    add(petalGeo, lotusMat, {
      p: [0.55, 0.44, 0], r: [0, 0, -0.85], s: [0.48, 0.1, 0.22], parent: holder,
    })
    group.add(holder)
  }

  // faceted orb the statue sits on
  add(new THREE.IcosahedronGeometry(0.38, 1), lotusMat, { p: [0, 0.64, 0] })

  // ── stylised statue ──
  const statue = new THREE.Group()
  statue.position.y = 1.02
  group.add(statue)

  // body + legs
  add(new THREE.IcosahedronGeometry(0.42, 1), statueMat, { p: [0, 0.32, 0], s: [1, 1.1, 0.82], parent: statue })
  add(new THREE.IcosahedronGeometry(0.2, 1),  statueMat, { p: [-0.3, 0.06, 0.16], s: [1.2, 0.7, 1], parent: statue })
  add(new THREE.IcosahedronGeometry(0.2, 1),  statueMat, { p: [0.3, 0.06, 0.16],  s: [1.2, 0.7, 1], parent: statue })
  // head
  add(new THREE.IcosahedronGeometry(0.27, 1), statueMat, { p: [0, 0.92, 0.02], parent: statue })
  // ears
  add(new THREE.IcosahedronGeometry(0.2, 1), statueMat, { p: [-0.32, 0.95, -0.02], r: [0, 0.35, 0], s: [0.55, 0.9, 0.18], parent: statue })
  add(new THREE.IcosahedronGeometry(0.2, 1), statueMat, { p: [0.32, 0.95, -0.02],  r: [0, -0.35, 0], s: [0.55, 0.9, 0.18], parent: statue })
  // trunk — curled tube
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.92, 0.24),
    new THREE.Vector3(0, 0.74, 0.34),
    new THREE.Vector3(0.09, 0.58, 0.32),
    new THREE.Vector3(0.14, 0.5, 0.2),
  ])
  add(new THREE.TubeGeometry(trunkCurve, 10, 0.06, 6, false), statueMat, { parent: statue })
  // crown
  add(new THREE.ConeGeometry(0.15, 0.26, 8), statueMat, { p: [0, 1.22, 0], parent: statue })
  add(new THREE.IcosahedronGeometry(0.05, 0), statueMat, { p: [0, 1.38, 0], parent: statue })
  // bindi — the one non-crystal accent
  const bindiMat = new THREE.MeshStandardMaterial({ color: '#c01f2e', roughness: 0.35 })
  add(new THREE.SphereGeometry(0.04, 12, 12), bindiMat, { p: [0, 1.08, 0.25], parent: statue })

  return { group, statueMat, lotusMat }
}

export default function Configurator() {
  const mountRef = useRef(null)
  const threeRef = useRef(null)

  const [part, setPart] = useState('statue')       // statue | lotus
  const [mode, setMode] = useState('crystal')      // crystal | finish | presets
  const [config, setConfig] = useState({
    statue: { color: '#eef1f5', finish: 'polished' },
    lotus:  { color: '#f4c6d7', finish: 'polished' },
  })

  // ── Build scene once ──
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#d6d6d8')

    const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.1, 60)
    camera.position.set(3.3, 2.6, 5.6)

    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    const key = new THREE.DirectionalLight('#ffffff', 1.6)
    key.position.set(3, 6, 4)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -3; key.shadow.camera.right = 3
    key.shadow.camera.top = 3;   key.shadow.camera.bottom = -3
    key.shadow.radius = 8
    scene.add(key)
    scene.add(new THREE.AmbientLight('#ffffff', 0.35))

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.16 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const { group, statueMat, lotusMat } = buildShowpiece()
    scene.add(group)

    // shift the projection so the model centres in the strip left of the panel
    const applyViewOffset = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      const panelW = Math.min(440, w * 0.92)
      camera.setViewOffset(w, h, w > 768 ? panelW / 2 : 0, 0, w, h)
    }
    applyViewOffset()

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 0.85, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 2.4
    controls.maxDistance = 8
    controls.maxPolarAngle = Math.PI / 2 - 0.05
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.8

    let raf
    const loop = () => {
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    loop()

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      applyViewOffset()
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    threeRef.current = { renderer, scene, camera, statueMat, lotusMat }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      controls.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      threeRef.current = null
    }
  }, [])

  // ── Apply config to materials ──
  useEffect(() => {
    const t = threeRef.current
    if (!t) return
    const apply = (mat, { color, finish }) => {
      mat.color.set(color).lerp(new THREE.Color("#ffffff"), 0.25)
      mat.attenuationColor.set(color)
      Object.assign(mat, FINISH_PROPS[finish])
    }
    apply(t.statueMat, config.statue)
    apply(t.lotusMat, config.lotus)
  }, [config])

  const setColor  = (hex) => setConfig((c) => ({ ...c, [part]: { ...c[part], color: hex } }))
  const setFinish = (id)  => setConfig((c) => ({ ...c, [part]: { ...c[part], finish: id } }))
  const applyPreset = (p) => setConfig((c) => ({
    statue: { ...c.statue, color: p.statue },
    lotus:  { ...c.lotus,  color: p.lotus },
  }))

  const snapshot = () => {
    const t = threeRef.current
    if (!t) return
    t.renderer.render(t.scene, t.camera)
    const a = document.createElement('a')
    a.href = t.renderer.domElement.toDataURL('image/png')
    a.download = 'zeller-showpiece.png'
    a.click()
  }

  const activeColor  = config[part].color
  const activeFinish = config[part].finish

  const SwatchGroup = ({ title, colors }) => (
    <div className="config-group">
      <h4>{title}</h4>
      <div className="config-swatches">
        {colors.map(({ name, hex }) => (
          <button
            key={name}
            className={`config-swatch ${activeColor === hex ? 'is-active' : ''}`}
            onClick={() => setColor(hex)}
          >
            <span className="config-swatch__chip" style={swatchStyle(hex)} />
            <span className="config-swatch__label">{name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="config-page">
      <div className="config-viewport" ref={mountRef} />

      {/* left chrome */}
      <a className="config-brand" href="#">
        <span className="config-brand__mark">ZELLER</span>
        <span className="config-brand__model">Ganesha Lotus</span>
      </a>
      <div className="config-actions">
        <a className="config-enquire" href="mailto:support@zellercrystals.com?subject=Zeller%20Showpiece%20Enquiry">
          Enquire
        </a>
        <button className="config-iconbtn" title="Save image" onClick={snapshot}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 8h3l2-2.5h6L17 8h3v11H4z" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        </button>
        <a className="config-iconbtn" title="Back to home" href="#">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 12h15M10 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {/* right panel */}
      <aside className="config-panel">
        <div className="config-panel__tabs">
          {['statue', 'lotus'].map((p) => (
            <button key={p} className={part === p ? 'is-active' : ''} onClick={() => setPart(p)}>
              {p === 'statue' ? 'Statue' : 'Lotus'}
            </button>
          ))}
        </div>

        <div className="config-panel__mode">
          {[['crystal', 'Crystal'], ['finish', 'Finish'], ['presets', 'Presets']].map(([id, label]) => (
            <button key={id} className={mode === id ? 'is-active' : ''} onClick={() => setMode(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="config-panel__body">
          {mode === 'crystal' && (
            <>
              <SwatchGroup title="Pastel Crystals" colors={PASTELS} />
              <SwatchGroup title="Precious Crystals" colors={PRECIOUS} />
            </>
          )}

          {mode === 'finish' && (
            <div className="config-group">
              <h4>Surface Finish — {part === 'statue' ? 'Statue' : 'Lotus'}</h4>
              <div className="config-finishes">
                {FINISHES.map((f) => (
                  <button
                    key={f.id}
                    className={`config-finish ${activeFinish === f.id ? 'is-active' : ''}`}
                    onClick={() => setFinish(f.id)}
                  >
                    <span className="config-finish__name">{f.name}</span>
                    <span className="config-finish__desc">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'presets' && (
            <div className="config-group">
              <h4>Signature Pairings</h4>
              <div className="config-swatches">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    className={`config-swatch ${config.lotus.color === p.lotus && config.statue.color === p.statue ? 'is-active' : ''}`}
                    onClick={() => applyPreset(p)}
                  >
                    <span className="config-swatch__chip config-swatch__chip--duo">
                      <span style={swatchStyle(p.statue)} />
                      <span style={swatchStyle(p.lotus)} />
                    </span>
                    <span className="config-swatch__label">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
