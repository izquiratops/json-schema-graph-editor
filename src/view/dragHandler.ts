import { State } from '../application/state';
import { EdgeRenderer } from './edgeRenderer';
import { getCanvasWrapRect } from './domHelpers';
import { ScreenCoords } from './types';

export class DragHandler {
  private static draggingId: string | null = null;
  private static grabOffset: ScreenCoords = { x: 0, y: 0 };

  public static attach(el: HTMLElement, id: string): void {
    el.querySelector<HTMLElement>('.badge')!.onmousedown = (e: MouseEvent) => {
      e.preventDefault();
      // Mousedown on badge fires the dragging state
      DragHandler.draggingId = id;

      // Save the point where the node starts moving from
      const rect = el.getBoundingClientRect();
      DragHandler.grabOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Apply selection to show the current dragging node highlighted
      document.querySelectorAll('.node').forEach(n => n.classList.remove('selected'));
      el.classList.add('selected');

      // Move the node element to the end of the #canvas div
      el.parentElement!.appendChild(el);
    };
  }

  public static onMouseMove(e: MouseEvent): void {
    // Ignore event, nothing dragging over here
    if (!DragHandler.draggingId) return;

    // Calc position
    const canvasRect = getCanvasWrapRect();
    const node = State.nodes[DragHandler.draggingId]!;
    node.x = e.clientX - canvasRect.left - DragHandler.grabOffset.x;
    node.y = e.clientY - canvasRect.top  - DragHandler.grabOffset.y;
    // Apply position
    const el = document.getElementById('node-' + DragHandler.draggingId)!;
    el.style.left = node.x + 'px';
    el.style.top  = node.y + 'px';
    EdgeRenderer.render();
  }

  public static onMouseUp(): void {
    DragHandler.draggingId = null;
  }
};
