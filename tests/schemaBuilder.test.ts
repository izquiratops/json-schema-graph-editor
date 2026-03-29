import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { State } from '../src/state';
import { SchemaBuilder } from '../src/schemaBuilder';

beforeEach(() => State._reset());

function addNode(
  id: string,
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'integer',
  props: Array<{ name: string; type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'integer' }> = [],
) {
  State.addNode({ id, type, name: id, props, x: 0, y: 0 });
}

describe('SchemaBuilder.build — scalar node', () => {
  it('returns { type } for a non-object, non-array node', () => {
    addNode('root', 'string');
    assert.deepEqual(SchemaBuilder.build('root'), { type: 'string' });
  });
});

describe('SchemaBuilder.build — object', () => {
  it('includes properties for scalar props', () => {
    addNode('root', 'object', [
      { name: 'id',   type: 'string' },
      { name: 'age',  type: 'number' },
    ]);
    assert.deepEqual(SchemaBuilder.build('root'), {
      type: 'object',
      properties: {
        id:  { type: 'string' },
        age: { type: 'number' },
      },
    });
  });

  it('omits properties key when there are no props', () => {
    addNode('root', 'object');
    const schema = SchemaBuilder.build('root');
    assert.equal('properties' in schema, false);
  });

  it('resolves nested schema from a prop-to-node connection', () => {
    addNode('root', 'object', [{ name: 'addr', type: 'object' }]);
    addNode('n1', 'object', [{ name: 'city', type: 'string' }]);
    State.addEdge({ fromNode: 'root', fromProp: 0, toNode: 'n1' });
    assert.deepEqual(SchemaBuilder.build('root'), {
      type: 'object',
      properties: {
        addr: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
      },
    });
  });

  it('falls back to { type } when no edge exists for a structure prop', () => {
    addNode('root', 'object', [{ name: 'x', type: 'object' }]);
    assert.deepEqual(SchemaBuilder.build('root'), {
      type: 'object',
      properties: { x: { type: 'object' } },
    });
  });

  it('builds nested schemas from node-to-prop connections', () => {
    addNode('root', 'object', [{ name: 'addr', type: 'object' }]);
    addNode('n1', 'object', [{ name: 'city', type: 'string' }]);
    State.addEdge({ fromNode: 'n1', toNode: 'root', toProp: 0 });
    assert.deepEqual(SchemaBuilder.build('root'), {
      type: 'object',
      properties: {
        addr: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
      },
    });
  });
});

describe('SchemaBuilder.build — array', () => {
  it('includes items for a primitive item type', () => {
    addNode('root', 'array', [{ name: 'items', type: 'string' }]);
    assert.deepEqual(SchemaBuilder.build('root'), {
      type: 'array',
      items: { type: 'string' },
    });
  });

  it('resolves items from a prop-to-node connection', () => {
    addNode('root', 'array', [{ name: 'items', type: 'object' }]);
    addNode('n1', 'object', [{ name: 'val', type: 'number' }]);
    State.addEdge({ fromNode: 'root', fromProp: 0, toNode: 'n1' });
    assert.deepEqual(SchemaBuilder.build('root'), {
      type: 'array',
      items: {
        type: 'object',
        properties: { val: { type: 'number' } },
      },
    });
  });

  it('omits items when props array is empty', () => {
    addNode('root', 'array');
    const schema = SchemaBuilder.build('root');
    assert.equal('items' in schema, false);
  });
});

describe('SchemaBuilder.build — circular references', () => {
  it('returns {} when a node is visited twice (cycle guard)', () => {
    addNode('root', 'object', [{ name: 'self', type: 'object' }]);
    State.addEdge({ fromNode: 'root', fromProp: 0, toNode: 'root' });
    const schema = SchemaBuilder.build('root');
    assert.deepEqual(schema.properties!['self'], {});
  });

  it('handles mutual cycles between two nodes gracefully', () => {
    addNode('a', 'object', [{ name: 'b', type: 'object' }]);
    addNode('b', 'object', [{ name: 'a', type: 'object' }]);
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'b', fromProp: 0, toNode: 'a' });
    // Should not throw or infinite-loop
    assert.doesNotThrow(() => SchemaBuilder.build('a'));
  });
});

describe('SchemaBuilder.build — missing root', () => {
  it('returns {} for an unknown nodeId', () => {
    assert.deepEqual(SchemaBuilder.build('nonexistent'), {});
  });
});
