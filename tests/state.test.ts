import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { State } from '../src/application/state';
import { EdgeRefs } from '../src/domain/edgeRefs';
import type { Prop, PropType } from '../src/domain/types';

beforeEach(() => State._reset());

function addNode(id: string, type: PropType, props: Prop[] = []) {
  State.addNode({
    id,
    type,
    title: '',
    description: '',
    props: type === 'array' ? [] : props,
    items: type === 'array' ? { type: props[0]?.type ?? 'string' } : undefined,
    x: 0,
    y: 0,
  });
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
    const node = {
      id: 'n1',
      type: 'object' as const,
      title: 'test',
      description: '',
      props: [],
      x: 0,
      y: 0,
    };
    State.addNode(node);
    assert.deepEqual(State.nodes['n1'], node);
  });

  it('removes a node', () => {
    State.addNode({ id: 'n1', type: 'object' as const, title: 'test', description: '', props: [], x: 0, y: 0 });
    State.removeNode('n1');
    assert.equal(State.nodes['n1'], undefined);
  });
});

describe('State.addEdge', () => {
  it('adds a node-to-prop edge and resolves the target prop ref from edges', () => {
    addNode('s', 'string');
    addNode('o', 'object', [{ name: 'title', type: 'string' }]);
    State.addEdge({ fromNode: 's', toNode: 'o', toProp: 0 });
    assert.equal(State.edges.length, 1);
    assert.equal(EdgeRefs.getRefForProp(State.nodes, State.edges, 'o', 0), 's');
  });

  it('replaces the previous incoming edge for the same target port', () => {
    addNode('s1', 'string');
    addNode('s2', 'string');
    addNode('o', 'object', [{ name: 'title', type: 'string' }]);
    State.addEdge({ fromNode: 's1', toNode: 'o', toProp: 0 });
    State.addEdge({ fromNode: 's2', toNode: 'o', toProp: 0 });
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.fromNode, 's2');
    assert.equal(EdgeRefs.getRefForProp(State.nodes, State.edges, 'o', 0), 's2');
  });

  it('replaces the previous outgoing edge for the same source port', () => {
    addNode('a', 'string');
    addNode('b', 'object', [{ name: 'first', type: 'string' }]);
    addNode('c', 'object', [{ name: 'second', type: 'string' }]);
    State.addEdge({ fromNode: 'a', toNode: 'b', toProp: 0 });
    State.addEdge({ fromNode: 'a', toNode: 'c', toProp: 0 });
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.toNode, 'c');
    assert.equal(EdgeRefs.getRefForProp(State.nodes, State.edges, 'c', 0), 'a');
  });

  it('keeps one outgoing edge per source header', () => {
    addNode('a', 'string');
    addNode('b', 'object', [{ name: 'first', type: 'string' }]);
    addNode('c', 'object', [{ name: 'second', type: 'string' }]);
    State.addEdge({ fromNode: 'a', toNode: 'b', toProp: 0 });
    State.addEdge({ fromNode: 'a', toNode: 'c', toProp: 0 });
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.toNode, 'c');
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
    addNode('a', 'string');
    addNode('b', 'object', [{ name: 'first', type: 'string' }]);
    addNode('c', 'string');
    State.addEdge({ fromNode: 'a', toNode: 'b', toProp: 0 });
    State.addEdge({ fromNode: 'c', toNode: 'b', toProp: 0 });
    State.removeEdgesOf('a');
    assert.equal(State.edges.length, 1);
    assert.equal(EdgeRefs.getRefForProp(State.nodes, State.edges, 'b', 0), 'c');
  });

  it('removes edges where node is the target', () => {
    addNode('x', 'object');
    addNode('a', 'object', [{ name: 'child', type: 'object' }]);
    State.addEdge({ fromNode: 'x', toNode: 'a', toProp: 0 });
    State.removeEdgesOf('a');
    assert.equal(State.edges.length, 0);
    assert.equal(EdgeRefs.getRefForProp(State.nodes, State.edges, 'a', 0), null);
  });

  it('leaves edges that do not involve the node', () => {
    addNode('a', 'object');
    addNode('b', 'object', [{ name: 'child', type: 'object' }]);
    addNode('c', 'object');
    addNode('d', 'object', [{ name: 'child', type: 'object' }]);
    State.addEdge({ fromNode: 'a', toNode: 'b', toProp: 0 });
    State.addEdge({ fromNode: 'c', toNode: 'd', toProp: 0 });
    State.removeEdgesOf('a');
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.fromNode, 'c');
    assert.equal(State.edges[0]!.toNode, 'd');
  });
});

describe('State.removeEdgeFromProp', () => {
  it('removes a specific target prop edge', () => {
    addNode('s', 'string');
    addNode('o', 'object', [
      { name: 'title', type: 'string' },
      { name: 'slug', type: 'string' },
    ]);
    State.addEdge({ fromNode: 's', toNode: 'o', toProp: 0 });
    State.removeEdgeFromProp('o', 0);
    assert.equal(State.edges.length, 0);
    assert.equal(EdgeRefs.getRefForProp(State.nodes, State.edges, 'o', 0), null);
  });

  it('removes only the requested target prop edge', () => {
    addNode('titleSource', 'string');
    addNode('slugSource', 'string');
    addNode('o', 'object', [
      { name: 'title', type: 'string' },
      { name: 'slug', type: 'string' },
    ]);
    State.addEdge({ fromNode: 'titleSource', toNode: 'o', toProp: 0 });
    State.addEdge({ fromNode: 'slugSource', toNode: 'o', toProp: 1 });
    State.removeEdgeFromProp('o', 0);
    assert.equal(State.edges.length, 1);
    assert.equal(State.edges[0]!.toProp, 1);
    assert.equal(EdgeRefs.getRefForProp(State.nodes, State.edges, 'o', 0), null);
    assert.equal(EdgeRefs.getRefForProp(State.nodes, State.edges, 'o', 1), 'slugSource');
  });

  it('does not remove edges from a different node', () => {
    addNode('a', 'object');
    addNode('b', 'object', [{ name: 'child', type: 'object' }]);
    State.addEdge({ fromNode: 'a', toNode: 'b', toProp: 0 });
    State.removeEdgeFromProp('x', 0);
    assert.equal(State.edges.length, 1);
  });
});

describe('State.shiftEdgePropIndices', () => {
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
    addNode('a', 'object', [{ name: 'local', type: 'string' }]);
    addNode('b', 'object', [
      { name: 'first', type: 'string' },
      { name: 'second', type: 'string' },
      { name: 'third', type: 'string' },
      { name: 'fourth', type: 'string' },
      { name: 'fifth', type: 'string' },
      { name: 'sixth', type: 'string' },
    ]);
    addNode('s', 'string');
    State.addEdge({ fromNode: 's', toNode: 'b', toProp: 5 });
    State.shiftEdgePropIndices('a', 0);
    assert.equal(State.edges[0]!.toProp, 5);
  });
});

describe('State change events', () => {
  it('emits node and prop update events for explicit mutation helpers', () => {
    addNode('a', 'object', [{ name: 'field', type: 'string', required: false }]);
    const events: string[] = [];
    const unsubscribe = State.onChange(event => {
      events.push(event.type);
    });

    State.setNodeTitle('a', 'renamed');
    State.setNodeDescription('a', 'Some description');
    State.setPropName('a', 0, 'newField');
    State.setPropRequired('a', 0, true);

    unsubscribe();

    assert.deepEqual(events, ['nodeUpdated', 'nodeUpdated', 'propUpdated', 'propUpdated']);
  });

  it('validates array item connections against the items keyword type', () => {
    addNode('arr', 'array', [{ name: 'items', type: 'number' }]);
    addNode('str', 'string');

    assert.throws(
      () => State.addEdge({ fromNode: 'str', toNode: 'arr', toProp: 0 }),
      /Type mismatch/,
    );
  });

  it('emits edge lifecycle events on add/remove/reindex', () => {
    addNode('a', 'string');
    addNode('b', 'object', [
      { name: 'first', type: 'string' },
      { name: 'second', type: 'string' },
    ]);

    const events: string[] = [];
    const unsubscribe = State.onChange(event => {
      events.push(event.type);
    });

    State.addEdge({ fromNode: 'a', toNode: 'b', toProp: 0 });
    State.removeEdgeFromProp('b', 0);
    State.addEdge({ fromNode: 'a', toNode: 'b', toProp: 1 });
    State.shiftEdgePropIndices('b', 0);

    unsubscribe();

    assert.deepEqual(events, ['edgeAdded', 'edgesRemoved', 'edgeAdded', 'edgesReindexed']);
  });
});
