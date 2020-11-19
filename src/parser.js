const parseFeed = (feed, url) => {
  const title = feed.querySelector('title').textContent;
  const description = feed.querySelector('description').textContent;
  const link = feed.querySelector('link').textContent;

  return {
    title,
    description,
    link,
    url,
    pending: false,
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
  try {
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
  } catch (err) {
    throw new Error('Rss Error');
  }
};

export default parse;
