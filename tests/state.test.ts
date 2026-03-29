import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { State } from '../src/state';
import type { Prop, PropType } from '../src/types';

beforeEach(() => State._reset());

function addNode(id: string, type: PropType, props: Prop[] = []) {
  State.addNode({ id, type, name: id, props, x: 0, y: 0 });
}

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
  it('adds a prop-to-node edge and syncs the source prop ref', () => {
    addNode('a', 'object', [{ name: 'child', type: 'object' }]);
    addNode('b', 'object');
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    assert.equal(State.edges.length, 1);
    assert.equal(State.nodes['a']!.props[0]!._ref, 'b');
  });

  it('adds a node-to-prop edge and syncs the target prop ref', () => {
    addNode('s', 'string');
    addNode('o', 'object', [{ name: 'title', type: 'string' }]);
    State.addEdge({ fromNode: 's', toNode: 'o', toProp: 0 });
    assert.equal(State.edges.length, 1);
    assert.equal(State.nodes['o']!.props[0]!._ref, 's');
  });

  it('replaces the previous incoming edge for the same target port', () => {
    addNode('s1', 'string');
    addNode('s2', 'string');
    addNode('o', 'object', [{ name: 'title', type: 'string' }]);
    State.addEdge({ fromNode: 's1', toNode: 'o', toProp: 0 });
    State.addEdge({ fromNode: 's2', toNode: 'o', toProp: 0 });
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.fromNode, 's2');
    assert.equal(State.nodes['o']!.props[0]!._ref, 's2');
  });

  it('replaces the previous outgoing edge for the same source port', () => {
    addNode('a', 'object', [{ name: 'child', type: 'object' }]);
    addNode('b', 'object');
    addNode('c', 'object');
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'c' });
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.toNode, 'c');
    assert.equal(State.nodes['a']!.props[0]!._ref, 'c');
  });

  it('allows multiple edges across different ports', () => {
    addNode('a', 'object', [
      { name: 'first', type: 'object' },
      { name: 'second', type: 'object' },
    ]);
    addNode('b', 'object');
    addNode('c', 'object');
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'a', fromProp: 1, toNode: 'c' });
    assert.equal(State.edges.length, 2);
  });

  it('validates the actual connected port types', () => {
    addNode('s', 'string');
    addNode('o', 'object', [{ name: 'count', type: 'number' }]);
    assert.throws(
      () => State.addEdge({ fromNode: 's', toNode: 'o', toProp: 0 }),
      /Type mismatch/,
    );
  });
});

describe('State.removeEdgesOf', () => {
  it('removes edges where node is the source', () => {
    addNode('a', 'object', [
      { name: 'first', type: 'object' },
      { name: 'second', type: 'object' },
    ]);
    addNode('b', 'object');
    addNode('c', 'object');
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'a', fromProp: 1, toNode: 'c' });
    State.removeEdgesOf('a');
    assert.equal(State.edges.length, 0);
    assert.equal(State.nodes['a']!.props[0]!._ref, null);
    assert.equal(State.nodes['a']!.props[1]!._ref, null);
  });

  it('removes edges where node is the target', () => {
    addNode('x', 'object', [{ name: 'child', type: 'object' }]);
    addNode('a', 'object');
    State.addEdge({ fromNode: 'x', fromProp: 0, toNode: 'a' });
    State.removeEdgesOf('a');
    assert.equal(State.edges.length, 0);
    assert.equal(State.nodes['x']!.props[0]!._ref, null);
  });

  it('leaves edges that do not involve the node', () => {
    addNode('a', 'object', [{ name: 'child', type: 'object' }]);
    addNode('b', 'object');
    addNode('c', 'object', [{ name: 'child', type: 'object' }]);
    addNode('d', 'object');
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'c', fromProp: 0, toNode: 'd' });
    State.removeEdgesOf('a');
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.fromNode, 'c');
  });
});

describe('State.removeEdgeFromProp', () => {
  it('removes a specific source+prop edge', () => {
    addNode('a', 'object', [
      { name: 'first', type: 'object' },
      { name: 'second', type: 'object' },
    ]);
    addNode('b', 'object');
    addNode('c', 'object');
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.addEdge({ fromNode: 'a', fromProp: 1, toNode: 'c' });
    State.removeEdgeFromProp('a', 0);
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.fromProp, 1);
    assert.equal(State.nodes['a']!.props[0]!._ref, null);
  });

  it('removes a specific target prop edge', () => {
    addNode('s', 'string');
    addNode('o', 'object', [
      { name: 'title', type: 'string' },
      { name: 'slug', type: 'string' },
    ]);
    State.addEdge({ fromNode: 's', toNode: 'o', toProp: 0 });
    State.removeEdgeFromProp('o', 0);
    assert.equal(State.edges.length, 0);
    assert.equal(State.nodes['o']!.props[0]!._ref, null);
  });

  it('does not remove edges from a different node', () => {
    addNode('a', 'object', [{ name: 'child', type: 'object' }]);
    addNode('b', 'object');
    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.removeEdgeFromProp('x', 0);
    assert.equal(State.edges.length, 1);
  });
});

describe('State.shiftEdgePropIndices', () => {
  it('decrements prop indices above the deleted index', () => {
    addNode('a', 'object', [
      { name: 'first', type: 'object' },
      { name: 'second', type: 'object' },
      { name: 'third', type: 'object' },
    ]);
    addNode('b', 'object');
    State.addEdge({ fromNode: 'a', fromProp: 2, toNode: 'b' });
    State.shiftEdgePropIndices('a', 1);
    assert.equal(State.edges[0]!.fromProp, 1);
  });

  it('decrements target prop indices above the deleted index', () => {
    addNode('s', 'string');
    addNode('o', 'object', [
      { name: 'first', type: 'string' },
      { name: 'second', type: 'string' },
      { name: 'third', type: 'string' },
    ]);
    State.addEdge({ fromNode: 's', toNode: 'o', toProp: 2 });
    State.shiftEdgePropIndices('o', 1);
    assert.equal(State.edges[0]!.toProp, 1);
  });

  it('does not affect edges from other nodes', () => {
    addNode('b', 'object', [
      { name: 'first', type: 'object' },
      { name: 'second', type: 'object' },
      { name: 'third', type: 'object' },
      { name: 'fourth', type: 'object' },
      { name: 'fifth', type: 'object' },
      { name: 'sixth', type: 'object' },
    ]);
    addNode('c', 'object');
    State.addEdge({ fromNode: 'b', fromProp: 5, toNode: 'c' });
    State.shiftEdgePropIndices('a', 0);
    assert.equal(State.edges[0]!.fromProp, 5);
  });
});

describe('State change events', () => {
  it('emits node and prop update events for explicit mutation helpers', () => {
    addNode('a', 'object', [{ name: 'field', type: 'string', required: false }]);
    const events: string[] = [];
    const unsubscribe = State.onChange(event => {
      events.push(event.type);
    });

    State.setNodeName('a', 'renamed');
    State.setPropName('a', 0, 'newField');
    State.setPropRequired('a', 0, true);

    unsubscribe();

    assert.deepEqual(events, ['nodeUpdated', 'propUpdated', 'propUpdated']);
  });

  it('emits edge lifecycle events on add/remove/reindex', () => {
    addNode('a', 'object', [
      { name: 'first', type: 'object' },
      { name: 'second', type: 'object' },
    ]);
    addNode('b', 'object');
    addNode('c', 'object');

    const events: string[] = [];
    const unsubscribe = State.onChange(event => {
      events.push(event.type);
    });

    State.addEdge({ fromNode: 'a', fromProp: 0, toNode: 'b' });
    State.removeEdgeFromProp('a', 0);
    State.addEdge({ fromNode: 'a', fromProp: 1, toNode: 'c' });
    State.shiftEdgePropIndices('a', 0);

    unsubscribe();

    assert.deepEqual(events, ['edgeAdded', 'edgesRemoved', 'edgeAdded', 'edgesReindexed']);
  });
});
