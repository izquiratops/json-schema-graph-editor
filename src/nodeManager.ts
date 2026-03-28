import type { PropType } from './types';
import { PROP_TYPES, CAN_CONNECT } from './constants';
import { State } from './state';
import { DragHandler } from './dragHandler';
import { PortHandler } from './portHandler';
import { EdgeRenderer } from './edgeRenderer';
import { SchemaOutput } from './schemaOutput';

export const NodeManager = {
  add(type: PropType, x?: number, y?: number): void {
    const id = State.uid();
    const node = {
      id,
      type,
      name: type + '_' + (id.slice(1)),
      props: [] as { name: string; type: PropType }[],
      x: x ?? 60 + Math.random() * 220,
      y: y ?? 80 + Math.random() * 160,
    };
    if (type === 'object') node.props = [{ name: 'field1', type: 'string' }];
    if (type === 'array')  node.props = [{ name: 'items',  type: 'string' }];
    State.addNode(node);
    this.render(id);
    SchemaOutput.update();
  },

  delete(id: string): void {
    State.removeEdgesOf(id);
    Object.values(State.nodes).forEach(n =>
      n.props.forEach(p => { if (p._ref === id) p._ref = null; }),
    );
    document.getElementById('node-' + id)?.remove();
    State.removeNode(id);
    EdgeRenderer.render();
    SchemaOutput.update();
  },

  addProp(nodeId: string): void {
    State.nodes[nodeId]!.props.push({ name: 'field', type: 'string' });
    this.render(nodeId);
    EdgeRenderer.render();
    SchemaOutput.update();
  },

  deleteProp(nodeId: string, propIdx: number): void {
    State.removeEdgeFromProp(nodeId, propIdx);
    State.shiftEdgePropIndices(nodeId, propIdx);
    State.nodes[nodeId]!.props.splice(propIdx, 1);
    this.render(nodeId);
    EdgeRenderer.render();
    SchemaOutput.update();
  },

  changePropType(nodeId: string, propIdx: number, newType: PropType): void {
    const prop = State.nodes[nodeId]!.props[propIdx]!;
    prop.type = newType;
    if (!CAN_CONNECT(newType)) {
      prop._ref = null;
      State.removeEdgeFromProp(nodeId, propIdx);
    }
    this.render(nodeId);
    EdgeRenderer.render();
    SchemaOutput.update();
  },

  render(id: string): void {
    const n = State.nodes[id]!;
    const isRoot = id === 'root';

    let el = document.getElementById('node-' + id) as HTMLElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = 'node-' + id;
      el.className = 'node';
      document.getElementById('canvas')!.appendChild(el);
    }

    el.style.left = n.x + 'px';
    el.style.top  = n.y + 'px';

    el.innerHTML = this._headerHTML(n.id, n.name, n.type as PropType, isRoot) + this._bodyHTML(id, n.type as PropType, n.props);

    DragHandler.attach(el, id);
    PortHandler.attach(el, id);
  },

  _headerHTML(id: string, name: string, type: PropType, isRoot: boolean): string {
    const portIn = isRoot ? '' : `<div class="port-in" data-node="${id}"></div>`;
    const delBtn = isRoot ? '' : `<button class="btn-delete-node" onclick="NodeManager.delete('${id}')">×</button>`;
    const ro     = isRoot ? 'readonly' : '';
    return `
      <div class="node-header">
        ${portIn}
        <span class="badge badge-${isRoot ? 'root' : type}">${isRoot ? 'root' : type}</span>
        <input class="node-name" value="${name}" ${ro}
          onchange="State.nodes['${id}'].name = this.value; SchemaOutput.update()">
        ${delBtn}
      </div>`;
  },

  _bodyHTML(
    nodeId: string,
    type: PropType,
    props: Array<{ name: string; type: PropType; _ref?: string | null }>,
  ): string {
    const hasProps = CAN_CONNECT(type);
    const rows = props.map((p, i) => this._propRowHTML(nodeId, p, i)).join('');
    const addBtn = hasProps
      ? `<button class="btn-add-prop" onclick="NodeManager.addProp('${nodeId}')">+ add property</button>`
      : '';
    return `<div class="node-body">${rows}</div>${addBtn}`;
  },

  _propRowHTML(
    nodeId: string,
    prop: { name: string; type: PropType },
    idx: number,
  ): string {
    const typeOptions = PROP_TYPES.map(t =>
      `<option${prop.type === t ? ' selected' : ''}>${t}</option>`,
    ).join('');

    const portOut = CAN_CONNECT(prop.type)
      ? `<div class="port-out" data-node="${nodeId}" data-prop="${idx}"></div>`
      : '';

    return `
      <div class="prop-row" id="prop-${nodeId}-${idx}">
        <input class="prop-name" value="${prop.name}"
          onchange="State.nodes['${nodeId}'].props[${idx}].name = this.value; SchemaOutput.update()">
        <select class="prop-type"
          onchange="NodeManager.changePropType('${nodeId}', ${idx}, this.value)">
          ${typeOptions}
        </select>
        <button class="btn-delete-prop" onclick="NodeManager.deleteProp('${nodeId}', ${idx})">×</button>
        ${portOut}
      </div>`;
  },
};
