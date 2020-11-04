// @ts-check
import 'bootstrap';
import Example from './Example';

const ft = `<div class="container-xl">
    <div class="text-center">created by
    <a href="https://ru.hexlet.io/professions/frontend/projects/11" target="_blank">Hexlet</a>
    </div>
  </div>`;

const footer = document.createElement('footer');
footer.classList.add('footer', 'border-top', 'py-3', 'mt-5');
footer.innerHTML = ft;

export default () => {
  const element = document.querySelector('#point');
  const body = document.querySelector('body');
  body.appendChild(footer);
  const obj = new Example(element);
  obj.init();
};
