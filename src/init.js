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
    const existingFeed = getFeedByURL(feed.url);
    feed.id = existingFeed ? existingFeed.id : _.uniqueId('feed_');
    feed.pending = false;
    return feed;
  };

  const filterNewPosts = (posts, feedId) => {
    const feedPosts = watchedState.posts.filter((el) => el.feedId === feedId);
    const oldPostLinks = feedPosts.map((post) => post.link);
    const newPosts = posts.filter((item) => !oldPostLinks.includes(item.link));
    return newPosts;
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

  const updatePosts = () => {
    const feedsToUpdate = watchedState.feeds.filter((feed) => !feed.pending);
    feedsToUpdate.forEach((feed) => {
      feed.pending = true;
      axios.get(`https://api.allorigins.win/get?url=${feed.url}`)
        .then((response) => {
          watchedState.networkError = false;
          const data = parse(response.data.contents, feed.url);
          const currentFeed = getFeedByURL(feed.url);
          const newPosts = filterNewPosts(data.posts, currentFeed.id);
          const newPostsWithID = assignPostsID(newPosts, currentFeed.id);
          watchedState.posts.push(...newPostsWithID);
          feed.pending = false;
        })
        .catch(() => {
          watchedState.networkError = true;
          feed.pending = false;
        });
    });
    setTimeout(updatePosts, UPDATE_TIME);
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
        if (watchedState.feeds.length === 1) {
          setTimeout(updatePosts, UPDATE_TIME);
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
