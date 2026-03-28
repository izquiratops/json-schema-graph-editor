import type { SchemaNode, Edge } from './types';

const _state = {
  nodes: {} as Record<string, SchemaNode>,
  edges: [] as Edge[],
  _nextId: 0,
};

export const State = {
  get nodes() { return _state.nodes; },
  get edges() { return _state.edges; },
  get _nextId() { return _state._nextId; },
  set _nextId(v: number) { _state._nextId = v; },

  uid(): string { return 'n' + (++_state._nextId); },

  addNode(node: SchemaNode): void { _state.nodes[node.id] = node; },
  removeNode(id: string): void    { delete _state.nodes[id]; },

  addEdge(edge: Edge): void {
    const propType  = _state.nodes[edge.fromNode]?.props[edge.fromProp]?.type;
    const nodeType  = _state.nodes[edge.toNode]?.type;
    if (propType !== nodeType) {
      throw new Error(
        `Type mismatch: prop type "${propType}" is not compatible with node type "${nodeType}".`,
      );
    }

    // One incoming edge per target node
    _state.edges = _state.edges.filter(e => e.toNode !== edge.toNode);
    // One outgoing edge per output port. When anyOf/oneOf nodes are implemented,
    // this restriction should be lifted for props that belong to those types.
    _state.edges = _state.edges.filter(
      e => !(e.fromNode === edge.fromNode && e.fromProp === edge.fromProp),
    );
    _state.edges.push(edge);
  },

  removeEdgesOf(nodeId: string): void {
    _state.edges = _state.edges.filter(
      e => e.fromNode !== nodeId && e.toNode !== nodeId,
    );
  },

  removeEdgeFromProp(nodeId: string, propIdx: number): void {
    _state.edges = _state.edges.filter(
      e => !(e.fromNode === nodeId && e.fromProp === propIdx),
    );
  },

  shiftEdgePropIndices(nodeId: string, deletedIdx: number): void {
    _state.edges = _state.edges.map(e =>
      e.fromNode === nodeId && e.fromProp > deletedIdx
        ? { ...e, fromProp: e.fromProp - 1 }
        : e,
    );
  },

  /** Reset to empty — used in tests. */
  _reset(): void {
    _state.nodes = {};
    _state.edges = [];
    _state._nextId = 0;
  },
};
