import { State } from './state';
import { NodeManager } from './nodeManager';
import { DragHandler } from './dragHandler';
import { PortHandler } from './portHandler';
import { SchemaOutput } from './schemaOutput';
import { startRenderCoordinator } from './renderCoordinator';

// Expose to global scope for inline HTML onclick handlers
declare global {
  interface Window {
    NodeManager: typeof NodeManager;
    State: typeof State;
    SchemaOutput: typeof SchemaOutput;
  }
}

window.NodeManager  = NodeManager;
window.State        = State;
window.SchemaOutput = SchemaOutput;

document.addEventListener('mousemove', (e: MouseEvent) => {
  DragHandler.onMouseMove(e);
  PortHandler.onMouseMove(e);
});

document.addEventListener('mouseup', () => {
  DragHandler.onMouseUp();
  PortHandler.onMouseUp();
});

startRenderCoordinator();

function initDemo(): void {
  State.addNode({
    id: 'root', type: 'object', name: 'root',
    x: 30, y: 80,
    props: [
      { name: 'id',      type: 'string'  },
      { name: 'age',     type: 'number'  },
      { name: 'active',  type: 'boolean' },
      { name: 'address', type: 'object' },
    ],
  });
  State._nextId = 1;

  State.addNode({
    id: 'n2', type: 'object', name: 'address',
    x: 290, y: 190,
    props: [
      { name: 'street', type: 'string' },
      { name: 'city',   type: 'string' },
    ],
  });
  State._nextId = 2;

  State.addEdge({ fromNode: 'root', fromProp: 3, toNode: 'n2' });
}

initDemo();
