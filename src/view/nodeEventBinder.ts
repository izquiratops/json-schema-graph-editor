import type { PropType } from '../domain/types';
import { State } from '../application/state';
import { NodeCommands } from '../application/nodeCommands';

export const NodeEventBinder = {
  bind(el: HTMLElement, nodeId: string): void {
    this._attachInputHandlers(el, nodeId);
    this._attachActionHandlers(el, nodeId);
  },

  _attachInputHandlers(el: HTMLElement, nodeId: string): void {
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
        NodeCommands.changeArrayItemType(nodeId, arrayItemSelect.value as PropType);
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
        NodeCommands.changePropType(nodeId, propIdx, select.value as PropType);
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
    const deleteNodeButton = el.querySelector<HTMLButtonElement>('button[data-action="delete-node"]');
    if (deleteNodeButton) {
      deleteNodeButton.onclick = () => {
        NodeCommands.delete(nodeId);
      };
    }

    const addPropButton = el.querySelector<HTMLButtonElement>('button[data-action="add-prop"]');
    if (addPropButton) {
      addPropButton.onclick = () => {
        NodeCommands.addProp(nodeId);
      };
    }

    el.querySelectorAll<HTMLButtonElement>('button[data-action="delete-prop"]').forEach(button => {
      button.onclick = () => {
        const propIdx = Number(button.dataset['propIdx']);
        if (Number.isNaN(propIdx)) return;
        NodeCommands.deleteProp(nodeId, propIdx);
      };
    });
  },
};
