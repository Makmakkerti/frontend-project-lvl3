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
    feeds: [],
    posts: [],
    error: '',
    formState: '',
    timeoutID: null,
  };

  const elements = {
    body: document.querySelector('body'),
    point: document.querySelector('#point'),
  };
  const watchedState = initView(appState, elements);

  const parseFeed = (feed, url) => {
    const existingFeed = watchedState.feeds.filter((el) => el.url === url);
    if (existingFeed.length) {
      return existingFeed[0];
    }
    const title = feed.querySelector('title').textContent;
    const description = feed.querySelector('description').textContent;
    const link = feed.querySelector('link').textContent;

    const id = watchedState.feeds.length + 1;
    return {
      title,
      description,
      link,
      id,
      url,
    };
  };

  const parsePost = (post, feedId, id) => {
    const title = post.querySelector('title').textContent;
    const description = post.querySelector('description').textContent;
    const link = post.querySelector('link').textContent;
    return {
      title,
      description,
      link,
      feedId,
      id,
    };
  };

  const parse = (data, url) => {
    const parser = new DOMParser();
    const parsedXML = parser.parseFromString(data, 'text/xml');

    const channel = parsedXML.querySelector('channel');
    const feed = parseFeed(channel, url);
    const channelPosts = channel.querySelectorAll('item');
    const parsedData = { feed, posts: [] };

    const inListLinks = watchedState.posts
      .filter((el) => el.feedId === feed.id)
      .map((item) => item.link);

    const newPosts = [];
    channelPosts.forEach((post) => {
      const link = post.querySelector('link').textContent;
      if (!inListLinks.includes(link)) {
        newPosts.push(post);
      }
    });

    newPosts.forEach((item) => {
      const id = parsedData.posts.length + 1;
      const post = parsePost(item, feed.id, id);
      parsedData.posts.push(post);
    });
    return parsedData;
  };

  const updatePosts = () => {
    watchedState.feeds.forEach((feed) => {
      axios.get(`https://api.allorigins.win/get?url=${feed.url}`)
        .then((response) => parse(response.data.contents, feed.url))
        .then((data) => {
          data.posts.reverse().forEach((post) => {
            watchedState.posts.unshift(post);
          });
        })
        .catch((err) => {
          console.log(err);
        });
    });
    watchedState.timeoutID = setTimeout(updatePosts, 5000);
  };

  const sendForm = (url) => {
    axios.get(`https://api.allorigins.win/get?url=${url}`)
      .then((response) => {
        try {
          const data = parse(response.data.contents, url);
          data.posts.forEach((post) => {
            watchedState.posts.push(post);
          });
          watchedState.feeds.push(data.feed);
          watchedState.formState = 'success';
        } catch (error) {
          watchedState.formState = 'invalid';
          watchedState.error = i18next.t('errors.invalidRss');
        }
      }).then(() => {
        if (watchedState.feeds.length === 1) {
          setTimeout(updatePosts, 5000);
        }
      })
      .catch(() => {
        watchedState.formState = 'invalid';
        watchedState.error = i18next.t('errors.network');
      });
  };

  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const url = data.get('url').trim();
    const schema = yup.string().trim().url().required();
    const inList = watchedState.feeds.filter((feed) => feed.url === url);

    if (inList.length) {
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
    sendForm(url);
  });
};

export default app;
