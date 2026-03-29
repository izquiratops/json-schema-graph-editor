export type PropType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

export interface Prop {
  name: string;
  type: PropType;
  required?: boolean;
}

export interface ArrayItemsKeyword {
  type: PropType;
}

export interface SchemaNode {
  id: string;
  type: PropType;
  title: string;
  description: string;
  props: Prop[];
  items?: ArrayItemsKeyword;
  x: number;
  y: number;
}

export interface Edge {
  fromNode: string;
  toNode: string;
  fromProp?: number;
  toProp?: number;
}
