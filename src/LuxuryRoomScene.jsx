import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FBXLoader }       from 'three/addons/loaders/FBXLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js'

const VignetteShader = {
  uniforms: { tDiffuse: { value: null }, offset: { value: 1.0 }, darkness: { value: 0.45 } },
  vertexShader:   `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float offset,darkness; varying vec2 vUv;
    void main(){
      vec4 c=texture2D(tDiffuse,vUv);
      vec2 u=(vUv-0.5)*2.0;
      float v=clamp(offset-dot(u*0.5,u*0.5)*darkness,0.,1.);
      gl_FragColor=vec4(c.rgb*v,c.a);
    }`,
}

function createNightSkyTexture() {
  const w = 4096, h = 2048
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')

  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0.00, '#010008')
  grad.addColorStop(0.40, '#080520')
  grad.addColorStop(0.70, '#110930')
  grad.addColorStop(0.88, '#1e0f3a')
  grad.addColorStop(1.00, '#2a1248')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Stars
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * w
    const y = Math.random() * h * 0.72
    const r = Math.random() * 1.4 + 0.2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${0.35 + Math.random() * 0.65})`
    ctx.fill()
  }

  // Moon
  const mx = w * 0.72, my = h * 0.18
  const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 90)
  mg.addColorStop(0,   'rgba(255,250,215,1)')
  mg.addColorStop(0.28,'rgba(255,246,200,0.85)')
  mg.addColorStop(0.65,'rgba(220,210,170,0.2)')
  mg.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = mg
  ctx.fillRect(0, 0, w, h)

  // City glow on horizon
  const cg = ctx.createRadialGradient(w * 0.5, h * 0.87, 0, w * 0.5, h * 0.87, w * 0.55)
  cg.addColorStop(0,   'rgba(160,70,20,0.28)')
  cg.addColorStop(0.5, 'rgba(100,35,10,0.12)')
  cg.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = cg
  ctx.fillRect(0, 0, w, h)

  // City lights
  for (let i = 0; i < 1200; i++) {
    const x = Math.random() * w
    const y = h * 0.72 + Math.random() * h * 0.28
    const r = Math.random() * 2.5 + 0.5
    const warm = Math.random() > 0.35
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = warm
      ? `rgba(255,200,120,${0.4 + Math.random() * 0.6})`
      : `rgba(180,200,255,${0.3 + Math.random() * 0.5})`
    ctx.fill()
  }

  return new THREE.CanvasTexture(canvas)
}

function createMarbleTexture() {
  const size = 2048
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')

  // Dark base
  const bg = ctx.createLinearGradient(0, 0, size, size)
  bg.addColorStop(0,   '#0e0d12')
  bg.addColorStop(0.5, '#131118')
  bg.addColorStop(1,   '#0c0b10')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  // Veins — multiple passes
  const passes = [
    { count: 18, alpha: [0.08, 0.14], lw: [1.5, 3.5], color: [160, 110, 40] },
    { count: 28, alpha: [0.04, 0.09], lw: [0.5, 2.0], color: [100, 80,  60] },
    { count: 40, alpha: [0.02, 0.05], lw: [0.3, 0.8], color: [200, 160, 80] },
  ]

  passes.forEach(({ count, alpha, lw, color: [r, g, b] }) => {
    for (let i = 0; i < count; i++) {
      ctx.beginPath()
      let x = Math.random() * size
      let y = Math.random() * size
      ctx.moveTo(x, y)
      const steps = 6 + Math.floor(Math.random() * 8)
      for (let s = 0; s < steps; s++) {
        x += (Math.random() - 0.5) * 280
        y += (Math.random() - 0.5) * 180
        const cx = x + (Math.random() - 0.5) * 140
        const cy = y + (Math.random() - 0.5) * 100
        ctx.quadraticCurveTo(cx, cy, x, y)
      }
      const a = alpha[0] + Math.random() * (alpha[1] - alpha[0])
      const w = lw[0] + Math.random() * (lw[1] - lw[0])
      ctx.strokeStyle = `rgba(${r},${g},${b},${a})`
      ctx.lineWidth = w
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  })

  return new THREE.CanvasTexture(canvas)
}

// Room constants
const W  = 3000   // width  (x: -1500 to +1500)
const D  = 4000   // depth  (z: -2000 to +2000)
const H  = 1200   // height (y: 0 to 1200)
const ZF = D / 2  // +2000 — window wall (front)
const ZB = -D / 2 // -2000 — back wall

export default function LuxuryRoomScene({ sectionRef, onReady }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = false
    renderer.setClearColor(0x010008, 1)

    /* ── Scene ── */
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0a0820, 0.000065)

    /* ── Environment ── */
    const pmrem  = new THREE.PMREMGenerator(renderer)
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment          = envMap
    scene.environmentIntensity = 0.6

    /* ── Night sky sphere (visible through glass) ── */
    const skyTex = createNightSkyTexture()
    const skyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(18000, 48, 24),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
    )
    scene.add(skyMesh)

    /* ── Materials ── */
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0d0b14, roughness: 0.92, metalness: 0.0,
    })

    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x0a0810, roughness: 0.95,
    })

    const marbleTex = createMarbleTexture()
    marbleTex.wrapS = marbleTex.wrapT = THREE.RepeatWrapping
    marbleTex.repeat.set(5, 7)
    const floorMat = new THREE.MeshStandardMaterial({
      map: marbleTex, roughness: 0.04, metalness: 0.05, envMapIntensity: 1.4,
    })

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xc8a050, metalness: 0.92, roughness: 0.12, envMapIntensity: 1.5,
    })

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x8899cc,
      metalness: 0, roughness: 0.0,
      transmission: 0.93, transparent: true, opacity: 1,
      ior: 1.52, thickness: 8,
      attenuationColor: new THREE.Color(0x7788bb),
      attenuationDistance: 80,
      envMapIntensity: 0.4,
      side: THREE.DoubleSide, depthWrite: false,
    })

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x1a1525, roughness: 0.7,
    })

    /* ── Floor ── */
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, 0, 0)
    scene.add(floor)

    /* ── Ceiling ── */
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(0, H, 0)
    scene.add(ceil)

    /* ── Back wall ── */
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat)
    backWall.position.set(0, H / 2, ZB)
    scene.add(backWall)

    /* ── Side walls ── */
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat)
    leftWall.rotation.y = Math.PI / 2
    leftWall.position.set(-W / 2, H / 2, 0)
    scene.add(leftWall)

    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat)
    rightWall.rotation.y = -Math.PI / 2
    rightWall.position.set(W / 2, H / 2, 0)
    scene.add(rightWall)

    /* ── Window wall — 3 floor-to-ceiling panels ── */
    const NUM_WIN  = 3
    const FRAME_W  = 28    // mullion width
    const FRAME_V  = 22    // top/bottom rail height
    const WIN_H    = H - FRAME_V * 2
    const WIN_W    = (W - FRAME_W * (NUM_WIN + 1)) / NUM_WIN

    // Gold sill & header rails
    const sill = new THREE.Mesh(new THREE.BoxGeometry(W, FRAME_V, 22), goldMat)
    sill.position.set(0, FRAME_V / 2, ZF)
    scene.add(sill)

    const header = new THREE.Mesh(new THREE.BoxGeometry(W, FRAME_V, 22), goldMat)
    header.position.set(0, H - FRAME_V / 2, ZF)
    scene.add(header)

    // Vertical mullions
    for (let i = 0; i <= NUM_WIN; i++) {
      const x = -W / 2 + i * (WIN_W + FRAME_W) + FRAME_W / 2
      const mullion = new THREE.Mesh(new THREE.BoxGeometry(FRAME_W, WIN_H, 22), goldMat)
      mullion.position.set(x, FRAME_V + WIN_H / 2, ZF)
      scene.add(mullion)
    }

    // Glass panels
    for (let i = 0; i < NUM_WIN; i++) {
      const x = -W / 2 + FRAME_W + i * (WIN_W + FRAME_W) + WIN_W / 2
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W - 2, WIN_H - 2), glassMat)
      glass.position.set(x, FRAME_V + WIN_H / 2, ZF - 2)
      scene.add(glass)
    }

    // Thin wall pieces flanking the window wall (left/right edges)
    const edgeL = new THREE.Mesh(new THREE.BoxGeometry(FRAME_W, H, 22), trimMat)
    edgeL.position.set(-W / 2 + FRAME_W / 2, H / 2, ZF)
    // already covered by mullion loop above

    /* ── Wainscoting / baseboard trim along walls ── */
    const baseH = 60
    const baseMat = new THREE.MeshStandardMaterial({ color: 0xb89040, metalness: 0.8, roughness: 0.2 })

    // Back wall baseboard
    const baseBk = new THREE.Mesh(new THREE.BoxGeometry(W, baseH, 10), baseMat)
    baseBk.position.set(0, baseH / 2, ZB + 5)
    scene.add(baseBk)

    // Side wall baseboards
    const baseLt = new THREE.Mesh(new THREE.BoxGeometry(D, baseH, 10), baseMat)
    baseLt.rotation.y = Math.PI / 2
    baseLt.position.set(-W / 2 + 5, baseH / 2, 0)
    scene.add(baseLt)

    const baseRt = new THREE.Mesh(new THREE.BoxGeometry(D, baseH, 10), baseMat)
    baseRt.rotation.y = -Math.PI / 2
    baseRt.position.set(W / 2 - 5, baseH / 2, 0)
    scene.add(baseRt)

    /* ── Crown molding on ceiling ── */
    const crownMat = new THREE.MeshStandardMaterial({ color: 0xa07830, metalness: 0.7, roughness: 0.25 })
    const crownH = 40

    const crownBk = new THREE.Mesh(new THREE.BoxGeometry(W, crownH, 10), crownMat)
    crownBk.position.set(0, H - crownH / 2, ZB + 5)
    scene.add(crownBk)

    const crownLt = new THREE.Mesh(new THREE.BoxGeometry(D, crownH, 10), crownMat)
    crownLt.rotation.y = Math.PI / 2
    crownLt.position.set(-W / 2 + 5, H - crownH / 2, 0)
    scene.add(crownLt)

    const crownRt = new THREE.Mesh(new THREE.BoxGeometry(D, crownH, 10), crownMat)
    crownRt.rotation.y = -Math.PI / 2
    crownRt.position.set(W / 2 - 5, H - crownH / 2, 0)
    scene.add(crownRt)

    /* ── Simple furniture suggestions ── */
    const darkFabric = new THREE.MeshStandardMaterial({ color: 0x1a1520, roughness: 0.88, metalness: 0.0 })
    const darkGlass  = new THREE.MeshPhysicalMaterial({
      color: 0x0a0a10, roughness: 0.05, metalness: 0.1,
      transmission: 0.6, transparent: true, ior: 1.5,
    })

    // Sofa — left side of room
    const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(700, 90, 260), darkFabric)
    sofaBase.position.set(-550, 45, -500)
    scene.add(sofaBase)

    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(700, 220, 70), darkFabric)
    sofaBack.position.set(-550, 110 + 45, -630)
    scene.add(sofaBack)

    const sofaArm1 = new THREE.Mesh(new THREE.BoxGeometry(70, 160, 260), darkFabric)
    sofaArm1.position.set(-195, 80, -500)
    scene.add(sofaArm1)

    const sofaArm2 = new THREE.Mesh(new THREE.BoxGeometry(70, 160, 260), darkFabric)
    sofaArm2.position.set(-905, 80, -500)
    scene.add(sofaArm2)

    // Coffee table
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(440, 12, 200), darkGlass)
    tableTop.position.set(-550, 200, -300)
    scene.add(tableTop)

    const tableLeg1 = new THREE.Mesh(new THREE.BoxGeometry(18, 200, 18), goldMat)
    tableLeg1.position.set(-370, 100, -220)
    scene.add(tableLeg1)

    const tableLeg2 = new THREE.Mesh(new THREE.BoxGeometry(18, 200, 18), goldMat)
    tableLeg2.position.set(-730, 100, -220)
    scene.add(tableLeg2)

    const tableLeg3 = new THREE.Mesh(new THREE.BoxGeometry(18, 200, 18), goldMat)
    tableLeg3.position.set(-370, 100, -380)
    scene.add(tableLeg3)

    const tableLeg4 = new THREE.Mesh(new THREE.BoxGeometry(18, 200, 18), goldMat)
    tableLeg4.position.set(-730, 100, -380)
    scene.add(tableLeg4)

    // Floor lamp — right side
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(40, 55, 18, 12), goldMat)
    lampBase.position.set(900, 9, -800)
    scene.add(lampBase)

    const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 800, 8), goldMat)
    lampPole.position.set(900, 400, -800)
    scene.add(lampPole)

    const lampShade = new THREE.Mesh(new THREE.CylinderGeometry(100, 70, 120, 16, 1, true), new THREE.MeshStandardMaterial({
      color: 0xffe8b0, roughness: 0.7, side: THREE.DoubleSide, emissive: 0xffa040, emissiveIntensity: 0.15,
    }))
    lampShade.position.set(900, 850, -800)
    scene.add(lampShade)

    /* ── Lights ── */
    // Moonlight from outside
    const moonLight = new THREE.DirectionalLight(0x8090c8, 0.35)
    moonLight.position.set(0.6, 0.8, 1)
    scene.add(moonLight)

    // Ambient inside
    scene.add(new THREE.AmbientLight(0x120e20, 2.2))

    // Warm lamp glow
    const lampPoint = new THREE.PointLight(0xff9040, 6, 1400)
    lampPoint.position.set(900, 820, -800)
    scene.add(lampPoint)

    // Second lamp left
    const lamp2Point = new THREE.PointLight(0xff8030, 5, 1200)
    lamp2Point.position.set(-1100, 700, -1200)
    scene.add(lamp2Point)

    // Chandelier position light (filled after FBX loads)
    const chanLight = new THREE.PointLight(0xffecc8, 12, 3000)
    chanLight.position.set(0, H * 0.55, -800)
    scene.add(chanLight)

    // Subtle fill from front (simulates moonlight through windows)
    const fillLight = new THREE.DirectionalLight(0x6070a0, 0.25)
    fillLight.position.set(0, 0.5, 1)
    scene.add(fillLight)

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.5, 25000)
    camera.position.set(0, 600, ZF + 1600)
    camera.lookAt(0, 500, ZF)

    let posSpline = null
    let tgtSpline = null
    const tmpPos = new THREE.Vector3()
    const tmpTgt = new THREE.Vector3()

    /* ── Camera spline — defined once (no FBX dependency) ── */
    const posPts = [
      new THREE.Vector3(0,    620, ZF + 1700),  // 0 outside — full window view
      new THREE.Vector3(80,   680, ZF + 900),   // 1 close to glass
      new THREE.Vector3(120,  740, ZF - 100),   // 2 just passed through
      new THREE.Vector3(180,  780, ZF - 800),   // 3 entering room
      new THREE.Vector3(100,  820, ZF - 1600),  // 4 mid-room
      new THREE.Vector3(0,    750, ZF - 2400),  // 5 approaching chandelier zone
      new THREE.Vector3(-80,  620, ZF - 2900),  // 6 near chandelier
      new THREE.Vector3(0,    480, ZF - 3000),  // 7 under chandelier looking up
    ]

    const tgtPts = [
      new THREE.Vector3(0,    540, ZF - 200),   // 0 looking at windows
      new THREE.Vector3(0,    580, ZF - 800),   // 1
      new THREE.Vector3(80,   650, ZF - 1600),  // 2
      new THREE.Vector3(100,  700, ZF - 2200),  // 3
      new THREE.Vector3(0,    730, ZF - 2800),  // 4
      new THREE.Vector3(-40,  900, ZF - 3000),  // 5 start looking up
      new THREE.Vector3(0,   1050, ZF - 3000),  // 6 looking at chandelier
      new THREE.Vector3(0,   1080, ZF - 2900),  // 7 chandelier overhead
    ]

    posSpline = new THREE.CatmullRomCurve3(posPts, false, 'catmullrom', 0.5)
    tgtSpline = new THREE.CatmullRomCurve3(tgtPts, false, 'catmullrom', 0.5)

    posSpline.getPoint(0, tmpPos)
    tgtSpline.getPoint(0, tmpTgt)
    camera.position.copy(tmpPos)
    camera.lookAt(tmpTgt)

    /* ── Load chandelier FBX ── */
    const fbxLoader = new FBXLoader()
    fbxLoader.load('/room/Glass_Shell.FBX', (fbx) => {

      const box    = new THREE.Box3().setFromObject(fbx)
      const size   = box.getSize(new THREE.Vector3())
      const centre = box.getCenter(new THREE.Vector3())

      const normScale = 900 / Math.max(size.x, size.y, size.z)
      fbx.scale.setScalar(normScale)

      fbx.position.set(
        -centre.x * normScale,
        -box.min.y * normScale,
        -centre.z * normScale
      )

      const scaledBox  = new THREE.Box3().setFromObject(fbx)
      const scaledH    = scaledBox.max.y - scaledBox.min.y

      // Hang from ceiling — top of chandelier at ceiling
      fbx.position.y += H - scaledH
      // Center deep in room
      fbx.position.z = -800

      // Glass material
      const glassChanMat = new THREE.MeshPhysicalMaterial({
        color: 0xfff8e8, metalness: 0, roughness: 0.01,
        transmission: 1, transparent: true, ior: 1.55,
        thickness: 3, attenuationColor: new THREE.Color(0xff9820),
        attenuationDistance: 4, clearcoat: 0.9, clearcoatRoughness: 0.01,
        envMapIntensity: 1.4, side: THREE.DoubleSide, flatShading: true,
      })
      const crystalMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff, metalness: 0, roughness: 0.01,
        transmission: 1, transparent: true, ior: 1.55,
        thickness: 2, attenuationColor: new THREE.Color(0xf0f4ff),
        attenuationDistance: 5, clearcoat: 0.9, clearcoatRoughness: 0.01,
        envMapIntensity: 1.4, side: THREE.DoubleSide, flatShading: true,
      })

      fbx.traverse((child) => {
        if (!child.isMesh) return
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) =>
            (m?.name || '').toLowerCase().includes('glass2') ? glassChanMat : crystalMat
          )
        } else {
          child.material = glassChanMat
        }
      })

      scene.add(fbx)
      onReady?.()

    }, undefined, () => { onReady?.() })

    /* ── Post-processing ── */
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.28, 0.38, 0.94
    ))
    composer.addPass(new ShaderPass(VignetteShader))

    /* ── Scroll ── */
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
      time += 0.004
      smoothProgress += (rawProgress - smoothProgress) * 0.025

      if (posSpline) {
        posSpline.getPoint(smoothProgress, tmpPos)
        tgtSpline.getPoint(smoothProgress, tmpTgt)

        // Subtle idle drift at rest
        const drift = Math.max(0, 1 - smoothProgress * 5) * 4
        tmpPos.x += Math.sin(time * 0.38) * drift
        tmpPos.y += Math.cos(time * 0.25) * drift * 0.25
      }

      camera.position.copy(tmpPos)
      camera.lookAt(tmpTgt)

      // Gentle lamp flicker
      chanLight.intensity = 12 + Math.sin(time * 2.3) * 0.8

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
