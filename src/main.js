import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initLenis, runPreloader, initMenu, initSound, initCursor } from './chrome.js'
import { initHero } from './hero.js'
import { initSlider } from './slider.js'
import { initGiant } from './giant.js'
import { initFooter } from './footer.js'
import { initLive } from './live.js'

gsap.registerPlugin(ScrollTrigger)

const lenis = initLenis()
initSound()
initMenu()
initCursor()
initHero()
initSlider()
initGiant()
initFooter()
initLive()

// menu / footer anchors scroll with Lenis
addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]')
  const id = a?.getAttribute('href')
  if (!id || id === '#') return
  const el = document.querySelector(id)
  if (!el) return
  e.preventDefault()
  lenis.scrollTo(el, { duration: 1.4 })
})

runPreloader(lenis).then(() => {
  dispatchEvent(new Event('mr:revealed'))
  ScrollTrigger.refresh()
})
