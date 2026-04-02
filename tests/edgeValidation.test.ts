import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateEdge } from '../src/domain/edgeValidation';
import type { SchemaNode } from '../src/domain/types';

function makeNode(id: string, type: SchemaNode['type'], props: SchemaNode['props'] = []): SchemaNode {
  return { id, type, title: '', description: '', props, x: 0, y: 0 };
}

describe('validateEdge', () => {
  it('accepts a valid prop-to-header edge with matching types', () => {
    const nodes = {
      a: makeNode('a', 'object', [{ name: 'child', type: 'object' }]),
      b: makeNode('b', 'object'),
    };
    assert.doesNotThrow(() => validateEdge(nodes, { fromNode: 'a', fromProp: 0, toNode: 'b' }));
  });

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
      /must link a node header to a prop row/,
    );
  });

  it('rejects edges linking two props (prop index on both sides)', () => {
    const nodes = {
      a: makeNode('a', 'object', [{ name: 'x', type: 'string' }]),
      b: makeNode('b', 'object', [{ name: 'y', type: 'string' }]),
    };
    assert.throws(
      () => validateEdge(nodes, { fromNode: 'a', fromProp: 0, toNode: 'b', toProp: 0 }),
      /must link a node header to a prop row/,
    );
  });

  it('rejects type mismatches between source and target', () => {
    const nodes = {
      a: makeNode('a', 'object', [{ name: 'x', type: 'string' }]),
      b: makeNode('b', 'number'),
    };
    assert.throws(
      () => validateEdge(nodes, { fromNode: 'a', fromProp: 0, toNode: 'b' }),
      /Type mismatch/,
    );
  });

  it('validates array items keyword type correctly', () => {
    const nodes = {
      a: makeNode('a', 'array'),
      b: makeNode('b', 'string'),
    };
    nodes.a.items = { type: 'string' };
    assert.doesNotThrow(() => validateEdge(nodes, { fromNode: 'a', fromProp: 0, toNode: 'b' }));
  });

  it('throws for unknown node references', () => {
    assert.throws(
      () => validateEdge({}, { fromNode: 'missing', fromProp: 0, toNode: 'also-missing' }),
      /Unknown node/,
    );
  });
});
