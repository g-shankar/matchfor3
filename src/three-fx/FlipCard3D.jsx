import React, { useEffect, useRef, useState } from 'react'
import { loadThree, prefersReducedMotion } from './three-lazy.js'

// A real 3D card: the photo lives on a plane in a WebGL scene. Changing
// cards triggers a true 3D flip (with lighting and a mid-flip texture
// swap), plus a gentle idle float and pointer tilt. Falls back to the
// plain DOM photo if WebGL or the texture fails.

const NUMBER_COLORS = ['#ff7864', '#f3b842', '#65bce8', '#6fc27c', '#9c7ddd']

function coverDraw(ctx, img, w, h, radius) {
  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(0, 0, w, h, radius)
  ctx.clip()
  const scale = Math.max(w / img.width, h / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
  ctx.restore()
}

function drawNumberCard(canvas, number) {
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  const color = NUMBER_COLORS[(number - 1) % NUMBER_COLORS.length]
  const gradient = ctx.createLinearGradient(0, 0, w, h)
  gradient.addColorStop(0, color)
  gradient.addColorStop(1, '#fff2a8')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.roundRect(0, 0, w, h, Math.min(w, h) * 0.06)
  ctx.fill()
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#294b4233'
  ctx.shadowOffsetY = h * 0.02
  ctx.font = `900 ${h * 0.52}px Nunito, system-ui, sans-serif`
  ctx.fillText(String(number), w / 2, h * 0.4)
  // counting dots
  ctx.shadowOffsetY = h * 0.006
  const dots = Math.min(number, 20)
  const dotR = Math.min(w, h) * 0.022
  const gap = dotR * 3.1
  const rowW = (dots - 1) * gap
  const y = h * 0.78
  for (let i = 0; i < dots; i += 1) {
    ctx.beginPath()
    ctx.arc(w / 2 - rowW / 2 + i * gap, y, dotR, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowOffsetY = 0
}

export default function FlipCard3D({ imageUrl, number, label, flipKey, fallback }) {
  const mountRef = useRef(null)
  const [failed, setFailed] = useState(false)
  const propsRef = useRef({ imageUrl, number, label })
  propsRef.current = { imageUrl, number, label }
  const flipKeyRef = useRef(flipKey)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount || failed) return undefined
    let disposed = false
    let renderer = null
    let raf = 0
    let ro = null
    const reduced = prefersReducedMotion()

    loadThree().then((THREE) => {
      if (disposed || !mountRef.current) return
      const el = mountRef.current
      const makeSize = () => ({ w: Math.max(50, el.clientWidth), h: Math.max(50, el.clientHeight) })
      const { w, h } = makeSize()

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(w, h)
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 100)
      camera.position.set(0, 0, 12)
      scene.add(new THREE.AmbientLight(0xffffff, 1.15))
      const key = new THREE.DirectionalLight(0xffffff, 0.85)
      key.position.set(4, 6, 9)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0xfff2d9, 0.35)
      rim.position.set(-5, -3, 6)
      scene.add(rim)

      // exact fit: visible height at the plane's depth
      const fitH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      const geo = new THREE.PlaneGeometry(fitH, fitH)
      const mat = new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.85, metalness: 0.02 })
      const mesh = new THREE.Mesh(geo, mat)
      scene.add(mesh)

      const st = {
        THREE, flip: 0, flipping: false, pending: null,
        tiltX: 0, tiltY: 0, tTiltX: 0, tTiltY: 0, time: Math.random() * 10,
        img: null, texSize: { w, h },
      }

      function fitMesh() {
        const { w: cw, h: ch } = makeSize()
        camera.aspect = cw / ch
        camera.updateProjectionMatrix()
        renderer.setSize(cw, ch)
        mesh.scale.set(cw / ch, 1, 1)
        st.texSize = { w: cw, h: ch }
      }
      fitMesh()

      function paintTexture() {
        const { imageUrl: url, number: num } = propsRef.current
        const { w: cw, h: ch } = st.texSize
        const scale = Math.min(window.devicePixelRatio || 1, 2)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(cw * scale)
        canvas.height = Math.round(ch * scale)
        const radius = Math.round(Math.min(canvas.width, canvas.height) * 0.07)
        if (num) {
          drawNumberCard(canvas, num)
          return { canvas, img: null }
        }
        return new Promise((resolve, reject) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            coverDraw(canvas.getContext('2d'), img, canvas.width, canvas.height, radius)
            resolve({ canvas, img })
          }
          img.onerror = reject
          img.src = url
        })
      }

      function toTexture(painted) {
        const tex = new THREE.CanvasTexture(painted.canvas)
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 4
        return { tex, img: painted.img || null }
      }

      function setImmediateTexture(painted) {
        const { tex, img } = toTexture(painted)
        if (mat.map) mat.map.dispose()
        mat.map = tex
        mat.needsUpdate = true
        st.img = img
      }

      function repaint() {
        const out = paintTexture()
        if (out && typeof out.then === 'function') {
          out.then(
            (painted) => { if (!disposed) setImmediateTexture(painted) },
            () => { if (!disposed) setFailed(true) },
          )
        } else {
          setImmediateTexture(out)
        }
      }

      function flipTo() {
        const out = paintTexture()
        const begin = (painted) => {
          if (disposed) return
          const { tex, img } = toTexture(painted)
          if (st.pending && st.pending.tex) st.pending.tex.dispose()
          st.pending = { tex, img }
          st.flip = 0
          st.flipping = true
        }
        if (out && typeof out.then === 'function') {
          out.then(begin, () => { if (!disposed) setFailed(true) })
        } else {
          begin(out)
        }
      }

      // initial paint
      repaint()
      // repaint on flipKey change
      const keyCheck = window.setInterval(() => {
        if (flipKeyRef.current !== st.lastKey) {
          st.lastKey = flipKeyRef.current
          if (reduced) repaint()
          else flipTo()
        }
      }, 60)
      st.lastKey = flipKeyRef.current

      const onPointer = (event) => {
        const r = el.getBoundingClientRect()
        const x = ((event.clientX - r.left) / r.width - 0.5) * 2
        const y = ((event.clientY - r.top) / r.height - 0.5) * 2
        st.tTiltY = Math.max(-1, Math.min(1, x)) * 0.17
        st.tTiltX = Math.max(-1, Math.min(1, -y)) * 0.13
      }
      const onLeave = () => { st.tTiltX = 0; st.tTiltY = 0 }
      el.addEventListener('pointermove', onPointer)
      el.addEventListener('pointerleave', onLeave)

      let resizeTimer = 0
      ro = new ResizeObserver(() => {
        window.clearTimeout(resizeTimer)
        resizeTimer = window.setTimeout(() => {
          if (disposed) return
          fitMesh()
          repaint()
        }, 250)
      })
      ro.observe(el)

      const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2)
      const tick = () => {
        if (disposed) return
        raf = requestAnimationFrame(tick)
        st.time += 0.016
        if (st.flipping) {
          st.flip = Math.min(1, st.flip + 0.016 / 0.5)
          if (st.flip >= 0.5 && st.pending) {
            if (mat.map) mat.map.dispose()
            mat.map = st.pending.tex
            mat.needsUpdate = true
            st.img = st.pending.img
            st.pending = null
          }
          if (st.flip >= 1) {
            st.flipping = false
            st.flip = 0
          }
        }
        const eased = easeInOut(st.flip)
        mesh.rotation.y = eased * Math.PI + st.tiltY
        mesh.rotation.x = st.tiltX
        st.tiltX += (st.tTiltX - st.tiltX) * 0.09
        st.tiltY += (st.tTiltY - st.tiltY) * 0.09
        if (!reduced && !st.flipping) mesh.position.y = Math.sin(st.time * 1.5) * 0.09
        else if (st.flipping) mesh.position.y = 0
        renderer.render(scene, camera)
      }
      tick()

      st.cleanup = () => {
        window.clearInterval(keyCheck)
        window.clearTimeout(resizeTimer)
        el.removeEventListener('pointermove', onPointer)
        el.removeEventListener('pointerleave', onLeave)
        if (ro) ro.disconnect()
        cancelAnimationFrame(raf)
        geo.dispose()
        if (mat.map) mat.map.dispose()
        if (st.pending && st.pending.tex) st.pending.tex.dispose()
        mat.dispose()
        renderer.dispose()
        if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement)
      }
      el._flip3dCleanup = st.cleanup
    }).catch(() => {
      if (!disposed) setFailed(true)
    })

    return () => {
      disposed = true
      if (mount._flip3dCleanup) {
        try { mount._flip3dCleanup() } catch { /* noop */ }
        mount._flip3dCleanup = null
      }
      if (renderer) {
        try { renderer.dispose() } catch { /* noop */ }
      }
    }
  }, [failed])

  useEffect(() => {
    flipKeyRef.current = flipKey
  }, [flipKey])

  if (failed) return fallback || null
  return <div ref={mountRef} className="f100-flip3d" role="img" aria-label={label} />
}
