import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { FBXLoader }        from 'three/addons/loaders/FBXLoader.js'
import { RoomEnvironment }  from 'three/addons/environments/RoomEnvironment.js'
import { EffectComposer }   from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }       from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass }  from 'three/addons/postprocessing/UnrealBloomPass.js'
import { ShaderPass }       from 'three/addons/postprocessing/ShaderPass.js'

/* ── Gentle vignette — edges only ── */
const VignetteShader = {
  uniforms: { tDiffuse: { value: null }, offset: { value: 1.0 }, darkness: { value: 0.55 } },
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

/* ── Aurora background GLSL ── */
const AURORA_VERT = `
void main() {
  gl_Position = vec4(position.xy, 1.0, 1.0);
}`

const AURORA_FRAG = `
precision highp float;
uniform float uTime;
uniform vec2  uResolution;

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t  = uTime * 0.35;

  // Single wavy horizontal aurora ribbon
  // Wave shape: layered sines for organic undulation
  float wave = 0.48
    + 0.045 * sin(uv.x * 2.1  + t * 0.9)
    + 0.028 * sin(uv.x * 4.7  + t * 1.4 + 1.2)
    + 0.018 * sin(uv.x * 9.3  + t * 2.1 + 2.5)
    + 0.010 * sin(uv.x * 17.0 + t * 3.0 + 0.8);

  // Gaussian vertical falloff from wave centre
  float dist  = uv.y - wave;
  float thickness = 0.055 + 0.020 * sin(uv.x * 3.2 + t * 0.7);  // varies along x
  float band  = exp(-dist * dist / (2.0 * thickness * thickness));

  // Color: blend SideRays colors along x — #EAB308 (amber) ↔ #96c8ff (blue)
  vec3 amber = vec3(0.918, 0.702, 0.031);
  vec3 blue  = vec3(0.588, 0.784, 1.000);
  float blend = 0.5 + 0.5 * sin(uv.x * 2.4 + t * 0.5);
  vec3 col = mix(amber, blue, blend);

  // Subtle brightness flicker along the ribbon
  float flicker = 0.7 + 0.3 * sin(uv.x * 6.0 + t * 2.2) * sin(uv.x * 2.3 - t * 1.1);
  float intensity = band * flicker * 0.72;

  gl_FragColor = vec4(col * intensity, 1.0);
}`

export default function RoomScene({ sectionRef, onReady }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.shadowMap.enabled = false
    renderer.setClearColor(0x1a0d2e, 1)

    /* ── Scene ── */
    const scene = new THREE.Scene()
    scene.background = null  // aurora plane handles the background

    /* ── Aurora background plane (commented out) ── */
    // const auroraUniforms = {
    //   uTime:       { value: 0 },
    //   uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    // }
    // const auroraMesh = new THREE.Mesh(
    //   new THREE.PlaneGeometry(2, 2),
    //   new THREE.ShaderMaterial({
    //     uniforms:       auroraUniforms,
    //     vertexShader:   AURORA_VERT,
    //     fragmentShader: AURORA_FRAG,
    //     depthTest:  false,
    //     depthWrite: false,
    //   })
    // )
    // auroraMesh.renderOrder = -1
    // auroraMesh.frustumCulled = false
    // scene.add(auroraMesh)

    /* ── Environment map (for glass IBL reflections) ── */
    const pmrem  = new THREE.PMREMGenerator(renderer)
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment          = envMap
    scene.environmentIntensity = 0.8

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 20000)
    camera.position.set(0, 200, 1800)
    camera.lookAt(0, 0, 0)

    // CatmullRom spline camera — filled after FBX loads
    let posSpline = null  // THREE.CatmullRomCurve3 for camera position
    let tgtSpline = null  // THREE.CatmullRomCurve3 for look-at target

    const tmpPos = new THREE.Vector3()
    const tmpTgt = new THREE.Vector3()

    function evalCam(t) {
      if (!posSpline) return
      posSpline.getPoint(t, tmpPos)
      tgtSpline.getPoint(t, tmpTgt)
    }

    /* ── Post-processing ── */
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.20, 0.45, 0.96
    )
    composer.addPass(bloom)

    const vignette = new ShaderPass(VignetteShader)
    composer.addPass(vignette)

    /* ── Glass material — amber translucent ── */
    const glassMat = new THREE.MeshPhysicalMaterial({
      color:               0xfff0d0,
      metalness:           0,
      roughness:           0.02,
      transmission:        1,
      transparent:         true,
      ior:                 1.55,
      thickness:           3.5,
      attenuationColor:    new THREE.Color(0xff8820),
      attenuationDistance: 3,
      clearcoat:           0.8,
      clearcoatRoughness:  0.02,
      envMapIntensity:     1.2,
      side:                THREE.DoubleSide,
      flatShading:         true,
    })

    /* ── Crystal material — clear glass ── */
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color:               0xffffff,
      metalness:           0,
      roughness:           0.02,
      transmission:        1,
      transparent:         true,
      ior:                 1.55,
      thickness:           2.0,
      attenuationColor:    new THREE.Color(0xf0f5ff),
      attenuationDistance: 4,
      clearcoat:           0.8,
      clearcoatRoughness:  0.02,
      envMapIntensity:     1.2,
      side:                THREE.DoubleSide,
      flatShading:         true,
    })

    /* ── Lights ── */
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 0.9)
    keyLight.position.set(0.3, 1.0, 0.5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xe8f0ff, 0.45)
    fillLight.position.set(-0.9, 0.3, 0.5)
    scene.add(fillLight)

    scene.add(new THREE.AmbientLight(0xfff0d8, 0.35))

    // Backlight to illuminate glass from behind — makes transmission visible
    const backLight = new THREE.PointLight(0xffe8c0, 2.5, 3000)
    backLight.position.set(0, 600, -800)
    scene.add(backLight)

    // Top rim light — catches the chains and top glass
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6)
    rimLight.position.set(0, 1, -0.8)
    scene.add(rimLight)

    /* ── Load FBX — no filtering, no clipping; show full chandelier ── */
    const fbxLoader = new FBXLoader()
    fbxLoader.load('/room/Glass_Shell.FBX', (fbx) => {

      const box    = new THREE.Box3().setFromObject(fbx)
      const size   = box.getSize(new THREE.Vector3())
      const centre = box.getCenter(new THREE.Vector3())

      // Normalize: largest dimension → 1000 units
      const normScale = 1000 / Math.max(size.x, size.y, size.z)
      fbx.scale.setScalar(normScale)

      // Centre on X/Z
      fbx.position.set(
        -centre.x * normScale,
        -box.min.y * normScale,
        -centre.z * normScale
      )

      const scaledBox  = new THREE.Box3().setFromObject(fbx)
      const scaledSize = scaledBox.getSize(new THREE.Vector3())

      // Lift so chains emerge from the TOP of the viewport —
      // mounting hardware goes off-screen at top, glass body fills frame
      fbx.position.y += scaledSize.y * 0.82

      // Final bounding box
      const finalBox    = new THREE.Box3().setFromObject(fbx)
      const finalCentre = finalBox.getCenter(new THREE.Vector3())
      const finalSize   = finalBox.getSize(new THREE.Vector3())

      // Apply materials to ALL meshes (no visibility filter)
      fbx.traverse((child) => {
        if (!child.isMesh) return

        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => {
            const mn = (m?.name || '').toLowerCase()
            return mn.includes('glass2') ? glassMat : crystalMat
          })
        } else {
          child.material = glassMat
        }
      })

      scene.add(fbx)

      /* ── CatmullRom spline camera ── */
      const cx = finalCentre.x
      const cy = finalCentre.y
      const cz = finalCentre.z
      const R  = finalSize.x * 0.5   // chandelier half-width
      const H  = finalSize.y

      // Glass body focus height — middle of the glass leaves
      const gy = finalBox.min.y + H * 0.38

      // Orbit helper: cylindrical coords (angle in radians, radius, height offset)
      const orb = (ang, rad, dy) => new THREE.Vector3(
        cx + Math.sin(ang) * rad,
        gy + dy,
        cz + Math.cos(ang) * rad
      )

      // ── Position spline: macro close → orbit 270° around → pull back ──
      // Angles: 0 = front, positive = clockwise when viewed from above
      const posPts = [
        orb(0.00,  R * 1.1,   H * 0.05),  // 0  macro front — almost touching glass
        orb(0.45,  R * 1.6,   H * 0.12),  // 1  ease out right, rising
        orb(1.05,  R * 2.2,   H * 0.08),  // 2  right flank, medium distance
        orb(1.65,  R * 2.8,  -H * 0.05),  // 3  sweeping right-back, drop low
        orb(2.30,  R * 2.4,  -H * 0.14),  // 4  behind, low angle looking up
        orb(3.00,  R * 2.0,  -H * 0.08),  // 5  left flank
        orb(3.70,  R * 1.8,   H * 0.04),  // 6  front-left, easing back in
        orb(4.20,  R * 1.5,   H * 0.18),  // 7  elevated front — grand reveal
      ]

      // ── Target spline: always near glass body centre, drifts subtly ──
      const tgtPts = [
        new THREE.Vector3(cx,            gy + H*0.06,  cz),  // 0 centre
        new THREE.Vector3(cx + R*0.15,   gy + H*0.04,  cz),  // 1 slight right
        new THREE.Vector3(cx + R*0.10,   gy,           cz),  // 2
        new THREE.Vector3(cx,            gy - H*0.08,  cz),  // 3 dip — under-belly
        new THREE.Vector3(cx - R*0.08,   gy - H*0.10,  cz),  // 4 low rear target
        new THREE.Vector3(cx - R*0.12,   gy,           cz),  // 5
        new THREE.Vector3(cx - R*0.05,   gy + H*0.04,  cz),  // 6
        new THREE.Vector3(cx,            gy + H*0.10,  cz),  // 7 elevated finish
      ]

      posSpline = new THREE.CatmullRomCurve3(posPts, false, 'catmullrom', 0.5)
      tgtSpline = new THREE.CatmullRomCurve3(tgtPts, false, 'catmullrom', 0.5)

      // Initialise camera at t=0
      posSpline.getPoint(0, tmpPos)
      tgtSpline.getPoint(0, tmpTgt)
      camera.position.copy(tmpPos)
      camera.lookAt(tmpTgt)

      onReady?.()

    }, undefined, () => { onReady?.() })

    /* ── Scroll ── */
    let rawProgress = 0, smoothProgress = 0
    const onScroll = () => {
      const sec = sectionRef.current; if (!sec) return
      rawProgress = Math.max(0, Math.min(1,
        window.scrollY / (sec.offsetHeight - window.innerHeight)
      ))
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    /* ── Render loop ── */
    let time = 0, rafId

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      time += 0.005
      smoothProgress += (rawProgress - smoothProgress) * 0.028  // slower smoothing = more cinematic

      // auroraUniforms.uTime.value = time

      if (posSpline) {
        evalCam(smoothProgress)

        // Subtle organic drift at the start (fades as user scrolls in)
        const drift = Math.max(0, 1 - smoothProgress * 4) * 3
        tmpPos.x += Math.sin(time * 0.41) * drift
        tmpPos.y += Math.cos(time * 0.27) * drift * 0.3
      }

      camera.position.copy(tmpPos)
      camera.lookAt(tmpTgt)
      composer.render()
    }
    animate()

    /* ── Resize ── */
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      composer.setSize(window.innerWidth, window.innerHeight)
      bloom.resolution.set(window.innerWidth, window.innerHeight)
      // auroraUniforms.uResolution.value.set(
      //   window.innerWidth  * renderer.getPixelRatio(),
      //   window.innerHeight * renderer.getPixelRatio()
      // )
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
