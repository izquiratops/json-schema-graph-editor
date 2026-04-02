import { State } from '../application/state';
import { PortHandler } from './portHandler';
import { portCenter } from './domHelpers';

export const EdgeRenderer = {
  render(): void {
    const svg = document.getElementById('svg') as unknown as SVGSVGElement;
    svg.innerHTML = '';

    State.edges.forEach(edge => {
      const s = this._portOutPos(edge.fromNode, edge.fromProp);
      const t = this._portInPos(edge.toNode, edge.toProp);
      if (s && t) this._drawCurve(svg, s, t, 'edge');
    });

    const preview = PortHandler._preview;
    if (preview) {
      this._drawCurve(
        svg,
        { x: preview.x, y: preview.y },
        { x: preview.ex, y: preview.ey },
        'edge-preview',
      );
    }
  },

  _drawCurve(
    svg: SVGSVGElement,
    s: { x: number; y: number },
    t: { x: number; y: number },
    cssClass: string,
  ): void {
    const cp = Math.abs(t.x - s.x) * 0.5;
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', cssClass);
    path.setAttribute(
      'd',
      `M${s.x},${s.y} C${s.x + cp},${s.y} ${t.x - cp},${t.y} ${t.x},${t.y}`,
    );
    svg.appendChild(path);
  },

  _portOutPos(nodeId: string, propIdx?: number): { x: number; y: number } | null {
    const selector = propIdx === undefined
      ? `#node-${nodeId} .node-header .port-out`
      : `#prop-${nodeId}-${propIdx} .port-out`;
    const port = document.querySelector<HTMLElement>(selector);
    return port ? portCenter(port) : null;
  },

  _portInPos(nodeId: string, propIdx?: number): { x: number; y: number } | null {
    const selector = propIdx === undefined
      ? `#node-${nodeId} .node-header .port-in`
      : `#prop-${nodeId}-${propIdx} .port-in`;
    const port = document.querySelector<HTMLElement>(selector);
    return port ? portCenter(port) : null;
  },
};
