/* eslint-disable no-param-reassign */
import 'bootstrap';
import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
import config from './config';
import initView from './view';
import en from './locales/en';
import parse from './parser';

const app = () => {
  i18next.init({
    lng: 'en',
    debug: false,
    resources: {
      en,
    },
  });

  const state = {
    feeds: [],
    posts: [],
    form: {
      state: 'filling',
      error: null,
    },
    network: {
      status: 'idle',
      error: false,
    },
  };

  yup.setLocale({
    string: {
      url: i18next.t('errors.url'),
    },
    mixed: {
      notOneOf: i18next.t('errors.notOneOf'),
    },
  });

  const watchedState = initView(state);
  const UPDATE_TIME = 5000;

  const assignFeedID = (feed) => {
    feed.id = _.uniqueId('feed_');
    return feed;
  };

  const assignPostsID = (posts, feedId) => {
    const postsWithID = posts
      .reverse()
      .map((post) => {
        const id = _.uniqueId('post_');
        return { ...post, id, feedId };
      });
    return postsWithID;
  };

  const getNewPosts = (posts, feedId) => {
    const feedPosts = watchedState.posts.filter((el) => el.feedId === feedId);
    const newPosts = _.differenceBy(posts, feedPosts, 'link');
    return assignPostsID(newPosts, feedId);
  };

  const updatePosts = (feed) => {
    const url = config.proxyURL + feed.url;
    axios.get(url)
      .then((response) => {
        const data = parse(response.data.contents, feed.url);
        const newPosts = getNewPosts(data.posts, feed.id);
        watchedState.posts.push(...newPosts);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setTimeout(updatePosts, UPDATE_TIME, feed);
      });
  };

  const addFeed = (feedURL) => {
    watchedState.network.status = 'loading';
    watchedState.network.error = false;
    const url = `${config.proxyURL}${feedURL}`;
    axios.get(url)
      .then((response) => {
        const data = parse(response.data.contents, feedURL);
        const feed = assignFeedID(data.feed);
        const posts = assignPostsID(data.posts, feed.id);
        watchedState.feeds.unshift(feed);
        watchedState.posts.push(...posts);
        watchedState.network.status = 'success';

        watchedState.form.state = 'filling';
        setTimeout(updatePosts, UPDATE_TIME, feed);
      })
      .catch((err) => {
        switch (err.name) {
          case 'Error':
            watchedState.network.error = true;
            break;
          case 'TypeError':
            watchedState.network.status = 'failed';
            watchedState.form.state = 'invalid';
            watchedState.form.error = i18next.t('errors.invalidRss');
            break;
          default:
            watchedState.network.status = 'failed';
            watchedState.form.error = i18next.t('errors.unexpected');
        }
      });
  };

  const form = document.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const url = data.get('url').trim();
    const feedUrls = watchedState.feeds.map((feed) => feed.url);
    const schema = yup.string()
      .trim()
      .url()
      .notOneOf(feedUrls)
      .required();

    try {
      schema.validateSync(url);
    } catch (err) {
      watchedState.form.state = 'invalid';
      watchedState.form.error = err.message;
      return;
    }
    watchedState.form.error = null;
    watchedState.form.state = 'valid';
    addFeed(url);
  });
};

export default app;
