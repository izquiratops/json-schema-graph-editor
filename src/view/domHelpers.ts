export function getCanvasWrapRect(): DOMRect {
  return document.getElementById('canvas-wrap')!.getBoundingClientRect();
}

export function portCenter(el: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  const wrap = getCanvasWrapRect();
  return {
    x: r.left - wrap.left + r.width / 2,
    y: r.top  - wrap.top  + r.height / 2,
  };
}
