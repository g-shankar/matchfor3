import React, { useEffect, useRef } from 'react'
import { loadThree, prefersReducedMotion } from './three-lazy.js'

// Ambient 3D backdrop for the library home: soft low-poly shapes in the
// shelf palette drifting slowly, with gentle scroll parallax. Pure
// decoration — pointer-events are disabled by CSS.

const PALETTE = [0xff7657, 0xf3b53f, 0x5dbf78, 0x5c9ee8, 0x9b78dc, 0x72d7b9]
const SHAPES = 16

export default function ShelfBackdrop3D() {
  const mountRef = useRef(null)

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
      const size = () => ({ w: Math.max(50, el.clientWidth), h: Math.max(50, el.clientHeight) })
      const { w, h } = size()

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setSize(w, h)
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 100)
      camera.position.set(0, 0, 16)

      scene.add(new THREE.AmbientLight(0xffffff, 1.2))
      const key = new THREE.DirectionalLight(0xffffff, 0.7)
      key.position.set(5, 8, 10)
      scene.add(key)

      const group = new THREE.Group()
      scene.add(group)

      const geos = [
        new THREE.IcosahedronGeometry(1, 0),
        new THREE.TorusGeometry(0.8, 0.32, 10, 20),
        new THREE.OctahedronGeometry(1, 0),
        new THREE.TorusKnotGeometry(0.6, 0.22, 48, 8),
      ]
      const items = []
      for (let i = 0; i < SHAPES; i += 1) {
        const mat = new THREE.MeshStandardMaterial({
          color: PALETTE[i % PALETTE.length],
          roughness: 0.6,
          metalness: 0.05,
          transparent: true,
          opacity: 0.16,
        })
        const mesh = new THREE.Mesh(geos[i % geos.length], mat)
        const s = 0.5 + Math.random() * 1.1
        mesh.scale.setScalar(s)
        mesh.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 18, -2 - Math.random() * 6)
        mesh.userData = {
          rx: (Math.random() - 0.5) * 0.4,
          ry: (Math.random() - 0.5) * 0.5,
          drift: 0.2 + Math.random() * 0.5,
          phase: Math.random() * Math.PI * 2,
          baseY: mesh.position.y,
        }
        group.add(mesh)
        items.push(mesh)
      }

      let scrollY = window.scrollY || 0
      const onScroll = () => { scrollY = window.scrollY || 0 }
      window.addEventListener('scroll', onScroll, { passive: true })

      let visible = true
      const onVis = () => { visible = !document.hidden }
      document.addEventListener('visibilitychange', onVis)

      const ro = new ResizeObserver(() => {
        const { w: nw, h: nh } = size()
        renderer.setSize(nw, nh)
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
      })
      ro.observe(el)

      let t = 0
      const tick = () => {
        if (disposed) return
        raf = requestAnimationFrame(tick)
        if (!visible) return
        t += 0.016
        group.position.y = scrollY * 0.004
        for (const mesh of items) {
          const u = mesh.userData
          mesh.rotation.x += u.rx * 0.016
          mesh.rotation.y += u.ry * 0.016
          if (!reduced) mesh.position.y = u.baseY + Math.sin(t * u.drift + u.phase) * 0.9
        }
        renderer.render(scene, camera)
      }
      tick()

      el._backdrop3dCleanup = () => {
        window.removeEventListener('scroll', onScroll)
        document.removeEventListener('visibilitychange', onVis)
        ro.disconnect()
        cancelAnimationFrame(raf)
        for (const g of geos) g.dispose()
        for (const mesh of items) mesh.material.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
      }
    }).catch(() => { /* decorative; fail silently */ })

    return () => {
      disposed = true
      const el = mountRef.current
      if (el && el._backdrop3dCleanup) {
        try { el._backdrop3dCleanup() } catch { /* noop */ }
        el._backdrop3dCleanup = null
      }
    }
  }, [])

  return <div ref={mountRef} className="f100-backdrop3d" aria-hidden="true" />
}
