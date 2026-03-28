import { State } from './state';
import { EdgeRenderer } from './edgeRenderer';
import { SchemaOutput } from './schemaOutput';

interface Preview {
  fromNode: string;
  fromProp: number;
  x: number;
  y: number;
  ex: number;
  ey: number;
}

export const PortHandler = {
  _preview: null as Preview | null,

  attach(el: HTMLElement, id: string): void {
    // Output ports (on prop rows)
    el.querySelectorAll<HTMLElement>('.port-out').forEach(port => {
      port.onmousedown = (e: MouseEvent) => {
        e.stopPropagation(); e.preventDefault();
        const pos = this.center(port);
        this._preview = {
          fromNode: id,
          fromProp: Number(port.dataset['prop']),
          ...pos,
          ex: pos.x,
          ey: pos.y,
        };
      };
    });

    // Input port (on node header)
    const portIn = el.querySelector<HTMLElement>('.port-in');
    if (portIn) {
      portIn.onmouseup = (e: MouseEvent) => {
        if (!this._preview || this._preview.fromNode === id) return;
        e.stopPropagation();
        const { fromNode, fromProp } = this._preview;
        try {
          State.addEdge({ fromNode, fromProp, toNode: id });
          // TODO: This throws if an output node port is attached to an input node port (instead of an input prop port) 
          State.nodes[fromNode]!.props[fromProp]!._ref = id;
        } catch (error) {
          const { message } = error as Error;
          console.warn(message);
        }
        this._preview = null;
        EdgeRenderer.render();
        SchemaOutput.update();
      };
    }
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
};
