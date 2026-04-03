import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getNodeBehavior } from '../src/domain/nodeBehavior';

describe('nodeBehavior registry', () => {
  it('keeps root constraints without overriding the underlying node kind', () => {
    const behavior = getNodeBehavior('root', 'object');
    assert.equal(behavior.nodeKind, 'object');
    assert.equal(behavior.isRoot, true);
    assert.equal(behavior.canEditTitle, true);
    assert.equal(behavior.canDeleteNode, false);
    assert.equal(behavior.canHaveHeaderOutPort, false);
    assert.equal(behavior.canHavePropInPort, true);
    assert.equal(behavior.canAddProp, true);
  });

  it('assigns distinct object and array behaviors', () => {
    const objectBehavior = getNodeBehavior('n1', 'object');
    const arrayBehavior = getNodeBehavior('n2', 'array');

    assert.equal(objectBehavior.nodeKind, 'object');
    assert.equal(arrayBehavior.nodeKind, 'array');
    assert.equal(objectBehavior.canHaveHeaderOutPort, true);
    assert.equal(arrayBehavior.canHaveHeaderOutPort, true);
    assert.equal(objectBehavior.canAddProp, true);
    assert.equal(arrayBehavior.canAddProp, false);
    assert.equal(arrayBehavior.hasItemsKeyword, true);
  });

  it('assigns primitive behavior to scalar nodes', () => {
    const behavior = getNodeBehavior('n1', 'string');
    assert.equal(behavior.nodeKind, 'primitive');
    assert.equal(behavior.canHaveHeaderOutPort, true);
    assert.equal(behavior.canAddProp, false);
  });

  it('keeps properties as the only input side for structured nodes', () => {
    const objectBehavior = getNodeBehavior('o1', 'object');
    const arrayBehavior = getNodeBehavior('a1', 'array');

    assert.equal(objectBehavior.canHavePropInPort, true);
    assert.equal(arrayBehavior.canHavePropInPort, true);
  });
});
