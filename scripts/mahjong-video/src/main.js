import { createStage, setCamera } from './stage.js'
import { createActors } from './actors.js'
import { createOverlay } from './overlay.js'
import { loadTileTextures, exportFaces } from './tiles.js'
import { timelineInfo } from './timeline.js'
import { stateAt } from './state.js'

const stage = createStage(document.querySelector('#gl'))
const errors = []
window.addEventListener('error', (event) => errors.push(event.message))
window.addEventListener('unhandledrejection', (event) => errors.push(String(event.reason)))
const fonts = [['600 58px Kanit', 'มาจอง'], ['700 40px Kanit', 'ปง'], ['800 italic 120px Kanit', 'มาจองญี่ปุ่น'], ['600 56px Kanit', 'พื้นฐาน'], ['600 28px Kanit', 'yakuzathai.com'], ['400 28px Sarabun', 'ตัวอย่าง']]

const ready = Promise.all(fonts.map(([spec, sample]) => document.fonts.load(spec, sample)))
  .then(() => document.fonts.ready)
  .then(() => loadTileTextures(stage.renderer))
  .then((materials) => {
    const drawActors = createActors(stage, materials)
    const drawOverlay = createOverlay(stage)
    window.renderAt = (t) => {
      const state = stateAt(Math.max(0, Math.min(timelineInfo.duration, Number(t))))
      setCamera(stage, state.camera)
      drawActors(state)
      drawOverlay(state)
      stage.renderer.render(stage.scene, stage.camera)
      return state
    }
    window.exportTileFaces = exportFaces
    window.renderAt(new URLSearchParams(location.search).has('t') ? Number(new URLSearchParams(location.search).get('t')) : 0)
  })
window.ready = ready
window.timelineInfo = timelineInfo
window.renderErrors = errors

ready.then(() => {
  const params = new URLSearchParams(location.search)
  if (params.has('t')) window.renderAt(Number(params.get('t')))
  if (params.has('play')) {
    const ui = document.createElement('div')
    ui.id = 'play-ui'
    ui.innerHTML = '<input type="range" min="0" max="0" step="0.033333" value="0"><span>0.00</span>'
    document.body.append(ui)
    const slider = ui.querySelector('input')
    const output = ui.querySelector('span')
    slider.max = String(timelineInfo.duration)
    let origin
    const tick = (stamp) => {
      if (origin === undefined) origin = stamp
      const time = Math.min(timelineInfo.duration, (stamp - origin) / 1000)
      slider.value = String(time)
      output.textContent = time.toFixed(2)
      window.renderAt(time)
      if (time < timelineInfo.duration) requestAnimationFrame(tick)
    }
    slider.addEventListener('input', () => { output.textContent = Number(slider.value).toFixed(2); window.renderAt(Number(slider.value)) })
    requestAnimationFrame(tick)
  }
})
