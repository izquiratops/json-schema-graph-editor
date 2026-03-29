import { State } from './state';
import { EdgeRefs } from './edgeRefs';

export interface JsonSchema {
  type?: string;
  title?: string;
  description?: string;
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

    if (n.title.trim().length > 0) schema.title = n.title;

    if (n.description.trim().length > 0) schema.description = n.description;

    if (n.type === 'object') {
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];
      n.props.forEach((p, idx) => {
        const refNodeId = EdgeRefs.getRefForProp(State.nodes, State.edges, nodeId, idx);
        properties[p.name] = (refNodeId && State.nodes[refNodeId])
          ? this.build(refNodeId, new Set(visited))
          : { type: p.type };
        if (p.required) required.push(p.name);
      });
      if (Object.keys(properties).length > 0) schema.properties = properties;
      if (required.length > 0) schema.required = required;
    }

    if (n.type === 'array' && n.items) {
      const refNodeId = EdgeRefs.getRefForProp(State.nodes, State.edges, nodeId, 0);
      schema.items = (refNodeId && State.nodes[refNodeId])
        ? this.build(refNodeId, new Set(visited))
        : { type: n.items.type };
    }

    return schema;
  },
};
