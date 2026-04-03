import type { PropType, SchemaNode, Edge } from './types';

type NodesMap = Record<string, SchemaNode>;

function hasPropIndex(propIdx: number | undefined): propIdx is number {
  return propIdx !== undefined;
}

function getPortType(nodes: NodesMap, nodeId: string, propIdx: number): PropType {
  const node = nodes[nodeId];
  if (!node) throw new Error(`Unknown node: "${nodeId}".`);

  if (node.type === 'array') {
    if (propIdx !== 0 || !node.items) throw new Error(`Unknown items keyword: "${nodeId}[${propIdx}]".`);
    return node.items.type;
  }

  if (node.type !== 'object') throw new Error(`Node "${nodeId}" does not support properties.`);
  const prop = node.props[propIdx];
  if (!prop) throw new Error(`Unknown prop: "${nodeId}[${propIdx}]".`);
  return prop.type;
}

export function validateEdge(nodes: NodesMap, edge: Edge): void {
  const hasFromProp = hasPropIndex(edge.fromProp);
  const hasToProp = hasPropIndex(edge.toProp);

  if (hasFromProp) {
    throw new Error('Connections must start from a node header, not a prop row.');
  }

  if (!hasToProp) {
    throw new Error('Connections must end at a prop row.');
  }

  const fromNode = nodes[edge.fromNode];
  if (!fromNode) throw new Error(`Unknown node: "${edge.fromNode}".`);
  const toNode = nodes[edge.toNode];
  if (!toNode) throw new Error(`Unknown node: "${edge.toNode}".`);

  if (edge.fromNode === 'root') {
    throw new Error('Root node does not expose an output port.');
  }

  const sourceType = fromNode.type;
  const targetType = getPortType(nodes, edge.toNode, edge.toProp as number);

  if (sourceType !== targetType) {
    throw new Error(
      `Type mismatch: source type "${sourceType}" is not compatible with target type "${targetType}".`,
    );
  }
}
