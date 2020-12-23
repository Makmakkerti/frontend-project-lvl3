const parse = (data) => {
  const parser = new DOMParser();
  const parsedXML = parser.parseFromString(data, 'text/xml');

  const parseItem = (item) => {
    const title = item.querySelector('title').textContent;
    const description = item.querySelector('description').textContent;
    const link = item.querySelector('link').textContent;

    return {
      title,
      description,
      link,
    };
  };

  if (parsedXML.querySelector('parsererror')) {
    const parserError = new Error('Parser Error');
    parserError.isParserError = true;
    throw parserError;
  }

  const channel = parsedXML.querySelector('channel');
  const feed = parseItem(channel);
  const channelPosts = channel.querySelectorAll('item');
  const posts = Array.from(channelPosts).map((item) => parseItem(item));
  return { feed, posts };
};

export default parse;
