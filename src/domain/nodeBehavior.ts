import type { PropType, SchemaNode } from './types';
import { IS_PRIMITIVE, IS_STRUCTURE } from './constants';

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

export function getNodeKind(nodeType: PropType): NodeKind {
  if (IS_PRIMITIVE(nodeType)) return 'primitive';
  if (nodeType === 'array') return 'array';
  if (IS_STRUCTURE(nodeType)) return 'object'; // TODO: IS_STRUCTURE is useless here now
  return 'object';
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
  return IS_STRUCTURE(propType);
}

export function getNodeBehaviorFromNode(node: Pick<SchemaNode, 'id' | 'type'>): NodeBehavior {
  return getNodeBehavior(node.id, node.type);
}
