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

    const renderFeedsList = () => {
      const feedsDiv = document.querySelector('.feeds');
      feedsDiv.innerHTML = '';

      const heading = document.createElement('h2');
      heading.textContent = 'Feeds';
      const ul = document.createElement('ul');

      state.channels.forEach((feed) => {
        const li = document.createElement('li');
        const head = document.createElement('h3');
        head.textContent = feed.channelTitle;
        const desc = document.createElement('p');
        desc.textContent = feed.channelDescription;
        li.appendChild(head);
        li.appendChild(desc);
        ul.appendChild(li);
      });

      feedsDiv.appendChild(heading);
      feedsDiv.appendChild(ul);
    };

    const renderPostsList = () => {
      const postsDiv = document.querySelector('.posts');
      postsDiv.innerHTML = '';

      const heading = document.createElement('h2');
      heading.textContent = 'Posts';
      const ul = document.createElement('ul');

      state.posts.forEach((post) => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.setAttribute('href', post.link);
        link.textContent = post.title;
        li.appendChild(link);
        ul.appendChild(li);
      });

      postsDiv.appendChild(heading);
      postsDiv.appendChild(ul);
    };

    const parse = (parsedXML) => {
      const channelData = parsedXML.querySelector('channel');
      const channelTitle = channelData.querySelector('title').textContent;
      const channelDescription = channelData.querySelector('description').textContent;
      const channelLink = channelData.querySelector('link').textContent;
      const channelId = state.channels.length + 1;
      state.channels.push({
        channelTitle,
        channelDescription,
        channelLink,
        id: channelId,
      });

      renderFeedsList();

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
      renderPostsList();
    };

    axios.get(`https://api.allorigins.win/get?url=${inputData}`).then((response) => {
      const parser = new DOMParser();
      const parsedXML = parser.parseFromString(response.data.contents, 'text/xml');
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
