import React, { useEffect, useRef } from 'react'
import { loadThree, prefersReducedMotion } from './three-lazy.js'

// A small golden 3D star that flies in, settles with an overshoot ease, then
// gently sways. Mounts at a fixed ~160px box on the island-complete screen.
// Renders nothing under prefers-reduced-motion or if WebGL fails — the DOM
// mini-confetti + star emoji cover those cases.

const SIZE = 160

export default function Star3D() {
  const mountRef = useRef(null)
  const reduced = prefersReducedMotion()

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || reduced) return undefined
    let disposed = false
    let renderer = null
    let raf = 0

    loadThree().then((THREE) => {
      if (disposed || !mountRef.current) return
      const el = mountRef.current
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
      } catch {
        return // WebGL unavailable: DOM fallback covers it
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(SIZE, SIZE)
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50)
      camera.position.set(0, 0, 7)

      const shape = new THREE.Shape()
      const R = 1.55, r = 0.64
      for (let i = 0; i < 10; i += 1) {
        const ang = Math.PI / 2 + (i * Math.PI) / 5
        const rad = i % 2 === 0 ? R : r
        const px = Math.cos(ang) * rad, py = Math.sin(ang) * rad
        if (i === 0) shape.moveTo(px, py)
        else shape.lineTo(px, py)
      }
      shape.closePath()
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.45, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 2,
      })
      geo.center()
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf5b942, metalness: 0.55, roughness: 0.32,
        emissive: 0x8a5200, emissiveIntensity: 0.28,
      })
      const star = new THREE.Mesh(geo, mat)
      scene.add(star)
      scene.add(new THREE.AmbientLight(0xffffff, 0.85))
      const key = new THREE.DirectionalLight(0xffffff, 1.5)
      key.position.set(4, 6, 8)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0x9fd0ff, 0.6)
      rim.position.set(-5, -2, 4)
      scene.add(rim)

      const started = performance.now()
      const tick = () => {
        if (disposed) return
        raf = requestAnimationFrame(tick)
        const t = (performance.now() - started) / 1000
        const s = Math.min(1, t / 0.75)
        const ease = 1 + 2.4 * Math.pow(s - 1, 3) + 1.4 * Math.pow(s - 1, 2) // overshoot settle
        star.scale.setScalar(Math.max(0.001, ease))
        star.position.y = Math.max(0, 2.6 * (1 - s))
        star.rotation.z = Math.sin(t * 0.8) * 0.22
        star.rotation.y = Math.sin(t * 0.5) * 0.38
        renderer.render(scene, camera)
      }
      tick()

      el._star3dCleanup = () => {
        cancelAnimationFrame(raf)
        geo.dispose()
        mat.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
      }
    }).catch(() => { /* decorative; fail silently to the DOM fallback */ })

    return () => {
      disposed = true
      const el = mountRef.current
      if (el && el._star3dCleanup) {
        try { el._star3dCleanup() } catch { /* noop */ }
        el._star3dCleanup = null
      }
    }
  }, [reduced])

  if (reduced) return null
  return <div ref={mountRef} className="nlv-star3d" style={{ width: SIZE, height: SIZE }} aria-hidden="true" />
}
