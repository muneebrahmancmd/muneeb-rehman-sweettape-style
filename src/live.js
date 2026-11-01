// Live previews: real projects shown in scaled iframes (no screenshots needed).
export const LIVE = [
  'https://muneeb-rehman-portfolio-darw.vercel.app/',
  'https://muneeb-rehman-50.netlify.app/',
  'https://muneeb-rehman-40.vercel.app/',
  'https://muneeb-rehman-portfolio-30.vercel.app/',
  'https://muneeb-rehman-portfolio-20.vercel.app/',
  'https://muneeb-portfolio-2026.netlify.app/',
  'https://muna-portfolio-2k26.netlify.app/',
  'https://muna-portfolio-2k26.vercel.app/',
  'https://muneeb-dev.netlify.app/',
  'https://muneeb-dev-portfolio.netlify.app/',
  'https://muneeb-port-folio.netlify.app/',
]
const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(es => es.forEach(e => fit(e.target))) : null
function fit(el) {
  const f = el.firstElementChild
  const w = el.clientWidth, h = el.clientHeight
  if (!f || !w || !h) return
  const vw = +el.dataset.vw || 1280
  const s = w / vw
  f.style.width = `${vw}px`
  f.style.height = `${Math.ceil(h / s)}px`
  f.style.transform = `scale(${s})`
}
export function setLive(el, url) {
  el.classList.add('live-frame')
  let f = el.querySelector('iframe')
  if (!f) {
    f = document.createElement('iframe')
    f.title = 'Live project preview'
    f.tabIndex = -1
    f.setAttribute('loading', 'lazy')
    f.setAttribute('aria-hidden', 'true')
    f.setAttribute('referrerpolicy', 'no-referrer')
    el.append(f)
    ro?.observe(el)
  }
  if (f.src !== url) f.src = url
  fit(el)
}
export function initLive() {
  document.querySelectorAll('[data-live]').forEach(el => setLive(el, LIVE[+el.dataset.live % LIVE.length]))
}
