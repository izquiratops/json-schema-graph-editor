import type { PropType, SchemaNode, Edge } from '../domain/types';
import { validateEdge } from '../domain/edgeValidation';


const _state = {
  nodes: {} as Record<string, SchemaNode>,
  edges: [] as Edge[],
  _nextId: 0,
};

export type StateChangeEvent =
  | { type: 'nodeAdded'; nodeId: string }
  | { type: 'nodeRemoved'; nodeId: string }
  | { type: 'nodeUpdated'; nodeId: string }
  | { type: 'propUpdated'; nodeId: string; propIdx: number }
  | { type: 'edgeAdded'; edge: Edge }
  | { type: 'edgesRemoved'; edges: Edge[] }
  | { type: 'edgesReindexed'; nodeId: string; deletedIdx: number }
  | { type: 'stateReset' };

type StateChangeListener = (event: StateChangeEvent) => void;

const listeners = new Set<StateChangeListener>();

function emitChange(event: StateChangeEvent): void {
  listeners.forEach(listener => listener(event));
}

function hasPropIndex(propIdx: number | undefined): propIdx is number {
  return propIdx !== undefined;
}

function getNode(nodeId: string): SchemaNode {
  const node = _state.nodes[nodeId];
  if (!node) throw new Error(`Unknown node: "${nodeId}".`);
  return node;
}

function getProp(nodeId: string, propIdx: number) {
  const node = getNode(nodeId);
  if (node.type !== 'object') throw new Error(`Node "${nodeId}" does not support properties.`);
  const prop = node.props[propIdx];
  if (!prop) throw new Error(`Unknown prop: "${nodeId}[${propIdx}]".`);
  return prop;
}

function sameSourcePort(left: Edge, right: Edge): boolean {
  return left.fromNode === right.fromNode && left.fromProp === right.fromProp;
}

function sameTargetPort(left: Edge, right: Edge): boolean {
  return left.toNode === right.toNode && left.toProp === right.toProp;
}

function removeEdges(predicate: (edge: Edge) => boolean): void {
  const removed = _state.edges.filter(predicate);
  _state.edges = _state.edges.filter(edge => !predicate(edge));
  if (removed.length > 0) emitChange({ type: 'edgesRemoved', edges: removed });
}

export const State = {
  get nodes() { return _state.nodes; },
  get edges() { return _state.edges; },
  get _nextId() { return _state._nextId; },
  set _nextId(v: number) { _state._nextId = v; },

  onChange(listener: StateChangeListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  offChange(listener: StateChangeListener): void {
    listeners.delete(listener);
  },

  uid(): string { return 'n' + (++_state._nextId); },

  addNode(node: SchemaNode): void {
    _state.nodes[node.id] = {
      ...node,
      props: node.type === 'array' ? [] : node.props,
      ...(node.type === 'array'
        ? { items: node.items ?? { type: 'string' } }
        : {}),
    };
    emitChange({ type: 'nodeAdded', nodeId: node.id });
  },

  removeNode(id: string): void {
    delete _state.nodes[id];
    emitChange({ type: 'nodeRemoved', nodeId: id });
  },

  setNodeTitle(nodeId: string, title: string): void {
    getNode(nodeId).title = title;
    emitChange({ type: 'nodeUpdated', nodeId });
  },

  setNodeName(nodeId: string, name: string): void {
    this.setNodeTitle(nodeId, name);
  },

  setNodeDescription(nodeId: string, description: string): void {
    getNode(nodeId).description = description;
    emitChange({ type: 'nodeUpdated', nodeId });
  },

  setPropName(nodeId: string, propIdx: number, name: string): void {
    getProp(nodeId, propIdx).name = name;
    emitChange({ type: 'propUpdated', nodeId, propIdx });
  },

  addProp(nodeId: string, prop: SchemaNode['props'][number]): void {
    getNode(nodeId).props.push(prop);
    emitChange({ type: 'nodeUpdated', nodeId });
  },

  removeProp(nodeId: string, propIdx: number): void {
    const node = getNode(nodeId);
    node.props.splice(propIdx, 1);
    emitChange({ type: 'nodeUpdated', nodeId });
  },

  setPropRequired(nodeId: string, propIdx: number, required: boolean): void {
    getProp(nodeId, propIdx).required = required;
    emitChange({ type: 'propUpdated', nodeId, propIdx });
  },

  setPropType(nodeId: string, propIdx: number, type: SchemaNode['props'][number]['type']): void {
    getProp(nodeId, propIdx).type = type;
    emitChange({ type: 'propUpdated', nodeId, propIdx });
  },

  setArrayItemType(nodeId: string, type: PropType): void {
    const node = getNode(nodeId);
    if (node.type !== 'array' || !node.items) throw new Error(`Node "${nodeId}" does not support items.`);
    node.items.type = type;
    emitChange({ type: 'nodeUpdated', nodeId });
  },

  addEdge(edge: Edge): void {
    validateEdge(_state.nodes, edge);

    removeEdges(existing => sameTargetPort(existing, edge));
    // One outgoing edge per output port. When anyOf/oneOf nodes are implemented,
    // this restriction should be lifted for props that belong to those types.
    removeEdges(existing => sameSourcePort(existing, edge));
    _state.edges.push(edge);
    emitChange({ type: 'edgeAdded', edge });
  },

  removeEdgesOf(nodeId: string): void {
    removeEdges(edge => edge.fromNode === nodeId || edge.toNode === nodeId);
  },

  removeEdgeFromProp(nodeId: string, propIdx: number): void {
    removeEdges(edge =>
      (edge.fromNode === nodeId && edge.fromProp === propIdx)
      || (edge.toNode === nodeId && edge.toProp === propIdx),
    );
  },

  shiftEdgePropIndices(nodeId: string, deletedIdx: number): void {
    _state.edges = _state.edges.map(e =>
      ({
        ...e,
        fromProp: e.fromNode === nodeId && hasPropIndex(e.fromProp) && e.fromProp > deletedIdx
          ? e.fromProp - 1
          : e.fromProp,
        toProp: e.toNode === nodeId && hasPropIndex(e.toProp) && e.toProp > deletedIdx
          ? e.toProp - 1
          : e.toProp,
      }),
    );
    emitChange({ type: 'edgesReindexed', nodeId, deletedIdx });
  },

  /** Reset to empty — used in tests. */
  _reset(): void {
    _state.nodes = {};
    _state.edges = [];
    _state._nextId = 0;
    emitChange({ type: 'stateReset' });
  },
};
