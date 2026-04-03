import type { Edge, SchemaNode } from './types';

type NodesMap = Record<string, SchemaNode>;

/**
 * EdgeRefs - Edge lookup adapter for graph connections
 *
 * Provides utilities for querying graph edge connections from State.edges.
 * Abstracts edge resolution logic for schema rendering, validation, and serialization.
 */
export const EdgeRefs = {
  /**
   * Finds the connected node for a specific property on a node.
   *
    * Searches for the incoming node-header -> property connection.
   *
   * @param _nodes - Map of all schema nodes (unused, kept for compatibility)
   * @param edges - Array of edges to search
   * @param nodeId - Node ID containing the property
   * @param propIdx - Zero-based property index
   * @returns The connected node ID, or null if no connection exists
   *
   * @example
   * const connectedNodeId = EdgeRefs.getRefForProp(nodes, edges, "node1", 0);
   */
  getRefForProp(_nodes: NodesMap, edges: Edge[], nodeId: string, propIdx: number): string | null {
    const incoming = edges.find(edge => edge.toNode === nodeId && edge.toProp === propIdx && edge.fromProp === undefined);
    if (incoming) return incoming.fromNode;

    return null;
  },
};
