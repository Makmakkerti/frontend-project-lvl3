// @ts-nocheck
import 'bootstrap';
import * as yup from 'yup';
import Jumbotron from './jumbotron';

const footerContent = `<div class="container-xl">
    <div class="text-center">created by
    <a href="https://www.mokienko.net" target="_blank">Mokienko.net</a>
    </div>
  </div>`;

const footer = document.createElement('footer');
footer.classList.add('footer', 'border-top', 'py-3', 'mt-5');
footer.innerHTML = footerContent;

const app = () => {
  const state = {
    rssList: [],
  };

  const validate = (link) => {
    const schema = yup.string().trim().url().required();

    try {
      schema.validateSync(link);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  // Adding Jumbotron to the page
  const element = document.querySelector('#point');
  const body = document.querySelector('body');
  body.appendChild(footer);
  const obj = new Jumbotron(element);
  obj.init();
  const form = document.querySelector('.rss-form');
  const rssInput = document.querySelector('.rss-form input');
  const errorField = document.querySelector('#errors');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // @ts-ignore
    const data = new FormData(e.target);
    const inputData = data.get('url');
    const validationError = validate(inputData);

    const clearError = () => {
      errorField.textContent = '';
      errorField.classList.add('hide');
      rssInput.classList.remove('errorInput');
    };

    const showError = (err) => {
      rssInput.classList.add('errorInput');
      errorField.textContent = err;
      errorField.classList.remove('hide');
    };

    if (validationError) {
      showError(validationError);
      return;
    }

    if (state.rssList.includes(inputData)) {
      showError('RSS already in the list!');
      return;
    }
    clearError();

    state.rssList.push(inputData);
    console.log(state);
  });
};

export default app;
