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
  try {
    const parser = new DOMParser();
    const parsedXML = parser.parseFromString(data, 'text/xml');
    if (parsedXML.querySelector('parsererror')) {
      const parserError = new Error('Parser Error');
      parserError.isParserError = true;
      return parserError;
    }
    const channel = parsedXML.querySelector('channel');
    const feed = parseFeed(channel, url);
    const channelPosts = channel.querySelectorAll('item');
    const posts = Array.from(channelPosts).map((item) => parsePost(item));
    return { feed, posts };
  } catch (err) {
    return err;
  }
};

export default parse;
