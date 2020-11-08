import 'bootstrap';
import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import initView from './view';
import en from './locales/en';

i18next.init({
  lng: 'en',
  debug: false,
  resources: {
    en,
  },
});

const app = () => {
  const appState = {
    rssLinks: [],
    feeds: [],
    posts: [],
    error: '',
    formState: '',
  };

  const elements = {
    body: document.querySelector('body'),
    point: document.querySelector('#point'),
  };

  const watchedState = initView(appState, elements);

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

  const form = document.querySelector('.rss-form');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const url = data.get('url');
    const schema = yup.string().trim().url().required();

    if (watchedState.rssLinks.includes(url)) {
      watchedState.error = i18next.t('errors.inList');
      watchedState.formState = 'invalid';
      return;
    }

    try {
      schema.validateSync(url);
    } catch (err) {
      watchedState.error = i18next.t('errors.validation');
      watchedState.formState = 'invalid';
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
