import type { ArrayItemsKeyword, Prop, PropType, SchemaNode } from './types';
import { PROP_TYPES } from './constants';
import { getNodeBehavior, canPropHaveOutPort } from './nodeBehavior';
import { State } from './state';
import { DragHandler } from './dragHandler';
import { PortHandler } from './portHandler';

// TODO: This file is getting too big

export const NodeManager = {
  add(type: PropType, x?: number, y?: number): void {
    const id = State.uid();
    const node: SchemaNode = {
      id,
      type,
      title: type + '_' + (id.slice(1)),
      description: '',
      props: [] as Prop[],
      items: undefined,
      x: x ?? 60 + Math.random() * 220,
      y: y ?? 80 + Math.random() * 160,
    };
    if (type === 'object') node.props = [{ name: 'field1', type: 'string', required: false }];
    if (type === 'array') node.items = { type: 'string' };
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

  changeArrayItemType(nodeId: string, newType: PropType): void {
    const node = State.nodes[nodeId]!;
    if (node.type !== 'array' || !node.items || node.items.type === newType) return;

    State.setArrayItemType(nodeId, newType);
    State.removeEdgeFromProp(nodeId, 0);
  },

  render(id: string): void {
    const n = State.nodes[id]!;
    const behavior = getNodeBehavior(n.id, n.type as PropType);

    let el = document.getElementById('node-' + id);
    if (!el) {
      el = document.createElement('div');
      el.id = 'node-' + id;
      el.className = 'node';
      document.getElementById('canvas')!.appendChild(el);
    }

    el.style.left = n.x + 'px';
    el.style.top = n.y + 'px';

    el.innerHTML = this._headerHTML(n.id, n.title, n.type as PropType, behavior.isRoot)
      + this._bodyHTML(n);

    this._attachInputHandlers(el, id);
    this._attachActionHandlers(el, id);
    DragHandler.attach(el, id);
    PortHandler.attach(el, id);
  },

  _attachInputHandlers(el: HTMLElement, nodeId: string): void {
    // Delegated inputs remove global inline mutations and make state updates testable.
    const nodeTitleInput = el.querySelector<HTMLInputElement>('input.node-title');
    if (nodeTitleInput) {
      nodeTitleInput.onchange = () => {
        State.setNodeTitle(nodeId, nodeTitleInput.value);
      };
    }

    const nodeDescriptionInput = el.querySelector<HTMLInputElement>('input.node-description');
    if (nodeDescriptionInput) {
      nodeDescriptionInput.onchange = () => {
        State.setNodeDescription(nodeId, nodeDescriptionInput.value);
      };
    }

    const arrayItemSelect = el.querySelector<HTMLSelectElement>('select.array-item-type');
    if (arrayItemSelect) {
      arrayItemSelect.onchange = () => {
        this.changeArrayItemType(nodeId, arrayItemSelect.value as PropType);
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

  _headerHTML(id: string, title: string, type: PropType, isRoot: boolean): string {
    const behavior = getNodeBehavior(id, type);
    const portIn = behavior.canHaveHeaderInPort ? `<div class="port-in" data-node="${id}"></div>` : '';
    const portOut = behavior.canHaveHeaderOutPort ? `<div class="port-out" data-node="${id}"></div>` : '';
    const delBtn = behavior.canDeleteNode
      ? `<button class="btn-delete-node" data-action="delete-node">×</button>`
      : '';
    const ro = behavior.canEditTitle ? '' : 'readonly';
    return `
      <div class="node-header">
        ${portIn}
        <span class="badge badge-${isRoot ? 'root' : type}">${isRoot ? 'root' : type}</span>
        <input class="node-title" value="${this._escapeAttr(title)}" placeholder="title" ${ro}>
        ${delBtn}
        ${portOut}
      </div>`;
  },

  _bodyHTML(node: SchemaNode): string {
    const behavior = getNodeBehavior(node.id, node.type);
    const descriptionRow = this._descriptionRowHTML(node.description);
    const itemsRow = behavior.hasItemsKeyword && node.items
      ? this._itemsRowHTML(node.id, node.items)
      : '';
    const propRows = node.props.map((prop, idx) => this._propRowHTML(node.type, node.id, prop, idx)).join('');
    const addBtn = behavior.canAddProp
      ? `<button class="btn-add-prop" data-action="add-prop">+ add property</button>`
      : '';
    return `<div class="node-body">${descriptionRow}${itemsRow}${propRows}</div>${addBtn}`;
  },

  _descriptionRowHTML(description: string): string {
    return `
      <label class="keyword-text-row">
        <span class="keyword-label">description</span>
        <input class="node-description" value="${this._escapeAttr(description)}" placeholder="description">
      </label>`;
  },

  _itemsRowHTML(nodeId: string, items: ArrayItemsKeyword): string {
    const typeOptions = PROP_TYPES.map(type =>
      `<option${items.type === type ? ' selected' : ''}>${type}</option>`,
    ).join('');
    const behavior = getNodeBehavior(nodeId, 'array');
    const portIn = behavior.canHavePropInPort
      ? `<div class="port-in" data-node="${nodeId}" data-prop="0"></div>`
      : '';

    return `
      <div class="prop-row keyword-row" id="prop-${nodeId}-0">
        ${portIn}
        <span class="keyword-label">items</span>
        <select class="array-item-type" data-prop-idx="0">
          ${typeOptions}
        </select>
      </div>`;
  },

  _propRowHTML(
    nodeType: PropType,
    nodeId: string,
    prop: { name: string; type: PropType; required?: boolean },
    idx: number,
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
        <input class="prop-name" value="${this._escapeAttr(prop.name)}" data-prop-idx="${idx}">
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

  _escapeAttr(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  },
};
