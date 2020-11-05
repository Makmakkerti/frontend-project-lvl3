// @ts-nocheck
import 'bootstrap';
import * as yup from 'yup';
import axios from 'axios';
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
    channels: [],
    posts: [],
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
  const errorField = document.querySelector('.feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // @ts-ignore
    const data = new FormData(e.target);
    const inputData = data.get('url');
    const validationError = validate(inputData);

    const clearError = () => {
      errorField.textContent = '';
      rssInput.classList.remove('errorInput');
      errorField.classList.remove('text-danger');
    };

    const showError = (err) => {
      rssInput.classList.add('errorInput');
      errorField.textContent = err;
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

    // const addToState = () => {

    // };

    const parse = (parsedXML) => {
      // const feeds = document.querySelector('.feeds');
      // const posts = document.querySelector('.posts');
      const channelData = parsedXML.querySelector('channel');
      const channelTitle = channelData.querySelector('title').textContent;
      const channelDescription = channelData.querySelector('description').textContent;
      const channelLink = channelData.querySelector('link').textContent;
      console.log(channelTitle, channelDescription, channelLink);

      const allPosts = channelData.querySelectorAll('item');
      allPosts.forEach((post) => {
        const title = post.querySelector('title').textContent;
        const description = post.querySelector('description').textContent;
        const link = post.querySelector('link').textContent;
        console.log(title, description, link);
      });
    };

    axios.get(inputData, {
      crossdomain: true,
    }).then((response) => {
      const parser = new DOMParser();
      const parsedXML = parser.parseFromString(response.data, 'text/xml');
      console.log(parsedXML);
      parse(parsedXML);
    })
      .catch((err) => {
        console.log(err);
      });

    state.rssList.push(inputData);
    console.log(state);
  });
};

export default app;
