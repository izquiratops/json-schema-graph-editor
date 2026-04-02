import type { PropType } from './types';

export const PRIMITIVE_NODE_TYPES: PropType[] = [
    'string',
    'number',
    'integer',
    'boolean',
    'null',
];

export const STRUCT_NODE_TYPES: PropType[] = [
    'object',
    'array',
];

export const ALL_NODE_TYPES: PropType[] = [
    ...PRIMITIVE_NODE_TYPES, ...STRUCT_NODE_TYPES,
];
