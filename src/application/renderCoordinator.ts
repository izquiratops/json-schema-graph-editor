import { State, type StateChangeEvent } from './state';

export interface RenderCallbacks {
  renderNode(nodeId: string): void;
  removeNodeElement(nodeId: string): void;
  renderEdges(): void;
  updateSchemaOutput(): void;
}

interface PendingRender {
  nodeIds: Set<string>;
  removeIds: Set<string>;
  redrawEdges: boolean;
  updateSchema: boolean;
  scheduled: boolean;
}

let callbacks: RenderCallbacks;

const pending: PendingRender = {
  nodeIds: new Set<string>(),
  removeIds: new Set<string>(),
  redrawEdges: false,
  updateSchema: false,
  scheduled: false,
};

function flush(): void {
  pending.removeIds.forEach(nodeId => {
    callbacks.removeNodeElement(nodeId);
  });

  pending.nodeIds.forEach(nodeId => {
    if (State.nodes[nodeId]) callbacks.renderNode(nodeId);
  });

  if (pending.redrawEdges) callbacks.renderEdges();
  if (pending.updateSchema) callbacks.updateSchemaOutput();

  pending.nodeIds.clear();
  pending.removeIds.clear();
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
    pending.removeIds.add(event.nodeId);
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

export function startRenderCoordinator(cb: RenderCallbacks): () => void {
  callbacks = cb;
  return State.onChange(onStateChange);
}
