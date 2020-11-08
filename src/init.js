import 'bootstrap';
import i18next from 'i18next';
import onChange from 'on-change';
import * as yup from 'yup';
import axios from 'axios';
import en from './locales/en';
import Jumbotron from './jumbotron';

i18next.init({
  lng: 'en',
  debug: true,
  resources: {
    en,
  },
});

const footerContent = `<div class="container-xl">
    <div class="text-center">${i18next.t('footerText')}
    <a href="https://www.mokienko.net" target="_blank">Mokienko.net</a>
    </div>
  </div>`;

const footer = document.createElement('footer');
footer.classList.add('footer', 'border-top', 'py-3', 'mt-5');
footer.innerHTML = footerContent;

const body = document.querySelector('body');
body.appendChild(footer);

const element = document.querySelector('#point');
const obj = new Jumbotron(element);
obj.init();

const form = document.querySelector('.rss-form');
const formInput = document.querySelector('.rss-form input');
const formButton = document.querySelector('.rss-form button');
const feedback = document.querySelector('.feedback');

const app = () => {
  const appState = {
    rssLinks: [],
    feeds: [],
    posts: [],
    error: '',
    formState: '',
  };

  const render = (state) => {
    const feeds = document.querySelector('.feeds');
    const posts = document.querySelector('.posts');
    feeds.innerHTML = '';
    posts.innerHTML = '';

    const feedsHeading = document.createElement('h2');
    feedsHeading.textContent = 'Feeds';
    feeds.appendChild(feedsHeading);
    const feedList = document.createElement('ul');
    feedList.classList.add('list-group', 'mb-5');

    state.feeds.forEach((feed) => {
      const feedItem = document.createElement('li');
      const head = document.createElement('h3');
      head.textContent = feed.channelTitle;
      const desc = document.createElement('p');
      desc.textContent = feed.channelDescription;
      feedItem.appendChild(head);
      feedItem.appendChild(desc);
      feedItem.classList.add('list-group-item');
      feedList.appendChild(feedItem);
    });
    feeds.appendChild(feedList);

    const postsHeading = document.createElement('h3');
    postsHeading.textContent = 'Posts';
    const postList = document.createElement('ul');
    posts.appendChild(postsHeading);
    postList.classList.add('list-group', 'mb-5');

    state.posts.forEach((post) => {
      const postItem = document.createElement('li');
      const link = document.createElement('a');
      link.setAttribute('href', post.link);
      link.textContent = post.title;
      postItem.classList.add('list-group-item');
      postItem.appendChild(link);
      posts.appendChild(postItem);
    });
    posts.appendChild(postList);
  };

  const watchedState = onChange(appState, (path, value) => {
    switch (path) {
      case 'rssLinks':
        render(appState);
        break;

      case 'formState':
        if (value === 'invalid') {
          feedback.classList.remove('text-success');
          feedback.classList.add('text-danger');
          formInput.classList.add('border', 'border-danger');
          formInput.disabled = false;
          formButton.disabled = false;
        }

        if (value === 'sending') {
          feedback.classList.remove('text-danger');
          formInput.classList.remove('border', 'border-danger');
          formInput.disabled = true;
          formButton.disabled = true;
        }

        if (value === 'success') {
          formInput.disabled = false;
          formButton.disabled = false;
          formInput.value = '';
          feedback.textContent = i18next.t('success');
          feedback.classList.add('text-success');
        }
        break;

      case 'error':
        feedback.textContent = value;
        feedback.classList.add('text-danger');
        formInput.classList.add('border', 'border-danger');
        break;

      default:
        break;
    }
  });

  const parse = (parsedXML) => {
    const channelData = parsedXML.querySelector('channel');
    const channelTitle = channelData.querySelector('title').textContent;
    const channelDescription = channelData.querySelector('description').textContent;
    const channelLink = channelData.querySelector('link').textContent;
    const channelId = watchedState.feeds.length + 1;
    watchedState.feeds.push({
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
      watchedState.posts.push({
        title,
        description,
        link,
        channelId,
        id: postId,
      });
      postId += 1;
    });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const url = data.get('url');
    const schema = yup.string().trim().url().required();

    if (watchedState.rssLinks.includes(url)) {
      watchedState.error = i18next.t('errors.inList');
      if (watchedState.formState !== 'invalid') {
        watchedState.formState = 'invalid';
      }
      return;
    }

    try {
      schema.validateSync(url);
    } catch (err) {
      watchedState.error = i18next.t('errors.validation');
      if (watchedState.formState !== 'invalid') {
        watchedState.formState = 'invalid';
      }
      return;
    }

    watchedState.error = '';
    watchedState.formState = 'sending';

    axios.get(`https://api.allorigins.win/get?url=${url}`)
      .then((response) => {
        try {
          const parser = new DOMParser();
          const parsedXML = parser.parseFromString(response.data.contents, 'text/xml');
          parse(parsedXML);
          watchedState.rssLinks.push(url);
          watchedState.formState = 'success';
        } catch (error) {
          watchedState.formState = 'invalid';
          watchedState.error = i18next.t('errors.invalidRss');
        }
      })
      .catch(() => {
        watchedState.formState = 'invalid';
        watchedState.error = i18next.t('errors.network');
      });
  });
};

export default app;
