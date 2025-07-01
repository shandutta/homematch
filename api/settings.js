import { ALL_NEIGHBORHOODS, FAV_NEIGHBORHOODS } from './neighborhoods.js'

/* ---------- weights ---------------------------------------------------- */
const WEIGHTS = { lawn: 30, kitchen: 25, commute: 20, safety: 15, view: 10 }

function renderWeights () {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
  document.getElementById('totalPct').textContent = total
  for (const k in WEIGHTS) {
    document.getElementById(`${k}Pct`).textContent = WEIGHTS[k]
    document.getElementById(`${k}Slider`).value    = WEIGHTS[k]
  }
}

function rebalance (changedKey, newVal) {
  newVal = +newVal
  const delta = newVal - WEIGHTS[changedKey]
  WEIGHTS[changedKey] = newVal

  const others = Object.keys(WEIGHTS).filter(k => k !== changedKey)
  let pool      = others.reduce((s, k) => s + WEIGHTS[k], 0)

  others.forEach(k => {
    const share = pool ? WEIGHTS[k] / pool : 0
    WEIGHTS[k] = Math.max(0, Math.round(WEIGHTS[k] - delta * share))
  })

  // final rounding tweak so Σ==100
  const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
  WEIGHTS.view += 100 - sum
  renderWeights()
}

/* wire the sliders */
for (const k in WEIGHTS) {
  document.getElementById(`${k}Slider`)
          .addEventListener('input', e => rebalance(k, e.target.value))
}

renderWeights()
