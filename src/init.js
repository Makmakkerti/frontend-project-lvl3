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

const UPDATE_TIME = 5000;
const getProxifiedURL = (url) => `${config.proxyURL}${url}`;

const assignPostsID = (posts, feedId) => {
  const postsWithID = posts
    .reverse()
    .map((post) => {
      const id = _.uniqueId('post_');
      return { ...post, id, feedId };
    });
  return postsWithID;
};

const app = () => {
  i18next.init({
    lng: 'en',
    debug: false,
    resources: {
      en,
    },
  })
    .then(() => {
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

      const updatePosts = (feed) => {
        axios.get(getProxifiedURL(feed.url))
          .then((response) => {
            const { contents } = response.data;
            const { posts } = parse(contents);

            const feedPosts = watchedState.posts.filter((el) => el.feedId === feed.id);
            const newPosts = _.differenceBy(posts, feedPosts, 'link');
            const newPostsWithId = assignPostsID(newPosts, feed.id);
            watchedState.posts.push(...newPostsWithId);
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

        axios.get(getProxifiedURL(feedURL))
          .then((response) => {
            const { contents } = response.data;
            const { feed, posts } = parse(contents);
            feed.id = _.uniqueId('feed_');
            feed.url = feedURL;

            watchedState.feeds.unshift(feed);
            watchedState.posts.push(...assignPostsID(posts, feed.id));
            watchedState.network.status = 'success';
            watchedState.form.state = 'filling';
            setTimeout(updatePosts, UPDATE_TIME, feed);
          })
          .catch((err) => {
            if (err.isAxiosError) {
              watchedState.network.error = true;
            } else if (err.isParserError) {
              watchedState.network.status = 'failed';
              watchedState.form.state = 'invalid';
              watchedState.form.error = i18next.t('errors.invalidRss');
            } else {
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
    })
    .catch((err) => {
      console.log(err);
    });
};

export default app;
