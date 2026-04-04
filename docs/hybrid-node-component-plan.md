# Hybrid Node Component Refactor Plan

## Goal

Replace string-built node markup with a hybrid view layer:

- HTML structure defined with native `<template>` elements
- Node behavior encapsulated in a light-DOM custom element
- Existing drag, edge, and port behavior preserved during the first refactor

This keeps the current architecture and bundle profile, while removing most inline HTML from TypeScript.

## Why This Approach

The current node rendering flow rebuilds the full node DOM with `innerHTML` and then rebinds listeners after every render. That makes rendering, event wiring, and DOM selectors tightly coupled.

The hybrid approach is the best fit for this codebase because:

- It splits HTML from TypeScript without adding a framework.
- It creates a real component boundary around a node.
- It keeps light DOM so existing CSS and selector-based logic continue to work.
- It allows a gradual migration without rewriting state or render coordination.

## Non-Goals

- No Shadow DOM in the first iteration.
- No framework adoption.
- No state-management rewrite.
- No redesign of edge drawing or drag behavior.
- No conversion of every row into its own custom element.

## Current Constraints

- Edge rendering queries node internals by selector.
- Port logic expects `.port-in` and `.port-out` elements to exist in ordinary DOM.
- Drag logic expects a visible `.badge` inside each node.
- Render scheduling already works and should remain unchanged.

Because of those constraints, the first implementation should keep the same DOM ids, class names, and general subtree layout used today.

## Target Design

### Templates

Add native templates to `index.html` for:

- node shell
- items row
- property row

These templates should contain the static HTML structure only. They should not contain inline event handlers.

### Custom Element

Add one light-DOM custom element for a node, for example `schema-node`.

Responsibilities:

- clone the node template on first render
- patch node content on updates
- render or re-render property rows and items rows inside the node body
- handle delegated `click` and `change` events for node interactions
- preserve the DOM hooks used by drag and port logic

Non-responsibilities:

- edge rendering
- canvas layout
- global toolbar actions
- state scheduling

### Renderer Role After Refactor

`NodeRenderer` should stop building HTML strings and become a mounting/updating adapter:

- create the custom element if needed
- set its `id` and absolute position
- pass node data into the component
- attach drag and port handlers

## File Plan

### 1. `index.html`

Add `<template>` elements near the bottom of the body or near the canvas markup.

Templates to add:

- `node-template`
- `items-row-template`
- `prop-row-template`

Template requirements:

- preserve `.node-header`, `.badge`, `.node-title`, `.node-description`
- preserve `.port-in` and `.port-out`
- preserve `data-action` and `data-prop-idx` hooks where needed
- preserve row ids in the form `prop-${nodeId}-${idx}` once rendered

### 2. New file: `src/view/schemaNodeElement.ts`

Create the light-DOM custom element.

Suggested API:

```ts
export class SchemaNodeElement extends HTMLElement {
  setNode(node: SchemaNode): void;
}

export function registerSchemaNodeElement(): void;
```

Suggested internal structure:

- cache references to frequently updated child elements
- clone the base node template once
- patch values and visibility on updates
- rebuild only the dynamic rows container when prop count or row kind changes
- use delegated listeners instead of per-input rebinding

Suggested private methods:

- `ensureInitialized()`
- `renderNode(node)`
- `renderItemsRow(node)`
- `renderPropRows(node)`
- `syncHeader(node)`
- `syncDescription(node)`
- `syncActionVisibility(node)`
- `handleClick(event)`
- `handleChange(event)`

### 3. `src/view/nodeRenderer.ts`

Simplify `NodeRenderer`.

Changes:

- remove `_headerHTML`, `_bodyHTML`, `_descriptionRowHTML`, `_itemsRowHTML`, `_propRowHTML`, `_escapeAttr`
- replace `div` creation with `schema-node` creation
- call `setNode(...)` on the element instead of writing `innerHTML`
- keep positioning logic
- keep `DragHandler.attach(...)`
- keep `PortHandler.attach(...)`

Expected end state:

- `NodeRenderer` is small and mostly imperative mounting code
- HTML generation is no longer in this file

### 4. `src/view/nodeEventBinder.ts`

Remove or retire this file after its responsibilities move into the custom element.

If other code still imports it during migration, keep it temporarily but stop using it from `NodeRenderer`.

### 5. `src/main.ts`

Register the custom element during startup before the first render.

Suggested change:

```ts
import { registerSchemaNodeElement } from './view/schemaNodeElement';

registerSchemaNodeElement();
```

Do this before state-driven rendering starts.

### 6. `src/view/dragHandler.ts`

No functional redesign in the first pass.

Validation points:

- `.badge` remains present inside each node
- drag start still works from the badge
- moving a node still updates position and redraws edges

Optional follow-up later:

- switch to one delegated drag-start binding instead of re-attaching per render

### 7. `src/view/portHandler.ts`

No functional redesign in the first pass.

Validation points:

- `.port-out` remains on supported headers
- `.port-in` remains on supported rows
- `data-prop` values remain correct
- add/remove/retype flows still preserve valid port targets

Optional follow-up later:

- switch to delegated port listeners if desired

### 8. `src/view/edgeRenderer.ts`

No intended code change in the first pass.

This file is a compatibility constraint. The refactor should preserve the selectors it depends on.

## Implementation Phases

### Phase 1: Introduce templates

- add `node-template`
- add `items-row-template`
- add `prop-row-template`
- keep structure aligned with the current markup

Deliverable:

- templates exist and mirror the current node DOM shape

### Phase 2: Introduce `SchemaNodeElement`

- create the custom element class
- clone and initialize the node template once
- implement `setNode(node)` for updates
- patch header, description, and action visibility

Deliverable:

- one node can render through the custom element with the same visible output as before

### Phase 3: Move interaction logic into the component

- replace direct child rebinding with delegated `click` and `change` handlers
- move title, description, items type, prop type, prop name, required, add prop, delete prop, and delete node handling into the component
- stop calling `NodeEventBinder.bind(...)` from `NodeRenderer`

Deliverable:

- `NodeEventBinder` is no longer part of the render path

### Phase 4: Simplify `NodeRenderer`

- mount `schema-node`
- pass node data into it
- keep positioning and external handler attachment
- remove old HTML-building helpers

Deliverable:

- `NodeRenderer` contains no HTML string generation

### Phase 5: Validate compatibility

- drag still works
- port connections still work
- edge rendering still targets the correct ports
- schema output still updates correctly
- adding, deleting, and editing nodes and props still work

Deliverable:

- feature parity with the current behavior

## Suggested Event Strategy

Use delegated handlers on the custom element root.

### Click handling

Handle actions by checking the nearest actionable target:

- `button[data-action="delete-node"]`
- `button[data-action="add-prop"]`
- `button[data-action="delete-prop"]`

### Change handling

Handle form changes by checking the target element:

- `.node-title`
- `.node-description`
- `.array-item-type`
- `.prop-name`
- `.prop-type`
- `.prop-required`

This avoids query-and-bind work after every render.

## Suggested DOM Rules

To avoid breaking drag and edge behavior, preserve these hooks:

- node root id: `node-${nodeId}`
- property row id: `prop-${nodeId}-${idx}`
- header badge class: `.badge`
- output port class: `.port-out`
- input port class: `.port-in`
- property index in `data-prop` and `data-prop-idx`

Do not rename these in the first pass.

## Testing Checklist

Manual checks:

- add each node type from the toolbar
- edit title and description
- add and delete properties
- rename properties
- change property types
- change array item type
- toggle required flags
- drag nodes around the canvas
- create and remove edges
- verify schema output updates after each change

Automated checks:

- run typecheck
- run tests
- add view-level tests later only if the project starts accumulating more UI logic

## Risks

### Risk 1: Hidden DOM contract breakage

`DragHandler`, `PortHandler`, and `EdgeRenderer` depend on the current DOM shape.

Mitigation:

- preserve selectors and ids in the first pass
- do not introduce Shadow DOM

### Risk 2: Re-render churn remains too high

If the custom element fully replaces its subtree on every update, structure improves but performance and event churn do not.

Mitigation:

- clone the shell once
- patch stable fields directly
- only rebuild row containers when necessary

### Risk 3: Over-componentization

Turning every small fragment into a custom element adds complexity without much value.

Mitigation:

- make only the node a custom element in phase one
- keep rows as template fragments

## Acceptance Criteria

The refactor is complete when:

- node markup is no longer built with inline HTML strings in `NodeRenderer`
- node interaction logic is owned by the light-DOM custom element
- templates define the base node and row markup
- drag, ports, and edge rendering behave the same as before
- existing tests still pass
- typecheck succeeds

## Optional Follow-Ups

- move toolbar inline `onclick` handlers in `index.html` to startup bindings in `main.ts`
- convert `DragHandler` and `PortHandler` to delegated binding patterns
- add small view tests around the component if UI complexity grows
- later reconsider Shadow DOM only after edge and port lookup stop depending on internal selectors