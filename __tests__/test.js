// @ts-check

import { promises as fs } from 'fs';
import path from 'path';
import init from '../src/init';

// @ts-ignore
beforeEach(async () => {
  const pathToHtml = path.resolve(__dirname, '__fixtures__/index.html');
  const html = await fs.readFile(pathToHtml, 'utf8');
  document.body.innerHTML = html;
});

// @ts-ignore
test('init', () => {
  init();
  // @ts-ignore
  expect(true).toBeDefined();
});
