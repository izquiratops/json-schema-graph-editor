import type { Edge, SchemaNode } from './types';

type NodesMap = Record<string, SchemaNode>;

function hasPropIndex(propIdx: number | undefined): propIdx is number {
  return propIdx !== undefined;
}

// Migration adapter: edges are the long-term source of truth, while _ref is
// temporarily maintained for compatibility with existing code paths.
export const EdgeRefs = {
  applyEdgeRef(nodes: NodesMap, edge: Edge): void {
    if (hasPropIndex(edge.fromProp) && !hasPropIndex(edge.toProp)) {
      const sourceProp = nodes[edge.fromNode]?.props[edge.fromProp];
      if (sourceProp) sourceProp._ref = edge.toNode;
    }

    if (!hasPropIndex(edge.fromProp) && hasPropIndex(edge.toProp)) {
      const targetProp = nodes[edge.toNode]?.props[edge.toProp];
      if (targetProp) targetProp._ref = edge.fromNode;
    }
  },

  clearEdgeRef(nodes: NodesMap, edge: Edge): void {
    if (hasPropIndex(edge.fromProp) && !hasPropIndex(edge.toProp)) {
      const sourceProp = nodes[edge.fromNode]?.props[edge.fromProp];
      if (sourceProp) sourceProp._ref = null;
    }

    if (!hasPropIndex(edge.fromProp) && hasPropIndex(edge.toProp)) {
      const targetProp = nodes[edge.toNode]?.props[edge.toProp];
      if (targetProp) targetProp._ref = null;
    }
  },

  getRefForProp(nodes: NodesMap, edges: Edge[], nodeId: string, propIdx: number): string | null {
    const outgoing = edges.find(edge => edge.fromNode === nodeId && edge.fromProp === propIdx && edge.toProp === undefined);
    if (outgoing) return outgoing.toNode;

    const incoming = edges.find(edge => edge.toNode === nodeId && edge.toProp === propIdx && edge.fromProp === undefined);
    if (incoming) return incoming.fromNode;

    return nodes[nodeId]?.props[propIdx]?._ref ?? null;
  },

  syncRefsFromEdges(nodes: NodesMap, edges: Edge[]): void {
    Object.values(nodes).forEach(node => {
      node.props.forEach(prop => {
        prop._ref = null;
      });
    });

    edges.forEach(edge => this.applyEdgeRef(nodes, edge));
  },
};
