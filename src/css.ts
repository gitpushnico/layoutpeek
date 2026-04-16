export const CSS = `
#lp-toolbar {
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 2147483647;
  display: flex;
  align-items: center;
  gap: 2px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,.1);
  border-radius: 10px;
  padding: 5px;
  box-shadow: 0 2px 12px rgba(0,0,0,.12), 0 0 0 .5px rgba(0,0,0,.05);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  user-select: none;
}

.lp-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 7px;
  cursor: pointer;
  color: #6b7280;
  transition: background .12s, color .12s;
  position: relative;
}

.lp-btn:hover { background: #f3f4f6; color: #111827; }
.lp-btn.lp-on { background: rgba(17,24,39,.1); color: #111827; }

.lp-sep {
  width: 1px;
  height: 18px;
  background: rgba(0,0,0,.08);
  margin: 0 2px;
}

/* H/V orientation buttons */
.lp-orient {
  display: none;
  align-items: center;
  gap: 1px;
  background: #f3f4f6;
  border-radius: 5px;
  padding: 2px;
  margin-left: 2px;
}

.lp-orient.lp-show { display: flex; }

.lp-obtn {
  width: 24px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  letter-spacing: .04em;
  transition: background .1s, color .1s;
  font-family: inherit;
}

.lp-obtn.lp-on { background: #ffffff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,.1); }

/* Tooltip */
.lp-btn::after {
  content: attr(data-tip);
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: #fff;
  font-size: 10px;
  white-space: nowrap;
  padding: 3px 7px;
  border-radius: 4px;
  pointer-events: none;
  opacity: 0;
  transition: opacity .1s;
  letter-spacing: .02em;
}

.lp-btn:hover::after { opacity: 1; }

#lp-hl {
  position: fixed;
  z-index: 2147483645;
  pointer-events: none;
  background: rgba(17,24,39,.06);
  outline: 1.5px solid rgba(17,24,39,.58);
  outline-offset: 0;
  border-radius: 1px;
  display: none;
}

#lp-sel {
  position: fixed;
  z-index: 2147483645;
  pointer-events: none;
  background: rgba(17,24,39,.08);
  outline: 2px solid #111827;
  outline-offset: 0;
  border-radius: 1px;
  display: none;
}

.lp-guide {
  position: fixed;
  z-index: 2147483646;
  background: rgba(249,115,22,.7);
  cursor: pointer;
  transition: background .1s;
}

.lp-guide:hover { background: rgba(249,115,22,1); }
.lp-guide.lp-guide-sel { background: rgba(249,115,22,1); outline: 1px solid rgba(249,115,22,.4); }

.lp-guide-h {
  left: 0;
  width: 100%;
  height: 1px;
  cursor: ns-resize;
}

.lp-guide-v {
  top: 0;
  height: 100%;
  width: 1px;
  cursor: ew-resize;
}

.lp-guide-preview {
  pointer-events: none !important;
  opacity: 0.45;
  display: none;
  background: rgba(249,115,22,.8) !important;
}

#lp-svg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2147483646;
  pointer-events: none;
  overflow: visible;
}
`;
