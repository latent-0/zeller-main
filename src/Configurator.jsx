import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

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

// ── GANESHA LOTUS ─────────────────────────────────────────────────────────────
function buildGanesha() {
  const statueMat = mkCrystal('#eef1f5')
  const lotusMat  = mkCrystal('#f4c6d7')

  const group = new THREE.Group()
  const add   = makeAdder(group)

  // ── Lotus base ──
  add(new THREE.CylinderGeometry(1.90, 2.00, 0.08, 24), lotusMat, { p: [0, 0.04, 0] })
  add(new THREE.CylinderGeometry(0.88, 0.98, 0.10, 18), lotusMat, { p: [0, 0.09, 0] })

  const pGeo = new THREE.IcosahedronGeometry(1, 1)

  // Outer petals — 16, wide & flat, fanning out horizontally
  for (let i = 0; i < 16; i++) {
    const h = new THREE.Group(); h.rotation.y = (i / 16) * Math.PI * 2; group.add(h)
    add(pGeo, lotusMat, { p: [1.52, 0.10, 0], r: [0, 0, -0.12], s: [1.05, 0.068, 0.58], parent: h })
  }
  // Middle petals — 12, more upright
  for (let i = 0; i < 12; i++) {
    const h = new THREE.Group(); h.rotation.y = (i / 12) * Math.PI * 2 + Math.PI / 12; group.add(h)
    add(pGeo, lotusMat, { p: [1.00, 0.26, 0], r: [0, 0, -0.44], s: [0.82, 0.072, 0.46], parent: h })
  }
  // Inner petals — 8, cupping upward
  for (let i = 0; i < 8; i++) {
    const h = new THREE.Group(); h.rotation.y = (i / 8) * Math.PI * 2 + Math.PI / 8; group.add(h)
    add(pGeo, lotusMat, { p: [0.64, 0.44, 0], r: [0, 0, -0.80], s: [0.60, 0.076, 0.32], parent: h })
  }

  // Large central faceted orb — Ganesha's seat
  add(new THREE.IcosahedronGeometry(0.56, 2), lotusMat, { p: [0, 0.72, 0] })

  // ── Ganesha statue ──
  const statue = new THREE.Group()
  statue.position.y = 1.28   // top of orb: 0.72 + 0.56
  group.add(statue)

  // Cross-legged lap base
  add(new THREE.IcosahedronGeometry(0.44, 1), statueMat, { p: [0, -0.04, 0.06], s: [1.55, 0.40, 1.15], parent: statue })
  // Body — round pot-belly, detail 1 keeps faces large enough to transmit light
  add(new THREE.IcosahedronGeometry(0.50, 1), statueMat, { p: [0, 0.32, 0], s: [1.05, 1.0, 0.90], parent: statue })
  // Belly protrusion forward
  add(new THREE.IcosahedronGeometry(0.28, 1), statueMat, { p: [0, 0.22, 0.38], s: [0.95, 0.80, 0.55], parent: statue })

  // 4 arms — detail 0 = fewer, brighter faces
  add(new THREE.IcosahedronGeometry(0.17, 0), statueMat, { p: [-0.52, 0.46, 0.02], s: [0.80, 0.55, 0.60], parent: statue })
  add(new THREE.IcosahedronGeometry(0.17, 0), statueMat, { p: [0.52, 0.46, 0.02],  s: [0.80, 0.55, 0.60], parent: statue })
  add(new THREE.IcosahedronGeometry(0.12, 0), statueMat, { p: [-0.48, 0.18, 0.22], parent: statue })
  add(new THREE.IcosahedronGeometry(0.12, 0), statueMat, { p: [0.48, 0.18, 0.22],  parent: statue })

  // Neck
  add(new THREE.IcosahedronGeometry(0.16, 0), statueMat, { p: [0, 0.65, 0.02], s: [0.70, 0.60, 0.58], parent: statue })

  // Head — large domed elephant skull, detail 1
  add(new THREE.IcosahedronGeometry(0.36, 1), statueMat, { p: [0, 0.90, 0], s: [1.10, 1.05, 0.95], parent: statue })
  // Elephant muzzle — projects prominently forward from lower face
  add(new THREE.IcosahedronGeometry(0.26, 1), statueMat, { p: [0, 0.80, 0.34], s: [0.88, 0.80, 0.78], parent: statue })

  // EARS — CylinderGeometry disc rotated so flat cap faces face the viewer.
  // Thin IcosahedronGeometry ears (prev approach) had 162 edge-on micro-faces → all dark.
  // A cylinder with r:[π/2,0,0] puts its 10 cap triangles facing ±Z (toward camera) → bright.
  // s:[0.90, 1.0, 1.22] stretches Y (world-Y after rotation) to make a taller oval ear.
  const earGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.10, 10)
  add(earGeo, statueMat, { p: [-0.62, 0.92, 0.06], r: [Math.PI / 2, 0,  0.08], s: [0.90, 1.0, 1.22], parent: statue })
  add(earGeo, statueMat, { p: [0.62, 0.92, 0.06],  r: [Math.PI / 2, 0, -0.08], s: [0.90, 1.0, 1.22], parent: statue })

  // Trunk — drops from muzzle tip and curls
  const trunkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.00, 0.80, 0.52),
    new THREE.Vector3(0.02, 0.66, 0.60),
    new THREE.Vector3(0.08, 0.52, 0.56),
    new THREE.Vector3(0.14, 0.38, 0.44),
    new THREE.Vector3(0.16, 0.24, 0.28),
  ])
  add(new THREE.TubeGeometry(trunkCurve, 14, 0.09, 7, false), statueMat, { parent: statue })

  // Crown — tiered mukut: stacked frustum rings shrinking toward top
  add(new THREE.CylinderGeometry(0.22, 0.26, 0.10, 10), statueMat, { p: [0, 1.26, 0], parent: statue })
  add(new THREE.CylinderGeometry(0.16, 0.20, 0.09,  9), statueMat, { p: [0, 1.36, 0], parent: statue })
  add(new THREE.CylinderGeometry(0.10, 0.14, 0.08,  8), statueMat, { p: [0, 1.45, 0], parent: statue })
  add(new THREE.IcosahedronGeometry(0.07, 0),            statueMat, { p: [0, 1.55, 0], parent: statue })

  // Bindi
  const bindiMat = new THREE.MeshStandardMaterial({ color: '#c01f2e', roughness: 0.35 })
  add(new THREE.SphereGeometry(0.04, 12, 12), bindiMat, { p: [0, 0.97, 0.40], parent: statue })

  return { group, statueMat, lotusMat }
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
  // Main body of the lower shell
  add(new THREE.IcosahedronGeometry(1.10, 3), shellMat, {
    p: [0, 0.24, 0.04], s: [1.28, 0.30, 1.05]
  })
  // Shell rim / lip (thicker at edge)
  add(new THREE.IcosahedronGeometry(1.0, 2), shellMat, {
    p: [0, 0.14, 0.10], s: [1.20, 0.115, 0.96]
  })
  // Hinge ridge at back
  add(new THREE.IcosahedronGeometry(0.35, 1), shellMat, {
    p: [0, 0.20, -0.72], s: [0.9, 0.40, 0.40]
  })
  // Shell ribbing — subtle ridges
  for (let i = -1; i <= 1; i++) {
    add(new THREE.IcosahedronGeometry(0.8, 2), shellMat, {
      p: [i * 0.38, 0.20, 0.08], s: [0.18, 0.22, 0.90]
    })
  }

  // ── Upper shell — smaller, angled back (open clam position) ──
  add(new THREE.IcosahedronGeometry(0.90, 3), shellMat, {
    p: [0, 0.42, -0.52], r: [-0.90, 0, 0], s: [1.12, 0.24, 0.88]
  })
  // Upper shell lip
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

  const [product, setProduct] = useState('ganesha')
  const [part,    setPart]    = useState('statue')   // per-product active part
  const [mode,    setMode]    = useState('crystal')
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
    // Top sparkle
    const top = new THREE.PointLight('#ffffff', 18, 20)
    top.position.set(0, 8, 0); scene.add(top)
    // Front fill — illuminates crystal from camera side so transmission reads as clarity, not dark
    const front = new THREE.PointLight('#e8f0ff', 28, 18)
    front.position.set(0, 3, 8); scene.add(front)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.MeshStandardMaterial({ color: '#1a1a1e', roughness: 0.95, envMapIntensity: 0.12 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const ganesha = buildGanesha()
    const bloom   = buildBloom()
    const oyster  = buildOyster()

    bloom.group.visible  = false
    oyster.group.visible = false

    scene.add(ganesha.group)
    scene.add(bloom.group)
    scene.add(oyster.group)

    const applyViewOffset = () => {
      const w = mount.clientWidth, h = mount.clientHeight
      const panelW = Math.min(440, w * 0.92)
      camera.setViewOffset(w, h, w > 768 ? panelW / 2 : 0, 0, w, h)
    }
    applyViewOffset()

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, 1.20, 0)
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

    threeRef.current = { renderer, scene, camera, controls, pmrem, ganesha, bloom, oyster }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      controls.dispose(); pmrem.dispose(); renderer.dispose()
      mount.removeChild(renderer.domElement)
      threeRef.current = null
    }
  }, [])

  // ── Switch product ────────────────────────────────────────────────────────
  useEffect(() => {
    const t = threeRef.current
    if (!t) return
    t.ganesha.group.visible = product === 'ganesha'
    t.bloom.group.visible   = product === 'bloom'
    t.oyster.group.visible  = product === 'oyster'

    // Adjust camera target & position per product
    const targets   = { ganesha: [0, 1.20, 0], bloom: [0, 0.32, 0], oyster: [0, 0.36, 0] }
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
      // Pearl uses a different material type — just recolor it
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
      <div className="config-viewport" ref={mountRef} />

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
