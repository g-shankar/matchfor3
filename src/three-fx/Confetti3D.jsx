import React, { useEffect, useRef } from 'react'
import { loadThree, prefersReducedMotion } from './three-lazy.js'

// Full-screen 3D confetti burst. Pass a new non-zero fireKey to launch a
// burst of instanced 3D confetti with gravity, tumbling, and fade-out.

const COLORS = [0xff7657, 0xf3b53f, 0x5dbf78, 0x5c9ee8, 0x9b78dc, 0xfff176, 0xffffff]
const COUNT = 170

export default function Confetti3D({ fireKey }) {
  const mountRef = useRef(null)
  const fireRef = useRef(fireKey)
  fireRef.current = fireKey

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    let disposed = false
    let renderer = null
    let raf = 0
    const reduced = prefersReducedMotion()

    loadThree().then((THREE) => {
      if (disposed || !mountRef.current) return
      const el = mountRef.current
      const w = () => window.innerWidth
      const h = () => window.innerHeight

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(w(), h())
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, w() / h(), 0.1, 100)
      camera.position.set(0, 0, 14)

      const geo = new THREE.PlaneGeometry(0.22, 0.32)
      const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true })
      const inst = new THREE.InstancedMesh(geo, mat, COUNT)
      inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      inst.count = 0
      scene.add(inst)
      const color = new THREE.Color()
      for (let i = 0; i < COUNT; i += 1) {
        inst.setColorAt(i, color.setHex(COLORS[i % COLORS.length]))
      }
      inst.instanceColor.needsUpdate = true

      const dummy = new THREE.Object3D()
      const parts = []
      let alive = false
      let lastFire = 0

      function burst() {
        if (reduced) return
        parts.length = 0
        for (let i = 0; i < COUNT; i += 1) {
          const angle = Math.random() * Math.PI * 2
          const speed = 3 + Math.random() * 6
          parts.push({
            x: (Math.random() - 0.5) * 4,
            y: -2 + Math.random() * 2,
            z: (Math.random() - 0.5) * 2,
            vx: Math.cos(angle) * speed * 0.7,
            vy: 4 + Math.random() * 7,
            vz: (Math.random() - 0.5) * 2,
            rx: Math.random() * Math.PI,
            ry: Math.random() * Math.PI,
            wx: (Math.random() - 0.5) * 12,
            wy: (Math.random() - 0.5) * 12,
            life: 0,
            maxLife: 1.9 + Math.random() * 0.9,
            scale: 0.7 + Math.random() * 0.8,
          })
        }
        alive = true
        lastFire = fireRef.current
      }

      const onResize = () => {
        renderer.setSize(w(), h())
        camera.aspect = w() / h()
        camera.updateProjectionMatrix()
      }
      window.addEventListener('resize', onResize)

      const tick = () => {
        if (disposed) return
        raf = requestAnimationFrame(tick)
        if (fireRef.current && fireRef.current !== lastFire) burst()
        if (alive) {
          let n = 0
          for (const p of parts) {
            p.life += 0.016
            if (p.life >= p.maxLife) continue
            p.vy -= 9.5 * 0.016
            p.vx *= 0.985
            p.x += p.vx * 0.016
            p.y += p.vy * 0.016
            p.z += p.vz * 0.016
            p.rx += p.wx * 0.016
            p.ry += p.wy * 0.016
            const fade = p.life > p.maxLife - 0.5 ? Math.max(0, (p.maxLife - p.life) / 0.5) : 1
            dummy.position.set(p.x, p.y, p.z)
            dummy.rotation.set(p.rx, p.ry, 0)
            const s = p.scale * fade
            dummy.scale.set(s, s, s)
            dummy.updateMatrix()
            inst.setMatrixAt(n, dummy.matrix)
            n += 1
          }
          inst.count = n
          inst.instanceMatrix.needsUpdate = true
          if (n === 0) alive = false
        } else if (inst.count !== 0) {
          inst.count = 0
        }
        renderer.render(scene, camera)
      }
      tick()
      if (fireRef.current) burst()

      el._confetti3dCleanup = () => {
        window.removeEventListener('resize', onResize)
        cancelAnimationFrame(raf)
        geo.dispose()
        mat.dispose()
        inst.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
      }
    }).catch(() => { /* confetti is decorative; fail silently */ })

    return () => {
      disposed = true
      const el = mountRef.current
      if (el && el._confetti3dCleanup) {
        try { el._confetti3dCleanup() } catch { /* noop */ }
        el._confetti3dCleanup = null
      }
    }
  }, [])

  return <div ref={mountRef} className="f100-confetti3d" aria-hidden="true" />
}
