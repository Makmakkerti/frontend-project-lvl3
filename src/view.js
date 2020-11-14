import i18next from 'i18next';
import onChange from 'on-change';

const elements = {
  form: document.querySelector('.rss-form'),
  formInput: document.querySelector('.rss-form input'),
  formButton: document.querySelector('.rss-form button'),
  feedback: document.querySelector('.feedback'),
  feeds: document.querySelector('.feeds'),
  posts: document.querySelector('.posts'),
};

const renderForm = (status) => {
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

const renderPosts = (state) => {
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

const render = (state) => {
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

const initView = (state) => {
  const watchedState = onChange(state, (path, value) => {
    switch (path) {
      case 'feeds':
        render(state);
        break;
      case 'formState':
        renderForm(value);
        break;
      case 'updated':
        if (state.updated) {
          renderPosts(state);
        }
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
