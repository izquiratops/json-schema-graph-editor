import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getNodeBehavior, canPropHaveOutPort } from '../src/nodeBehavior';

describe('nodeBehavior registry', () => {
  it('assigns root behavior by node id', () => {
    const behavior = getNodeBehavior('root', 'object');
    assert.equal(behavior.nodeKind, 'root');
    assert.equal(behavior.canEditName, false);
    assert.equal(behavior.canDeleteNode, false);
    assert.equal(behavior.canHaveHeaderInPort, false);
    assert.equal(behavior.canHaveHeaderOutPort, false);
    assert.equal(behavior.canHavePropInPort, false);
    assert.equal(behavior.canAddProp, true);
  });

  it('assigns structure behavior for object and array nodes', () => {
    const objectBehavior = getNodeBehavior('n1', 'object');
    const arrayBehavior = getNodeBehavior('n2', 'array');

    assert.equal(objectBehavior.nodeKind, 'structure');
    assert.equal(arrayBehavior.nodeKind, 'structure');
    assert.equal(objectBehavior.canHaveHeaderInPort, true);
    assert.equal(arrayBehavior.canHaveHeaderOutPort, true);
    assert.equal(objectBehavior.canAddProp, true);
  });

  it('assigns primitive behavior to scalar nodes', () => {
    const behavior = getNodeBehavior('n1', 'string');
    assert.equal(behavior.nodeKind, 'primitive');
    assert.equal(behavior.canHaveHeaderInPort, false);
    assert.equal(behavior.canHaveHeaderOutPort, true);
    assert.equal(behavior.canAddProp, false);
  });

  it('allows prop output ports only for structure prop types', () => {
    assert.equal(canPropHaveOutPort('object'), true);
    assert.equal(canPropHaveOutPort('array'), true);
    assert.equal(canPropHaveOutPort('string'), false);
    assert.equal(canPropHaveOutPort('number'), false);
  });
});
