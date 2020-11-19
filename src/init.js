/* eslint-disable no-param-reassign */
import 'bootstrap';
import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
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

  const assignFeedId = (data) => {
    const { feed } = data;
    const existingFeed = watchedState.feeds.filter((el) => el.url === data.feed.url);
    feed.id = existingFeed.length > 0 ? existingFeed[0].id : watchedState.feeds.length + 1;
    return feed;
  };

  const assignPostIds = (data) => {
    const feedId = data.feed.id;
    const feedPosts = watchedState.posts.filter((el) => el.feedId === feedId);
    const newPosts = [];
    let id;

    if (feedPosts.length < 1) {
      id = 1;
      data.posts.forEach((post) => {
        newPosts.unshift({ ...post, id, feedId });
        id += 1;
      });
      return newPosts;
    }

    const oldPostLinks = [];
    feedPosts.forEach((post) => oldPostLinks.push(post.link));

    data.posts.forEach((post) => {
      const oldPost = oldPostLinks.includes(post.link);
      if (!oldPost) {
        newPosts.unshift({ ...post, id, feedId });
      }
    });
    return newPosts;
  };

  const filter = (data) => {
    const feed = assignFeedId(data);
    const posts = assignPostIds(data);
    return { feed, posts };
  };

  const updatePosts = () => {
    const feedsToUpdate = watchedState.feeds.filter((feed) => !feed.pending);
    feedsToUpdate.forEach((feed) => {
      feed.pending = true;
      axios.get(`https://api.allorigins.win/get?url=${feed.url}`)
        .then((response) => {
          watchedState.networkError = false;
          const data = parse(response.data.contents, feed.url);
          const filtered = filter(data);
          watchedState.posts.push(...filtered.posts);
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
        const filtered = filter(data);

        watchedState.posts.push(...filtered.posts);
        watchedState.feeds.unshift(filtered.feed);
        watchedState.formState = 'success';

        if (watchedState.feeds.length === 1) {
          setTimeout(updatePosts, UPDATE_TIME);
        }
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
