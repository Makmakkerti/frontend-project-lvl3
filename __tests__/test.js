import { promises as fs } from 'fs';
import path from 'path';
import init from '../src/init';

beforeEach(() => {
  const pathToHtml = path.resolve(__dirname, '__fixtures__/index.html');
  return fs.readFile(pathToHtml, 'utf8')
    .then((html) => {
      document.body.innerHTML = html;
    })
    .catch((e) => {
      console.log(e);
    });
});

test('init', () => {
  init();
  expect(true).toBeDefined();
});
