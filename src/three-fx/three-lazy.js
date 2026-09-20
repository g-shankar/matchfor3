// Lazy-load three.js so the main bundle stays lean; the 3D chunk loads
// only when a First 100 screen that uses it mounts.
let threePromise = null

export function loadThree() {
  if (!threePromise) threePromise = import('three')
  return threePromise
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
