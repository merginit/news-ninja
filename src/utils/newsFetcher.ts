export interface NewsItemData {
  id: string;
  title: string;
  source: string;
  type: 'real' | 'bomb' | 'breaking' | 'clickbait' | 'mini-clickbait' | 'paywall' | 'top-secret' | 'jackpot' | 'ad';
  url?: string;
}

const RSS_FEEDS = {
  real: [
    { name: 'CNN', url: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
    { name: 'NYPost', url: 'https://nypost.com/feed/' },
    { name: 'Politico', url: 'https://www.politico.com/rss/politicopicks.xml' },
    { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml' },
    { name: 'WSJ', url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml' },
    { name: 'NatGeo', url: 'https://www.nationalgeographic.com/pages/topic/latest-stories/rss' },
    { name: 'Forbes', url: 'https://www.forbes.com/real-time/feed2/' },
    { name: 'Reason', url: 'https://reason.com/latest/feed/' },
  ],
  bomb: [
    { name: 'The Onion', url: 'https://www.theonion.com/rss' },
    { name: 'Babylon Bee', url: 'https://babylonbee.com/feed/' },
  ],
};

const PROXY_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';

export async function fetchNewsFeeds(customFeedUrl?: string | null): Promise<NewsItemData[]> {
  const allNews: NewsItemData[] = [];

  const fetchPromises = [];

  let selectedReal;
  if (customFeedUrl && customFeedUrl.trim().length > 0) {
    selectedReal = [{ name: 'Custom Feed', url: customFeedUrl }];
  } else {
    selectedReal = [...RSS_FEEDS.real].sort(() => 0.5 - Math.random()).slice(0, 3);
  }

  const selectedBomb = [...RSS_FEEDS.bomb].sort(() => 0.5 - Math.random()).slice(0, 1);

  const feedsToFetch = [
    ...selectedReal.map((f) => ({ ...f, type: 'real' as const })),
    ...selectedBomb.map((f) => ({ ...f, type: 'bomb' as const })),
  ];

  for (const feed of feedsToFetch) {
    const promise = fetch(`${PROXY_URL}${encodeURIComponent(feed.url)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.items) {
          // If custom feed, grab more items since we only have one feed
          const limit = customFeedUrl ? 30 : 15;

          // Filter out news older than 48 hours
          const twoDaysAgo = Date.now() - 48 * 60 * 60 * 1000;

          const validItems = data.items.filter((item: any) => {
            if (!item.title || item.title.trim().length === 0) return false;

            // Satire bombs are timeless, keep them
            if (feed.type === 'bomb') return true;

            if (item.pubDate) {
              const pubTime = new Date(item.pubDate).getTime();
              // If it's a valid date and it's older than 48 hours, reject it
              if (!isNaN(pubTime) && pubTime < twoDaysAgo) {
                return false;
              }
            }
            return true;
          });

          validItems.slice(0, limit).forEach((item: any) => {
            allNews.push({
              id: crypto.randomUUID(),
              title: item.title.trim(),
              source: feed.name,
              type: feed.type,
              url: item.link,
            });
          });
        }
      })
      .catch((err) => console.error(`Error fetching ${feed.name}:`, err));

    fetchPromises.push(promise);
  }

  await Promise.allSettled(fetchPromises);

  // Randomly upgrade some real news to breaking/clickbait/paywall/top-secret
  allNews.forEach((item) => {
    if (item.type === 'real') {
      const rand = Math.random();
      if (rand < 0.08) {
        item.type = 'top-secret';
        item.title = 'CLASSIFIED INFORMATION';
        item.source = 'ANONYMOUS';
      } else if (rand < 0.20) {
        item.type = 'breaking';
      } else if (rand < 0.30) {
        item.type = 'clickbait';
      } else if (rand < 0.35) {
        item.type = 'paywall';
      }
    }
  });

  return allNews.sort(() => 0.5 - Math.random());
}
