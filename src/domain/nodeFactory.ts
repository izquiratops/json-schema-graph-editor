import type { Prop, PropType, SchemaNode } from './types';

export function createNode(id: string, type: PropType, x?: number, y?: number): SchemaNode {
  const node: SchemaNode = {
    id,
    type,
    title: type + '_' + (id.slice(1)),
    description: '',
    props: [] as Prop[],
    items: undefined,
    x: x ?? 60 + Math.random() * 220,
    y: y ?? 80 + Math.random() * 160,
  };
  if (type === 'object') node.props = [{ name: 'field1', type: 'string', required: false }];
  if (type === 'array') node.items = { type: 'string' };
  return node;
}
