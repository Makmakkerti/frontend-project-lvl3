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
    rssLinks: [],
    feeds: [],
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
  const formInput = document.querySelector('.rss-form input');
  const feedback = document.querySelector('.feedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // @ts-ignore
    const data = new FormData(e.target);
    const url = data.get('url');
    const validationError = validate(url);

    formInput.classList.remove('border', 'border-danger');
    feedback.classList.remove('text-danger', 'text-success');

    if (validationError) {
      formInput.classList.add('border', 'border-danger');
      feedback.textContent = validationError;
      feedback.classList.add('text-danger');
      return;
    }

    if (state.rssLinks.includes(url)) {
      feedback.classList.add('text-danger');
      formInput.classList.add('border', 'border-danger');
      feedback.textContent = 'RSS already in the list!';
      return;
    }

    const render = (selector) => {
      const div = document.querySelector(`.${selector.toLowerCase()}`);
      div.innerHTML = '';

      const heading = document.createElement('h2');
      heading.textContent = selector;
      const ul = document.createElement('ul');
      ul.classList.add('list-group');

      if (selector.toLowerCase() === 'feeds') {
        ul.classList.add('mb-5');
        state.feeds.forEach((feed) => {
          const li = document.createElement('li');
          const head = document.createElement('h3');
          head.textContent = feed.channelTitle;
          const desc = document.createElement('p');
          desc.textContent = feed.channelDescription;
          li.appendChild(head);
          li.appendChild(desc);
          li.classList.add('list-group-item');
          ul.appendChild(li);
        });
      }

      if (selector.toLowerCase() === 'posts') {
        state.posts.forEach((post) => {
          const li = document.createElement('li');
          const link = document.createElement('a');
          link.setAttribute('href', post.link);
          link.textContent = post.title;
          li.classList.add('list-group-item');
          li.appendChild(link);
          ul.appendChild(li);
        });
      }

      div.appendChild(heading);
      div.appendChild(ul);
    };

    const parse = (parsedXML) => {
      const channelData = parsedXML.querySelector('channel');
      const channelTitle = channelData.querySelector('title').textContent;
      const channelDescription = channelData.querySelector('description').textContent;
      const channelLink = channelData.querySelector('link').textContent;
      const channelId = state.feeds.length + 1;
      state.feeds.push({
        channelTitle,
        channelDescription,
        channelLink,
        id: channelId,
      });

      const allPosts = channelData.querySelectorAll('item');
      let postId = 1;
      allPosts.forEach((post) => {
        const title = post.querySelector('title').textContent;
        const description = post.querySelector('description').textContent;
        const link = post.querySelector('link').textContent;
        state.posts.push({
          title,
          description,
          link,
          channelId,
          id: postId,
        });
        postId += 1;
      });
      render('Feeds');
      render('Posts');
    };

    axios.get(`https://api.allorigins.win/get?url=${url}`).then((response) => {
      const parser = new DOMParser();
      const parsedXML = parser.parseFromString(response.data.contents, 'text/xml');
      parse(parsedXML);
      formInput.value = '';
      feedback.textContent = 'Rss has been loaded';
      feedback.classList.add('text-success');
    })
      .catch((err) => {
        console.log(err);
      });

    state.rssLinks.push(url);
  });
};

export default app;
