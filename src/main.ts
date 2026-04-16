import { CSS } from './css'

const _existing = document.getElementById('lp-toolbar')
if (_existing) {
  ;(window as any).__lp_cleanup?.()
} else {
  main()
}


type Mode = 'select' | 'guides'
type GuideDir = 'h' | 'v'

interface Guide {
  id: number
  dir: GuideDir
  pos: number
  el: HTMLElement
}

type HistoryAction =
  | { type: 'add'; guide: Guide }
  | { type: 'remove'; guide: Guide }
  | { type: 'move'; guide: Guide; from: number; to: number }


function main(): void {

  const styleEl = document.createElement('style')
  styleEl.id = 'lp-css'
  styleEl.textContent = CSS
  document.head.appendChild(styleEl)

  let mode: Mode = 'select'
  let guideDir: GuideDir = 'h'
  let hoveredEl: Element | null = null
  let selectedEl: Element | null = null
  let altDown = false
  let guides: Guide[] = []
  let selectedGuide: Guide | null = null
  let guideIdSeq = 0
  let history: HistoryAction[] = []
  let histIdx = -1

  const toolbar = buildToolbar()
  document.body.appendChild(toolbar)

  const hlEl = document.createElement('div')
  hlEl.id = 'lp-hl'
  document.body.appendChild(hlEl)

  const selEl = document.createElement('div')
  selEl.id = 'lp-sel'
  document.body.appendChild(selEl)

  const svgLayer = buildSVG()
  document.body.appendChild(svgLayer)

  // Guide preview — follows cursor in guides mode before placing
  const guidePreview = document.createElement('div')
  guidePreview.className = 'lp-guide lp-guide-h lp-guide-preview'
  document.body.appendChild(guidePreview)

  // Elements belonging to LayoutPeek — excluded from elementFromPoint results
  function isOurs(el: Node | null): boolean {
    if (!el) return false
    if (toolbar.contains(el) || el === hlEl || el === selEl || el === svgLayer || el === guidePreview) return true
    return guides.some(g => g.el === el || g.el.contains(el as Node))
  }


  function onMouseMove(e: MouseEvent): void {
    // Guide preview: update regardless of which mode we're in
    if (mode === 'guides') {
      guidePreview.className = `lp-guide lp-guide-${guideDir} lp-guide-preview`
      if (guideDir === 'h') guidePreview.style.top = e.clientY + 'px'
      else guidePreview.style.left = e.clientX + 'px'
      guidePreview.style.display = 'block'
      return
    }

    // Select mode
    const el = document.elementFromPoint(e.clientX, e.clientY)
    hoveredEl = (!el || isOurs(el)) ? null : el

    if (hoveredEl) {
      setBox(hlEl, hoveredEl)
    } else {
      hlEl.style.display = 'none'
    }

    refreshSVG()
  }

  function onClick(e: MouseEvent): void {
    const target = e.target as Element

    if (mode === 'select') {
      if (isOurs(target)) return
      e.preventDefault()
      e.stopPropagation()

      if (selectedEl && selectedEl === hoveredEl) {
        // Deselect on second click
        selectedEl = null
        selEl.style.display = 'none'
      } else if (hoveredEl) {
        selectedEl = hoveredEl
        setBox(selEl, selectedEl)
        hlEl.style.display = 'none'
      }
      refreshSVG()
    }

    if (mode === 'guides') {
      if (isOurs(target)) return
      addGuide(guideDir, guideDir === 'h' ? e.clientY : e.clientX)
    }
  }

  function onKeyDown(e: KeyboardEvent): void {
    // Ignore when user is typing in a field
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    const key = e.key

    if (key === 'Alt') {
      altDown = true
      refreshSVG()
    }

    if (key === 'Escape') cleanup()
    if (key === 'm' || key === 'M') cleanup()
    if (key === 's' || key === 'S') switchMode('select')
    if (key === 'g' || key === 'G') switchMode('guides')
    if (key === 'h' || key === 'H') { guideDir = 'h'; refreshToolbar() }
    if (key === 'v' || key === 'V') { guideDir = 'v'; refreshToolbar() }

    if ((key === 'Delete' || key === 'Backspace') && selectedGuide) {
      e.preventDefault()
      removeGuide(selectedGuide)
    }

    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && key === 'z') {
      e.preventDefault()
      undo()
    }
    if ((e.metaKey || e.ctrlKey) && (e.shiftKey && key === 'z' || key === 'y')) {
      e.preventDefault()
      redo()
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (e.key === 'Alt') {
      altDown = false
      refreshSVG()
    }
  }


  function switchMode(m: Mode): void {
    mode = m
    if (m === 'select') {
      guidePreview.style.display = 'none'
      clearSVG()
    } else {
      // Entering guides mode: hide selection UI
      hlEl.style.display = 'none'
      selEl.style.display = 'none'
      clearSVG()
    }
    refreshToolbar()
  }


  function addGuide(dir: GuideDir, pos: number): Guide {
    const el = document.createElement('div')
    el.className = `lp-guide lp-guide-${dir}`
    positionGuide(el, dir, pos)
    document.body.appendChild(el)

    const guide: Guide = { id: ++guideIdSeq, dir, pos, el }
    guides.push(guide)

    // Select on click
    el.addEventListener('click', (e) => {
      e.stopPropagation()
      if (selectedGuide === guide) {
        deselect()
      } else {
        selectGuide(guide)
      }
    })

    // Drag
    let dragStart = 0
    let posStart = 0

    el.addEventListener('mousedown', (e) => {
      e.stopPropagation()
      selectGuide(guide)
      dragStart = dir === 'h' ? e.clientY : e.clientX
      posStart = guide.pos

      const onMove = (e: MouseEvent) => {
        const delta = (dir === 'h' ? e.clientY : e.clientX) - dragStart
        const newPos = Math.max(0, posStart + delta)
        guide.pos = newPos
        positionGuide(el, dir, newPos)
      }

      const onUp = () => {
        if (guide.pos !== posStart) {
          pushHistory({ type: 'move', guide, from: posStart, to: guide.pos })
        }
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })

    pushHistory({ type: 'add', guide })
    return guide
  }

  function removeGuide(g: Guide): void {
    g.el.remove()
    guides = guides.filter(x => x !== g)
    if (selectedGuide === g) selectedGuide = null
    pushHistory({ type: 'remove', guide: g })
  }

  function positionGuide(el: HTMLElement, dir: GuideDir, pos: number): void {
    if (dir === 'h') el.style.top = pos + 'px'
    else el.style.left = pos + 'px'
  }

  function selectGuide(g: Guide): void {
    selectedGuide?.el.classList.remove('lp-guide-sel')
    selectedGuide = g
    g.el.classList.add('lp-guide-sel')
  }

  function deselect(): void {
    selectedGuide?.el.classList.remove('lp-guide-sel')
    selectedGuide = null
  }


  function setBox(div: HTMLElement, el: Element): void {
    const r = el.getBoundingClientRect()
    div.style.cssText =
      `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;display:block`
  }


  function clearSVG(): void {
    while (svgLayer.lastChild && (svgLayer.lastChild as Element).tagName !== 'defs') {
      svgLayer.removeChild(svgLayer.lastChild)
    }
  }

  // Master SVG refresh — called on every state change
  function refreshSVG(): void {
    clearSVG()
    if (mode !== 'select') return

    if (altDown) {
      // Alt mode: distances
      if (selectedEl && hoveredEl && hoveredEl !== selectedEl) {
        // Element → element distances
        renderDistances(svgLayer, selectedEl, hoveredEl)
      } else if (hoveredEl) {
        // Just show the hovered box
        appendSVGRect(svgLayer, hoveredEl.getBoundingClientRect())
        drawDimensions(svgLayer, hoveredEl.getBoundingClientRect())
      }
      // Guide → element distances (always when Alt held and hovering)
      if (hoveredEl) renderGuideDistances(hoveredEl)
    } else {
      // Normal mode: dimensions + spacing overlay
      if (hoveredEl) drawDimensions(svgLayer, hoveredEl.getBoundingClientRect())
      if (selectedEl && selectedEl !== hoveredEl) {
        drawDimensions(svgLayer, selectedEl.getBoundingClientRect())
      }
      // Spacing overlay always visible on selected element
      if (selectedEl) drawSpacing(svgLayer, selectedEl)
    }
  }

  // Guide → element distance lines (Alt mode)
  function renderGuideDistances(el: Element): void {
    if (!guides.length) return
    const r = el.getBoundingClientRect()

    for (const g of guides) {
      if (g.dir === 'h') {
        const gY = g.pos
        if (gY < r.top) {
          const x = clamp(midX(r), 60, window.innerWidth - 60)
          drawMeasure(svgLayer, x, r.top, x, gY, px(r.top - gY))
        } else if (gY > r.bottom) {
          const x = clamp(midX(r), 60, window.innerWidth - 60)
          drawMeasure(svgLayer, x, r.bottom, x, gY, px(gY - r.bottom))
        }
      } else {
        const gX = g.pos
        if (gX < r.left) {
          const y = clamp(midY(r), 20, window.innerHeight - 20)
          drawMeasure(svgLayer, r.left, y, gX, y, px(r.left - gX))
        } else if (gX > r.right) {
          const y = clamp(midY(r), 20, window.innerHeight - 20)
          drawMeasure(svgLayer, r.right, y, gX, y, px(gX - r.right))
        }
      }
    }
  }

  function renderDistances(svg: SVGSVGElement, a: Element, b: Element): void {
    clearSVG()
    const ra = a.getBoundingClientRect()
    const rb = b.getBoundingClientRect()

    // Draw both bounding boxes in SVG so they're clear
    appendSVGRect(svg, ra)
    appendSVGRect(svg, rb)

    // Gap top: B is entirely above A
    if (rb.bottom <= ra.top) {
      const x = clamp(midX(ra), 60, window.innerWidth - 60)
      drawMeasure(svg, x, ra.top, x, rb.bottom, px(ra.top - rb.bottom))
    }
    // Gap bottom: B is entirely below A
    if (rb.top >= ra.bottom) {
      const x = clamp(midX(ra), 60, window.innerWidth - 60)
      drawMeasure(svg, x, ra.bottom, x, rb.top, px(rb.top - ra.bottom))
    }
    // Gap left: B is entirely to the left of A
    if (rb.right <= ra.left) {
      const y = clamp(midY(ra), 20, window.innerHeight - 20)
      drawMeasure(svg, ra.left, y, rb.right, y, px(ra.left - rb.right))
    }
    // Gap right: B is entirely to the right of A
    if (rb.left >= ra.right) {
      const y = clamp(midY(ra), 20, window.innerHeight - 20)
      drawMeasure(svg, ra.right, y, rb.left, y, px(rb.left - ra.right))
    }
  }


  toolbar.querySelector('#lp-t-sel')!.addEventListener('click', () => switchMode('select'))
  toolbar.querySelector('#lp-t-gui')!.addEventListener('click', () => switchMode('guides'))
  toolbar.querySelector('#lp-t-h')!.addEventListener('click', () => { guideDir = 'h'; refreshToolbar() })
  toolbar.querySelector('#lp-t-v')!.addEventListener('click', () => { guideDir = 'v'; refreshToolbar() })

  function refreshToolbar(): void {
    const selBtn = toolbar.querySelector('#lp-t-sel')!
    const guiBtn = toolbar.querySelector('#lp-t-gui')!
    const orient = toolbar.querySelector('#lp-orient') as HTMLElement
    const hBtn = toolbar.querySelector('#lp-t-h')!
    const vBtn = toolbar.querySelector('#lp-t-v')!

    selBtn.classList.toggle('lp-on', mode === 'select')
    guiBtn.classList.toggle('lp-on', mode === 'guides')
    orient.classList.toggle('lp-show', mode === 'guides')
    hBtn.classList.toggle('lp-on', guideDir === 'h')
    vBtn.classList.toggle('lp-on', guideDir === 'v')
  }


  function pushHistory(action: HistoryAction): void {
    history = history.slice(0, histIdx + 1)
    history.push(action)
    histIdx = history.length - 1
  }

  function undo(): void {
    if (histIdx < 0) return
    const action = history[histIdx--]
    applyInverse(action)
  }

  function redo(): void {
    if (histIdx >= history.length - 1) return
    const action = history[++histIdx]
    applyAction(action)
  }

  function applyAction(action: HistoryAction): void {
    if (action.type === 'add') {
      document.body.appendChild(action.guide.el)
      guides.push(action.guide)
    } else if (action.type === 'remove') {
      action.guide.el.remove()
      guides = guides.filter(g => g !== action.guide)
      if (selectedGuide === action.guide) selectedGuide = null
    } else if (action.type === 'move') {
      action.guide.pos = action.to
      positionGuide(action.guide.el, action.guide.dir, action.to)
    }
  }

  function applyInverse(action: HistoryAction): void {
    if (action.type === 'add') {
      action.guide.el.remove()
      guides = guides.filter(g => g !== action.guide)
      if (selectedGuide === action.guide) selectedGuide = null
    } else if (action.type === 'remove') {
      document.body.appendChild(action.guide.el)
      guides.push(action.guide)
    } else if (action.type === 'move') {
      action.guide.pos = action.from
      positionGuide(action.guide.el, action.guide.dir, action.from)
    }
  }


  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)


  function cleanup(): void {
    toolbar.remove()
    hlEl.remove()
    selEl.remove()
    svgLayer.remove()
    guidePreview.remove()
    guides.forEach(g => g.el.remove())
    document.getElementById('lp-css')?.remove()
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKeyDown)
    document.removeEventListener('keyup', onKeyUp)
    delete (window as any).__lp_cleanup
  }

  ;(window as any).__lp_cleanup = cleanup
  refreshToolbar()
}


function buildToolbar(): HTMLElement {
  const iconSelect = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z"/></svg>'
  const iconRuler =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="9" rx="1.5" fill="none"/><path d="M6 15v-2.5M9 15v-3.5M12 15v-2.5M15 15v-4M18 15v-2"/></svg>'
  const el = document.createElement('div')
  el.id = 'lp-toolbar'
  el.innerHTML =
    `<button id="lp-t-sel" class="lp-btn lp-on" data-tip="Select (S)">${iconSelect}</button>` +
    `<div class="lp-sep"></div>` +
    `<button id="lp-t-gui" class="lp-btn" data-tip="Ruler (G)">${iconRuler}</button>` +
    `<div id="lp-orient" class="lp-orient">` +
      `<button id="lp-t-h" class="lp-obtn lp-on">H</button>` +
      `<button id="lp-t-v" class="lp-obtn">V</button>` +
    `</div>`
  return el
}


function buildSVG(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.id = 'lp-svg'
  // Arrow markers
  svg.innerHTML =
    `<defs>` +
    `<marker id="lp-a0" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">` +
    `<path d="M0,0 L5,2.5 L0,5 Z" fill="#111827"/>` +
    `</marker>` +
    `<marker id="lp-a1" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto-start-reverse">` +
    `<path d="M0,0 L5,2.5 L0,5 Z" fill="#111827"/>` +
    `</marker>` +
    `</defs>`
  return svg
}


function appendSVGRect(svg: SVGSVGElement, r: DOMRect): void {
  const rect = createSVGEl<SVGRectElement>('rect')
  rect.setAttribute('x', String(r.left))
  rect.setAttribute('y', String(r.top))
  rect.setAttribute('width', String(r.width))
  rect.setAttribute('height', String(r.height))
  rect.setAttribute('fill', 'rgba(17,24,39,.06)')
  rect.setAttribute('stroke', '#111827')
  rect.setAttribute('stroke-width', '1.5')
  svg.appendChild(rect)
}

function drawMeasure(
  svg: SVGSVGElement,
  x1: number, y1: number,
  x2: number, y2: number,
  label: string,
): void {
  const g = createSVGEl<SVGGElement>('g')

  const line = createSVGEl<SVGLineElement>('line')
  attrs(line, {
    x1: String(x1), y1: String(y1),
    x2: String(x2), y2: String(y2),
    stroke: '#111827',
    'stroke-width': '1.5',
    'marker-start': 'url(#lp-a1)',
    'marker-end': 'url(#lp-a0)',
  })

  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const tw = label.length * 6.5 + 14
  const th = 18

  const bg = createSVGEl<SVGRectElement>('rect')
  attrs(bg, {
    x: String(mx - tw / 2),
    y: String(my - th / 2),
    width: String(tw),
    height: String(th),
    rx: '4',
    fill: '#111827',
  })

  const text = createSVGEl<SVGTextElement>('text')
  attrs(text, {
    x: String(mx),
    y: String(my + 1),
    'text-anchor': 'middle',
    'dominant-baseline': 'middle',
    fill: 'white',
    'font-size': '10',
    'font-family': 'SF Mono, Menlo, Monaco, Consolas, monospace',
    'font-weight': '500',
  })
  text.textContent = label

  g.appendChild(line)
  g.appendChild(bg)
  g.appendChild(text)
  svg.appendChild(g)
}


function drawDimensions(svg: SVGSVGElement, r: DOMRect): void {
  const pad = 7

  // Width label — above top center, fall back to below if near screen top
  const wx = clamp(midX(r), 28, window.innerWidth - 28)
  const wy = r.top - pad > 14 ? r.top - pad : r.bottom + pad + 8
  drawPill(svg, wx, wy, `${Math.round(r.width)}px`)

  // Height label — right of right edge, fall back to left if near screen edge
  const hy = clamp(midY(r), 10, window.innerHeight - 10)
  const hx = r.right + pad + 14 < window.innerWidth - 10
    ? r.right + pad + 14
    : r.left - pad - 14
  drawPill(svg, hx, hy, `${Math.round(r.height)}px`)
}

function drawPill(svg: SVGSVGElement, cx: number, cy: number, label: string, color = '#111827'): void {
  const tw = label.length * 5.8 + 12
  const th = 16
  const g = createSVGEl<SVGGElement>('g')

  const bg = createSVGEl<SVGRectElement>('rect')
  attrs(bg, {
    x: String(cx - tw / 2), y: String(cy - th / 2),
    width: String(tw), height: String(th),
    rx: '3', fill: color,
  })

  const text = createSVGEl<SVGTextElement>('text')
  attrs(text, {
    x: String(cx), y: String(cy + 1),
    'text-anchor': 'middle', 'dominant-baseline': 'middle',
    fill: 'white', 'font-size': '10',
    'font-family': 'SF Mono, Menlo, Monaco, Consolas, monospace',
    'font-weight': '500',
  })
  text.textContent = label

  g.appendChild(bg)
  g.appendChild(text)
  svg.appendChild(g)
}

// Shows padding (green), border (blue), margin (orange) on selected element

function drawSpacing(svg: SVGSVGElement, el: Element): void {
  const r = el.getBoundingClientRect()
  const cs = getComputedStyle(el)

  const mt = parseFloat(cs.marginTop) || 0
  const mr = parseFloat(cs.marginRight) || 0
  const mb = parseFloat(cs.marginBottom) || 0
  const ml = parseFloat(cs.marginLeft) || 0

  const bt = parseFloat(cs.borderTopWidth) || 0
  const br = parseFloat(cs.borderRightWidth) || 0
  const bb = parseFloat(cs.borderBottomWidth) || 0
  const bl = parseFloat(cs.borderLeftWidth) || 0

  const pt = parseFloat(cs.paddingTop) || 0
  const pr = parseFloat(cs.paddingRight) || 0
  const pb = parseFloat(cs.paddingBottom) || 0
  const pl = parseFloat(cs.paddingLeft) || 0

  // Margin strips (outside the element box)
  spRect(svg, r.left - ml, r.top - mt, r.width + ml + mr, mt, 'm')
  spRect(svg, r.left - ml, r.bottom, r.width + ml + mr, mb, 'm')
  spRect(svg, r.left - ml, r.top, ml, r.height, 'm')
  spRect(svg, r.right, r.top, mr, r.height, 'm')

  // Border strips
  spRect(svg, r.left, r.top, r.width, bt, 'b')
  spRect(svg, r.left, r.bottom - bb, r.width, bb, 'b')
  spRect(svg, r.left, r.top + bt, bl, r.height - bt - bb, 'b')
  spRect(svg, r.right - br, r.top + bt, br, r.height - bt - bb, 'b')

  // Padding strips (inside border)
  const ix = r.left + bl
  const iy = r.top + bt
  const iw = r.width - bl - br
  const ih = r.height - bt - bb
  spRect(svg, ix, iy, iw, pt, 'p')
  spRect(svg, ix, iy + ih - pb, iw, pb, 'p')
  spRect(svg, ix, iy + pt, pl, ih - pt - pb, 'p')
  spRect(svg, ix + iw - pr, iy + pt, pr, ih - pt - pb, 'p')

  // Labels — only for non-zero values, shown as small pills
  drawSpacingLabels(svg, r, { mt, mr, mb, ml }, { bt, br, bb, bl }, { pt, pr, pb, pl })
}

function spRect(svg: SVGSVGElement, x: number, y: number, w: number, h: number, type: 'm' | 'b' | 'p'): void {
  if (w <= 0 || h <= 0) return
  const fill = type === 'm'
    ? 'rgba(251,146,60,.3)'   // orange
    : type === 'b'
      ? 'rgba(96,165,250,.35)' // blue
      : 'rgba(52,211,153,.35)' // green
  const rect = createSVGEl<SVGRectElement>('rect')
  attrs(rect, { x: String(x), y: String(y), width: String(w), height: String(h), fill })
  svg.appendChild(rect)
}

function drawSpacingLabels(
  svg: SVGSVGElement,
  r: DOMRect,
  m: { mt: number; mr: number; mb: number; ml: number },
  b: { bt: number; br: number; bb: number; bl: number },
  p: { pt: number; pr: number; pb: number; pl: number },
): void {
  // Padding labels inside element (green)
  const ix = r.left + b.bl, iy = r.top + b.bt
  const iw = r.width - b.bl - b.br, ih = r.height - b.bt - b.bb
  if (p.pt > 0) drawPill(svg, ix + iw / 2, iy + p.pt / 2, `${Math.round(p.pt)}px`, '#10b981')
  if (p.pb > 0) drawPill(svg, ix + iw / 2, iy + ih - p.pb / 2, `${Math.round(p.pb)}px`, '#10b981')
  if (p.pl > 0) drawPill(svg, ix + p.pl / 2, iy + ih / 2, `${Math.round(p.pl)}px`, '#10b981')
  if (p.pr > 0) drawPill(svg, ix + iw - p.pr / 2, iy + ih / 2, `${Math.round(p.pr)}px`, '#10b981')

  // Margin labels outside element (orange)
  if (m.mt > 0) drawPill(svg, r.left + r.width / 2, r.top - m.mt / 2, `${Math.round(m.mt)}px`, '#f97316')
  if (m.mb > 0) drawPill(svg, r.left + r.width / 2, r.bottom + m.mb / 2, `${Math.round(m.mb)}px`, '#f97316')
  if (m.ml > 0) drawPill(svg, r.left - m.ml / 2, r.top + r.height / 2, `${Math.round(m.ml)}px`, '#f97316')
  if (m.mr > 0) drawPill(svg, r.right + m.mr / 2, r.top + r.height / 2, `${Math.round(m.mr)}px`, '#f97316')
}


function createSVGEl<T extends SVGElement>(tag: string): T {
  return document.createElementNS('http://www.w3.org/2000/svg', tag) as T
}

function attrs(el: SVGElement, map: Record<string, string>): void {
  for (const [k, v] of Object.entries(map)) el.setAttribute(k, v)
}

function midX(r: DOMRect): number { return (r.left + r.right) / 2 }
function midY(r: DOMRect): number { return (r.top + r.bottom) / 2 }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)) }
function px(n: number): string { return `${Math.round(n)}px` }

