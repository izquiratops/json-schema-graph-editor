import { State } from './state';
import { EdgeRenderer } from './edgeRenderer';

export const DragHandler = {
  _dragging: null as string | null,
  _offset: { x: 0, y: 0 },

  attach(el: HTMLElement, id: string): void {
    el.querySelector<HTMLElement>('.node-header')!.onmousedown = (e: MouseEvent) => {
      const ignore = ['INPUT', 'SELECT', 'BUTTON'];
      if (
        ignore.includes((e.target as HTMLElement).tagName) ||
        (e.target as HTMLElement).classList.contains('port-in')
      ) return;
      e.preventDefault();

      this._dragging = id;
      const rect = el.getBoundingClientRect();
      const wrap = document.getElementById('canvas-wrap')!.getBoundingClientRect();
      this._offset = {
        x: e.clientX - (rect.left - wrap.left),
        y: e.clientY - (rect.top  - wrap.top),
      };

      document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
      el.classList.add('selected');
    };
  },

  onMouseMove(e: MouseEvent): void {
    if (!this._dragging) return;
    const wrap = document.getElementById('canvas-wrap')!.getBoundingClientRect();
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
