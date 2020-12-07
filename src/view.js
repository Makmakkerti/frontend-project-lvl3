/* eslint-disable no-param-reassign */
import _ from 'lodash';
import i18next from 'i18next';
import onChange from 'on-change';

const uiState = {
  visitedPosts: [],
};

const clearForm = (elements) => {
  elements.formInput.classList.remove('border', 'border-danger');
  elements.formInput.disabled = false;
  elements.formButton.disabled = false;
};

const clearFeedback = (elements) => {
  elements.feedback.classList.remove('text-danger', 'text-success');
  elements.feedback.textContent = '';
};

const showFeedbackError = (message, elements) => {
  if (!message) return;
  elements.feedback.classList.remove('text-success');
  elements.feedback.classList.add('text-danger');
  elements.feedback.textContent = message;
};

const disableForm = (elements) => {
  elements.formInput.disabled = true;
  elements.formButton.disabled = true;
};

const enableForm = (elements) => {
  elements.formInput.disabled = false;
  elements.formButton.disabled = false;
};

const changeFormState = (state, elements) => {
  if (state === 'invalid') {
    elements.formInput.classList.add('is-invalid');
  } else {
    elements.formInput.classList.remove('is-invalid');
  }
};

const makeVisited = (postId) => {
  const { visitedPosts } = uiState;
  if (_.includes(visitedPosts, postId)) return;
  const link = document.querySelector(`a[data-id="${postId}"]`);
  link.classList.remove('font-weight-bold');
  link.classList.add('font-weight-normal');
  uiState.visitedPosts = [...visitedPosts, postId];
};

const showModal = (postId, state, elements) => {
  const post = _.find(state.posts, (el) => el.id === postId);
  makeVisited(postId);
  elements.modalTitle.textContent = post.title;
  elements.modalBody.textContent = post.description;
  elements.modalLinkToFull.setAttribute('href', post.link);
  elements.modalLinkToFull.setAttribute('target', '_blank');
};

const renderForm = (status, state, elements) => {
  clearForm(elements);
  switch (status) {
    case 'loading':
      disableForm(elements);
      clearFeedback(elements);
      break;
    case 'success':
      clearFeedback(elements);
      elements.formInput.value = '';
      elements.feedback.classList.add('text-success');
      elements.feedback.textContent = i18next.t('success');
      break;
    case 'failed':
      enableForm(elements);
      showFeedbackError(state.form.error, elements);
      break;
    case 'unexpectedError':
      clearFeedback(elements);
      showFeedbackError(i18next.t('errors.unexpected'), elements);
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
    const button = document.createElement('button');

    button.textContent = 'Preview';
    button.classList.add('btn', 'btn-primary', 'btn-sm');
    button.dataset.id = post.id;
    button.dataset.toggle = 'modal';
    button.dataset.target = '#modal';
    button.addEventListener('click', () => showModal(post.id, state, elements));

    link.setAttribute('href', post.link);
    link.textContent = post.title;
    link.dataset.id = post.id;
    link.setAttribute('target', '_blank');
    link.addEventListener('click', () => makeVisited(post.id));

    if (!_.includes(uiState.visitedPosts, post.id)) {
      link.classList.add('font-weight-bold');
    } else {
      link.classList.add('font-weight-normal');
    }

    postItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start');
    postItem.appendChild(link);
    postItem.appendChild(button);
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
    const head = document.createElement('h3');
    head.textContent = feed.title;

    const desc = document.createElement('p');
    desc.textContent = feed.description;

    const feedItem = document.createElement('li');
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
    modalTitle: document.querySelector('#modal .modal-title'),
    modalBody: document.querySelector('#modal .modal-body'),
    modalLinkToFull: document.querySelector('#modal .full-article'),
  };

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'feeds':
        renderFeeds(state, elements);
        break;
      case 'posts':
        renderPosts(state, elements);
        break;
      case 'form.state':
        changeFormState(value, elements);
        break;
      case 'form.error':
        if (value) {
          showFeedbackError(value, elements);
        } else {
          clearForm(elements);
          clearFeedback(elements);
        }
        break;
      case 'network.status':
        renderForm(value, state, elements);
        break;
      case 'network.error':
        if (value) {
          enableForm(elements);
          showFeedbackError(i18next.t('errors.network'), elements);
        } else {
          clearFeedback(elements);
          showFeedbackError(state.form.error, elements);
        }
        break;

      default:
        break;
    }
  });
  return watchedState;
};

export default initView;
