import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { State } from '../src/state';
import { SchemaBuilder } from '../src/schemaBuilder';

beforeEach(() => State._reset());

function addNode(
  id: string,
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'integer',
  props: Array<{ name: string; type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'integer'; _ref?: string }> = [],
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

  it('resolves _ref to a nested schema', () => {
    addNode('root', 'object', [{ name: 'addr', type: 'object', _ref: 'n1' }]);
    addNode('n1', 'object', [{ name: 'city', type: 'string' }]);
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

  it('falls back to { type } when _ref points to a missing node', () => {
    addNode('root', 'object', [{ name: 'x', type: 'object', _ref: 'missing' }]);
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

  it('resolves _ref in items to a nested schema', () => {
    addNode('root', 'array', [{ name: 'items', type: 'object', _ref: 'n1' }]);
    addNode('n1', 'object', [{ name: 'val', type: 'number' }]);
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
    // root.prop._ref = root  →  direct self-cycle
    addNode('root', 'object', [{ name: 'self', type: 'object', _ref: 'root' }]);
    const schema = SchemaBuilder.build('root');
    assert.deepEqual(schema.properties!['self'], {});
  });

  it('handles mutual cycles between two nodes gracefully', () => {
    addNode('a', 'object', [{ name: 'b', type: 'object', _ref: 'b' }]);
    addNode('b', 'object', [{ name: 'a', type: 'object', _ref: 'a' }]);
    // Should not throw or infinite-loop
    assert.doesNotThrow(() => SchemaBuilder.build('a'));
  });
});

describe('SchemaBuilder.build — missing root', () => {
  it('returns {} for an unknown nodeId', () => {
    assert.deepEqual(SchemaBuilder.build('nonexistent'), {});
  });
});
