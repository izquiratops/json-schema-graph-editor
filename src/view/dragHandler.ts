import { State } from '../application/state';
import { EdgeRenderer } from './edgeRenderer';
import { getCanvasWrapRect } from './domHelpers';

export const DragHandler = {
  _dragging: null as string | null,
  _offset: { x: 0, y: 0 },

  attach(el: HTMLElement, id: string): void {
    el.querySelector<HTMLElement>('.badge')!.onmousedown = (e: MouseEvent) => {
      e.preventDefault();
      this._dragging = id;
      const rect = el.getBoundingClientRect();
      const wrap = getCanvasWrapRect();
      this._offset = {
        x: e.clientX - (rect.left - wrap.left),
        y: e.clientY - (rect.top  - wrap.top),
      };

      document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
      el.classList.add('selected');

      // Move the node element to the end of the #canvas div
      el.parentElement!.appendChild(el);
    };
  },

  onMouseMove(e: MouseEvent): void {
    if (!this._dragging) return;
    const wrap = getCanvasWrapRect();
    const node = State.nodes[this._dragging]!;
    node.x = e.clientX - wrap.left - this._offset.x;
    node.y = e.clientY - wrap.top  - this._offset.y;
    const el = document.getElementById('node-' + this._dragging)!;
    el.style.left = node.x + 'px';
    el.style.top  = node.y + 'px';
    EdgeRenderer.render();
  },

  onMouseUp(): void { this._dragging = null; },
};
