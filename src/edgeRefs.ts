import type { Edge, SchemaNode } from './types';

type NodesMap = Record<string, SchemaNode>;

/**
 * EdgeRefs - Edge lookup adapter for graph connections
 *
 * Provides utilities for querying graph edge connections. All graph connections
 * are resolved exclusively from State.edges, ensuring a single source of truth
 * for the graph topology.
 *
 * @remarks
 * This adapter abstracts edge queries and makes the edge resolution logic
 * reusable across different parts of the application that need to navigate
 * the graph structure (e.g., schema rendering, validation, serialization).
 */
export const EdgeRefs = {
  /**
   * Finds the connected node reference for a specific property on a node.
   *
   * Searches for edges connected to a node's property in both directions:
   * - **Outgoing**: Property → Node (property exports to another node)
   * - **Incoming**: Node → Property (another node imports to this property)
   *
   * @param _nodes - Map of all schema nodes (currently unused, kept for interface compatibility)
   * @param edges - Array of all graph edges to search through
   * @param nodeId - The ID of the node containing the property
   * @param propIdx - The zero-based index of the property within the node's props array
   *
   * @returns The ID of the connected node, or null if no connection exists for this property
   *
   * @example
   * // Find what node property 0 of node "node1" connects to
   * const connectedNodeId = EdgeRefs.getRefForProp(nodes, edges, "node1", 0);
   * // Returns "node2" if node1.props[0] connects to node2, or null if no connection
   *
   * @remarks
   * - Only searches for direct property-level connections (edges with fromProp or toProp)
   * - Returns the first match found; edge uniqueness should be enforced elsewhere
   * - Does not traverse multiple hops or return intermediate edges
   */
  getRefForProp(_nodes: NodesMap, edges: Edge[], nodeId: string, propIdx: number): string | null {
    // Search for outgoing edge: this property exports to another node
    const outgoing = edges.find(edge => edge.fromNode === nodeId && edge.fromProp === propIdx && edge.toProp === undefined);
    if (outgoing) return outgoing.toNode;

    // Search for incoming edge: another node imports to this property
    const incoming = edges.find(edge => edge.toNode === nodeId && edge.toProp === propIdx && edge.fromProp === undefined);
    if (incoming) return incoming.fromNode;

    return null;
  },
};
