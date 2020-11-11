/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
import i18next from 'i18next';
import onChange from 'on-change';

const renderForm = (status, elements) => {
  switch (status) {
    case 'invalid':
      elements.feedback.classList.remove('text-success');
      elements.feedback.classList.add('text-danger');
      elements.formInput.classList.add('border', 'border-danger');
      elements.formInput.disabled = false;
      elements.formButton.disabled = false;
      break;
    case 'sending':
      elements.feedback.classList.remove('text-danger');
      elements.formInput.classList.remove('border', 'border-danger');
      elements.formInput.disabled = true;
      elements.formButton.disabled = true;
      break;
    case 'success':
      elements.formInput.disabled = false;
      elements.formButton.disabled = false;
      elements.formInput.value = '';
      elements.feedback.textContent = i18next.t('success');
      elements.feedback.classList.add('text-success');
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
    postItem.prepend(link);
    posts.appendChild(postItem);
  });
  posts.prepend(postList);
};

const render = (state, elements) => {
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

  renderPosts(state, elements);
};

const initView = (state, elements) => {
  elements.form = document.querySelector('.rss-form');
  elements.formInput = document.querySelector('.rss-form input');
  elements.formButton = document.querySelector('.rss-form button');
  elements.feedback = document.querySelector('.feedback');
  elements.feeds = document.querySelector('.feeds');
  elements.posts = document.querySelector('.posts');

  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'feeds':
        render(state, elements);
        break;
      case 'formState':
        renderForm(value, elements);
        break;
      case 'timeoutID':
        renderPosts(state, elements);
        break;
      case 'error':
        elements.feedback.textContent = value;
        elements.feedback.classList.add('text-danger');
        elements.formInput.classList.add('border', 'border-danger');
        break;

      default:
        break;
    }
  });
  return watchedState;
};

export default initView;
