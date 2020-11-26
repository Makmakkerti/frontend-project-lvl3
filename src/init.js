/* eslint-disable no-param-reassign */
import 'bootstrap';
import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import _ from 'lodash';
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
    const oldPostLinks = feedPosts.map((post) => post.link);
    const newPosts = posts.filter((item) => !oldPostLinks.includes(item.link));
    const newPostsWithID = assignPostsID(newPosts, feedId);
    return newPostsWithID;
  };

  const updatePosts = (feed) => {
    axios.get(`https://api.allorigins.win/get?url=${feed.url}`)
      .then((response) => {
        watchedState.network.error = false;
        const data = parse(response.data.contents, feed.url);
        const newPosts = getNewPosts(data.posts, feed.id);
        watchedState.posts.push(...newPosts);
      })
      .catch(() => {
        watchedState.network.error = true;
      })
      .finally(() => {
        setTimeout(updatePosts, UPDATE_TIME, feed);
      });
  };

  const sendForm = (url) => {
    axios.get(`https://api.allorigins.win/get?url=${url}`)
      .then((response) => {
        const data = parse(response.data.contents, url);
        const feed = assignFeedID(data.feed);
        const posts = assignPostsID(data.posts, feed.id);
        watchedState.feeds.unshift(feed);
        watchedState.posts.push(...posts);
        watchedState.network.status = 'success';
        setTimeout(updatePosts, UPDATE_TIME, feed);
      })
      .catch((err) => {
        switch (err.message) {
          case 'Network Error':
            watchedState.network.status = 'failed';
            break;
          case 'Rss Error':
            watchedState.network.status = 'failed';
            watchedState.form.error = 'invalidRss';
            break;
          default:
            watchedState.network.status = 'failed';
            watchedState.form.error = 'unexpectedError';
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
      switch (err.type) {
        case 'url':
          watchedState.form.error = 'invalidUrl';
          return;
        case 'notOneOf':
          watchedState.form.error = 'inList';
          return;
        default:
          watchedState.form.error = 'unexpectedError';
          return;
      }
    }
    watchedState.form.error = null;
    watchedState.network.status = 'loading';
    watchedState.form.state = 'valid';
    sendForm(url);
  });
};

export default app;
