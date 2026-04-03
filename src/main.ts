import { State } from './application/state';
import { NodeCommands } from './application/nodeCommands';
import { startRenderCoordinator } from './application/renderCoordinator';
import { NodeRenderer } from './view/nodeRenderer';
import { EdgeRenderer } from './view/edgeRenderer';
import { DragHandler } from './view/dragHandler';
import { PortHandler } from './view/portHandler';
import { SchemaOutput } from './view/schemaOutput';

// Expose to global scope for inline HTML onclick handlers
declare global {
  interface Window {
    NodeCommands: typeof NodeCommands;
    State: typeof State;
    SchemaOutput: typeof SchemaOutput;
  }
}

window.NodeCommands = NodeCommands;
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

startRenderCoordinator({
  renderNode: (id) => NodeRenderer.render(id),
  removeNodeElement: (id) => document.getElementById('node-' + id)?.remove(),
  renderEdges: () => EdgeRenderer.render(),
  updateSchemaOutput: () => SchemaOutput.update(),
});

function initDemo(): void {
  State.addNode({
    id: 'root', type: 'object', title: 'Person', description: 'A person record',
    x: 430, y: 80,
    props: [
      { name: 'id',      type: 'string'  },
      { name: 'age',     type: 'number'  },
      { name: 'active',  type: 'boolean' },
      { name: 'address', type: 'object' },
    ],
  });

  State.addNode({
    id: 'n1', type: 'object', title: 'Address', description: 'Mailing address',
    x: 80, y: 190,
    props: [
      { name: 'street', type: 'string' },
      { name: 'city',   type: 'string' },
    ],
  });

  State.addEdge({
    fromNode: 'n1', toNode: 'root', toProp: 3,
  });
}

initDemo();
