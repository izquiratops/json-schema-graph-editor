import type { PropType, SchemaNode } from './types';
import { IS_PRIMITIVE, IS_STRUCTURE } from './constants';

export type NodeKind = 'root' | 'primitive' | 'structure';

interface NodeBehavior {
  nodeKind: NodeKind;
  canEditName: boolean;
  canDeleteNode: boolean;
  canHaveHeaderInPort: boolean;
  canHaveHeaderOutPort: boolean;
  canHavePropInPort: boolean;
  canAddProp: boolean;
}

const BEHAVIOR_BY_KIND: Record<NodeKind, NodeBehavior> = {
  // Centralizes graph entity behavior to keep type checks out of DOM rendering paths.
  root: {
    nodeKind: 'root',
    canEditName: false,
    canDeleteNode: false,
    canHaveHeaderInPort: false,
    canHaveHeaderOutPort: false,
    canHavePropInPort: false,
    canAddProp: true,
  },
  primitive: {
    nodeKind: 'primitive',
    canEditName: true,
    canDeleteNode: true,
    canHaveHeaderInPort: false,
    canHaveHeaderOutPort: true,
    canHavePropInPort: false,
    canAddProp: false,
  },
  structure: {
    nodeKind: 'structure',
    canEditName: true,
    canDeleteNode: true,
    canHaveHeaderInPort: true,
    canHaveHeaderOutPort: true,
    canHavePropInPort: true,
    canAddProp: true,
  },
};

export function getNodeKind(nodeId: string, nodeType: PropType): NodeKind {
  if (nodeId === 'root') return 'root';
  if (IS_PRIMITIVE(nodeType)) return 'primitive';
  if (IS_STRUCTURE(nodeType)) return 'structure';
  return 'primitive';
}

export function getNodeBehavior(nodeId: string, nodeType: PropType): NodeBehavior {
  return BEHAVIOR_BY_KIND[getNodeKind(nodeId, nodeType)];
}

export function canPropHaveOutPort(propType: PropType): boolean {
  return IS_STRUCTURE(propType);
}

export function getNodeBehaviorFromNode(node: Pick<SchemaNode, 'id' | 'type'>): NodeBehavior {
  return getNodeBehavior(node.id, node.type);
}
