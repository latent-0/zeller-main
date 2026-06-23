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
    renderer.setClearColor(0x05080f, 1)

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
    scene.environmentIntensity = 0.35

    /* ── Camera ── */
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 20000)
    camera.position.set(0, 200, 1800)
    camera.lookAt(0, 0, 0)

    const camStart = new THREE.Vector3()
    const camEnd   = new THREE.Vector3()
    const tgtStart = new THREE.Vector3()
    const tgtEnd   = new THREE.Vector3()

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
      color:               0xffffff,
      metalness:           0,
      roughness:           0.018,
      transmission:        1,
      transparent:         false,
      ior:                 1.62,
      thickness:           2.8,
      dispersion:          0.32,
      attenuationColor:    new THREE.Color(0xff8820),
      attenuationDistance: 5,
      clearcoat:           0.5,
      clearcoatRoughness:  0.04,
      envMapIntensity:     0.3,
      side:                THREE.FrontSide,
      flatShading:         true,
      depthWrite:          true,
    })

    /* ── Crystal material — clear glass ── */
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color:               0xffffff,
      metalness:           0,
      roughness:           0.018,
      transmission:        1,
      transparent:         false,
      ior:                 1.62,
      thickness:           1.8,
      dispersion:          0.32,
      attenuationColor:    new THREE.Color(0xf5f9ff),
      attenuationDistance: 5,
      clearcoat:           0.5,
      clearcoatRoughness:  0.04,
      envMapIntensity:     0.3,
      side:                THREE.FrontSide,
      flatShading:         true,
      depthWrite:          true,
    })

    /* ── Lights ── */
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 0.9)
    keyLight.position.set(0.3, 1.0, 0.5)
    scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xe8f0ff, 0.45)
    fillLight.position.set(-0.9, 0.3, 0.5)
    scene.add(fillLight)

    scene.add(new THREE.AmbientLight(0xfff0d8, 0.35))

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

      /* ── Camera: look at lower glass body; chains hang off the top ── */
      const dist = finalSize.y * 1.5
      // Look at 32% from bottom — glass body center, chains go off top
      const lookY = finalBox.min.y + finalSize.y * 0.32

      camStart.set(finalCentre.x + finalSize.x * 0.05, lookY + finalSize.y * 0.04, finalCentre.z + dist)
      camEnd.set  (finalCentre.x - finalSize.x * 0.08, lookY - finalSize.y * 0.10, finalCentre.z + dist * 0.35)
      tgtStart.set(finalCentre.x, lookY, finalCentre.z)
      tgtEnd.set  (finalCentre.x, lookY + finalSize.y * 0.04, finalCentre.z)

      camera.position.copy(camStart)
      camera.lookAt(tgtStart)

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
    const tmpPos = new THREE.Vector3(), tmpTgt = new THREE.Vector3()
    let time = 0, rafId

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      time += 0.005
      smoothProgress += (rawProgress - smoothProgress) * 0.04

      // auroraUniforms.uTime.value = time

      tmpPos.lerpVectors(camStart, camEnd, smoothProgress)
      tmpTgt.lerpVectors(tgtStart, tgtEnd, smoothProgress)

      const drift = (1 - smoothProgress) * 7
      tmpPos.x += Math.sin(time * 0.52) * drift
      tmpPos.y += Math.cos(time * 0.39) * drift * 0.25

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
