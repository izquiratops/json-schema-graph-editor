import { State } from '../application/state';
import { PortHandler } from './portHandler';
import { portCenter } from './domHelpers';
import { ScreenCoords } from './types';

export class EdgeRenderer {
  public static render(): void {
    const svg = document.getElementById('svg') as unknown as SVGSVGElement;
    svg.innerHTML = '';

    State.edges.forEach(edge => {
      const s = edge.fromProp === undefined ? EdgeRenderer.portOutPos(edge.fromNode) : null;
      const t = edge.toProp === undefined ? null : EdgeRenderer.portInPos(edge.toNode, edge.toProp);
      // TODO: Should draw dirty edges from new/removed/dragged nodes
      if (s && t) EdgeRenderer.drawCurve(svg, s, t, 'edge');
    });

    const preview = PortHandler._preview;
    if (preview) {
      EdgeRenderer.drawCurve(
        svg,
        { x: preview.x, y: preview.y },
        { x: preview.ex, y: preview.ey },
        'edge-preview',
      );
    }
  }

  private static drawCurve(
    svg: SVGSVGElement,
    s: ScreenCoords,
    t: ScreenCoords,
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
  }

  private static portOutPos(nodeId: string): ScreenCoords | null {
    const port = document.querySelector<HTMLElement>(`#node-${nodeId} .node-header .port-out`);
    return port ? portCenter(port) : null;
  }

  private static portInPos(nodeId: string, propIdx?: number): ScreenCoords | null {
    const selector = propIdx === undefined
      ? `#node-${nodeId} .node-header .port-in`
      : `#prop-${nodeId}-${propIdx} .port-in`;
    const port = document.querySelector<HTMLElement>(selector);
    return port ? portCenter(port) : null;
  }
};
