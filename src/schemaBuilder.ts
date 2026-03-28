import { State } from './state';

export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
}

export const SchemaBuilder = {
  build(nodeId: string, visited: Set<string> = new Set()): JsonSchema {
    if (visited.has(nodeId)) return {};
    visited.add(nodeId);

    const n = State.nodes[nodeId];
    if (!n) return {};

    const schema: JsonSchema = { type: n.type };

    if (n.type === 'object') {
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      n.props.forEach(p => {
        properties[p.name] = (p._ref && State.nodes[p._ref])
          ? this.build(p._ref, new Set(visited))
          : { type: p.type };
        if (p.required) required.push(p.name);
      });
      if (Object.keys(properties).length > 0) schema.properties = properties;
      if (required.length > 0) schema.required = required;
    }

    if (n.type === 'array' && n.props.length > 0) {
      const p = n.props[0]!;
      schema.items = (p._ref && State.nodes[p._ref])
        ? this.build(p._ref, new Set(visited))
        : { type: p.type };
    }

    return schema;
  },
};
