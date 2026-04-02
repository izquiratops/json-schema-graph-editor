import { State } from '../application/state';
import { buildSchema } from '../domain/schemaBuilder';

export const SchemaOutput = {
  update(): void {
    const pre = document.getElementById('schema-pre')!;
    if (!State.nodes['root']) { pre.innerHTML = '{}'; return; }

    const schema = {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      ...buildSchema(State.nodes, State.edges, 'root'),
    };

    pre.innerHTML = this._highlight(JSON.stringify(schema, null, 2));
  },

  copy(): void {
    if (!State.nodes['root']) return;
    const schema = {
      '$schema': 'https://json-schema.org/draft/2020-12/schema',
      ...buildSchema(State.nodes, State.edges, 'root'),
    };
    navigator.clipboard?.writeText(JSON.stringify(schema, null, 2));
  },

  _highlight(json: string): string {
    return json
      .replace(/("(?:[^\\"]|\\.)*")\s*:/g, '<span class="hl-key">$1</span>:')
      .replace(/:\s*("(?:[^\\"]|\\.)*")/g, ': <span class="hl-str">$1</span>')
      .replace(/:\s*(-?\d+\.?\d*)/g,       ': <span class="hl-num">$1</span>')
      .replace(/:\s*(true|false|null)\b/g, ': <span class="hl-bool">$1</span>');
  },
};
