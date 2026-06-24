import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader }      from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader }     from 'three/addons/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer }  from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }      from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass }      from 'three/addons/postprocessing/ShaderPass.js'

const VignetteShader = {
  uniforms: { tDiffuse: { value: null }, offset: { value: 1.0 }, darkness: { value: 0.35 } },
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

export default function InteriorScene({ sectionRef, onReady }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.48
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = false

    /* ── Scene ── */
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xc8c0b8)
    scene.fog = new THREE.FogExp2(0xc8c0b8, 0.00006)

    /* ── Environment (IBL) ── */
    const pmrem  = new THREE.PMREMGenerator(renderer)
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment          = envMap
    scene.environmentIntensity = 0.5

    /* ── Lights ── */
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.4))

    // Key from above-left — avoids blasting the front-facing sofa
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 0.5)
    keyLight.position.set(1, 6, 2)
    scene.add(keyLight)

    const warmPoint = new THREE.PointLight(0xffb040, 0.5, 2000)
    warmPoint.position.set(0, 400, 0)
    scene.add(warmPoint)

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 60, 100000)
    camera.position.set(0, 200, 2000)

    let posSpline = null
    let tgtSpline = null
    const tmpPos  = new THREE.Vector3()
    const tmpTgt  = new THREE.Vector3()

    /* ── GLTF loader ── */
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')

    const gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)

    gltfLoader.load(
      '/interior-scene/interior_scene.glb',
      (gltf) => {
        const model = gltf.scene

        /* Normalise scale — target longest axis = 4000 units */
        const box    = new THREE.Box3().setFromObject(model)
        const size   = box.getSize(new THREE.Vector3())
        const centre = box.getCenter(new THREE.Vector3())
        const TARGET = 4000
        const scale  = TARGET / Math.max(size.x, size.y, size.z)
        model.scale.setScalar(scale)

        model.position.set(
          -centre.x * scale,
          -box.min.y * scale,
          -centre.z * scale,
        )

        model.traverse((child) => {
          child.castShadow    = false
          child.receiveShadow = false
          if (!child.isMesh) return

          // Fix any red/wrong-coloured emissives — remap to warm amber
          const mats = Array.isArray(child.material) ? child.material : [child.material]
          mats.forEach(mat => {
            if (!mat) return
            const nm = child.name.toLowerCase()

          // Architectural side panels (polySurface138-143) — darken to stop bloom bleed
          if (/polysurface(138|139|141|142|143)/.test(nm)) {
            mat.color?.multiplyScalar(0.55)
            if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.9)
            mat.transmission = 0
            mat.transparent = false
            mat.opacity = 1.0
          }

          // Sofa / mattress — warm greige, not pure white
          if (nm.includes('sofa') || nm.includes('matress')) {
            mat.color?.set(0xb8b4ae)
            if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.75)
          }

          // Blanket — light brown / camel
          if (nm === 'polysurface144') {
            mat.color?.set(0xc4956a)
            if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.80)
          }


          // Hide inner bulb filament geometry (causes z-fighting inside glass globes)
          if (nm.includes('bulb')) {
            child.visible = false
            return
          }

          if (mat.emissive && mat.emissiveIntensity > 0) {
              // Clamp physical-lux exports
              if (mat.emissiveIntensity > 1.0) mat.emissiveIntensity = 0.8
              // Remap red/dominant emissives → warm amber chandelier glow
              if (mat.emissive.r > 0.3) {
                mat.emissive.set(0xffb347)
                mat.emissiveIntensity = 0.9
              }
            }
            // Kill any glass/frosted transmission materials so camera doesn't clip through panels
            if (mat.transmission > 0) {
              mat.transmission = 0
              mat.roughness = Math.max(mat.roughness, 0.5)
            }
            if (mat.transparent && mat.opacity < 0.95) {
              mat.transparent = false
              mat.opacity = 1.0
            }
          })
        })

        scene.add(model)
        model.updateMatrixWorld(true)

        /* Recalculate bounding box in world space */
        const placed  = new THREE.Box3().setFromObject(model)
        const pSize   = placed.getSize(new THREE.Vector3())
        const pCentre = placed.getCenter(new THREE.Vector3())
        const pH      = pSize.y

        /* Reposition pendant light — at chandelier position */
        const cx = pCentre.x
        const cz = pCentre.z
        warmPoint.position.set(cx, pH * 0.78, cz)
        warmPoint.distance = pH * 0.6

        /* Second fill light — softer, wider — lifts the room from below */
        const fillLight = new THREE.PointLight(0xffd080, 1.2, pH * 1.1)
        fillLight.position.set(cx, pH * 0.72, cz)
        scene.add(fillLight)

        /* ── Camera: room reveal → chandelier orbit ── */
        const roomEye = pH * 0.27

        // Orbit stays in the front half of the room — angles ±75° from front
        // so the camera never pushes into back walls or outside the space
        const orbitR = Math.min(pSize.x, pSize.z) * 0.38
        const orbitH = pH * 0.42
        const lookH  = pH * 0.76

        // Sweep: right-front → front → left-front → left-side (all safe inside room)
        const a0 =  Math.PI * 0.42   // start right-front
        const a1 =  Math.PI * 0.18
        const a2 =  0.0              // dead-front
        const a3 = -Math.PI * 0.22
        const a4 = -Math.PI * 0.44   // end left-front

        const posPts = [
          // — Room reveal (t 0 → 0.38) —
          new THREE.Vector3(cx + pSize.x*0.28, roomEye,      placed.max.z * 0.70),
          new THREE.Vector3(cx + pSize.x*0.10, roomEye*1.05, cz + pSize.z*0.18),
          new THREE.Vector3(cx - pSize.x*0.02, roomEye*1.1,  cz + pSize.z*0.04),
          // — Chandelier arc (t 0.38 → 1): front-arc only, inside the room —
          new THREE.Vector3(cx + Math.sin(a0)*orbitR, orbitH,       cz + Math.cos(a0)*orbitR),
          new THREE.Vector3(cx + Math.sin(a1)*orbitR, orbitH*1.02,  cz + Math.cos(a1)*orbitR),
          new THREE.Vector3(cx + Math.sin(a2)*orbitR, orbitH*1.035, cz + Math.cos(a2)*orbitR),
          new THREE.Vector3(cx + Math.sin(a3)*orbitR, orbitH*1.02,  cz + Math.cos(a3)*orbitR),
          new THREE.Vector3(cx + Math.sin(a4)*orbitR, orbitH,       cz + Math.cos(a4)*orbitR),
        ]
        const tgtPts = [
          new THREE.Vector3(cx - pSize.x*0.12, roomEye*0.70, cz - pSize.z*0.18),
          new THREE.Vector3(cx - pSize.x*0.06, roomEye*0.75, cz - pSize.z*0.10),
          new THREE.Vector3(cx,                lookH*0.52,   cz - pSize.z*0.04),
          new THREE.Vector3(cx + pSize.x*0.010, lookH,       cz - pSize.z*0.010),
          new THREE.Vector3(cx + pSize.x*0.006, lookH*0.99,  cz - pSize.z*0.006),
          new THREE.Vector3(cx,                 lookH,        cz),
          new THREE.Vector3(cx - pSize.x*0.006, lookH*0.99,  cz - pSize.z*0.006),
          new THREE.Vector3(cx - pSize.x*0.010, lookH,       cz - pSize.z*0.010),
        ]

        posSpline = new THREE.CatmullRomCurve3(posPts, false, 'catmullrom', 0.5)
        tgtSpline = new THREE.CatmullRomCurve3(tgtPts, false, 'catmullrom', 0.5)

        posSpline.getPoint(0, tmpPos)
        tgtSpline.getPoint(0, tmpTgt)
        camera.position.copy(tmpPos)
        camera.lookAt(tmpTgt)

        onReady?.()
      },
      undefined,
      (err) => {
        console.error('GLB load error:', err)
        onReady?.()
      }
    )

    /* ── Post-processing ── */
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    composer.addPass(new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.08, 0.25, 0.96
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
        const drift = Math.max(0, 1 - smoothProgress * 6) * 2
        tmpPos.x += Math.sin(time * 0.4) * drift
        tmpPos.y += Math.cos(time * 0.28) * drift * 0.3
      }

      camera.position.copy(tmpPos)
      camera.lookAt(tmpTgt)

      warmPoint.intensity = 2.8 + Math.sin(time * 2.1) * 0.5 + Math.sin(time * 3.7) * 0.2

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
