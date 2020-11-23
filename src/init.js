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

  const appState = {
    feeds: [],
    posts: [],
    formState: '',
    networkError: false,
  };

  const watchedState = initView(appState);
  const UPDATE_TIME = 5000;

  const getFeedByURL = (url) => watchedState.feeds.filter((el) => el.url === url)[0];

  const assignFeedID = (feed) => {
    feed.id = _.uniqueId('feed_');
    feed.pending = false;
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
    if (feed.pending) return;
    feed.pending = true;
    axios.get(`https://api.allorigins.win/get?url=${feed.url}`)
      .then((response) => {
        watchedState.networkError = false;
        const data = parse(response.data.contents, feed.url);
        const newPosts = getNewPosts(data.posts, feed.id);
        console.log(newPosts);
        watchedState.posts.push(...newPosts);
        feed.pending = false;
      })
      .catch(() => {
        watchedState.networkError = true;
        feed.pending = false;
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
        watchedState.formState = 'success';
      })
      .catch((err) => {
        switch (err.message) {
          case 'Network Error':
            watchedState.networkError = true;
            break;
          case 'Rss Error':
            watchedState.formState = 'invalidRss';
            break;
          default:
            watchedState.formState = 'unexpectedError';
        }
      })
      .finally(() => {
        const feed = getFeedByURL(url);
        setTimeout(updatePosts, UPDATE_TIME, feed);
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
      watchedState.formState = 'invalid';
      switch (err.type) {
        case 'url':
          watchedState.formState = 'invalidUrl';
          return;
        case 'notOneOf':
          watchedState.formState = 'inList';
          return;
        default:
          watchedState.formState = 'unexpectedError';
          return;
      }
    }
    watchedState.formState = 'sending';
    sendForm(url);
  });
};

export default app;
