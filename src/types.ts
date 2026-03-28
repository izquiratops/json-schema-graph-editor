export type PropType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'null';

export interface Prop {
  name: string;
  type: PropType;
  _ref?: string | null;
  required?: boolean;
}

export interface SchemaNode {
  id: string;
  type: PropType;
  name: string;
  props: Prop[];
  x: number;
  y: number;
}

export interface Edge {
  fromNode: string;
  toNode: string;
  fromProp?: number;
  toProp?: number;
}
