import type { PropType } from './types';

export const PROP_TYPES: PropType[] = [
  'string', 'number', 'integer', 'boolean', 'object', 'array', 'null',
];

export const CAN_CONNECT = (type: PropType): boolean =>
  type === 'object' || type === 'array';
