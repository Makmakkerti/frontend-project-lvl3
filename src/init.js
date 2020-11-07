// @ts-nocheck
import 'bootstrap';
import onChange from 'on-change';
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
          console.log('Validation error!');
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
          feedback.textContent = 'Rss has been loaded';
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
      watchedState.error = 'RSS already in the list!';
      return;
    }

    try {
      schema.validateSync(url);
    } catch (err) {
      watchedState.error = err.message;
      return;
    }
    watchedState.error = '';

    watchedState.formState = 'sending';

    axios.get(`https://api.allorigins.win/get?url=${url}`).then((response) => {
      const parser = new DOMParser();
      const parsedXML = parser.parseFromString(response.data.contents, 'text/xml');
      parse(parsedXML);
      watchedState.rssLinks.push(url);
      watchedState.formState = 'success';
    })
      .catch((err) => {
        watchedState.error = 'Source is not correct!';
        console.log(err);
      });
  });
};

export default app;
