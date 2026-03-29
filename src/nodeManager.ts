import type { PropType } from './types';
import { PROP_TYPES } from './constants';
import { getNodeBehavior, canPropHaveOutPort } from './nodeBehavior';
import { State } from './state';
import { DragHandler } from './dragHandler';
import { PortHandler } from './portHandler';

export const NodeManager = {
  add(type: PropType, x?: number, y?: number): void {
    const id = State.uid();
    const node = {
      id,
      type,
      name: type + '_' + (id.slice(1)),
      props: [] as { name: string; type: PropType; required?: boolean }[],
      x: x ?? 60 + Math.random() * 220,
      y: y ?? 80 + Math.random() * 160,
    };
    if (type === 'object') node.props = [{ name: 'field1', type: 'string', required: false }];
    if (type === 'array') node.props = [{ name: 'items', type: 'string', required: false }];
    State.addNode(node);
  },

  delete(id: string): void {
    State.removeEdgesOf(id);
    document.getElementById('node-' + id)?.remove();
    State.removeNode(id);
  },

  addProp(nodeId: string): void {
    State.addProp(nodeId, { name: 'field', type: 'string', required: false });
  },

  deleteProp(nodeId: string, propIdx: number): void {
    State.removeEdgeFromProp(nodeId, propIdx);
    State.shiftEdgePropIndices(nodeId, propIdx);
    State.removeProp(nodeId, propIdx);
  },

  changePropType(nodeId: string, propIdx: number, newType: PropType): void {
    const prop = State.nodes[nodeId]!.props[propIdx]!;
    if (prop.type === newType) return;

    State.setPropType(nodeId, propIdx, newType);
    State.removeEdgeFromProp(nodeId, propIdx);
  },

  render(id: string): void {
    const n = State.nodes[id]!;
    const behavior = getNodeBehavior(n.id, n.type as PropType);
    const isRoot = behavior.nodeKind === 'root';

    let el = document.getElementById('node-' + id);
    if (!el) {
      el = document.createElement('div');
      el.id = 'node-' + id;
      el.className = 'node';
      document.getElementById('canvas')!.appendChild(el);
    }

    el.style.left = n.x + 'px';
    el.style.top = n.y + 'px';

    el.innerHTML = this._headerHTML(n.id, n.name, n.type as PropType, isRoot) + this._bodyHTML(id, n.type as PropType, n.props, isRoot);

    this._attachInputHandlers(el, id);
    this._attachActionHandlers(el, id);
    DragHandler.attach(el, id);
    PortHandler.attach(el, id);
  },

  _attachInputHandlers(el: HTMLElement, nodeId: string): void {
    // Delegated inputs remove global inline mutations and make state updates testable.
    const nodeNameInput = el.querySelector<HTMLInputElement>('input.node-name');
    if (nodeNameInput) {
      nodeNameInput.onchange = () => {
        State.setNodeName(nodeId, nodeNameInput.value);
      };
    }

    el.querySelectorAll<HTMLInputElement>('input.prop-name').forEach(input => {
      input.onchange = () => {
        const propIdx = Number(input.dataset['propIdx']);
        if (Number.isNaN(propIdx)) return;
        State.setPropName(nodeId, propIdx, input.value);
      };
    });

    el.querySelectorAll<HTMLSelectElement>('select.prop-type').forEach(select => {
      select.onchange = () => {
        const propIdx = Number(select.dataset['propIdx']);
        if (Number.isNaN(propIdx)) return;
        this.changePropType(nodeId, propIdx, select.value as PropType);
      };
    });

    el.querySelectorAll<HTMLInputElement>('input.prop-required').forEach(input => {
      input.onchange = () => {
        const propIdx = Number(input.dataset['propIdx']);
        if (Number.isNaN(propIdx)) return;
        State.setPropRequired(nodeId, propIdx, input.checked);
      };
    });
  },

  _attachActionHandlers(el: HTMLElement, nodeId: string): void {
    // Action delegation replaces remaining inline buttons with explicit command routing.
    const deleteNodeButton = el.querySelector<HTMLButtonElement>('button[data-action="delete-node"]');
    if (deleteNodeButton) {
      deleteNodeButton.onclick = () => {
        this.delete(nodeId);
      };
    }

    const addPropButton = el.querySelector<HTMLButtonElement>('button[data-action="add-prop"]');
    if (addPropButton) {
      addPropButton.onclick = () => {
        this.addProp(nodeId);
      };
    }

    el.querySelectorAll<HTMLButtonElement>('button[data-action="delete-prop"]').forEach(button => {
      button.onclick = () => {
        const propIdx = Number(button.dataset['propIdx']);
        if (Number.isNaN(propIdx)) return;
        this.deleteProp(nodeId, propIdx);
      };
    });
  },

  _headerHTML(id: string, name: string, type: PropType, isRoot: boolean): string {
    const behavior = getNodeBehavior(id, type);
    const portIn = behavior.canHaveHeaderInPort ? `<div class="port-in" data-node="${id}"></div>` : '';
    const portOut = behavior.canHaveHeaderOutPort ? `<div class="port-out" data-node="${id}"></div>` : '';
    const delBtn = behavior.canDeleteNode
      ? `<button class="btn-delete-node" data-action="delete-node">×</button>`
      : '';
    const ro = behavior.canEditName ? '' : 'readonly';
    return `
      <div class="node-header">
        ${portIn}
        <span class="badge badge-${isRoot ? 'root' : type}">${isRoot ? 'root' : type}</span>
        <input class="node-name" value="${name}" ${ro}>
        ${delBtn}
        ${portOut}
      </div>`;
  },

  _bodyHTML(
    nodeId: string,
    type: PropType,
    props: Array<{ name: string; type: PropType }>,
    isRoot: boolean,
  ): string {
    const behavior = getNodeBehavior(nodeId, type);
    const hasProps = behavior.canAddProp;
    const rows = props.map((p, i) => this._propRowHTML(type, nodeId, p, i, isRoot)).join('');
    const addBtn = hasProps
      ? `<button class="btn-add-prop" data-action="add-prop">+ add property</button>`
      : '';
    return `<div class="node-body">${rows}</div>${addBtn}`;
  },

  _propRowHTML(
    nodeType: PropType,
    nodeId: string,
    prop: { name: string; type: PropType; required?: boolean },
    idx: number,
    isRoot: boolean,
  ): string {
    const typeOptions = PROP_TYPES.map(t =>
      `<option${prop.type === t ? ' selected' : ''}>${t}</option>`,
    ).join('');

    const behavior = getNodeBehavior(nodeId, nodeType);

    const portIn = behavior.canHavePropInPort
      ? `<div class="port-in" data-node="${nodeId}" data-prop="${idx}"></div>`
      : '';

    const portOut = canPropHaveOutPort(prop.type)
      ? `<div class="port-out" data-node="${nodeId}" data-prop="${idx}"></div>`
      : '';

    const requiredChecked = prop.required ? 'checked' : '';

    return `
      <div class="prop-row" id="prop-${nodeId}-${idx}">
        ${portIn}
        <input class="prop-name" value="${prop.name}" data-prop-idx="${idx}">
        <select class="prop-type" data-prop-idx="${idx}">
          ${typeOptions}
        </select>
        <label class="prop-required">
          <input class="prop-required" type="checkbox" ${requiredChecked} data-prop-idx="${idx}">
          <small>Required</small>
        </label>
        <button class="btn-delete-prop" data-action="delete-prop" data-prop-idx="${idx}">×</button>
        ${portOut}
      </div>`;
  },
};
