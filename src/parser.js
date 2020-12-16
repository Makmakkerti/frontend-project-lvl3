export const parseFeed = (feed, url) => {
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

export const parsePosts = (items) => Array.from(items).map((item) => parsePost(item));

export const parse = (data) => {
  try {
    const parser = new DOMParser();
    const parsedXML = parser.parseFromString(data, 'text/xml');
    if (parsedXML.querySelector('parsererror')) {
      const parserError = new Error('Parser Error');
      parserError.isParserError = true;
      return parserError;
    }
    return parsedXML.querySelector('channel');
  } catch (err) {
    return err;
  }
};
