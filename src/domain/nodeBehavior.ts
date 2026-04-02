import type { PropType, SchemaNode } from './types';
import { PRIMITIVE_NODE_TYPES, STRUCT_NODE_TYPES } from './constants';

export type NodeKind = 'primitive' | 'object' | 'array';

interface NodeBehavior {
  nodeKind: NodeKind;
  isRoot: boolean;
  canEditTitle: boolean;
  canDeleteNode: boolean;
  canHaveHeaderInPort: boolean;
  canHaveHeaderOutPort: boolean;
  canHavePropInPort: boolean;
  canAddProp: boolean;
  hasItemsKeyword: boolean;
}

const BEHAVIOR_BY_KIND: Record<NodeKind, Omit<NodeBehavior, 'isRoot'>> = {
  // Centralizes graph entity behavior to keep type checks out of DOM rendering paths.
  primitive: {
    nodeKind: 'primitive',
    canEditTitle: true,
    canDeleteNode: true,
    canHaveHeaderInPort: false,
    canHaveHeaderOutPort: true,
    canHavePropInPort: false,
    canAddProp: false,
    hasItemsKeyword: false,
  },
  object: {
    nodeKind: 'object',
    canEditTitle: true,
    canDeleteNode: true,
    canHaveHeaderInPort: true,
    canHaveHeaderOutPort: true,
    canHavePropInPort: true,
    canAddProp: true,
    hasItemsKeyword: false,
  },
  array: {
    nodeKind: 'array',
    canEditTitle: true,
    canDeleteNode: true,
    canHaveHeaderInPort: true,
    canHaveHeaderOutPort: true,
    canHavePropInPort: true,
    canAddProp: false,
    hasItemsKeyword: true,
  },
};

// TODO: make sure node and props are consistent
export function getNodeKind(nodeType: PropType): NodeKind {
  if (PRIMITIVE_NODE_TYPES.includes(nodeType)) return 'primitive';
  if (nodeType === 'array') return 'array';
  if (nodeType === 'object') return 'object';
  throw new Error('Node type not recognized.');
}

export function getNodeBehavior(nodeId: string, nodeType: PropType): NodeBehavior {
  const isRoot = nodeId === 'root';
  const behavior = BEHAVIOR_BY_KIND[getNodeKind(nodeType)];

  return {
    ...behavior,
    isRoot,
    canDeleteNode: !isRoot && behavior.canDeleteNode,
    canHaveHeaderInPort: !isRoot && behavior.canHaveHeaderInPort,
    canHaveHeaderOutPort: !isRoot && behavior.canHaveHeaderOutPort,
  };
}

export function canPropHaveOutPort(propType: PropType): boolean {
  return STRUCT_NODE_TYPES.includes(propType);
}

export function getNodeBehaviorFromNode(node: Pick<SchemaNode, 'id' | 'type'>): NodeBehavior {
  return getNodeBehavior(node.id, node.type);
}
