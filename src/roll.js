import * as THREE from 'three'

// A procedural tape-style roll (axis along local Y), original geometry: no external models.
export function makeRoll(hex, { R = 0.5, r = 0.3, H = 0.34 } = {}) {
  const g = new THREE.Group()
  const c = document.createElement('canvas')
  c.width = 512; c.height = 64
  const x = c.getContext('2d')
  x.fillStyle = hex; x.fillRect(0, 0, 512, 64)
  x.fillStyle = 'rgba(0,0,0,.16)'
  for (let i = 0; i < 4; i++) x.fillRect(i * 128 + 20, 8, 5, 48)
  x.fillStyle = 'rgba(255,255,255,.18)'
  x.fillRect(0, 6, 512, 8)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  const body = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, roughness: 0.35, side: THREE.DoubleSide })
  const edge = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.5, side: THREE.DoubleSide })
  const card = new THREE.MeshStandardMaterial({ color: 0xe3c79a, roughness: 0.9, side: THREE.DoubleSide })
  const seg = 72
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, seg, 1, true), body)
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(r, r, H, seg, 1, true), edge)
  const core = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.025, r - 0.025, H + 0.04, seg, 1, true), card)
  const cap = y => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r, R, seg), edge)
    m.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2
    m.position.y = y
    return m
  }
  const ring = y => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.025, r, seg), card)
    m.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2
    m.position.y = y * 1.12
    return m
  }
  g.add(outer, inner, core, cap(H / 2), cap(-H / 2), ring(H / 2), ring(-H / 2))
  return g
}
