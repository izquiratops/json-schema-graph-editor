import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateEdge } from '../src/domain/edgeValidation';
import type { SchemaNode } from '../src/domain/types';

function makeNode(id: string, type: SchemaNode['type'], props: SchemaNode['props'] = []): SchemaNode {
  return { id, type, title: '', description: '', props, x: 0, y: 0 };
}

describe('validateEdge', () => {
  it('accepts a valid header-to-prop edge with matching types', () => {
    const nodes = {
      a: makeNode('a', 'string'),
      b: makeNode('b', 'object', [{ name: 'val', type: 'string' }]),
    };
    assert.doesNotThrow(() => validateEdge(nodes, { fromNode: 'a', toNode: 'b', toProp: 0 }));
  });

  it('rejects edges linking two headers (no prop index on either side)', () => {
    const nodes = {
      a: makeNode('a', 'object'),
      b: makeNode('b', 'object'),
    };
    assert.throws(
      () => validateEdge(nodes, { fromNode: 'a', toNode: 'b' }),
      /must end at a prop row/,
    );
  });

  it('rejects edges starting from a prop row', () => {
    const nodes = {
      a: makeNode('a', 'object', [{ name: 'x', type: 'string' }]),
      b: makeNode('b', 'object', [{ name: 'y', type: 'string' }]),
    };
    assert.throws(
      () => validateEdge(nodes, { fromNode: 'a', fromProp: 0, toNode: 'b', toProp: 0 }),
      /must start from a node header/,
    );
  });

  it('rejects type mismatches between source and target', () => {
    const nodes = {
      a: makeNode('a', 'number'),
      b: makeNode('b', 'object', [{ name: 'x', type: 'string' }]),
    };
    assert.throws(
      () => validateEdge(nodes, { fromNode: 'a', toNode: 'b', toProp: 0 }),
      /Type mismatch/,
    );
  });

  it('validates array items keyword type correctly', () => {
    const nodes = {
      a: makeNode('a', 'string'),
      b: makeNode('b', 'array'),
    };
    nodes.b.items = { type: 'string' };
    assert.doesNotThrow(() => validateEdge(nodes, { fromNode: 'a', toNode: 'b', toProp: 0 }));
  });

  it('rejects root as a source node because it has no output port', () => {
    const nodes = {
      root: makeNode('root', 'object'),
      b: makeNode('b', 'object', [{ name: 'child', type: 'object' }]),
    };
    assert.throws(
      () => validateEdge(nodes, { fromNode: 'root', toNode: 'b', toProp: 0 }),
      /Root node does not expose an output port/,
    );
  });

  it('throws for unknown node references', () => {
    assert.throws(
      () => validateEdge({}, { fromNode: 'missing', toNode: 'also-missing', toProp: 0 }),
      /Unknown node/,
    );
  });
});
