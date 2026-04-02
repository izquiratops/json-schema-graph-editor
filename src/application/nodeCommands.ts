import type { PropType } from '../domain/types';
import { createNode } from '../domain/nodeFactory';
import { State } from './state';

export const NodeCommands = {
  add(type: PropType, x?: number, y?: number): void {
    State.addNode(createNode(State.uid(), type, x, y));
  },

  delete(id: string): void {
    State.removeEdgesOf(id);
    State.removeNode(id);
  },

  addProp(nodeId: string): void {
    State.addProp(nodeId, { name: 'field', type: 'string', required: false });
  },

  deleteProp(nodeId: string, propIdx: number): void {
    State.removeEdgeFromProp(nodeId, propIdx);
    State.shiftEdgePropIndices(nodeId, propIdx);
    State.removeProp(nodeId, propIdx);
  },

  changePropType(nodeId: string, propIdx: number, newType: PropType): void {
    const prop = State.nodes[nodeId]!.props[propIdx]!;
    if (prop.type === newType) return;

    State.setPropType(nodeId, propIdx, newType);
    State.removeEdgeFromProp(nodeId, propIdx);
  },

  changeArrayItemType(nodeId: string, newType: PropType): void {
    const node = State.nodes[nodeId]!;
    if (node.type !== 'array' || !node.items || node.items.type === newType) return;

    State.setArrayItemType(nodeId, newType);
    State.removeEdgeFromProp(nodeId, 0);
  },
};
