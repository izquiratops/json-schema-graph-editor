import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createNode } from '../src/domain/nodeFactory';

describe('createNode', () => {
  it('creates an object node with a default property', () => {
    const node = createNode('n1', 'object', 100, 200);
    assert.equal(node.id, 'n1');
    assert.equal(node.type, 'object');
    assert.equal(node.title, 'object_1');
    assert.equal(node.description, '');
    assert.equal(node.x, 100);
    assert.equal(node.y, 200);
    assert.equal(node.props.length, 1);
    assert.equal(node.props[0]!.name, 'field1');
    assert.equal(node.props[0]!.type, 'string');
    assert.equal(node.items, undefined);
  });

  it('creates an array node with default items keyword', () => {
    const node = createNode('n2', 'array', 50, 60);
    assert.equal(node.type, 'array');
    assert.equal(node.props.length, 0);
    assert.deepEqual(node.items, { type: 'string' });
  });

  it('creates a primitive node with no props and no items', () => {
    const node = createNode('n3', 'string', 10, 20);
    assert.equal(node.type, 'string');
    assert.equal(node.props.length, 0);
    assert.equal(node.items, undefined);
  });

  it('uses random position when x/y are omitted', () => {
    const node = createNode('n4', 'boolean');
    assert.equal(typeof node.x, 'number');
    assert.equal(typeof node.y, 'number');
  });
});
