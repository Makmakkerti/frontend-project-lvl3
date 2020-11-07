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

const app = () => {
  const appState = {
    rssLinks: [],
    feeds: [],
    posts: [],
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

  const watchedState = onChange(appState, (path, value, oldValue) => {
    switch (path) {
      case 'rssLinks':
        console.log(value, oldValue);
        render(appState);
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

    if (watchedState.rssLinks.includes(url)) {
      feedback.classList.add('text-danger');
      formInput.classList.add('border', 'border-danger');
      feedback.textContent = 'RSS already in the list!';
      return;
    }

    axios.get(`https://api.allorigins.win/get?url=${url}`).then((response) => {
      const parser = new DOMParser();
      const parsedXML = parser.parseFromString(response.data.contents, 'text/xml');
      parse(parsedXML);
      formInput.value = '';
      watchedState.rssLinks.push(url);
      feedback.textContent = 'Rss has been loaded';
      feedback.classList.add('text-success');
    })
      .catch((err) => {
        console.log(err);
      });
  });
};

export default app;
