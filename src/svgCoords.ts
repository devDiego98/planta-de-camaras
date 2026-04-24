export function clientToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const m = svg.getScreenCTM()
  if (!m) return { x: clientX, y: clientY }
  const p = pt.matrixTransform(m.inverse())
  return { x: p.x, y: p.y }
}
