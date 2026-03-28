import type { PropType } from './types';

const PRIMITIVE_TYPES: PropType[] = ['string', 'number', 'integer', 'boolean', 'null'];

const STRUCT_TYPES: PropType[] = ['object', 'array'];

export const PROP_TYPES: PropType[] = [...PRIMITIVE_TYPES, ...STRUCT_TYPES];

export const IS_PRIMITIVE = (type: PropType): boolean => PRIMITIVE_TYPES.includes(type);

export const CAN_CONNECT = (type: PropType): boolean => STRUCT_TYPES.includes(type);
