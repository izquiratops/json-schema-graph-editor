import { State, type StateChangeEvent } from './state';
import { NodeManager } from './nodeManager';
import { EdgeRenderer } from './edgeRenderer';
import { SchemaOutput } from './schemaOutput';

interface PendingRender {
  nodeIds: Set<string>;
  redrawEdges: boolean;
  updateSchema: boolean;
  scheduled: boolean;
}

const pending: PendingRender = {
  nodeIds: new Set<string>(),
  redrawEdges: false,
  updateSchema: false,
  scheduled: false,
};

function flush(): void {
  pending.nodeIds.forEach(nodeId => {
    if (State.nodes[nodeId]) NodeManager.render(nodeId);
  });

  if (pending.redrawEdges) EdgeRenderer.render();
  if (pending.updateSchema) SchemaOutput.update();

  pending.nodeIds.clear();
  pending.redrawEdges = false;
  pending.updateSchema = false;
  pending.scheduled = false;
}

function scheduleFlush(): void {
  if (pending.scheduled) return;
  pending.scheduled = true;
  queueMicrotask(flush);
}

function onStateChange(event: StateChangeEvent): void {
  if (event.type === 'nodeAdded' || event.type === 'nodeUpdated') {
    pending.nodeIds.add(event.nodeId);
    pending.redrawEdges = true;
    pending.updateSchema = true;
  }

  if (event.type === 'propUpdated') {
    pending.nodeIds.add(event.nodeId);
    pending.redrawEdges = true;
    pending.updateSchema = true;
  }

  if (event.type === 'nodeRemoved') {
    pending.redrawEdges = true;
    pending.updateSchema = true;
  }

  if (event.type === 'edgeAdded' || event.type === 'edgesRemoved' || event.type === 'edgesReindexed') {
    pending.redrawEdges = true;
    pending.updateSchema = true;
  }

  if (event.type === 'stateReset') {
    pending.redrawEdges = true;
    pending.updateSchema = true;
  }

  scheduleFlush();
}

export function startRenderCoordinator(): () => void {
  return State.onChange(onStateChange);
}
