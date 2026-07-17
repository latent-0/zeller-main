import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'

// ── Palettes ──────────────────────────────────────────────────────────────────
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
const FINISH_PROPS = {
  polished: { roughness: 0.02, transmission: 1,    iridescence: 0 },
  frosted:  { roughness: 0.45, transmission: 0.65, iridescence: 0 },
  aurora:   { roughness: 0.04, transmission: 0.95, iridescence: 1 },
}
const PRODUCTS = [
  { id: 'ganesha', name: 'Ganesha Lotus',  subtitle: 'Sacred crystal figurine' },
  { id: 'bloom',   name: 'Crystal Bloom',  subtitle: 'Faceted crystal flower'   },
  { id: 'oyster',  name: 'Pearl Oyster',   subtitle: 'Crystal clam with pearl'  },
]
const PEARL_COLORS = [
  { name: 'Ivory',     hex: '#f0e8d5' },
  { name: 'Champagne', hex: '#d4b896' },
  { name: 'Rose',      hex: '#e8c4bc' },
  { name: 'Silver',    hex: '#d4d8dc' },
]
// Maps each Ganesha part tab to its FBX file
const GANESHA_FILE = {
  statue: '/models/C2_Fixed.fbx',
  lotus:  '/models/C3_Lotus_Fixed.fbx',
}

// ── Material helpers ──────────────────────────────────────────────────────────
const applyCrystalColor = (mat, hex) => {
  const c = new THREE.Color(hex)
  mat.color.copy(c).lerp(new THREE.Color('#ffffff'), 0.78)
  mat.attenuationColor.copy(c)
  const { l } = c.getHSL({})
  mat.attenuationDistance = 0.3 + l * 2.6
}

const mkCrystal = (hex) => {
  const mat = new THREE.MeshPhysicalMaterial({
    metalness: 0, roughness: 0.02,
    transmission: 1, thickness: 1.4, ior: 1.56,
    dispersion: 0.38,
    clearcoat: 1, clearcoatRoughness: 0.02,
    specularIntensity: 1.5, envMapIntensity: 2.5,
    iridescenceIOR: 1.7, flatShading: true,
  })
  applyCrystalColor(mat, hex)
  return mat
}

const mkPearl = (hex = '#f0e8d5') => new THREE.MeshPhysicalMaterial({
  color: new THREE.Color(hex),
  roughness: 0.07, metalness: 0.04,
  transmission: 0.08, thickness: 0.3, ior: 1.45,
  iridescence: 0.55, iridescenceIOR: 1.32,
  clearcoat: 0.85, clearcoatRoughness: 0.04,
  flatShading: false,
})

const swatchStyle = (hex) => ({
  background: `linear-gradient(150deg,
    color-mix(in srgb, ${hex} 45%, white) 0%,
    ${hex} 55%,
    color-mix(in srgb, ${hex} 72%, black) 100%)`,
})

// mesh helper used inside all builders
function makeAdder(group) {
  return function add(geo, mat, { p = [0,0,0], r = [0,0,0], s = [1,1,1], parent = group } = {}) {
    const m = new THREE.Mesh(geo, mat)
    m.position.set(...p); m.rotation.set(...r); m.scale.set(...s)
    m.castShadow = true
    parent.add(m)
    return m
  }
}

// ── CRYSTAL BLOOM ─────────────────────────────────────────────────────────────
function buildBloom() {
  const bloomMat  = mkCrystal('#f4c6d7')
  const centerMat = mkCrystal('#eef1f5')

  const group = new THREE.Group()
  const add   = makeAdder(group)

  // Thin base disc
  add(new THREE.CylinderGeometry(0.62, 0.68, 0.08, 12), bloomMat, { p: [0, 0.04, 0] })

  // Outer petals — 6 large rounded faceted drops
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const g = new THREE.Group(); g.rotation.y = a; group.add(g)
    add(new THREE.IcosahedronGeometry(0.8, 2), bloomMat, {
      p: [0.60, 0.28, 0], r: [0, 0, -1.35], s: [0.72, 0.115, 0.46], parent: g
    })
  }

  // Inner accent petals — 6 smaller, upright
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + (Math.PI / 6)
    const g = new THREE.Group(); g.rotation.y = a; group.add(g)
    add(new THREE.IcosahedronGeometry(0.55, 2), bloomMat, {
      p: [0.36, 0.42, 0], r: [0, 0, -0.70], s: [0.52, 0.10, 0.32], parent: g
    })
  }

  // Faceted centre orb (the clear crystal bead at the heart)
  add(new THREE.IcosahedronGeometry(0.32, 3), centerMat, { p: [0, 0.38, 0] })

  return { group, bloomMat, centerMat }
}

// ── PEARL OYSTER ──────────────────────────────────────────────────────────────
function buildOyster() {
  const shellMat = mkCrystal('#eef1f5')
  const pearlMat = mkPearl('#f0e8d5')

  const group = new THREE.Group()
  const add   = makeAdder(group)

  // Low display base
  add(new THREE.CylinderGeometry(0.36, 0.40, 0.06, 14), shellMat, { p: [0, 0.03, 0] })

  // ── Lower shell — wide, flat, faceted ──
  add(new THREE.IcosahedronGeometry(1.10, 3), shellMat, {
    p: [0, 0.24, 0.04], s: [1.28, 0.30, 1.05]
  })
  add(new THREE.IcosahedronGeometry(1.0, 2), shellMat, {
    p: [0, 0.14, 0.10], s: [1.20, 0.115, 0.96]
  })
  add(new THREE.IcosahedronGeometry(0.35, 1), shellMat, {
    p: [0, 0.20, -0.72], s: [0.9, 0.40, 0.40]
  })
  for (let i = -1; i <= 1; i++) {
    add(new THREE.IcosahedronGeometry(0.8, 2), shellMat, {
      p: [i * 0.38, 0.20, 0.08], s: [0.18, 0.22, 0.90]
    })
  }

  // ── Upper shell — smaller, angled back (open clam position) ──
  add(new THREE.IcosahedronGeometry(0.90, 3), shellMat, {
    p: [0, 0.42, -0.52], r: [-0.90, 0, 0], s: [1.12, 0.24, 0.88]
  })
  add(new THREE.IcosahedronGeometry(0.82, 2), shellMat, {
    p: [0, 0.36, -0.30], r: [-0.90, 0, 0], s: [1.00, 0.10, 0.80]
  })

  // ── Pearl — sits nestled in the lower shell ──
  add(new THREE.SphereGeometry(0.26, 36, 28), pearlMat, { p: [0, 0.44, 0.16] })

  return { group, shellMat, pearlMat }
}

// ── Configurator component ────────────────────────────────────────────────────
export default function Configurator() {
  const mountRef  = useRef(null)
  const threeRef  = useRef(null)

  const [product,       setProduct]       = useState('ganesha')
  const [part,          setPart]          = useState('statue')
  const [mode,          setMode]          = useState('crystal')
  const [sceneReady,    setSceneReady]    = useState(false)
  const [ganeshLoading, setGaneshLoading] = useState(false)
  const fbxCacheRef = useRef({})
  const [config,  setConfig]  = useState({
    ganesha: {
      statue: { color: '#eef1f5', finish: 'polished' },
      lotus:  { color: '#f4c6d7', finish: 'polished' },
    },
    bloom: {
      bloom:  { color: '#f4c6d7', finish: 'polished' },
      center: { color: '#eef1f5', finish: 'polished' },
    },
    oyster: {
      shell: { color: '#eef1f5', finish: 'polished' },
      pearl: { color: '#f0e8d5', finish: 'polished' },
    },
  })

  // ── Build scene once ──────────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mount.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#1c1c21')
    scene.fog = new THREE.Fog('#1c1c21', 9, 22)

    const camera = new THREE.PerspectiveCamera(32, mount.clientWidth / mount.clientHeight, 0.1, 60)
    camera.position.set(3.5, 2.4, 7.5)

    const pmrem = new THREE.PMREMGenerator(renderer)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

    const key = new THREE.DirectionalLight('#ffffff', 2.4)
    key.position.set(3, 7, 4)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.left = -4; key.shadow.camera.right = 4
    key.shadow.camera.top  =  4; key.shadow.camera.bottom = -4
    key.shadow.radius = 10
    scene.add(key)
    scene.add(new THREE.AmbientLight('#ffffff', 0.3))
    const rimA = new THREE.PointLight('#bcd4ff', 50, 25)
    rimA.position.set(-4, 3, -3); scene.add(rimA)
    const rimB = new THREE.PointLight('#ffe1b8', 35, 25)
    rimB.position.set(4, 1.5, -2.5); scene.add(rimB)
    const top = new THREE.PointLight('#ffffff', 18, 20)
    top.position.set(0, 8, 0); scene.add(top)
    const front = new THREE.PointLight('#e8f0ff', 28, 18)
    front.position.set(0, 3, 8); scene.add(front)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.95, envMapIntensity: 0.12 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Ganesha: empty group + shared crystal materials (FBX loaded separately)
    const ganeshGroup  = new THREE.Group()
    const ganeshaStatueMat = mkCrystal('#eef1f5')
    const ganeshaLotusMat  = mkCrystal('#f4c6d7')
    scene.add(ganeshGroup)

    const bloom  = buildBloom()
    const oyster = buildOyster()
    bloom.group.visible  = false
    oyster.group.visible = false
    scene.add(bloom.group)
    scene.add(oyster.group)

    const applyViewOffset = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      const panelW = Math.min(440, w * 0.92)
      camera.setViewOffset(w, h, w > 768 ? panelW / 2 : 0, 0, w, h)
    }
    applyViewOffset()

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1.5, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.minDistance = 2.4
    controls.maxDistance = 9
    controls.maxPolarAngle = Math.PI / 2 - 0.04
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.7

    let raf
    const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop) }
    loop()

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      applyViewOffset(); camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    threeRef.current = {
      renderer, scene, camera, controls, pmrem,
      ganesha: { group: ganeshGroup, statueMat: ganeshaStatueMat, lotusMat: ganeshaLotusMat },
      bloom, oyster,
    }
    setSceneReady(true)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      controls.dispose(); pmrem.dispose(); renderer.dispose()
      mount.removeChild(renderer.domElement)
      threeRef.current = null
    }
  }, [])

  // ── Load FBX when Ganesha part tab changes (statue→C2, lotus→C3) ─────────
  useEffect(() => {
    if (!sceneReady || product !== 'ganesha') return
    const t = threeRef.current
    if (!t) return

    const filePath   = GANESHA_FILE[part] ?? GANESHA_FILE.statue
    const ganeshGroup = t.ganesha.group
    const cache       = fbxCacheRef.current

    // Hide all cached wrappers
    Object.values(cache).forEach(w => { w.visible = false })

    // Already loaded — just show it
    if (cache[filePath]) {
      cache[filePath].visible = true
      return
    }

    // Load fresh
    let cancelled = false
    setGaneshLoading(true)

    const loader = new FBXLoader()
    loader.load(filePath, (obj) => {
      if (cancelled) return

      // The FBX may contain multiple instances in a row — keep only the first child
      const extra = obj.children.slice(1)
      extra.forEach(c => obj.remove(c))

      // Auto-normalise: fit inside a ~3-unit cube, sit at y=0, centre x/z
      const box = new THREE.Box3().setFromObject(obj)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale  = 3.0 / maxDim

      const wrapper = new THREE.Group()
      wrapper.add(obj)
      wrapper.scale.setScalar(scale)
      wrapper.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)

      // Assign crystal material: lotus file → lotusMat on all; statue file → statueMat on all
      // (single-part files have no split needed)
      const mat = part === 'lotus' ? t.ganesha.lotusMat : t.ganesha.statueMat
      obj.traverse(child => {
        if (!child.isMesh) return
        child.castShadow = true
        child.receiveShadow = true
        child.material = mat
      })

      cache[filePath] = wrapper
      ganeshGroup.add(wrapper)
      setGaneshLoading(false)
    }, undefined, err => {
      if (!cancelled) { console.error('FBX error:', err); setGaneshLoading(false) }
    })

    return () => { cancelled = true }
  }, [sceneReady, product, part])

  // ── Switch product ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = threeRef.current
    if (!t) return
    t.ganesha.group.visible = product === 'ganesha'
    t.bloom.group.visible   = product === 'bloom'
    t.oyster.group.visible  = product === 'oyster'

    const targets   = { ganesha: [0, 1.5, 0],  bloom: [0, 0.32, 0], oyster: [0, 0.36, 0] }
    const positions = { ganesha: [3.5, 2.4, 7.5], bloom: [1.8, 1.0, 4.0], oyster: [2.4, 1.2, 5.0] }
    t.controls.target.set(...targets[product])
    t.camera.position.set(...positions[product])
    t.controls.update()
  }, [product])

  // ── Apply config to materials ─────────────────────────────────────────────
  useEffect(() => {
    const t = threeRef.current
    if (!t) return

    const applyMat = (mat, { color, finish }) => {
      applyCrystalColor(mat, color)
      Object.assign(mat, FINISH_PROPS[finish])
      mat.needsUpdate = true
    }

    if (product === 'ganesha') {
      applyMat(t.ganesha.statueMat, config.ganesha.statue)
      applyMat(t.ganesha.lotusMat,  config.ganesha.lotus)
    }
    if (product === 'bloom') {
      applyMat(t.bloom.bloomMat,  config.bloom.bloom)
      applyMat(t.bloom.centerMat, config.bloom.center)
    }
    if (product === 'oyster') {
      applyMat(t.oyster.shellMat, config.oyster.shell)
      const c = new THREE.Color(config.oyster.pearl.color)
      t.oyster.pearlMat.color.copy(c)
      t.oyster.pearlMat.needsUpdate = true
    }
  }, [config, product])

  const setColor  = (hex) =>
    setConfig(c => ({ ...c, [product]: { ...c[product], [part]: { ...c[product][part], color: hex } } }))
  const setFinish = (id) =>
    setConfig(c => ({ ...c, [product]: { ...c[product], [part]: { ...c[product][part], finish: id } } }))

  const snapshot = () => {
    const t = threeRef.current; if (!t) return
    t.renderer.render(t.scene, t.camera)
    const a = document.createElement('a')
    a.href = t.renderer.domElement.toDataURL('image/png')
    a.download = `zeller-${product}.png`; a.click()
  }

  // Parts available per product
  const PARTS = {
    ganesha: [{ id: 'statue', label: 'Statue' }, { id: 'lotus',  label: 'Lotus'  }],
    bloom:   [{ id: 'bloom',  label: 'Bloom'  }, { id: 'center', label: 'Centre' }],
    oyster:  [{ id: 'shell',  label: 'Shell'  }, { id: 'pearl',  label: 'Pearl'  }],
  }

  const activeParts   = PARTS[product]
  const activeConfig  = config[product][part] ?? config[product][activeParts[0].id]
  const activePart    = activeParts.find(p => p.id === part) ? part : activeParts[0].id

  const isOysterPearl = product === 'oyster' && activePart === 'pearl'

  const SwatchGroup = ({ title, colors }) => (
    <div className="config-group">
      <h4>{title}</h4>
      <div className="config-swatches">
        {colors.map(({ name, hex }) => (
          <button
            key={name}
            className={`config-swatch ${activeConfig.color === hex ? 'is-active' : ''}`}
            onClick={() => setColor(hex)}
          >
            <span className="config-swatch__chip" style={swatchStyle(hex)} />
            <span className="config-swatch__label">{name}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const currentProduct = PRODUCTS.find(p => p.id === product)

  return (
    <div className="config-page">
      <div className="config-viewport" ref={mountRef}>
        {ganeshLoading && product === 'ganesha' && (
          <div className="config-loading">
            <div className="config-loading__ring" />
            <p>Loading model…</p>
          </div>
        )}
      </div>

      {/* left chrome */}
      <a className="config-brand" href="#">
        <span className="config-brand__mark">ZELLER</span>
        <span className="config-brand__model">{currentProduct.name}</span>
      </a>
      <div className="config-actions">
        <a className="config-enquire" href={`mailto:support@zellercrystals.com?subject=Zeller%20${encodeURIComponent(currentProduct.name)}%20Enquiry`}>
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

        {/* Product selector */}
        <div className="config-panel__products">
          {PRODUCTS.map(p => (
            <button
              key={p.id}
              className={`config-product-btn ${product === p.id ? 'is-active' : ''}`}
              onClick={() => { setProduct(p.id); setPart(PARTS[p.id][0].id) }}
            >
              <span className="config-product-btn__name">{p.name}</span>
              <span className="config-product-btn__sub">{p.subtitle}</span>
            </button>
          ))}
        </div>

        <div className="config-panel__tabs">
          {activeParts.map(({ id, label }) => (
            <button key={id} className={activePart === id ? 'is-active' : ''} onClick={() => setPart(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="config-panel__mode">
          {[['crystal', 'Crystal'], ['finish', 'Finish']].map(([id, label]) => (
            <button key={id} className={mode === id ? 'is-active' : ''} onClick={() => setMode(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="config-panel__body">
          {mode === 'crystal' && (
            isOysterPearl ? (
              <SwatchGroup title="Pearl Tones" colors={PEARL_COLORS} />
            ) : (
              <>
                <SwatchGroup title="Pastel Crystals"   colors={PASTELS}  />
                <SwatchGroup title="Precious Crystals" colors={PRECIOUS} />
              </>
            )
          )}

          {mode === 'finish' && !isOysterPearl && (
            <div className="config-group">
              <h4>Surface Finish</h4>
              <div className="config-finishes">
                {FINISHES.map((f) => (
                  <button
                    key={f.id}
                    className={`config-finish ${activeConfig.finish === f.id ? 'is-active' : ''}`}
                    onClick={() => setFinish(f.id)}
                  >
                    <span className="config-finish__name">{f.name}</span>
                    <span className="config-finish__desc">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'finish' && isOysterPearl && (
            <div className="config-group">
              <p style={{ color: 'var(--config-muted, #888)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                Pearl surface is naturally satin with iridescent overtones —<br />no finish options for pearl.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
