import gsap from 'gsap'
import * as THREE from 'three'
import G from './glyphs.json'
import { makeRoll } from './roll.js'
import { LIVE, setLive } from './live.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { makePeel, damp } from './bits.js'

const SLIDES = [
  { id: 'web', bg: '#fa8005', wc: '#fcd805', ring: '#fff1a2', tagBg: '#FFDC13', tagInk: '#D7791A', ink: '#FFDC13', color: '#FFDC13',
    tags: ['WEB DESIGN', 'FRONT END', 'ANIMATION'], copy: 'Fast, responsive websites with motion that feels alive. Designed and coded by one person, then shipped live on the web.',
    strip: ['/assets/tape-beige.png', 'masking', 129.23, 37.12] },
  { id: 'graphic', bg: '#50CBFF', wc: '#007db2', ring: '#a8dcf0', tagBg: '#1b87b8', tagInk: '#8bd8f5', ink: '#1b87b8', color: '#50CBFF',
    tags: ['LOGOS', 'POSTERS', 'SOCIAL GRAPHICS'], copy: 'Clean layouts and bold visuals with a clear identity. Made to get noticed, built to last.',
    strip: ['/assets/tape-white.png', 'tissue', 138.77, 51.54] },
  { id: 'photo', bg: '#FF7B5F', wc: '#a82712', ring: '#ffd9c2', tagBg: '#9e2a12', tagInk: '#f2a08c', ink: '#9e2a12', color: '#FF7B5F',
    tags: ['RETOUCHING', 'COLOUR GRADING', 'CLEAN-UP'], copy: 'Careful retouching and colour work. Your photo, just the way you remember the moment.',
    strip: ['/assets/tape-clear.png', 'clear', 147.71, 96.64] },
  { id: 'video', bg: '#2E3EAC', wc: '#101E83', ring: '#d9d2f7', tagBg: '#172795', tagInk: '#B0B9FA', ink: '#919CFF', color: '#2E3EAC',
    tags: ['VEO 3', 'CINEMATIC', 'STORYTELLING'], copy: 'Cinematic AI video shaped into a story. Every shot planned, every frame chosen.',
    strip: ['/assets/tape-black.png', 'black', 155.56, 52.81] },
  { id: 'ai', bg: '#b6fe00', wc: '#52AF16', ring: '#e4f7a8', tagBg: '#52AF16', tagInk: '#E7FF8F', ink: '#52AF16', color: '#8be000',
    tags: ['MIDJOURNEY', 'FLUX', 'IMAGEN'], copy: 'Concept art and visuals from the edge of imagination, guided by a clear idea.',
    strip: ['/assets/tape-kraft.png', 'masking', 128.83, 40.74] },
  { id: 'cs', bg: '#F7D000', wc: '#a88700', ring: '#fff0b0', tagBg: '#a88700', tagInk: '#ffeda0', ink: '#8a6f00', color: '#F7D000',
    tags: ['COMPUTER SCIENCE', 'NEW SKILLS', 'EVERY WEEK'], copy: 'A computer science student learning something new every week, then putting it straight to work.',
    strip: ['/assets/tape-clear.png', 'clear', 147.71, 96.64] },
].map((s, i) => ({ ...s, glyphs: G[s.id], shots: [(2 * i) % LIVE.length, (2 * i + 1) % LIVE.length], roll: `/assets/roll-${s.id}.webp` }))
const THE = G.the

export function initSlider() {
  const sec = document.querySelector('.tape-slider-parent')
  const base = sec.querySelector('.bg-layer--base')
  const next = sec.querySelector('.bg-layer--next')
  const subhead = sec.querySelector('.subhead')
  const rollIt = sec.querySelector('.roll-it')
  const track = sec.querySelector('.rail-track')
  const left = sec.querySelector('.left')
  const tagsBox = sec.querySelector('.tags')
  const body = sec.querySelector('.subtext .h5')
  const topTitle = sec.querySelector('.top-title')
  const bottomTitle = sec.querySelector('.bottom-title')
  const explore = sec.querySelector('.explore-button')
  const showBox = sec.querySelector('.showcases')
  let cur = 0, busy = null
  const S = () => SLIDES[cur]

  const lift = () => sec.style.setProperty('--slide-lift', `${-Math.min(Math.max(0, 0.36 * innerWidth - 0.576 * innerHeight), 0.036 * innerWidth)}px`)
  addEventListener('resize', lift)
  lift()

  const paint = s => {
    sec.style.setProperty('--tag-bg', s.tagBg)
    sec.style.setProperty('--tag-ink', s.tagInk)
    sec.style.setProperty('--ink', s.ink)
  }

  /* rail */
  const buttons = SLIDES.map((s, i) => {
    const b = document.createElement('button')
    b.setAttribute('aria-label', `${s.id}`)
    b.style.setProperty('--ring', s.ring)
    b.innerHTML = `<span class="roll-ring"></span><img src="${s.roll}" alt="">`
    b.addEventListener('click', () => go(i))
    track.append(b)
    return b
  })
  const rail = { rot: 180 }
  const placeRail = () => {
    const r = track.offsetWidth / 2
    buttons.forEach((b, i) => {
      const a = (i * 60 + rail.rot) * Math.PI / 180
      b.style.transform = `translate(-50%,-50%) translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px)`
    })
  }
  const rings = buttons.map(b => b.querySelector('.roll-ring'))
  const setActive = () => buttons.forEach((b, i) => { b.classList.toggle('is-active', i === cur); b.setAttribute('aria-pressed', i === cur); b.style.zIndex = i === cur ? 2 : 1 })

  /* letters are coloured by mask so one image set serves every tint */
  const letter = (cls, src, w, h, unit) => {
    const el = document.createElement('span')
    el.className = cls
    el.style.cssText = `--glyph:url(${src});width:${w * unit}vw;height:${h * unit}vw`
    el.innerHTML = '<i></i>'
    return el
  }
  const theEls = THE.map(([L, w, h]) => {
    const el = letter('the-glyph', `/assets/${L}`, w, h, 0.0674 * 0.85)
    topTitle.append(el)
    return el.firstChild
  })
  let glyphEls = []
  const buildWord = s => {
    bottomTitle.innerHTML = ''
    const sum = s.glyphs.reduce((a, g) => a + g[1], 0), u = 0.0674 * Math.min(1, 700 / sum), n = s.glyphs.length
    glyphEls = s.glyphs.map(([L, w, h], i) => {
      const el = letter('glyph', `/assets/words/${s.id}/${L}`, w, h, u)
      const k = 2 * i / (n - 1) - 1
      el.style.transform = `translateY(${(s.depth ?? 1.3) * (1 - k * k)}vw) rotate(${-(s.tilt ?? 8) * k}deg)`
      bottomTitle.append(el)
      return el.firstChild
    })
    bottomTitle.style.left = ''
  }

  /* left column */
  const fillLeft = s => {
    tagsBox.innerHTML = `<div class="tag">${s.tags.map(t => `<h6 class="h6">${t}</h6>`).join('')}</div>`
    body.innerHTML = s.copy.split(' ').map(w => `<span class="body-clip"><span class="body-rise">${w}</span></span>`).join(' ')
  }
  const bodyLines = () => {
    const rows = new Map()
    body.querySelectorAll('.body-rise').forEach(w => { const k = w.parentElement.offsetTop; rows.set(k, [...(rows.get(k) || []), w]) })
    return [...rows.values()]
  }
  const tagEls = () => [...tagsBox.querySelectorAll('h6')]

  /* showcases */
  const shots = [0, 1].map(i => {
    const wrap = document.createElement('span')
    wrap.className = `showcase showcase--${i + 1}`
    wrap.innerHTML = '<span class="live-frame"></span><span class="showcase-tape"></span>'
    showBox.append(wrap)
    return { wrap, img: wrap.firstChild, tape: wrap.lastChild, peel: null }
  })
  const fillShots = s => shots.forEach((sh, i) => {
    setLive(sh.img, LIVE[s.shots[i]])
    const [src, back, w, h] = s.strip
    sh.tape.style.width = `${w}px`
    sh.tape.style.height = `${h}px`
    const p = sh.peel?.progress ?? 0
    sh.peel = makePeel(sh.tape, { img: src, dir: 90, from: i ? 0.54 : 0.66, back })
    sh.peel.progress = p
  })

  /* 3D key visual */
  const viewer = initViewer(sec.querySelector('.key-visual'), SLIDES)

  /* first paint */
  const s0 = S()
  base.style.background = s0.bg
  sec.style.setProperty('--word-colour', s0.wc)
  paint(s0)
  buildWord(s0)
  fillLeft(s0)
  fillShots(s0)
  setActive()
  placeRail()
  addEventListener('resize', placeRail)
  explore.href = LIVE[S().shots[0]]
  explore.target = '_blank'
  explore.rel = 'noopener'

  /* entrance */
  const dipH = el => el.parentElement.offsetHeight + 2
  gsap.set(theEls, { y: i => dipH(theEls[i]) })
  gsap.set(glyphEls, { y: i => dipH(glyphEls[i]) })
  gsap.set(tagEls(), { x: () => -(left.getBoundingClientRect().right + 40) })
  gsap.set(body.querySelectorAll('.body-rise'), { yPercent: 110 })
  gsap.set(shots.map(s => s.wrap), { rotationY: -90, z: -55, transformPerspective: 900 })
  gsap.set(explore, { autoAlpha: 0, scale: 0, y: 0.022 * innerWidth })
  gsap.set(explore.querySelector('.button-text'), { yPercent: 115 })
  gsap.set(rings, { scale: 0, opacity: 0 })
  gsap.set(subhead, { autoAlpha: 0, rotationY: -100, transformPerspective: 420 })

  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return
    io.disconnect()
    sec.classList.add('is-ready')
    gsap.timeline()
      .to(subhead, { autoAlpha: 1, rotationY: 0, duration: 0.85, ease: 'back.out(1.4)' }, 0)
      .to(rings[cur], { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' }, 0.4)
      .to(theEls, { y: 0, duration: 0.42, ease: 'power3.out', stagger: 0.08 }, 0.1)
      .to(glyphEls, { y: 0, duration: 0.42, ease: 'power3.out', stagger: 0.05 }, 0.26)
      .to(tagEls(), { x: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07 }, 0.2)
      .add(() => gsap.to(bodyLines(), { yPercent: 0, duration: 0.72, ease: 'power3.out', stagger: 0.09 }), 0.2)
      .to(shots.map(s => s.wrap), { rotationY: 0, z: 0, duration: 0.39, ease: 'power2.out', stagger: 0.26 }, 0.22)
      .to(shots.map(s => s.peel), { progress: 1, duration: 0.62, ease: 'power2.out', stagger: 0.26 }, 0.69)
      .to(explore, { scale: 1, duration: 0.52, ease: 'back.out(2.4)' }, 0.6)
      .to(explore, { autoAlpha: 1, y: 0, duration: 0.68, ease: 'back.out(1.9)' }, 0.6)
      .to(explore.querySelector('.button-text'), { yPercent: 0, duration: 0.5, ease: 'power3.out' }, 0.76)
  }, { rootMargin: '0px 0px -45% 0px' }).observe(sec)

  /* slide change */
  const sound = new Audio('/assets/sounds/slide-change.wav')
  function go(i) {
    i = (i + SLIDES.length) % SLIDES.length
    if (i === cur) return
    busy?.progress(1)
    cur = i
    const s = S()
    explore.href = LIVE[s.shots[0]]
    sound.currentTime = 0
    sound.play().catch(() => {})
    setActive()

    const tl = busy = gsap.timeline()
    // rail spins the shortest way so the chosen roll lands at the far left
    const delta = ((180 - i * 60 - rail.rot) % 360 + 540) % 360 - 180
    tl.to(rings, { scale: 0, opacity: 0, duration: 0.46, ease: 'back.in(0.9)' }, 0)
      .to(rail, { rot: rail.rot + delta, duration: 0.85, ease: 'sine.inOut', onUpdate: placeRail }, 0.12)
      .to(rings[i], { scale: 1, opacity: 1, duration: 0.55, ease: 'back.out(1.6)' }, 0.75)

    // background sweeps down with a curved leading edge
    const H = sec.offsetHeight, arc = sec.offsetWidth * 150.5 / 1456, o = H + arc + 2
    next.style.height = `${o}px`
    next.style.background = s.bg
    const sweepEase = gsap.parseEase('power2.out')
    // time at which the sweep's edge passes an element's bottom
    const passes = el => {
      const y = el.getBoundingClientRect().bottom - sec.getBoundingClientRect().top + arc
      let lo = 0, hi = 1
      for (let k = 0; k < 20; k++) { const m = (lo + hi) / 2; sweepEase(m) * o < y ? lo = m : hi = m }
      return 0.75 + 0.85 * hi
    }
    tl.fromTo(next, { y: -o }, { y: 0, duration: 0.85, ease: 'power2.out' }, 0.75)
      .call(() => paint(s), null, passes(subhead))
      .call(() => rollIt.style.color = s.ink, null, passes(rollIt))
      .call(() => { base.style.background = s.bg; gsap.set(next, { y: -o }) }, null, 1.6)

    // "THE" letters dip, change ink, rise again
    const n = theEls.length
    theEls.forEach((el, k) => {
      tl.to(el, { y: dipH(el), duration: 0.32, ease: 'power2.in' }, 0.08 * k)
    })
    tl.call(() => sec.style.setProperty('--word-colour', s.wc), null, 0.08 * (n - 1) + 0.32)
    theEls.forEach((el, k) => tl.to(el, { y: 0, duration: 0.42, ease: 'power3.out' }, Math.max(0.39 + 0.08 * (n - 1), 0.81) + 0.08 * k))

    // word glyphs dip out, swap word, rise in
    const out = glyphEls
    out.forEach((el, k) => tl.to(el, { y: dipH(el), duration: 0.32, ease: 'power2.in' }, 0.06 + 0.05 * k))
    const swapAt = 0.06 + 0.05 * (out.length - 1) + 0.32
    tl.call(() => {
      buildWord(s)
      gsap.set(glyphEls, { y: k => dipH(glyphEls[k]) })
      glyphEls.forEach((el, k) => gsap.to(el, { y: 0, duration: 0.42, ease: 'power3.out', delay: Math.max(0, 0.9 - swapAt) + 0.05 * k }))
    }, null, swapAt)

    // model does a coin flip
    tl.add(() => viewer.flipTo(i), 0.1)

    // showcase cards flip edge-on, swap, flip back
    shots.forEach((sh, k) => {
      const t0 = 0.18 + 0.26 * k
      tl.to(sh.wrap, { rotationY: 90, z: -55, duration: 0.39, ease: 'power2.in' }, t0)
        .call(() => {
          setLive(sh.img, LIVE[s.shots[k]])
          const [src, back, w, h] = s.strip
          Object.assign(sh.tape.style, { width: `${w}px`, height: `${h}px` })
          sh.peel = makePeel(sh.tape, { img: src, dir: 90, from: k ? 0.54 : 0.66, back })
          sh.peel.progress = 1
          gsap.set(sh.wrap, { rotationY: -90 })
        }, null, t0 + 0.39)
        .to(sh.wrap, { rotationY: 0, z: 0, duration: 0.39, ease: 'power2.out' }, t0 + 0.39)
    })

    // left column slides out, swaps copy, comes back
    const leftOut = 0.12 + 0.34 + 0.07 * 2
    tl.to(tagEls(), { x: -(left.getBoundingClientRect().right + 40), duration: 0.34, ease: 'power2.in', stagger: 0.07 }, 0.12)
      .add(() => gsap.to(bodyLines(), { yPercent: 110, duration: 0.26, ease: 'power2.in', stagger: 0.05 }), 0.12)
      .call(() => {
        fillLeft(s)
        gsap.set(tagEls(), { x: -(left.getBoundingClientRect().right + 40) })
        gsap.set(body.querySelectorAll('.body-rise'), { yPercent: 110 })
      }, null, leftOut)
      .add(() => {
        gsap.to(tagEls(), { x: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07 })
        gsap.to(bodyLines(), { yPercent: 0, duration: 0.72, ease: 'power3.out', stagger: 0.09 })
      }, Math.max(leftOut + 0.06, 1.48))
  }

  sec.querySelectorAll('.tape-nav button').forEach(b => b.addEventListener('click', () => go(cur + +b.dataset.dir)))
  addEventListener('keydown', e => {
    const r = sec.getBoundingClientRect()
    if (r.top > innerHeight / 2 || r.bottom < innerHeight / 2) return
    if (e.key === 'ArrowRight') go(cur + 1)
    if (e.key === 'ArrowLeft') go(cur - 1)
  })
}

/* ---------- key visual: the current roll in 3D, with a gentle mouse tilt ---------- */
function initViewer(box, slides) {
  const canvas = box.querySelector('canvas')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setClearColor(0, 0)
  renderer.toneMapping = THREE.NoToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.14
  const extra = new THREE.DirectionalLight(0xffffff, 0.12)
  extra.position.set(2.7, 2, 1)
  scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.97), extra)
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100)
  camera.position.z = 2.3

  const tilt = new THREE.Group(), flip = new THREE.Group()
  tilt.add(flip)
  scene.add(tilt)
  const models = []
  let shown = 0, dirty = true
  slides.forEach((sl, i) => {
    const wrap = new THREE.Group()
    wrap.rotation.x = -Math.PI / 2
    wrap.add(makeRoll(sl.color))
    wrap.visible = i === shown
    flip.add(wrap)
    models[i] = wrap
  })
  dirty = true
  gsap.to(canvas, { opacity: 1, duration: 0.35 })

  const fit = () => {
    const s = box.clientWidth * 1.3
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(s, s, false)
    dirty = true
  }
  new ResizeObserver(fit).observe(box)
  fit()

  const ptr = { x: 0, y: 0 }, cur = { x: 0, y: 0 }
  if (matchMedia('(hover: hover)').matches) {
    addEventListener('pointermove', e => {
      const r = box.getBoundingClientRect()
      const k = 0.5 * Math.min(innerWidth, innerHeight) * 0.42
      ptr.x = gsap.utils.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / k)
      ptr.y = gsap.utils.clamp(-1, 1, (e.clientY - (r.top + r.height / 2)) / k)
    })
    addEventListener('blur', () => { ptr.x = ptr.y = 0 })
  }
  const flipState = { a: 0 }
  gsap.ticker.add((_, dtMs) => {
    const dt = dtMs / 1000
    const nx = damp(cur.x, ptr.x, 5, dt), ny = damp(cur.y, ptr.y, 5, dt)
    if (Math.abs(nx - cur.x) + Math.abs(ny - cur.y) > 1e-5) dirty = true
    cur.x = nx
    cur.y = ny
    if (!dirty) return
    tilt.rotation.set(-0.08 * cur.y, 0.12 * cur.x, 0)
    tilt.position.set(-0.09 * cur.x, 0.065 * cur.y, 0)
    flip.rotation.y = flipState.a
    renderer.render(scene, camera)
    dirty = false
  })
  const mark = () => { dirty = true }
  return {
    flipTo(i) {
      gsap.timeline()
        .to(flipState, { a: Math.PI / 2, duration: 0.45, ease: 'power2.in', onUpdate: mark })
        .call(() => {
          models.forEach((m, k) => m && (m.visible = k === i))
          shown = i
          flipState.a = -Math.PI / 2
        })
        .to(flipState, { a: 0, duration: 0.45, ease: 'power2.out', onUpdate: mark })
    },
  }
}
