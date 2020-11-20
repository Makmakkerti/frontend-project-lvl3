/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import onChange from 'on-change';

const clearForm = (elements) => {
  elements.formInput.classList.remove('border', 'border-danger');
  elements.formInput.disabled = false;
  elements.formButton.disabled = false;
};

const showFormError = (message, elements) => {
  elements.feedback.classList.remove('text-success');
  elements.feedback.classList.add('text-danger');
  elements.formInput.classList.add('border', 'border-danger');
  elements.feedback.textContent = i18next.t(message);
};

const renderForm = (status, elements) => {
  clearForm(elements);
  switch (status) {
    case 'invalidUrl':
      showFormError('errors.validation', elements);
      break;
    case 'invalidRss':
      showFormError('errors.invalidRss', elements);
      break;
    case 'inList':
      showFormError('errors.inList', elements);
      break;
    case 'sending':
      elements.formInput.disabled = true;
      elements.formButton.disabled = true;
      break;
    case 'success':
      elements.feedback.classList.remove('text-danger');
      elements.formInput.value = '';
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = i18next.t('success');
      break;
    case 'unexpectedError':
      showFormError('errors.unexpected', elements);
      break;
    default: break;
  }
};

const renderPosts = (state, elements) => {
  const { posts } = elements;
  posts.innerHTML = '';

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
    postList.prepend(postItem);
  });
  posts.appendChild(postList);
};

const renderFeeds = (state, elements) => {
  const { feeds } = elements;
  feeds.innerHTML = '';

  const feedsHeading = document.createElement('h2');
  feedsHeading.textContent = 'Feeds';
  feeds.appendChild(feedsHeading);
  const feedList = document.createElement('ul');
  feedList.classList.add('list-group', 'mb-5');

  state.feeds.forEach((feed) => {
    const feedItem = document.createElement('li');
    const head = document.createElement('h3');
    head.textContent = feed.title;
    const desc = document.createElement('p');
    desc.textContent = feed.description;
    feedItem.appendChild(head);
    feedItem.appendChild(desc);
    feedItem.classList.add('list-group-item');
    feedList.appendChild(feedItem);
  });
  feeds.appendChild(feedList);
};

const initView = (state) => {
  const elements = {
    form: document.querySelector('.rss-form'),
    formInput: document.querySelector('.rss-form input'),
    formButton: document.querySelector('.rss-form button'),
    feedback: document.querySelector('.feedback'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'feeds':
        renderFeeds(state, elements);
        break;
      case 'formState':
        renderForm(value, elements);
        break;
      case 'posts':
        renderPosts(state, elements);
        break;
      case 'networkError':
        if (value) {
          elements.feedback.textContent = i18next.t('errors.network');
          elements.feedback.classList.add('text-danger');
          elements.feedback.classList.remove('text-success');
        } else {
          elements.feedback.textContent = '';
          elements.feedback.classList.remove('text-danger');
        }
        break;

      default:
        break;
    }
  });
  return watchedState;
};

export default initView;
