import { componentize } from '@bytecodealliance/componentize-js';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const source = await readFile(path.join(root, 'src', 'index.js'), 'utf8');
const wit = await readFile(path.join(root, 'wit', 'provider.wit'), 'utf8');

const { component } = await componentize(source, wit, {
  witPath: path.join(root, 'wit'),
});

await writeFile(path.join(root, 'juro.wasm'), component);
console.log('built', component.length, 'bytes');