import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FBXLoader }       from 'three/addons/loaders/FBXLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js'

/* ──────────────────────────────────────────────────────────
   Vignette — soft radial falloff, edges only
────────────────────────────────────────────────────────── */
const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset:   { value: 0.88 },
    darkness: { value: 0.72 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset, darkness;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 u = (vUv - 0.5) * 2.0;
      float v = clamp(offset - dot(u * 0.5, u * 0.5) * darkness, 0., 1.);
      gl_FragColor = vec4(c.rgb * v, c.a);
    }`,
}

/* ──────────────────────────────────────────────────────────
   Film grain — per-frame random noise, subtle texture
────────────────────────────────────────────────────────── */
const GrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime:    { value: 0   },
    uAmt:     { value: 0.032 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime, uAmt;
    varying vec2 vUv;
    float rand(vec2 n){ return fract(sin(dot(n, vec2(12.9898,4.1414))) * 43758.5453); }
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      float g = rand(vUv + fract(uTime * 0.41)) * uAmt - uAmt * 0.5;
      gl_FragColor = vec4(c.rgb + g, c.a);
    }`,
}

/* ──────────────────────────────────────────────────────────
   Particle shaders — GPU-animated glowing dust
────────────────────────────────────────────────────────── */
const PART_VERT = `
  attribute float aRand;
  attribute vec3  aCol;
  uniform   float uTime;
  varying   vec3  vCol;
  varying   float vAlpha;

  void main() {
    vCol   = aCol;
    vAlpha = 0.12 + 0.88 * aRand;

    vec3 pos = position;

    // Slow orbital drift — each particle at its own phase & speed
    float spd = 0.07 + aRand * 0.10;
    float ang  = uTime * spd + aRand * 6.2832;
    pos.x += sin(ang              ) * 22.0;
    pos.z += cos(ang * 0.83       ) * 18.0;
    pos.y += sin(uTime * 0.13 + aRand * 6.28) * 28.0;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (1100.0 / -mv.z) * (0.5 + aRand * 2.2);
    gl_Position  = projectionMatrix * mv;
  }
`

const PART_FRAG = `
  varying vec3  vCol;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0) discard;
    float soft = 1.0 - pow(r, 0.55);
    gl_FragColor = vec4(vCol, soft * vAlpha);
  }
`

/* ──────────────────────────────────────────────────────────
   Build particle cloud — centred at origin, moved after FBX
────────────────────────────────────────────────────────── */
function makeParticles() {
  const N    = 3200
  const pos  = new Float32Array(N * 3)
  const rand = new Float32Array(N)
  const col  = new Float32Array(N * 3)

  for (let i = 0; i < N; i++) {
    const θ  = Math.random() * Math.PI * 2
    const φ  = Math.acos(2 * Math.random() - 1)
    const rx = 280 + Math.random() * 600
    const ry = 420 + Math.random() * 750
    const rz = 280 + Math.random() * 600

    pos[i * 3]     = rx * Math.sin(φ) * Math.cos(θ)
    pos[i * 3 + 1] = ry * (Math.random() - 0.5)
    pos[i * 3 + 2] = rz * Math.sin(φ) * Math.sin(θ)

    rand[i] = Math.random()

    // 58% amber/orange  42% violet
    if (Math.random() > 0.42) {
      col[i * 3]     = 0.94 + Math.random() * 0.06
      col[i * 3 + 1] = 0.38 + Math.random() * 0.30
      col[i * 3 + 2] = 0.04 + Math.random() * 0.08
    } else {
      col[i * 3]     = 0.38 + Math.random() * 0.32
      col[i * 3 + 1] = 0.06 + Math.random() * 0.10
      col[i * 3 + 2] = 0.72 + Math.random() * 0.28
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos,  3))
  geo.setAttribute('aRand',    new THREE.BufferAttribute(rand, 1))
  geo.setAttribute('aCol',     new THREE.BufferAttribute(col,  3))

  const mat = new THREE.ShaderMaterial({
    vertexShader:   PART_VERT,
    fragmentShader: PART_FRAG,
    uniforms:   { uTime: { value: 0 } },
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
  })

  return new THREE.Points(geo, mat)
}

/* ──────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────── */
export default function CrystalHero({ sectionRef, onReady }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    /* ── Renderer — transparent so CSS gradient shows through ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping         = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3
    renderer.outputColorSpace    = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)

    /* ── Scene ── */
    const scene = new THREE.Scene()

    /* ── Environment map (IBL for glass reflections) ── */
    const pmrem  = new THREE.PMREMGenerator(renderer)
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment          = envMap
    scene.environmentIntensity = 1.0

    /* ── Lights ── */
    // Warm key — upper right, emulates studio spot
    const key = new THREE.DirectionalLight(0xffd8a0, 1.1)
    key.position.set(1.2, 1.4, 0.7)
    scene.add(key)

    // Purple fill — left, atmospheric bleed from background
    const fill = new THREE.DirectionalLight(0x7030e0, 0.65)
    fill.position.set(-1.2, 0.3, 0.6)
    scene.add(fill)

    // Violet rim — from behind, separates chandelier from void
    const rim = new THREE.DirectionalLight(0xc4aee0, 0.75)
    rim.position.set(0.1, 0.7, -1.1)
    scene.add(rim)

    // Deep purple ambient — keeps shadows colourful, not black
    scene.add(new THREE.AmbientLight(0x1c0840, 4.0))

    /* ── Inner glow lights — clustered at chandelier body (updated after FBX) ── */
    const innerLights = [
      new THREE.PointLight(0xffb060, 9,  700),
      new THREE.PointLight(0xff6820, 7,  550),
      new THREE.PointLight(0xff6820, 7,  550),
      new THREE.PointLight(0xffa040, 8,  800),
      new THREE.PointLight(0xff4800, 5,  400),
    ]
    innerLights.forEach(l => scene.add(l))

    /* ── Particles ── */
    const particles = makeParticles()
    scene.add(particles)

    /* ── Camera — oblique low-left start ── */
    const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 20000)
    camera.position.set(-320, 400, 1900)
    camera.lookAt(0, 900, 0)

    let posSpline = null
    let tgtSpline = null
    const tmpPos  = new THREE.Vector3()
    const tmpTgt  = new THREE.Vector3()

    /* ── Chandelier group (allows Y-rotation independent of camera target) ── */
    let chanGroup = null

    /* ── Load FBX ── */
    const loader = new FBXLoader()
    loader.load('/room/Glass_Shell.FBX', (fbx) => {

      const box    = new THREE.Box3().setFromObject(fbx)
      const size   = box.getSize(new THREE.Vector3())
      const centre = box.getCenter(new THREE.Vector3())

      // Normalise to 1000 on largest axis
      const ns = 1000 / Math.max(size.x, size.y, size.z)
      fbx.scale.setScalar(ns)
      fbx.position.set(-centre.x * ns, -box.min.y * ns, -centre.z * ns)

      const sb = new THREE.Box3().setFromObject(fbx)
      const sh = sb.max.y - sb.min.y

      // Lift — mounting hardware exits top, glass body fills viewport
      fbx.position.y += sh * 0.82

      const fb = new THREE.Box3().setFromObject(fbx)
      const fc = fb.getCenter(new THREE.Vector3())
      const fs = fb.getSize(new THREE.Vector3())

      // Glass-body focus point (~lower third of total height)
      const focusY = fb.min.y + fs.y * 0.38

      /* ── Premium glass materials with emissive amber glow ── */
      const baseMat = {
        metalness: 0, roughness: 0.01,
        transmission: 1, transparent: true, ior: 1.55,
        clearcoat: 0.92, clearcoatRoughness: 0.01,
        envMapIntensity: 1.5,
        side: THREE.DoubleSide, flatShading: true,
      }
      const glassMat = new THREE.MeshPhysicalMaterial({
        ...baseMat,
        color:               0xfff4d0,
        thickness:           3.5,
        attenuationColor:    new THREE.Color(0xff6c08),
        attenuationDistance: 2.8,
        emissive:            new THREE.Color(0xff5005),
        emissiveIntensity:   0.55,
      })
      const crystalMat = new THREE.MeshPhysicalMaterial({
        ...baseMat,
        color:               0xffffff,
        thickness:           2.0,
        attenuationColor:    new THREE.Color(0xffe8b8),
        attenuationDistance: 4.5,
        emissive:            new THREE.Color(0xff8830),
        emissiveIntensity:   0.28,
      })

      fbx.traverse((child) => {
        if (!child.isMesh) return
        if (Array.isArray(child.material)) {
          child.material = child.material.map(m =>
            (m?.name || '').toLowerCase().includes('glass2') ? glassMat : crystalMat
          )
        } else {
          child.material = glassMat
        }
      })

      // Wrap in group — group rotates on Y; fbx stays locally straight
      chanGroup = new THREE.Group()
      chanGroup.add(fbx)
      // Shift chandelier right-of-centre — oblique composition
      chanGroup.position.set(160, 0, 0)
      scene.add(chanGroup)

      // Position inner lights around glass body
      const ly = focusY
      const lx = 160  // match chanGroup offset
      ;[
        [lx,       ly,       0,    0],
        [lx + 110, ly - 80,  60,   1],
        [lx - 110, ly - 80, -60,   2],
        [lx,       ly - 200, 0,    3],
        [lx,       ly + 80,  0,    4],
      ].forEach(([x, y, z, idx]) => innerLights[idx].position.set(x, y, z))

      // Centre particle cloud on glass body
      particles.position.set(lx, focusY, 0)

      /* ── Camera spline — oblique orbit ── */
      const cx = lx + fc.x - lx   // == fc.x since fbx centred
      const cy = focusY
      const cz = 0

      // Spline: low-left → right arc → elevated right → high centre → left sweep → low-left
      const posPts = [
        new THREE.Vector3(-320,  cy - 400, 1900),   // 0 oblique low-left — opening frame
        new THREE.Vector3( 750,  cy - 180, 1650),   // 1 sweep right
        new THREE.Vector3( 980,  cy + 260, 1250),   // 2 right elevated
        new THREE.Vector3( 500,  cy + 600, 1500),   // 3 high centre-right
        new THREE.Vector3(-180,  cy + 500, 1700),   // 4 high left
        new THREE.Vector3(-800,  cy - 100, 1450),   // 5 left mid
        new THREE.Vector3(-320,  cy - 400, 1900),   // 6 closed loop — same as 0
      ]

      const tgtPts = [
        new THREE.Vector3(lx,       cy + 80,  cz),   // 0
        new THREE.Vector3(lx + 60,  cy + 20,  cz),   // 1
        new THREE.Vector3(lx + 30,  cy - 60,  cz),   // 2
        new THREE.Vector3(lx,       cy + 100, cz),   // 3
        new THREE.Vector3(lx - 40,  cy + 60,  cz),   // 4
        new THREE.Vector3(lx,       cy,       cz),   // 5
        new THREE.Vector3(lx,       cy + 80,  cz),   // 6
      ]

      posSpline = new THREE.CatmullRomCurve3(posPts, false, 'catmullrom', 0.5)
      tgtSpline = new THREE.CatmullRomCurve3(tgtPts, false, 'catmullrom', 0.5)

      posSpline.getPoint(0, tmpPos)
      tgtSpline.getPoint(0, tmpTgt)
      camera.position.copy(tmpPos)
      camera.lookAt(tmpTgt)

      onReady?.()

    }, undefined, () => onReady?.())

    /* ── Post-processing ── */
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    // Bloom — generous strength so emissive glass halos beautifully
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.35,  // strength
      0.60,  // radius
      0.68   // threshold — catches emissive without blowing neutrals
    ))

    const grainPass = new ShaderPass(GrainShader)
    composer.addPass(grainPass)

    const vigPass = new ShaderPass(VignetteShader)
    composer.addPass(vigPass)

    /* ── Scroll progress ── */
    let rawProgress = 0, smoothProgress = 0
    const onScroll = () => {
      const sec = sectionRef?.current
      if (!sec) return
      rawProgress = Math.max(0, Math.min(1,
        window.scrollY / (sec.offsetHeight - window.innerHeight)
      ))
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    /* ── Render loop ── */
    let time = 0, rafId
    const animate = () => {
      rafId = requestAnimationFrame(animate)
      time  += 0.005
      smoothProgress += (rawProgress - smoothProgress) * 0.026

      // Chandelier slow Y-rotation — model turns, camera orbits both
      if (chanGroup) chanGroup.rotation.y = time * 0.10

      // Particle shader time
      particles.material.uniforms.uTime.value = time

      // Scroll-driven camera orbit
      if (posSpline) {
        posSpline.getPoint(smoothProgress, tmpPos)
        tgtSpline.getPoint(smoothProgress, tmpTgt)

        // Idle micro-drift before user scrolls
        const idle = Math.max(0, 1 - smoothProgress * 8) * 6
        tmpPos.x += Math.sin(time * 0.28) * idle
        tmpPos.y += Math.cos(time * 0.19) * idle * 0.3

        camera.position.lerp(tmpPos, 0.08)
        camera.lookAt(tmpTgt)
      }

      // Inner light flicker — simulates candle/crystal warmth
      innerLights.forEach((l, i) => {
        l.intensity = (l.intensity * 0.92) + ((8 + Math.sin(time * 1.7 + i * 1.1) * 1.2) * 0.08)
      })

      grainPass.uniforms.uTime.value = time

      composer.render()
    }
    animate()

    /* ── Resize ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      envMap.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', zIndex: 1 }}
    />
  )
}
