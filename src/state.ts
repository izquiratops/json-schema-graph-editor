import { IS_PRIMITIVE } from './constants';
import type { SchemaNode, Edge } from './types';

const _state = {
  nodes: {} as Record<string, SchemaNode>,
  edges: [] as Edge[],
  _nextId: 0,
};

function hasPropIndex(propIdx: number | undefined): propIdx is number {
  return propIdx !== undefined;
}

function getNode(nodeId: string): SchemaNode {
  const node = _state.nodes[nodeId];
  if (!node) throw new Error(`Unknown node: "${nodeId}".`);
  return node;
}

function getProp(nodeId: string, propIdx: number) {
  const prop = getNode(nodeId).props[propIdx];
  if (!prop) throw new Error(`Unknown prop: "${nodeId}[${propIdx}]".`);
  return prop;
}

function clearEdgeRef(edge: Edge): void {
  if (hasPropIndex(edge.fromProp) && !hasPropIndex(edge.toProp)) {
    const prop = _state.nodes[edge.fromNode]?.props[edge.fromProp];
    if (prop) prop._ref = null;
  }

  if (!hasPropIndex(edge.fromProp) && hasPropIndex(edge.toProp)) {
    const prop = _state.nodes[edge.toNode]?.props[edge.toProp];
    if (prop) prop._ref = null;
  }
}

function applyEdgeRef(edge: Edge): void {
  if (hasPropIndex(edge.fromProp) && !hasPropIndex(edge.toProp)) {
    getProp(edge.fromNode, edge.fromProp)._ref = edge.toNode;
  }

  if (!hasPropIndex(edge.fromProp) && hasPropIndex(edge.toProp)) {
    getProp(edge.toNode, edge.toProp)._ref = edge.fromNode;
  }
}

function sameSourcePort(left: Edge, right: Edge): boolean {
  return left.fromNode === right.fromNode && left.fromProp === right.fromProp;
}

function sameTargetPort(left: Edge, right: Edge): boolean {
  return left.toNode === right.toNode && left.toProp === right.toProp;
}

function removeEdges(predicate: (edge: Edge) => boolean): void {
  const removed = _state.edges.filter(predicate);
  removed.forEach(clearEdgeRef);
  _state.edges = _state.edges.filter(edge => !predicate(edge));
}

export const State = {
  get nodes() { return _state.nodes; },
  get edges() { return _state.edges; },
  get _nextId() { return _state._nextId; },
  set _nextId(v: number) { _state._nextId = v; },

  uid(): string { return 'n' + (++_state._nextId); },

  addNode(node: SchemaNode): void { _state.nodes[node.id] = node; },
  removeNode(id: string): void    { delete _state.nodes[id]; },

  addEdge(edge: Edge): void {
    const hasFromProp = hasPropIndex(edge.fromProp);
    const hasToProp = hasPropIndex(edge.toProp);

    if (hasFromProp === hasToProp) {
      throw new Error('Connections must link a node header to a prop row, or a prop row to a node header.');
    }

    const sourceType = hasFromProp
      ? getProp(edge.fromNode, edge.fromProp as number).type
      : getNode(edge.fromNode).type;
    const targetType = hasToProp
      ? getProp(edge.toNode, edge.toProp as number).type
      : getNode(edge.toNode).type;

    if (sourceType !== targetType) {
      throw new Error(
        `Type mismatch: source type "${sourceType}" is not compatible with target type "${targetType}".`,
      );
    }

    removeEdges(existing => sameTargetPort(existing, edge));
    // One outgoing edge per output port. When anyOf/oneOf nodes are implemented,
    // this restriction should be lifted for props that belong to those types.
    removeEdges(existing => sameSourcePort(existing, edge));
    _state.edges.push(edge);
    applyEdgeRef(edge);
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
  },

  /** Reset to empty — used in tests. */
  _reset(): void {
    _state.nodes = {};
    _state.edges = [];
    _state._nextId = 0;
  },
};
