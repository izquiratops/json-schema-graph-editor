import { State } from '../application/state';
import { EdgeRenderer } from './edgeRenderer';
import { getCanvasWrapRect } from './domHelpers';

export const DragHandler = {
  _dragging: null as string | null,
  _grabOffset: { x: 0, y: 0 },

  attach(el: HTMLElement, id: string): void {
    el.querySelector<HTMLElement>('.badge')!.onmousedown = (e: MouseEvent) => {
      e.preventDefault();
      this._dragging = id;
      const rect = el.getBoundingClientRect();
      this._grabOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
      el.classList.add('selected');

      // Move the node element to the end of the #canvas div
      el.parentElement!.appendChild(el);
    };
  },

  onMouseMove(e: MouseEvent): void {
    if (!this._dragging) return;
    const canvasRect = getCanvasWrapRect();
    const node = State.nodes[this._dragging]!;
    node.x = e.clientX - canvasRect.left - this._grabOffset.x;
    node.y = e.clientY - canvasRect.top  - this._grabOffset.y;
    const el = document.getElementById('node-' + this._dragging)!;
    el.style.left = node.x + 'px';
    el.style.top  = node.y + 'px';
    EdgeRenderer.render();
  },

  onMouseUp(): void { this._dragging = null; },
};
