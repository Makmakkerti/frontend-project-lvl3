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
    feedUrls: [],
    feeds: [],
    posts: [],
    error: '',
    formState: '',
    updated: false,
  };

  const watchedState = initView(appState);
  const UPDATE_TIME = 5000;

  const parseFeed = (feed, url) => {
    const title = feed.querySelector('title').textContent;
    const description = feed.querySelector('description').textContent;
    const link = feed.querySelector('link').textContent;

    return {
      title,
      description,
      link,
      url,
    };
  };

  const parsePost = (post) => {
    const title = post.querySelector('title').textContent;
    const description = post.querySelector('description').textContent;
    const link = post.querySelector('link').textContent;
    return {
      title,
      description,
      link,
    };
  };

  const parse = (data, url) => {
    const parser = new DOMParser();
    const parsedXML = parser.parseFromString(data, 'text/xml');

    const channel = parsedXML.querySelector('channel');
    const feed = parseFeed(channel, url);
    const channelPosts = channel.querySelectorAll('item');
    const parsedData = { feed, posts: [] };

    channelPosts.forEach((item) => {
      const post = parsePost(item);
      parsedData.posts.push(post);
    });
    return parsedData;
  };

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
    watchedState.feeds.forEach((feed) => {
      axios.get(`https://api.allorigins.win/get?url=${feed.url}`)
        .then((response) => parse(response.data.contents, feed.url))
        .then((data) => {
          const filtered = filter(data);
          filtered.posts.forEach((post) => {
            watchedState.posts.push(post);
          });
          watchedState.updated = true;
        })
        .catch(() => {
          watchedState.formState = 'invalid';
          watchedState.error = i18next.t('errors.network');
        });
    });
    watchedState.updated = false;
    setTimeout(updatePosts, UPDATE_TIME);
  };

  const sendForm = (url) => {
    axios.get(`https://api.allorigins.win/get?url=${url}`)
      .then((response) => {
        if (response.data.status.http_code === 404) {
          throw new Error('Invalid rss');
        }
        return parse(response.data.contents, url);
      })
      .then((data) => {
        const newData = filter(data);
        watchedState.feedUrls.push(url);

        newData.posts.forEach((post) => {
          watchedState.posts.push(post);
        });
        watchedState.feeds.unshift(newData.feed);
        watchedState.formState = 'success';
      })
      .then(() => {
        if (watchedState.feeds.length === 1) {
          setTimeout(updatePosts, UPDATE_TIME);
        }
      })
      .catch((err) => {
        if (err.message === 'Invalid rss') {
          watchedState.formState = 'invalid';
          watchedState.error = i18next.t('errors.invalidRss');
        } else {
          console.log(err.message);
          watchedState.formState = 'invalid';
          watchedState.error = i18next.t('errors.network');
        }
      });
  };

  const form = document.querySelector('.rss-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const url = data.get('url').trim();
    const schema = yup.string()
      .trim()
      .url()
      .required()
      .notOneOf(watchedState.feedUrls);

    try {
      schema.validateSync(url);
    } catch (err) {
      watchedState.formState = 'invalid';
      switch (err.type) {
        case 'url':
          watchedState.error = i18next.t('errors.validation');
          return;
        case 'notOneOf':
          watchedState.error = i18next.t('errors.inList');
          return;
        default:
          watchedState.error = i18next.t('errors.unexpected');
          return;
      }
    }

    watchedState.error = '';
    watchedState.formState = 'sending';
    sendForm(url);
  });
};

export default app;
