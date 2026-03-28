import { State } from './state';
import { EdgeRenderer } from './edgeRenderer';
import { SchemaOutput } from './schemaOutput';

interface Preview {
  fromNode: string;
  fromProp?: number;
  x: number;
  y: number;
  ex: number;
  ey: number;
}

export const PortHandler = {
  _preview: null as Preview | null,

  attach(el: HTMLElement, id: string): void {
    // Output ports (node headers and prop rows)
    el.querySelectorAll<HTMLElement>('.port-out').forEach(port => {
      port.onmousedown = (e: MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        const pos = this.center(port);
        this._preview = {
          fromNode: id,
          fromProp: this._propIndex(port),
          ...pos,
          ex: pos.x,
          ey: pos.y,
        };
      };
    });

    // Input ports (node headers and prop rows)
    el.querySelectorAll<HTMLElement>('.port-in').forEach(port => {
      port.onmouseup = (e: MouseEvent) => {
        if (!this._preview || this._preview.fromNode === id) return;
        e.stopPropagation();
        const { fromNode, fromProp } = this._preview;
        const toProp = this._propIndex(port);
        try {
          State.addEdge({ fromNode, fromProp, toNode: id, toProp });
        } catch (error) {
          const { message } = error as Error;
          console.warn(message);
        }
        this._preview = null;
        EdgeRenderer.render();
        SchemaOutput.update();
      };
    });
  },

  onMouseMove(e: MouseEvent): void {
    if (!this._preview) return;
    const wrap = document.getElementById('canvas-wrap')!.getBoundingClientRect();
    this._preview.ex = e.clientX - wrap.left;
    this._preview.ey = e.clientY - wrap.top;
    EdgeRenderer.render();
  },

  onMouseUp(): void {
    if (this._preview) { this._preview = null; EdgeRenderer.render(); }
  },

  center(el: HTMLElement): { x: number; y: number } {
    const r = el.getBoundingClientRect();
    const wrap = document.getElementById('canvas-wrap')!.getBoundingClientRect();
    return {
      x: r.left - wrap.left + r.width / 2,
      y: r.top  - wrap.top  + r.height / 2,
    };
  },

  _propIndex(el: HTMLElement): number | undefined {
    const prop = el.dataset['prop'];
    if (prop === undefined) return undefined;

    const propIdx = Number(prop);
    return Number.isNaN(propIdx) ? undefined : propIdx;
  },
};
