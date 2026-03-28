import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { State } from '../src/state';

beforeEach(() => State._reset());

describe('State.uid', () => {
  it('generates sequential IDs starting at n1', () => {
    assert.equal(State.uid(), 'n1');
    assert.equal(State.uid(), 'n2');
    assert.equal(State.uid(), 'n3');
  });
});

describe('State.addNode / removeNode', () => {
  it('stores and retrieves a node', () => {
    const node = { id: 'n1', type: 'object' as const, name: 'test', props: [], x: 0, y: 0 };
    State.addNode(node);
    assert.deepEqual(State.nodes['n1'], node);
  });

  it('removes a node', () => {
    State.addNode({ id: 'n1', type: 'object' as const, name: 'test', props: [], x: 0, y: 0 });
    State.removeNode('n1');
    assert.equal(State.nodes['n1'], undefined);
  });
});

describe('State.addEdge', () => {
  it('adds an edge', () => {
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    assert.equal(State.edges.length, 1);
  });

  it('enforces at most one incoming edge per toNode (replaces previous)', () => {
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'c', fromProp: 1, toNode: 'b' });
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.fromNode, 'c');
  });

  it('allows multiple edges with different toNode values', () => {
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'a', fromProp: 1, toNode: 'c' });
    assert.equal(State.edges.length, 2);
  });
});

describe('State.removeEdgesOf', () => {
  it('removes edges where node is the source', () => {
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'a', fromProp: 1, toNode: 'c' });
    State.removeEdgesOf('a');
    assert.equal(State.edges.length, 0);
  });

  it('removes edges where node is the target', () => {
    State.addEdge({ fromNode: 'x', fromProp: 0, toNode: 'a' });
    State.removeEdgesOf('a');
    assert.equal(State.edges.length, 0);
  });

  it('leaves edges that do not involve the node', () => {
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'c', fromProp: 0, toNode: 'd' });
    State.removeEdgesOf('a');
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.fromNode, 'c');
  });
});

describe('State.removeEdgeFromProp', () => {
  it('removes a specific source+prop edge', () => {
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'a', fromProp: 1, toNode: 'c' });
    State.removeEdgeFromProp('a', 0);
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.fromProp, 1);
  });

  it('does not remove edges from a different node', () => {
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.removeEdgeFromProp('x', 0);
    assert.equal(State.edges.length, 1);
  });
});

describe('State.shiftEdgePropIndices', () => {
  it('decrements prop indices above the deleted index', () => {
    State.addEdge({ fromNode: 'a', fromProp: 2, toNode: 'b' });
    State.shiftEdgePropIndices('a', 1);
    assert.equal(State.edges[0]!.fromProp, 1);
  });

  it('does not change prop indices at or below the deleted index', () => {
    State.addEdge({ fromNode: 'a', fromProp: 1, toNode: 'b' });
    State.shiftEdgePropIndices('a', 1);
    assert.equal(State.edges[0]!.fromProp, 1);
  });

  it('does not affect edges from other nodes', () => {
    State.addEdge({ fromNode: 'b', fromProp: 5, toNode: 'c' });
    State.shiftEdgePropIndices('a', 0);
    assert.equal(State.edges[0]!.fromProp, 5);
  });
});
