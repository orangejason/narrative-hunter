const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const { execSync, execFileSync } = require('child_process');
const ethers = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const upload = multer({ dest: '/tmp/uploads/' });

// ========== ENV ==========
const TWITTER_TOKEN = process.env.TWITTER_TOKEN || '';
const AVE_API_KEY = process.env.AVE_API_KEY || '';
const JUMPBOT_PRIVATE_KEY = process.env.PRIVATE_KEY || '0x091edad957eec6adc457c80deed1a92ad2e8765499d6508a2a8b7e76358883b5';
const JUMPBOT_ROUTER = '0xED66076762747DcaDd45f2d754CA938bd96c9990';
const JUMPBOT_API = 'https://jumpad.fun/api';

// ========== CACHE ==========
const cache = {};
const CACHE_TTL = 30 * 60 * 1000; // default 30 minutes

// Time window definitions: key → duration in ms (for filtering publishedAt)
// All windows share ONE global narrative cache (5min TTL). Time window only filters on read.
const TIME_WINDOWS = {
  '1h':  { ms: 60 * 60 * 1000, label: '1小时' },
  '6h':  { ms: 6  * 60 * 60 * 1000, label: '6小时' },
  '12h': { ms: 12 * 60 * 60 * 1000, label: '12小时' },
  '24h': { ms: 24 * 60 * 60 * 1000, label: '24小时' },
};
const GLOBAL_NARRATIVE_TTL = 5 * 60 * 1000; // 5 minutes global cache
const DEFAULT_TIME_WINDOW = '1h';

// === 24h Rolling Buffer ===
// Accumulates narratives across fetches. Each time window filters this buffer by publishedAt,
// ensuring 1h/6h/12h/24h windows show genuinely different historical content over time.
let NARRATIVE_BUFFER = [];
const BUFFER_MAX_AGE = 24 * 60 * 60 * 1000;
const BUFFER_MAX_SIZE = 600;

function normTitleKey(n) {
  return (n.title || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, '').slice(0, 25);
}

function updateNarrativeBuffer(freshNarratives) {
  const cutoff = Date.now() - BUFFER_MAX_AGE;
  NARRATIVE_BUFFER = NARRATIVE_BUFFER.filter(n => {
    const t = n.publishedAt ? new Date(n.publishedAt).getTime() : 0;
    return t > cutoff;
  });
  const existing = new Set(NARRATIVE_BUFFER.map(normTitleKey));
  for (const n of freshNarratives) {
    const key = normTitleKey(n);
    if (key && !existing.has(key)) {
      NARRATIVE_BUFFER.push(n);
      existing.add(key);
    }
  }
  if (NARRATIVE_BUFFER.length > BUFFER_MAX_SIZE) {
    NARRATIVE_BUFFER.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
    NARRATIVE_BUFFER = NARRATIVE_BUFFER.slice(0, BUFFER_MAX_SIZE);
  }
  console.log(`[Buffer] total=${NARRATIVE_BUFFER.length}, added=${freshNarratives.length}`);
}

// Global symbol → market data map for enriching narrative tokens
const symbolTokenMap = {};
function updateSymbolMap(tokens) {
  for (const t of tokens) {
    const sym = (t.symbol || '').toUpperCase();
    if (!sym) continue;
    if (!symbolTokenMap[sym] || (t.marketCap || 0) > (symbolTokenMap[sym].marketCap || 0)) {
      symbolTokenMap[sym] = { address: t.address || '', change24h: t.change24h || 0, change1h: t.change1h || 0, logo: t.logo || '', chain: t.chain || 'sol', price: t.price || 0, marketCap: t.marketCap || 0 };
    }
  }
}
function enrichTokens(tokenList) {
  return tokenList.map(t => {
    const sym = (t.symbol || '').toUpperCase();
    const m = symbolTokenMap[sym];
    if (m) return { ...t, address: t.address || m.address, change24h: m.change24h, change1h: m.change1h, logo: t.logo || m.logo, chain: m.chain, price: m.price };
    return t;
  });
}

function getCached(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}
// SSE clients for real-time narrative push — stored as Map: res → timeWindow
const sseClients = new Map();
function broadcastNarrativeUpdate(narratives, timeWindow) {
  if (!sseClients.size) return;
  const tw = timeWindow || DEFAULT_TIME_WINDOW;
  const payload = `data: ${JSON.stringify({ narratives, timeWindow: tw })}\n\n`;
  for (const [client, clientTw] of sseClients) {
    if (clientTw === tw) {
      try { client.write(payload); } catch (e) { sseClients.delete(client); }
    }
  }
}

function setCache(key, data, ttl) {
  cache[key] = { data, ts: Date.now(), ttl: ttl || CACHE_TTL };
  if (key === 'narratives_global' && Array.isArray(data)) {
    // Broadcast to ALL SSE clients — each client will filter by its own timeWindow
    for (const [client] of sseClients) {
      try { client.write(`data: ${JSON.stringify({ type: 'refresh' })}\n\n`); } catch (e) { sseClients.delete(client); }
    }
  }
}
function getCachedWithTtl(key) {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < (entry.ttl || CACHE_TTL)) return entry.data;
  return null;
}

// ========== HELPERS ==========
const BN_IMG_BASE = 'https://bin.bnbstatic.com';

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    timeout: 15000,
    ...opts,
    headers: {
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
      ...(opts.headers || {}),
    },
  });
  return res.json();
}

// ========== BINANCE APIs ==========
const BN_BASE = 'https://web3.binance.com/bapi/defi/v1/public/wallet-direct';

// Social Rush - 叙事话题列表 (fetch all 3 sort types × 3 pages × 2 chains = ~540 unique narratives)
async function getBinanceSocialRushAll() {
  const results = [];
  const seen = new Set();
  try {
    const chains = ['CT_501', 'CT_56'];
    const sorts = [10, 20, 30];
    const pages = [1, 2, 3];
    const fetches = chains.flatMap(chainId =>
      sorts.flatMap(sort =>
        pages.map(page =>
          fetchJSON(`${BN_BASE}/buw/wallet/market/token/social-rush/rank/list?chainId=${chainId}&rankType=${sort}&sort=${sort}&asc=false&page=${page}&pageSize=50`)
            .catch(() => null)
        )
      )
    );
    const responses = await Promise.all(fetches);
    for (const resp of responses) {
      if (Array.isArray(resp?.data)) {
        for (const item of resp.data) {
          const id = item.topicId;
          if (id && seen.has(id)) continue;
          if (id) seen.add(id);
          results.push(item);
        }
      }
    }
  } catch (e) { console.error('socialRushAll err:', e.message); }
  return results;
}

// Trending tokens (top gainers / hot tokens) — converted to narratives
async function getBinanceTrendingAll() {
  const results = [];
  try {
    // rankType 10=trending, 20=top gainer, 30=new listing; for SOL+BSC; pages 1+2
    const chains = ['CT_501', 'CT_56'];
    const fetches = chains.flatMap(chainId =>
      [10, 20, 30].flatMap(rankType =>
        [1, 2].map(page =>
          fetchJSON(`${BN_BASE}/buw/wallet/market/token/pulse/unified/rank/list`, {
            method: 'POST',
            body: JSON.stringify({
              rankType, chainId, period: 50, sortBy: 70, orderAsc: false,
              page, size: 100,
              percentChangeMin: -100, percentChangeMax: 10000,
              marketCapMin: 0, marketCapMax: 10000000000,
              volumeMin: 0, volumeMax: 10000000000,
              liquidityMin: 0, liquidityMax: 10000000000,
              holdersMin: 0, holdersMax: 10000000,
              holdersTop10PercentMin: 0, holdersTop10PercentMax: 100,
              countMin: 0, countMax: 10000000,
              uniqueTraderMin: 0, uniqueTraderMax: 1000000,
              launchTimeMin: 0, launchTimeMax: 9999999999,
            }),
          }).catch(() => null)
        )
      )
    );
    const resps = await Promise.all(fetches);
    const seen = new Set();
    for (const r of resps) {
      // API returns data.tokens (NOT data.data)
      const items = r?.data?.tokens || r?.data?.data || (Array.isArray(r?.data) ? r.data : []);
      if (!Array.isArray(items)) continue;
      for (const t of items) {
        const addr = t.contractAddress || t.tokenAddress || '';
        if (!addr || seen.has(addr)) continue;
        seen.add(addr);
        results.push(t);
      }
    }
  } catch (e) { console.error('trendingAll err:', e.message); }
  return results;
}

// Social Hype - token社交热度排行
async function getBinanceSocialHype(chainId = 'CT_501') {
  try {
    const url = `${BN_BASE}/buw/wallet/market/token/pulse/social/hype/rank/leaderboard?chainId=${chainId}&sentiment=All&socialLanguage=ALL&targetLanguage=zh&timeRange=1`;
    return await fetchJSON(url);
  } catch (e) { console.error('socialHype err:', e.message); return null; }
}

// Trending tokens — fetch all 3 rankTypes (trending/gainers/new) in parallel, dedupe by address
async function getBinanceTrending(chainId = 'CT_501') {
  try {
    const base = {
      chainId, period: 50, sortBy: 70, orderAsc: false, page: 1, size: 50,
      percentChangeMin: -100, percentChangeMax: 10000,
      marketCapMin: 0, marketCapMax: 10000000000,
      volumeMin: 0, volumeMax: 10000000000,
      liquidityMin: 0, liquidityMax: 10000000000,
      holdersMin: 0, holdersMax: 10000000,
      holdersTop10PercentMin: 0, holdersTop10PercentMax: 100,
      countMin: 0, countMax: 10000000,
      uniqueTraderMin: 0, uniqueTraderMax: 1000000,
      launchTimeMin: 0, launchTimeMax: 9999999999,
    };
    const [r10, r20, r30] = await Promise.all([
      fetchJSON(`${BN_BASE}/buw/wallet/market/token/pulse/unified/rank/list`, { method: 'POST', body: JSON.stringify({ ...base, rankType: 10 }) }).catch(() => null),
      fetchJSON(`${BN_BASE}/buw/wallet/market/token/pulse/unified/rank/list`, { method: 'POST', body: JSON.stringify({ ...base, rankType: 20 }) }).catch(() => null),
      fetchJSON(`${BN_BASE}/buw/wallet/market/token/pulse/unified/rank/list`, { method: 'POST', body: JSON.stringify({ ...base, rankType: 30 }) }).catch(() => null),
    ]);
    // Merge and dedupe by contractAddress, tag each token with its rankType
    const seen = new Set();
    const merged = [];
    for (const [r, rt] of [[r10, 10], [r20, 20], [r30, 30]]) {
      const items = r?.data?.tokens || r?.data?.data || (Array.isArray(r?.data) ? r.data : []);
      for (const t of (items || [])) {
        const addr = t.contractAddress || t.tokenAddress || '';
        if (!addr || seen.has(addr)) continue;
        seen.add(addr);
        merged.push({ ...t, _rankType: rt });
      }
    }
    // Return in same shape the caller expects: { data: { tokens: [...] } }
    return { data: { tokens: merged } };
  } catch (e) { console.error('trending err:', e.message); return null; }
}

// Smart Money token inflow rank
async function getBinanceSmartMoney(chainId = 'CT_501') {
  try {
    return await fetchJSON(`${BN_BASE}/tracker/wallet/token/inflow/rank/query`, {
      method: 'POST',
      body: JSON.stringify({ chainId, period: '24h', tagType: 2 }),
    });
  } catch (e) { console.error('smartMoney err:', e.message); return null; }
}

// Meme Rush
async function getBinanceMemeRush(chainId = 'CT_501') {
  try {
    return await fetchJSON(`${BN_BASE}/buw/wallet/market/token/pulse/rank/list`, {
      method: 'POST',
      body: JSON.stringify({
        chainId, rankType: 10, limit: 100,
        progressMin: "0", progressMax: "100",
        tokenAgeMin: 0, tokenAgeMax: 999999999,
        holdersMin: 0, holdersMax: 1000000,
        liquidityMin: "0", liquidityMax: "1000000000",
        volumeMin: "0", volumeMax: "1000000000",
        marketCapMin: "0", marketCapMax: "1000000000",
        countMin: 0, countMax: 1000000,
        countBuyMin: 0, countBuyMax: 1000000,
        countSellMin: 0, countSellMax: 1000000,
        holdersTop10PercentMin: "0", holdersTop10PercentMax: "100",
        holdersDevPercentMin: "0", holdersDevPercentMax: "100",
        holdersSniperPercentMin: "0", holdersSniperPercentMax: "100",
        holdersInsiderPercentMin: "0", holdersInsiderPercentMax: "100",
        bundlerHoldingPercentMin: "0", bundlerHoldingPercentMax: "100",
        newWalletHoldingPercentMin: "0", newWalletHoldingPercentMax: "100",
        bnHoldingPercentMin: "0", bnHoldingPercentMax: "100",
        bnHoldersMin: 0, bnHoldersMax: 1000000,
        kolHoldersMin: 0, kolHoldersMax: 1000000,
        proHoldersMin: 0, proHoldersMax: 1000000,
        devMigrateCountMin: 0, devMigrateCountMax: 1000,
        devPosition: 0, devBurnedToken: 0,
        excludeDevWashTrading: 0, excludeInsiderWashTrading: 0,
        keywords: [], excludes: [], protocol: [], exclusive: 0,
        paidOnDexScreener: 0, pumpfunLiving: 0, cmcBoost: 0,
        globalFeeMin: "0", globalFeeMax: "100",
        tokenSocials: { atLeastOne: 0, socials: [] },
      }),
    });
  } catch (e) { console.error('memeRush err:', e.message); return null; }
}

// Leaderboard - 钱包排行
async function getBinanceLeaderboard(chainId = 'CT_501') {
  try {
    const url = `${BN_BASE}/market/leaderboard/query?chainId=${chainId}&tag=ALL&pageNo=1&pageSize=100&sortBy=0&orderBy=0&period=7d`;
    return await fetchJSON(url);
  } catch (e) { console.error('leaderboard err:', e.message); return null; }
}

// ========== TWITTER (6551) ==========
async function searchTwitter(keywords, maxResults = 20) {
  if (!TWITTER_TOKEN) return null;
  try {
    return await fetchJSON('https://ai.6551.io/open/twitter_search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TWITTER_TOKEN}` },
      body: JSON.stringify({ keywords, maxResults, product: 'Top', minLikes: 50 }),
    });
  } catch (e) { console.error('twitter err:', e.message); return null; }
}

// Search 6551 for KOLs discussing a topic — returns [{username, name, followers}]
async function searchKolsForTopic(topic, maxResults = 5) {
  if (!TWITTER_TOKEN) return [];
  try {
    const res = await fetchJSON('https://ai.6551.io/open/twitter_search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TWITTER_TOKEN}` },
      body: JSON.stringify({ keywords: topic, maxResults: 15, product: 'Top', minLikes: 100 }),
    });
    const tweets = res?.data || [];
    const seen = new Set();
    const kols = [];
    for (const t of tweets) {
      const username = t.userScreenName || t.screenName || t.userName || '';
      const name = t.userName || t.name || username;
      const followers = t.userFollowers || t.followersCount || 0;
      if (!username || seen.has(username.toLowerCase())) continue;
      // Only include accounts with meaningful followers (KOL filter)
      if (followers < 1000) continue;
      seen.add(username.toLowerCase());
      kols.push({ username, name, followers });
    }
    // Sort by followers descending
    kols.sort((a, b) => b.followers - a.followers);
    return kols.slice(0, maxResults);
  } catch (e) {
    console.error('searchKolsForTopic err:', e.message);
    return [];
  }
}

// Search KOLs + extract best tweet image for narrative card
async function searchKolsForTopicWithImages(topic, maxResults = 5) {
  if (!TWITTER_TOKEN) return { kols: [], bestImage: null, tweets: [] };
  try {
    const res = await fetchJSON('https://ai.6551.io/open/twitter_search', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TWITTER_TOKEN}` },
      body: JSON.stringify({ keywords: topic, maxResults: 15, product: 'Top', minLikes: 100 }),
    });
    const tweets = res?.data || [];
    const seen = new Set();
    const kols = [];
    let bestImage = null;
    let bestScore = 0;
    const tweetDetails = [];

    for (const t of tweets) {
      const username = t.userScreenName || t.screenName || t.userName || '';
      const name = t.userName || t.name || username;
      const followers = t.userFollowers || t.followersCount || 0;
      const likes = t.favoriteCount || 0;
      const retweets = t.retweetCount || 0;
      const tweetText = (t.fullText || t.text || '').replace(/\n+/g, ' ').trim();
      const tweetId = t.id || t.id_str || '';
      const tweetUrl = tweetId ? `https://x.com/${username}/status/${tweetId}` : `https://x.com/${username}`;

      // Extract tweet media images for narrative card
      const media = t.media || [];
      for (const m of media) {
        const u = m.thumbUrl || m.mediaUrl || '';
        if (u && u.includes('twimg.com') && !u.includes('profile_images')) {
          const score = retweets * 3 + likes;
          if (score > bestScore) {
            bestScore = score;
            bestImage = u;
          }
        }
      }

      if (!username || seen.has(username.toLowerCase())) continue;
      if (followers < 1000) continue;
      seen.add(username.toLowerCase());
      const avatar = t.userProfileImageUrl || t.profileImageUrl || '';
      kols.push({ username, name, followers, avatar, tweetUrl, tweetText, likes, retweets });
      if (tweetText) {
        tweetDetails.push({ username, name, avatar, followers, tweetText, likes, retweets, tweetUrl });
      }
    }

    kols.sort((a, b) => b.followers - a.followers);
    tweetDetails.sort((a, b) => (b.likes * 2 + b.retweets * 5) - (a.likes * 2 + a.retweets * 5));
    return { kols: kols.slice(0, maxResults), bestImage, tweets: tweetDetails.slice(0, 8) };
  } catch (e) {
    console.error('searchKolsWithImages err:', e.message);
    return { kols: [], bestImage: null, tweets: [] };
  }
}

// ========== 6551 TWITTER: Crypto KOL Narrative Discovery ==========
// Discover real trending narratives from Twitter KOL discussions
// Strategy: search specific news/event queries → one narrative per query → reliable output
async function discoverCryptoKolNarratives(seedTopics = []) {
  if (!TWITTER_TOKEN) return [];

  // Phase 1: Crypto-specific narrative search queries — must return clearly crypto-relevant content
  // Use $TICKER or protocol names inline to force crypto context and avoid false positives
  const searchQueries = [
    // Macro & regulation — explicit crypto context
    '$BTC ETF BlackRock Fidelity institutional inflows record',
    'Bitcoin spot ETF approval SEC crypto market rally',
    'crypto stablecoin bill congress regulation USD legislation',
    '$ETH Ethereum SEC commodity approval futures ETF',
    // Solana ecosystem
    '$SOL Solana DEX volume record Raydium Jupiter TVL',
    'Solana meme coin launchpad pump.fun milestone new high',
    // BNB/BSC ecosystem
    '$BNB BNB Chain four.meme new launch milestone',
    'Binance listing new token announcement BSC ecosystem',
    // AI narrative
    '$AI $VIRTUAL AI agent autonomous crypto on-chain launch',
    'AI crypto agent narrative on-chain intelligence new project',
    // RWA / DePIN / infrastructure
    'RWA real world asset tokenization institution Ethereum Base',
    'DePIN Helium MapleStory $IO $GRASS network expansion',
    // Meme culture
    '$TRUMP $DOGE $PEPE meme coin viral social narrative rally',
    'new meme coin viral community launch $WIF $BONK Solana',
    // Market events
    'crypto whale accumulation on-chain billion $BTC $ETH alert',
    'crypto exchange hacked exploit billion stolen security alert',
    'major protocol airdrop claim snapshot announcement community',
    // Layer2 / scalability
    '$ARB $OP Base Arbitrum Optimism Layer2 TVL record milestone',
    'Ethereum L2 scaling solution user growth fee reduction',
    // GameFi / SocialFi
    'on-chain game launch $GALA $IMX $RON player milestone',
    'decentralized social $FARCASTER $LENS protocol milestone',
  ];

  // Known non-crypto tokens to exclude from ticker clustering (too generic as English words)
  const BLACKLISTED_TICKERS = new Set(['HEX','SET','KEY','CAT','DOG','APE','COW','AMP',
    'HOT','GET','PAY','ACE','BOX','CUT','FIT','ICE','MAN','NOW','ONE','OUT','POP','RUN',
    'SIT','SUN','TIP','TOP','TWO','WAX','YES','YOU','FOR','THE','AND','NOT','BUT','CAN',
    'ARE','NEW','ALL','HAD','HER','HIS','USE','WAY','WHO','OIL','HIT','RED','ASK','BIG',
    'LOT','SHE','OLD','OFF','YES']);

  // Require tweet to contain crypto-relevant terms for it to pass through
  const CRYPTO_SIGNAL = /\$[A-Z]{2,8}|blockchain|defi|nft|web3|on-chain|crypto|coinbase|binance|solana|ethereum|bitcoin|uniswap|metamask|wallet|token|protocol|airdrop|layer[- ]?2|mainnet|testnet|dao|dex|tvl|staking|yield|liquidity|memecoin|altcoin|\bbtc\b|\beth\b|\bsol\b|\bbnb\b/i;

  // Fetch tweets from multiple search queries in parallel
  const allTweets = [];
  const queries = searchQueries.sort(() => Math.random() - 0.5).slice(0, 14);
  const fetchPromises = queries.map(async (kw) => {
    try {
      const res = await fetchJSON('https://ai.6551.io/open/twitter_search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${TWITTER_TOKEN}` },
        body: JSON.stringify({ keywords: kw, maxResults: 20, product: 'Recent', minLikes: 15 }),
      });
      for (const t of (res?.data || [])) {
        const username = t.userScreenName || t.screenName || '';
        const name = t.userName || t.name || username;
        const followers = t.userFollowers || t.followersCount || 0;
        const text = (t.fullText || t.text || '').replace(/\n+/g, ' ').trim();
        const likes = t.favoriteCount || 0;
        const retweets = t.retweetCount || 0;
        const lang = (t.language || 'en').toLowerCase();
        if (followers < 1000 || likes < 8 || text.length < 30) continue;
        // Only English or Chinese — filter out Japanese, Korean, etc.
        if (lang !== 'en' && lang !== 'zh' && lang !== 'und') continue;
        // Must be crypto-relevant tweet
        if (!CRYPTO_SIGNAL.test(text)) continue;
        // Filter out pure coin-shilling
        const shillPattern = /0x[a-fA-F0-9]{30,}|presale.*ca:|CA:\s*0x/i;
        if (shillPattern.test(text) && followers < 10000) continue;

        const tweetId = t.id || t.tweetId || '';
        let tweetImage = '';
        for (const m of (t.media || [])) {
          const u = m.mediaUrl || m.thumbUrl || '';
          if (u && u.includes('twimg.com') && !u.includes('profile_images')) { tweetImage = u; break; }
        }
        // unavatar.io fetches Twitter profile image by username (API doesn't return avatar URLs)
        const avatar = `https://unavatar.io/x/${username}`;
        const tweetUrl = tweetId ? `https://x.com/${username}/status/${tweetId}` : `https://x.com/${username}`;

        // Extract $TICKER mentions
        const tickerMatches = text.match(/\$([A-Z]{2,10})/g) || [];
        const tickers = [...new Set(tickerMatches.map(m => m.replace('$', '')))];

        // Extract key topic words (for semantic clustering)
        const topicWords = extractTopicWords(text);

        // Decode actual tweet publish time from Twitter snowflake ID
        let publishedAt = null;
        if (tweetId) {
          try {
            const snowflakeMs = Number(BigInt(tweetId) >> 22n) + 1288834974657;
            if (snowflakeMs > 1000000000000) publishedAt = new Date(snowflakeMs).toISOString();
          } catch (_) {}
        }

        allTweets.push({
          username, name, followers, text, likes, retweets, tickers, tweetImage,
          avatar, tweetUrl, publishedAt,
          topicWords, kw,
          engagement: likes * 2 + retweets * 5,
          heat: Math.min(100, Math.round(
            Math.log10(likes + 1) * 12 + Math.log10(retweets + 1) * 15 + Math.log10(followers) * 5
          )),
        });
      }
    } catch (e) {
      console.error(`6551 kol [${kw}] err:`, e.message);
    }
  });
  await Promise.all(fetchPromises);

  if (allTweets.length === 0) return [];

  // Phase 2: Cluster tweets into narrative themes
  // Priority: $ticker clusters > topic-word clusters > discard isolated tweets
  const clusters = [];
  const assigned = new Set();

  // Pass 1: Cluster by shared $tickers (strongest narrative signal)
  const tickerIndex = {}; // ticker -> tweet indices
  allTweets.forEach((tw, i) => {
    for (const ticker of tw.tickers) {
      if (!tickerIndex[ticker]) tickerIndex[ticker] = [];
      tickerIndex[ticker].push(i);
    }
  });
  // Sort tickers by tweet count (most discussed first)
  const sortedTickers = Object.entries(tickerIndex).sort((a, b) => b[1].length - a[1].length);
  for (const [ticker, indices] of sortedTickers) {
    if (BLACKLISTED_TICKERS.has(ticker)) continue; // Skip generic English words
    const unassigned = indices.filter(i => !assigned.has(i));
    if (unassigned.length < 2) continue; // Need 2+ tweets to form a narrative
    const clusterTweets = unassigned.map(i => allTweets[i]);
    unassigned.forEach(i => assigned.add(i));
    clusters.push({ type: 'ticker', key: ticker, tweets: clusterTweets });
  }

  // Pass 2: Cluster remaining tweets by shared topic words
  const remaining = allTweets.map((tw, i) => ({ tw, i })).filter(({ i }) => !assigned.has(i));
  const wordIndex = {}; // word -> tweet indices
  for (const { tw, i } of remaining) {
    for (const w of tw.topicWords) {
      if (!wordIndex[w]) wordIndex[w] = [];
      wordIndex[w].push(i);
    }
  }
  const sortedWords = Object.entries(wordIndex).sort((a, b) => b[1].length - a[1].length);
  for (const [word, indices] of sortedWords) {
    const unassigned = indices.filter(i => !assigned.has(i));
    if (unassigned.length < 2) continue; // Need 2+ tweets for word-based cluster
    const clusterTweets = unassigned.map(i => allTweets[i]);
    unassigned.forEach(i => assigned.add(i));
    clusters.push({ type: 'topic', key: word, tweets: clusterTweets });
  }

  // Phase 3: Convert clusters into Chinese narratives
  const narratives = [];
  for (const cluster of clusters) {
    const { type, key, tweets } = cluster;
    tweets.sort((a, b) => b.engagement - a.engagement);

    // Unique KOLs in this cluster
    const kolMap = {};
    for (const tw of tweets) {
      if (!kolMap[tw.username]) kolMap[tw.username] = tw;
    }
    const kols = Object.values(kolMap)
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 5)
      .map(k => ({
        username: k.username,
        name: k.name,
        followers: k.followers,
        avatar: k.avatar || '',
        tweetUrl: k.tweetUrl || `https://x.com/${k.username}`,
        tweetText: k.text || '',
        likes: k.likes || 0,
        retweets: k.retweets || 0,
      }));

    const kolCount = Object.keys(kolMap).length;
    const totalEngagement = tweets.reduce((s, t) => s + t.engagement, 0);
    const avgHeat = Math.round(tweets.reduce((s, t) => s + t.heat, 0) / tweets.length);
    const clusterHeat = Math.min(100, avgHeat + Math.min(25, kolCount * 6));

    // Best image from cluster
    const bestImg = tweets.find(t => t.tweetImage)?.tweetImage || tweets[0].avatar || '';

    // All tickers mentioned in cluster
    const allTickers = new Set();
    for (const tw of tweets) tw.tickers.forEach(t => allTickers.add(t));
    const tokenList = [...allTickers].slice(0, 6).map(sym => ({ symbol: sym, name: sym, change: 0, address: '', logo: '' }));

    // Generate Chinese narrative title & description (news-style, not coin-shilling)
    let cnTitle, cnDesc;
    if (type === 'ticker') {
      const topicFreq = {};
      for (const tw of tweets) {
        for (const w of tw.topicWords) {
          if (w.toLowerCase() !== key.toLowerCase()) topicFreq[w] = (topicFreq[w]||0)+1;
        }
      }
      const dominantTopic = Object.entries(topicFreq).sort((a,b)=>b[1]-a[1])[0]?.[0] || '';
      cnTitle = buildNewsTitle(tweets, key, 'ticker', dominantTopic);
      cnDesc = buildNewsDesc(tweets, key);
    } else {
      cnTitle = buildNewsTitle(tweets, key, 'topic', '');
      cnDesc = buildNewsDesc(tweets, '');
    }

    // Top tweets for modal display
    const topTweetsForModal = tweets.slice(0, 6).map(tw => ({
      username: tw.username,
      name: tw.name,
      avatar: tw.avatar || '',
      followers: tw.followers,
      tweetText: tw.text || '',
      likes: tw.likes || 0,
      retweets: tw.retweets || 0,
      tweetUrl: tw.tweetUrl || `https://x.com/${tw.username}`,
    }));

    // Use the most recent tweet's actual publish time as the narrative's published time
    const clusterPublishedAt = tweets
      .map(t => t.publishedAt)
      .filter(Boolean)
      .sort()
      .pop() || null;

    narratives.push({
      title: cnTitle,
      description: cnDesc.slice(0, 280),
      heat: clusterHeat,
      kols,
      tweets: topTweetsForModal,
      tokens: tokenList,
      image: bestImg,
      source: '6551 KOL',
      tweetCount: tweets.length,
      kolCount,
      publishedAt: clusterPublishedAt,
    });
  }

  return narratives.sort((a, b) => b.heat - a.heat);
}

// Extract meaningful topic words from tweet text (for clustering)
function extractTopicWords(text) {
  const words = new Set();
  // Project/protocol names (capitalized words)
  const caps = text.match(/\b[A-Z][a-zA-Z]{2,12}\b/g) || [];
  for (const w of caps) {
    const lower = w.toLowerCase();
    if (!STOP_WORDS.has(lower)) words.add(lower);
  }
  // Chinese key phrases
  const cnPhrases = text.match(/[\u4e00-\u9fa5]{2,6}/g) || [];
  for (const p of cnPhrases) {
    if (!CN_STOP.has(p)) words.add(p);
  }
  return [...words];
}

const STOP_WORDS = new Set([
  'the', 'this', 'that', 'just', 'like', 'very', 'will', 'can', 'has', 'have',
  'been', 'not', 'but', 'and', 'for', 'are', 'was', 'were', 'with', 'all',
  'its', 'now', 'new', 'you', 'your', 'they', 'their', 'from', 'more',
  'most', 'some', 'any', 'only', 'also', 'still', 'even', 'never',
  'Crypto', 'Token', 'Coin', 'Market', 'Price', 'Chart', 'Trading',
]);
const CN_STOP = new Set(['的是', '这个', '那个', '什么', '怎么', '不是', '可以', '已经', '还是', '就是']);

// Analyze bullish/bearish sentiment from tweets
function analyzeSentiment(tweets) {
  let bull = 0, bear = 0;
  const bullWords = /\b(bull|pump|moon|buy|long|alpha|gem|100x|ape|rip|send|breakout|accumulate|load)\b/i;
  const bearWords = /\b(bear|dump|short|sell|rug|scam|crash|exit|fade|avoid)\b/i;
  for (const tw of tweets) {
    if (bullWords.test(tw.text)) bull++;
    if (bearWords.test(tw.text)) bear++;
  }
  if (bull > bear * 2) return 'bullish';
  if (bear > bull * 2) return 'bearish';
  return 'neutral';
}

// Map ticker symbols to Chinese narrative names
const TICKER_CN_MAP = {
  'BTC': '比特币', 'ETH': '以太坊', 'SOL': 'Solana', 'BNB': 'BNB Chain',
  'XRP': 'XRP', 'ADA': '卡尔达诺', 'DOGE': '狗狗币', 'SHIB': 'SHIB',
  'AVAX': 'Avalanche', 'DOT': 'Polkadot', 'LINK': 'Chainlink', 'UNI': 'Uniswap',
  'MATIC': 'Polygon', 'ARB': 'Arbitrum', 'OP': 'Optimism', 'SUI': 'Sui',
  'APT': 'Aptos', 'NEAR': 'NEAR Protocol', 'ATOM': 'Cosmos', 'INJ': 'Injective',
  'JUP': 'Jupiter', 'RAY': 'Raydium', 'WIF': 'dogwifhat', 'PEPE': 'PEPE',
  'FLOKI': 'Floki', 'BONK': 'Bonk', 'RENDER': 'Render', 'FET': 'Fetch.ai',
};

// Build a news-style Chinese title from tweet cluster content
function buildNewsTitle(tweets, key, type, dominantTopic) {
  const top = tweets[0];
  // Scan all top tweets for events, not just the first one
  const allText = tweets.slice(0, 4).map(t => t.text || '').join(' ');
  const cnKey = TOPIC_WORD_CN[key?.toLowerCase()] || key || '';
  const cnTicker = TICKER_CN_MAP[key?.toUpperCase()] || key || '';

  // Detect specific events across cluster tweets
  const isATH    = /all[- ]?time high|new (?:high|ath)|record high|\bATH\b/i.test(allText);
  const isListed = /listed on|listing on|now (?:on|live on) (?:binance|coinbase|okx|bybit|gate|mexc|kraken)/i.test(allText);
  const isLaunch = /(?:just |officially )?launch(?:ed|ing)|goes live|mainnet launch|went live/i.test(allText);
  const isPartner= /partner(?:ship|ing|ed)|collaboration|integrat(?:ed|ion)|work(?:ing)? with/i.test(allText);
  const isRaised = /raised?\s+\$[\d.]+[mk]?|funding round|series [ab]/i.test(allText);
  const isUpgrade= /upgrade|hardfork|hard fork|v\d+\.\d+|major update/i.test(allText);
  const isSEC    = /\bSEC\b|\bregulat/i.test(allText);
  const isETF    = /\bETF\b|exchange.traded fund/i.test(allText);
  const isHack   = /hack(?:ed)?|exploit|breach|stolen/i.test(allText);
  const isInflow = /net\s*inflow|institutional buy|accumulate|institution/i.test(allText);
  const pctGain  = allText.match(/([+]?\d{2,4})\s*%/)?.[1];
  const tvlMatch = allText.match(/\$[\d.]+\s*[bmk]?\s*(?:tvl|total value)/i)?.[0];
  const dollarAmt = allText.match(/\$[\d.]+\s*[bm](?:illion)?/i)?.[0];

  if (type === 'ticker') {
    // News-first format: narrative context → then ticker, never "$TICKER xxx"
    if (isETF && isInflow) return `${cnTicker} ETF 机构净流入持续扩大，主流化叙事深入推进`;
    if (isETF)    return `${cnTicker} ETF 市场出现重要动态，机构资金流向受关注`;
    if (isATH)    return `${cnTicker}触及历史新高，市场情绪进入极度亢奋`;
    if (isHack)   return `${cnTicker}相关协议遭遇安全漏洞，市场高度警惕`;
    if (isListed) return `${cnTicker}确认登陆主流交易所，流动性大幅提升`;
    if (isRaised && dollarAmt) return `${cnTicker}完成${dollarAmt}融资，机构入场信号明确`;
    if (isRaised) return `${cnTicker}完成新一轮融资，项目基本面持续强化`;
    if (isLaunch) return `${cnTicker}重磅产品正式上线，生态布局全面提速`;
    if (isPartner)return `${cnTicker}达成重要战略合作，叙事外延持续扩展`;
    if (isUpgrade)return `${cnTicker}重大协议升级落地，技术路线日趋明朗`;
    if (isSEC)    return `${cnTicker}监管动态明朗，市场预期迎来积极转变`;
    if (pctGain && parseInt(pctGain) > 50) return `${cnTicker}单日涨幅 ${pctGain}%，链上活动全面爆发`;
    if (tvlMatch) return `${cnTicker}生态锁仓量攀升，DeFi 叙事持续发酵`;
    if (dominantTopic) {
      const cnNarr = TOPIC_WORD_CN[dominantTopic.toLowerCase()] || dominantTopic;
      return `${cnTicker}与${cnNarr}叙事形成共振，市场关注度快速攀升`;
    }
    return `${cnTicker}链上活动明显异常，市场正在形成新叙事共识`;
  } else {
    if (isATH)    return `${cnKey}板块突破历史新高，叙事进入爆发期`;
    if (isListed) return `${cnKey}生态新项目密集上线，赛道热度飙升`;
    if (isLaunch) return `${cnKey}重磅产品发布，生态版图加速扩张`;
    if (isPartner)return `${cnKey}跨项目合作频繁，叙事共振加速`;
    if (isUpgrade)return `${cnKey}核心协议重大升级，技术突破受瞩目`;
    if (isSEC)    return `${cnKey}监管风向明朗，行业发展迎来新机遇`;
    if (pctGain && parseInt(pctGain) > 30) return `${cnKey}涨幅达 ${pctGain}%，赛道热度全面引爆`;
    // Topic fallback based on key
    const KW_HEADLINES = {
      'ai agent': 'AI Agent 赛道：链上智能代理进入爆发式增长阶段',
      'depin': 'DePIN 赛道升温：去中心化物理基础设施叙事强势崛起',
      'rwa': 'RWA 赛道加速：传统资产代币化进程创历史新高',
      'bitcoin etf': 'Bitcoin ETF 机构资金持续净流入，主流化进程加速',
      'ethereum layer': '以太坊 Layer2 生态高速扩张，TVL 与交易量创历史新高',
      'solana': 'Solana 生态爆发：DEX 交易量与链上活跃度再创新高',
      'meme': 'Meme 赛道新热潮：市场情绪高度亢奋，新币发射频率创纪录',
      'altcoin': '山寨季叙事升温：资金开始从 BTC 向优质 Altcoin 轮动',
      'pump.fun': 'Pump.fun 新币发射量创新高，Meme 赛道发行热潮持续升温',
      'whale': '巨鲸大规模链上建仓，聪明钱动向引发市场广泛跟随',
    };
    const kwLow = (tweets[0]?.kw || '').toLowerCase();
    const match = Object.keys(KW_HEADLINES).find(k => kwLow.includes(k) || cnKey.toLowerCase().includes(k));
    if (match) return KW_HEADLINES[match];
    return `${cnKey}：加密市场新叙事热点正在形成`;
  }
}

// Build substantive Chinese narrative description from tweet cluster
function buildNewsDesc(tweets, ticker) {
  const topTweets = tweets.slice(0, 6);

  // First: try using a tweet that's already in Chinese (most reliable)
  for (const tw of topTweets) {
    const t = tw.text || '';
    const cnRatio = (t.match(/[\u4e00-\u9fff]/g) || []).length / (t.length || 1);
    if (cnRatio >= 0.3 && t.length > 30) return t.slice(0, 280);
  }

  // Extract concrete facts from ALL top tweets
  const events = [];
  const projects = new Set();
  const metrics = [];

  // Named entities to pick up
  const KNOWN_ENTITIES = [
    'Binance','Coinbase','OKX','Bybit','MEXC','Gate','Kraken','Upbit',
    'Solana','Ethereum','Bitcoin','BNB','Base','Arbitrum','Optimism','Polygon',
    'BlackRock','Fidelity','Goldman','JPMorgan','Trump','SEC','CFTC','Fed',
    'OpenAI','Nvidia','Google','Apple','Microsoft',
    'Uniswap','Raydium','Jupiter','Orca','Aave','Compound','MakerDAO',
    'Pump.fun','Four.meme','Hyperliquid','dYdX',
  ];

  const EVENT_MAP = [
    [/listed (?:on|at) ([\w.]+)/i,     (m) => `登陆 ${m[1]} 交易所`],
    [/listing (?:on|at) ([\w.]+)/i,    (m) => `即将上线 ${m[1]}`],
    [/raised?\s+\$?([\d.]+\s*[bmk]?)/i,(m) => `完成 $${m[1]} 融资`],
    [/tvl[^$\n]*\$?([\d.]+\s*[bmkb])/i,(m) => `TVL 达 $${m[1]}`],
    [/(?:up|gained?|surged?|jumped?|pump(?:ed)?)\s+([\d.]+)%/i, (m) => `上涨 ${m[1]}%`],
    [/(?:down|lost?|dropped?|fell?|crashed?)\s+([\d.]+)%/i,     (m) => `下跌 ${m[1]}%`],
    [/\$?([\d.]+\s*[bm]) (?:in )?(?:trading )?volume/i,         (m) => `交易量 $${m[1]}`],
    [/all[- ]?time high/i,      () => '触及历史新高'],
    [/all[- ]?time low/i,       () => '跌至历史新低'],
    [/mainnet (?:launch|live)/i,() => '主网正式上线'],
    [/hard ?fork/i,             () => '完成硬分叉升级'],
    [/hacked?|exploit(?:ed)?/i, () => '遭遇安全漏洞攻击'],
    [/airdrop/i,                () => '开启代币空投活动'],
    [/partnership|collaborat/i, () => '达成重要战略合作'],
    [/burned?\s+([\d,]+)/i,     (m) => `销毁 ${m[1]} 枚代币`],
    [/\$([\d,.]+[bmk]?)\s*(?:market cap|mcap)/i, (m) => `市值达 $${m[1]}`],
    [/(\d+(?:\.\d+)?)\s*million (?:users?|wallets?|addresses?)/i, (m) => `${m[1]}M 用户`],
    [/net\s*inflow[^$\n]*\$?([\d.]+\s*[bm])/i, (m) => `净流入 $${m[1]}`],
    [/institutional|institution/i, () => '机构投资者持续入场'],
  ];

  for (const tw of topTweets) {
    const t = tw.text || '';
    for (const [pat, builder] of EVENT_MAP) {
      const m = t.match(pat);
      if (m) { const ev = builder(m); if (ev && !events.includes(ev)) events.push(ev); }
    }
    for (const ent of KNOWN_ENTITIES) {
      if (t.includes(ent)) projects.add(ent);
    }
    // Extract percentages and dollar amounts not caught above
    const pcts = t.match(/([+\-]?\d{1,4}(?:\.\d+)?)\s*%/g) || [];
    for (const p of pcts.slice(0, 2)) if (!metrics.includes(p)) metrics.push(p);
  }

  // Build narrative lead from topic context
  const kwLow = (topTweets[0]?.kw || '').toLowerCase();
  const KEY_LEADS = {
    'breaking':       '加密市场突发重大消息',
    'hack':           '链上安全事件引发市场高度警惕',
    'exploit':        '协议遭遇漏洞攻击',
    'listing':        '知名项目确认登陆主流交易所',
    'regulation':     '监管层最新动向引发市场关注',
    'sec':            'SEC 监管新动态对市场预期产生深远影响',
    'bitcoin etf':    'Bitcoin ETF 机构资金流向出现新变化',
    'solana':         'Solana 生态链上活动持续升温',
    'ethereum':       '以太坊生态出现重要进展',
    'meme coin':      'Meme 赛道新一轮热潮持续发酵',
    'whale':          '巨鲸大规模链上操作引发市场追踪',
    'airdrop':        '热门项目空投活动吸引大量参与者',
    'rwa':            'RWA 实物资产代币化叙事迎来新进展',
    'ai agent':       'AI Agent 链上生态出现重要突破',
    'depin':          'DePIN 去中心化基础设施赛道升温',
    'volume':         '链上交易量数据创下新里程碑',
    'institutional':  '机构投资者正在加速布局加密资产',
    'stablecoin':     '稳定币市场出现新动态值得关注',
    'bnb':            'BNB Chain 生态出现重大更新',
    'base':           'Base 链生态吸引新项目持续入驻',
  };
  const lead = Object.keys(KEY_LEADS).find(k => kwLow.includes(k));
  const leadText = lead ? KEY_LEADS[lead] : `加密市场热点叙事正在形成`;

  // Compose description — narrative-first, no "$TICKER" prefix
  const cnTickerName = ticker ? (TICKER_CN_MAP[ticker.toUpperCase()] || ticker) : '';
  const projectStr = projects.size ? `，涉及 ${[...projects].slice(0, 3).join('、')}` : '';
  const eventStr = events.length ? `。${events.slice(0, 3).join('，')}` : '';
  // If ticker has a Chinese name, use it naturally in context
  const tickerCtx = cnTickerName && cnTickerName !== ticker ? `（$${ticker}）` : (ticker ? `（$${ticker}）` : '');

  // Pull a key sentence from the top tweet for concreteness
  const keyLine = (() => {
    for (const tw of topTweets) {
      const sentences = (tw.text || '').split(/[.!?\n]/).filter(s => s.trim().length > 20);
      for (const s of sentences) {
        // Prefer sentences with numbers or named entities
        if (/\d/.test(s) || KNOWN_ENTITIES.some(e => s.includes(e))) {
          const partial = translateTweetToCn(s.trim(), ticker);
          if (partial.length > 15) return '「' + partial.slice(0, 80) + '」';
        }
      }
    }
    return '';
  })();

  const result = `${leadText}${tickerCtx}${projectStr}${eventStr}${keyLine ? ' ' + keyLine : ''}。`;
  return result.slice(0, 280);
}

function formatEngagement(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// Topic word -> Chinese name mapping
const TOPIC_WORD_CN = {
  'solana': 'Solana生态', 'ethereum': '以太坊生态', 'base': 'Base链',
  'pump': '暴涨行情', 'meme': 'Meme币', 'alpha': 'Alpha机会',
  'whale': '巨鲸动向', 'airdrop': '空投', 'depin': 'DePIN',
  'agent': 'AI Agent', 'rwa': 'RWA实物资产', 'nft': 'NFT',
  'launch': '新币发射', 'listing': '上线交易所', 'staking': '质押',
  'governance': '治理提案', 'bridge': '跨链桥', 'dex': 'DEX交易',
  'raydium': 'Raydium', 'jupiter': 'Jupiter', 'orca': 'Orca',
  '聪明钱': '聪明钱动向', '暴涨': '暴涨行情', '新项目': '新项目发现',
};

// Translate English tweet text to Chinese (aggressive, crypto-specific)
function translateTweetToCn(text, ticker) {
  if (!text) return '';
  // If already mostly Chinese, return as-is
  const cnChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (cnChars > text.length * 0.3) return text.slice(0, 200);

  // Phase 1: Full sentence/phrase patterns (longest first)
  const SENTENCE_PATTERNS = [
    [/\bis (?:now )?trending on (?:Twitter|X)\b/gi, '正在推特上火爆'],
    [/\bis (?:now )?live on\b/gi, '已上线'],
    [/\bis (?:now )?available on\b/gi, '已可在...上使用'],
    [/\bjust (?:got |been )?listed on\b/gi, '刚刚上线了'],
    [/\bjust launched\b/gi, '刚刚发射'],
    [/\bjust listed\b/gi, '刚刚上线'],
    [/\bjust bought\b/gi, '刚刚买入了'],
    [/\bjust sold\b/gi, '刚刚卖出了'],
    [/\bjust dropped\b/gi, '刚刚发布了'],
    [/\bjust announced\b/gi, '刚刚宣布了'],
    [/\bjust hit\b/gi, '刚刚达到了'],
    [/\bjust crossed\b/gi, '刚刚突破了'],
    [/\bjust flipped\b/gi, '刚刚超越了'],
    [/\bsmart money is buying\b/gi, '聪明钱正在买入'],
    [/\bsmart money\b/gi, '聪明钱'],
    [/\bmarket cap\b/gi, '市值'],
    [/\ball[- ]?time high\b/gi, '历史新高'],
    [/\ball[- ]?time low\b/gi, '历史新低'],
    [/\bprice target\b/gi, '目标价'],
    [/\bpump and dump\b/gi, '拉盘砸盘'],
    [/\brug ?pull(?:ed)?\b/gi, '跑路'],
    [/\bdiamond hands?\b/gi, '钻石手'],
    [/\bpaper hands?\b/gi, '纸手'],
    [/\bto the moon\b/gi, '冲上月球🚀'],
    [/\bnot financial advice\b/gi, '非投资建议'],
    [/\bbuy(?:ing)? the dip\b/gi, '逢低买入'],
    [/\bape(?:d|ing)?\s*in(?:to)?\b/gi, '冲进去'],
    [/\bgoing parabolic\b/gi, '抛物线式上涨'],
    [/\bmeme ?coin\b/gi, 'Meme币'],
    [/\bmeme ?season\b/gi, 'Meme季'],
    [/\bstaking program\b/gi, '质押计划'],
    [/\bstaking rewards?\b/gi, '质押奖励'],
    [/\byield farming\b/gi, '流动性挖矿'],
    [/\bgas fees?\b/gi, 'Gas费'],
    [/\btotal supply\b/gi, '总供应量'],
    [/\btrading volume\b/gi, '交易量'],
    [/\bprice action\b/gi, '价格走势'],
    [/\bwhale activity\b/gi, '巨鲸活动'],
    [/\bwhale alert\b/gi, '巨鲸警报'],
    [/\bin anticipation of\b/gi, '为了即将到来的'],
    [/\bworth of\b/gi, '价值的'],
    [/\bhas spiked\b/gi, '已飙升'],
    [/\bis crossing into\b/gi, '正在进入'],
    [/\bwe(?:'re| are) excited to\b/gi, '我们很高兴地'],
  ];

  // Phase 2: Individual word patterns
  const WORD_PATTERNS = [
    [/\bDYOR\b/g, '自己研究'], [/\bNFA\b/g, '非投资建议'],
    [/\bLFG\b/g, '冲！'], [/\bWAGMI\b/g, '我们都会成功'], [/\bNGMI\b/g, '不会成功'],
    [/\bGM\b/g, '早安'], [/\bGN\b/g, '晚安'],
    [/\bbullish\b/gi, '看涨'], [/\bbearish\b/gi, '看跌'],
    [/\bpumping\b/gi, '暴涨中'], [/\bdumping\b/gi, '暴跌中'],
    [/\bmooning\b/gi, '起飞中'], [/\bripping\b/gi, '暴涨中'],
    [/\bsurging\b/gi, '暴涨'], [/\bcrashing\b/gi, '暴跌'],
    [/\bbreaking\b/gi, '突发'], [/\btrending\b/gi, '火爆'],
    [/\bwhales?\b/gi, '巨鲸'], [/\bairdrop\b/gi, '空投'],
    [/\bliquidity\b/gi, '流动性'], [/\bholders?\b/gi, '持有者'],
    [/\bcommunity\b/gi, '社区'], [/\bnarrative\b/gi, '叙事'],
    [/\bexchange\b/gi, '交易所'], [/\bvolume\b/gi, '交易量'],
    [/\bsupply\b/gi, '供应量'], [/\blisting\b/gi, '上线'],
    [/\blaunch(?:ed|ing)?\b/gi, '发射'], [/\bburn(?:ed|ing)?\b/gi, '销毁'],
    [/\bbuying\b/gi, '买入'], [/\bselling\b/gi, '卖出'],
    [/\bbought\b/gi, '买入了'], [/\bsold\b/gi, '卖出了'],
    [/\bprice\b/gi, '价格'], [/\balert\b/gi, '警报'],
    [/\btoken\b/gi, '代币'], [/\bcoin\b/gi, '币'],
    [/\bhuge\b/gi, '巨大'], [/\bmassive\b/gi, '大量'],
    [/\binsane\b/gi, '疯狂'], [/\bprofit\b/gi, '利润'],
    [/\bloss\b/gi, '亏损'], [/\bstaking\b/gi, '质押'],
    [/\bannounced\b/gi, '宣布了'], [/\bunveil\b/gi, '揭幕'],
    [/\bpartnership\b/gi, '合作'], [/\bintegration\b/gi, '集成'],
    [/\bupdate\b/gi, '更新'], [/\bupgrade\b/gi, '升级'],
    [/\bmainnet\b/gi, '主网'], [/\btestnet\b/gi, '测试网'],
    [/\broadmap\b/gi, '路线图'], [/\becosystem\b/gi, '生态系统'],
    [/\bnetwork\b/gi, '网络'], [/\bprotocol\b/gi, '协议'],
    [/\bgovernance\b/gi, '治理'], [/\bproposal\b/gi, '提案'],
    [/\brewards?\b/gi, '奖励'], [/\bearning\b/gi, '收益'],
    [/\byield\b/gi, '收益率'], [/\bAPR\b/g, '年化收益率'],
    [/\bAPY\b/g, '年化复利率'],
    [/\bnew\b/gi, '新的'], [/\bhot\b/gi, '火热'],
    [/\bbig\b/gi, '大'], [/\bfirst\b/gi, '首个'],
    [/\bbefore\b/gi, '在...之前'], [/\bafter\b/gi, '在...之后'],
    [/\bnow\b/gi, '现在'], [/\btoday\b/gi, '今天'],
    [/\bis\b/gi, '是'], [/\bare\b/gi, '是'],
    [/\bhas\b/gi, '已'], [/\bhave\b/gi, '已'],
    [/\bwill\b/gi, '将'], [/\bcan\b/gi, '可以'],
    [/\bthis\b/gi, '这'], [/\bthat\b/gi, '那'],
    [/\blike\b/gi, '像'], [/\bwith\b/gi, '与'],
    [/\bfrom\b/gi, '从'], [/\binto\b/gi, '进入'],
    [/\babout\b/gi, '关于'], [/\bfor\b/gi, '为了'],
    [/\band\b/gi, '和'], [/\bor\b/gi, '或'],
    [/\bbut\b/gi, '但'], [/\balso\b/gi, '也'],
    [/\bvery\b/gi, '非常'], [/\bmore\b/gi, '更多'],
    [/\bmost\b/gi, '最'], [/\bonly\b/gi, '仅'],
    [/\bjust\b/gi, '刚'], [/\balready\b/gi, '已经'],
    [/\bstill\b/gi, '仍然'], [/\beven\b/gi, '甚至'],
    [/\bnever\b/gi, '从不'], [/\balways\b/gi, '总是'],
    [/\beveryone\b/gi, '所有人'], [/\beverything\b/gi, '一切'],
    [/\bthe\b/gi, ''], [/\ba\b/gi, ''], [/\ban\b/gi, ''],
  ];

  let result = text;
  // Remove URLs first (keep them separate)
  const urls = [];
  result = result.replace(/https?:\/\/\S+/g, (url) => { urls.push(url); return ''; });

  // Apply sentence patterns first, then word patterns
  for (const [pattern, replacement] of SENTENCE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  for (const [pattern, replacement] of WORD_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  // Clean up whitespace
  result = result.replace(/\s{2,}/g, ' ').trim();

  // Add ticker context prefix if provided
  const prefix = ticker ? `$${ticker}：` : '';
  return prefix + result.slice(0, 200);
}

// ========== AVE CLOUD ==========
async function getAveTrending(chain = 'solana') {
  if (!AVE_API_KEY) return null;
  try {
    return await fetchJSON(`https://ave.ai/api/v2/tokens/trending?chain=${chain}&page=0&pageSize=20`, {
      headers: { 'X-API-KEY': AVE_API_KEY },
    });
  } catch (e) { console.error('ave err:', e.message); return null; }
}

// ========== FOUR.MEME HOT TOKENS (BSC) ==========
async function getFourMemeHotTokens(orderBy = 'Hot') {
  try {
    const res = await fetchJSON('https://four.meme/meme-api/v1/private/token/query/advanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ orderBy }),
    });
    return res?.data || [];
  } catch (e) { console.error('fourmeme hot err:', e.message); return []; }
}

// ========== BITGET ==========
async function getBitgetRankings(name = 'topGainers') {
  try {
    const result = execSync(
      `cd /root/.openclaw/workspace && python3 scripts/bitget_api.py rankings --name ${name} 2>/dev/null`,
      { timeout: 15000, encoding: 'utf-8' }
    );
    return JSON.parse(result);
  } catch (e) { return null; }
}

// ========== SIMPLE EN->CN TRANSLATION ==========
// Basic keyword-based translation for common crypto terms
const EN_CN_MAP = {
  'Lamborghini': '兰博基尼', 'Bitcoin': '比特币', 'Ethereum': '以太坊',
  'accepting': '接受', 'payment': '支付', 'payments': '支付',
  'announced': '宣布', 'launches': '推出', 'launched': '推出了',
  'trending': '热门', 'surging': '暴涨', 'pumping': '暴涨中',
  'whale': '巨鲸', 'whales': '巨鲸', 'buying': '买入', 'selling': '卖出',
  'breaking': '突发', 'just': '刚刚', 'alert': '警报',
  'bullish': '看涨', 'bearish': '看跌', 'moon': '登月',
  'airdrop': '空投', 'listing': '上线', 'burn': '销毁',
  'market cap': '市值', 'volume': '交易量', 'price': '价格',
  'new': '新', 'token': '代币', 'coin': '代币', 'meme': 'Meme',
  'smart money': '聪明钱', 'narrative': '叙事', 'alpha': 'Alpha',
  'community': '社区', 'holders': '持有者', 'degen': 'Degen',
  'exchange': '交易所', 'liquidity': '流动性', 'supply': '供应量',
};

function roughTranslateToZh(text) {
  if (!text) return '';
  // If text is already mostly Chinese, return as-is
  const cnChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  if (cnChars / text.length > 0.3) return text;

  let result = text;
  for (const [en, cn] of Object.entries(EN_CN_MAP)) {
    result = result.replace(new RegExp(en, 'gi'), cn);
  }
  return result;
}

// ========== HELPER: resolve Binance image URL ==========
function bnImg(iconPath) {
  if (!iconPath) return '';
  if (iconPath.startsWith('http')) return iconPath;
  return BN_IMG_BASE + iconPath;
}

// ================================================================
// NARRATIVE CATEGORY CLASSIFICATION
// ================================================================

const NARRATIVE_CATEGORIES = {
  geopolitics: { label: '地缘政治', labelEn: 'Geopolitics', keywords: ['iran', 'israel', 'war', 'military', 'conflict', 'sanction', 'trump', 'biden', 'tariff', 'trade war', 'geopolit', 'missile', 'nuclear', 'drone', 'ceasefire', 'nato', 'russia', 'ukraine', 'china', 'taiwan', '美伊', '战争', '制裁', '关税', '冲突', '军事', '地缘'] },
  celebrity: { label: '名人/KOL', labelEn: 'Celebrity/KOL', keywords: ['elon', 'musk', 'trump', 'vitalik', 'cz', 'sbf', 'do kwon', 'celebrity', 'influencer', 'kol', 'announcement', 'tweet', '马斯克', '名人', 'viral', 'famous', 'billionaire'] },
  tiktok: { label: 'TikTok/社交热点', labelEn: 'TikTok/Social', keywords: ['tiktok', 'viral', 'trend', 'hashtag', 'social media', 'instagram', 'youtube', 'influencer', 'streamer', '社交', '热点', '病毒式', '短视频'] },
  ai: { label: 'AI', labelEn: 'AI', keywords: ['ai ', 'artificial intelligence', 'chatgpt', 'openai', 'claude', 'llm', 'machine learning', 'deepseek', 'nvidia', 'gpu', 'agent', 'ai代', 'ai agent', '人工智能'] },
  defi: { label: 'DeFi', labelEn: 'DeFi', keywords: ['defi', 'dex', 'swap', 'liquidity', 'yield', 'staking', 'lending', 'borrow', 'amm', 'tvl', 'protocol', 'aave', 'uniswap', 'curve', 'farming'] },
  meme: { label: 'Meme', labelEn: 'Meme', keywords: ['meme', 'doge', 'pepe', 'shib', 'bonk', 'pump.fun', 'pump fun', 'four.meme', 'flap.sh', 'memecoin', 'meme coin', '土狗', '迷因'] },
  gamefi: { label: 'GameFi/NFT', labelEn: 'GameFi/NFT', keywords: ['nft', 'gamefi', 'game', 'metaverse', 'play to earn', 'p2e', 'axie', 'sandbox', 'virtual world', '游戏', '元宇宙'] },
  layer1: { label: 'L1/L2', labelEn: 'L1/L2', keywords: ['layer 1', 'layer 2', 'l1', 'l2', 'rollup', 'zk', 'optimism', 'arbitrum', 'base', 'solana', 'ethereum', 'avalanche', 'polygon', 'sui', 'aptos', 'cosmos', 'polkadot'] },
  regulation: { label: '监管/政策', labelEn: 'Regulation', keywords: ['sec', 'regulation', 'etf', 'approval', 'ban', 'compliance', 'law', 'court', 'lawsuit', 'legal', 'policy', 'congress', 'legislation', '监管', '政策', '合规', 'spot etf', 'bitcoin etf'] },
  exchange: { label: '交易所', labelEn: 'Exchange', keywords: ['binance', 'coinbase', 'okx', 'bybit', 'bitget', 'exchange', 'listing', 'delist', 'ipo', '上市', '上线', '交易所', 'cex', 'launchpool', 'launchpad'] },
};

function classifyNarrative(n) {
  const text = `${n.title || ''} ${n.description || ''} ${n._topicEn || ''} ${(n.tokens || []).map(t => t.symbol + ' ' + (t.name || '')).join(' ')}`.toLowerCase();
  const scores = {};
  for (const [cat, { keywords }] of Object.entries(NARRATIVE_CATEGORIES)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) score += kw.length > 3 ? 2 : 1; // longer keywords = stronger signal
    }
    if (score > 0) scores[cat] = score;
  }
  // Sort by score descending, pick top 2
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) {
    // Default based on source
    if ((n.source || '').includes('Meme')) return ['meme'];
    if ((n.source || '').includes('Smart Money')) return ['defi'];
    return ['other'];
  }
  // Return top category, or top 2 if second score >= 50% of first
  const result = [sorted[0][0]];
  if (sorted.length > 1 && sorted[1][1] >= sorted[0][1] * 0.5) {
    result.push(sorted[1][0]);
  }
  return result;
}

// Token category classification based on tags and name
const TOKEN_CATEGORIES = {
  meme: { label: 'Meme', keywords: ['meme', 'doge', 'pepe', 'shib', 'bonk', 'floki', 'cat', 'dog', 'frog', 'inu', 'moon', 'elon', 'trump', 'baby'] },
  ai: { label: 'AI', keywords: ['ai', 'gpt', 'neural', 'agent', 'bot', 'deep', 'learn', 'intelligence'] },
  defi: { label: 'DeFi', keywords: ['defi', 'swap', 'yield', 'stake', 'lend', 'farm', 'pool', 'vault', 'dao'] },
  gamefi: { label: 'GameFi', keywords: ['game', 'play', 'nft', 'meta', 'world', 'quest', 'hero', 'battle'] },
  infra: { label: 'Infra', keywords: ['chain', 'layer', 'bridge', 'oracle', 'protocol', 'network', 'node', 'validator'] },
};

function classifyToken(t) {
  const text = `${t.symbol || ''} ${t.name || ''} ${(t.tags || []).join(' ')}`.toLowerCase();
  for (const [cat, { keywords }] of Object.entries(TOKEN_CATEGORIES)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return cat;
    }
  }
  return 'other';
}

// ================================================================
// API ENDPOINTS
// ================================================================

// GET /api/narratives - 热点叙事聚合 (100+)
app.get('/api/narratives', async (req, res) => {
  try {
    const chain = req.query.chain || 'all';
    const sourceFilter = req.query.source || 'all'; // all|6551|binance|bitget|ave
    const categoryFilter = req.query.category || 'all'; // all|geopolitics|celebrity|tiktok|ai|defi|meme|gamefi|layer1|regulation|exchange
    const timeWindow = TIME_WINDOWS[req.query.timeWindow] ? req.query.timeWindow : DEFAULT_TIME_WINDOW;
    const sortBy = req.query.sortBy || 'heat'; // heat | time | score
    const chainId = chain === 'all' ? 'CT_501' : `CT_${chain}`;
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 200);

    // Use rolling 24h buffer for time window filtering — each window shows genuinely different content.
    // 5-min cache only gates API re-fetches; buffer accumulates history across fetches.
    const cacheKey = 'narratives_global';
    const cacheEntry = cache[cacheKey];
    const twMs = TIME_WINDOWS[timeWindow].ms;
    const isCacheHit = cacheEntry && Date.now() - cacheEntry.ts < GLOBAL_NARRATIVE_TTL;

    function applyFiltersAndSort(pool) {
      const cutoff = Date.now() - twMs;
      let filtered = pool.filter(n => {
        const t = n.publishedAt ? new Date(n.publishedAt).getTime() : 0;
        return t >= cutoff;
      });
      if (sourceFilter !== 'all') {
        filtered = filtered.filter(n => {
          const src = (n.source || '').toLowerCase();
          if (sourceFilter === '6551') return src.includes('6551') || src.includes('kol');
          if (sourceFilter === 'binance') return src.includes('binance');
          return true;
        });
      }
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(n => {
          const cats = n.categories || [];
          return cats.includes(categoryFilter);
        });
      }
      if (sortBy === 'time') {
        filtered.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
      } else if (sortBy === 'score') {
        filtered.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
      } else {
        // Default: heat desc
        filtered.sort((a, b) => (b.heat || 0) - (a.heat || 0));
      }
      return filtered;
    }

    if (isCacheHit) {
      // Serve from buffer (has all historical data); fresh cache just means no re-fetch needed
      const pool = NARRATIVE_BUFFER.length > 0 ? NARRATIVE_BUFFER : cacheEntry.data;
      const filtered = applyFiltersAndSort(pool);
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);
      return res.json({ narratives: paged, total: filtered.length, page, pageSize, timeWindow, updatedAt: new Date(cacheEntry.ts).toISOString() });
    }

    // Parallel fetch ALL data sources
    const chainIds = chain === 'all' ? ['CT_501', 'CT_56'] : [chainId];
    const [socialRushItems, kolNarratives, trendingItems, smartMoneySol, smartMoneySolIntraday, ...multiChainResults] = await Promise.all([
      getBinanceSocialRushAll(),
      discoverCryptoKolNarratives(),
      getBinanceTrendingAll(),
      getBinanceSmartMoney('CT_501'),
      fetchJSON(`${BN_BASE}/tracker/wallet/token/inflow/rank/query`, {
        method: 'POST',
        body: JSON.stringify({ chainId: 'CT_501', period: '4h', tagType: 2 }),
      }).catch(() => null),
      ...chainIds.map(cid => Promise.all([
        Promise.resolve(null),
        getBinanceMemeRush(cid),
      ])),
    ]);

    const narratives = [];
    const seenTopicIds = new Set();

    // === Social Rush: ~90 narratives from 3 sort types ===
    for (const item of socialRushItems) {
      const nameObj = item.name || {};
      const title = nameObj.topicNameCn || nameObj.topicNameEn || '未知叙事';
      const summaryObj = item.aiSummary || {};
      const desc = summaryObj.aiSummaryCn || summaryObj.aiSummaryEn || '';

      const tokens = (item.tokenList || []).map(t => ({
        symbol: t.symbol || '',
        name: t.tokenName || '',
        change: parseFloat(t.priceChange24h || t.priceChangeRate || t.percentChange || 0),
        address: t.contractAddress || '',
        logo: bnImg(t.icon),
        chain: t.chainId || '',
      }));

      // Extract KOL from topicLink
      const originKol = [];
      if (item.topicLink) {
        const linkMatch = item.topicLink.match(/x\.com\/([^\/\s]+)/);
        if (linkMatch) originKol.push({ username: linkMatch[1], tweetUrl: item.topicLink });
      }

      // Image: use first token's icon
      let image = '';
      for (const t of tokens) {
        if (t.logo) { image = t.logo; break; }
      }

      narratives.push({
        title,
        description: desc,
        heat: Math.min(100, Math.round(parseFloat(item.progress || 50))),
        kols: [],
        _originKol: originKol,
        _topicEn: nameObj.topicNameEn || '',
        tokens: tokens.slice(0, 6),
        image,
        source: 'Binance Social Rush',
        tokenCount: item.tokenSize || tokens.length,
      });
    }

    // Binance Social Hype disabled (low quality descriptions)

    // === Meme Rush: from all chains, up to 50 each ===
    for (let i = 0; i < chainIds.length; i++) {
      const memeRush = multiChainResults[i]?.[1];
      const memeItems = memeRush?.data?.data || (Array.isArray(memeRush?.data) ? memeRush.data : []);
      for (const t of memeItems.slice(0, 50)) {
        const sym = t.symbol || t.tokenSymbol || '';
        if (!sym) continue;
        const logo = bnImg(t.tokenLogo || t.icon || '');
        narratives.push({
          title: `${sym} Meme 新币冲刺`,
          description: `Pump.fun 新 meme 代币，bonding curve 进度 ${parseFloat(t.progress || 0).toFixed(0)}%，24h 涨跌 ${parseFloat(t.priceChange || t.priceChangeRate || 0).toFixed(1)}%`,
          heat: Math.min(100, Math.round(parseFloat(t.progress || 30))),
          kols: [],
          _originKol: [],
          _topicEn: sym,
          tokens: [{
            symbol: sym,
            name: t.tokenName || '',
            change: parseFloat(t.priceChange || t.priceChangeRate || 0),
            address: t.tokenAddress || t.contractAddress || '',
            logo,
          }],
          image: logo,
          source: 'Binance Meme Rush',
        });
      }
    }

    // === Trending Tokens: hot + top gainer + new listing (SOL + BSC) ===
    const TRENDING_RANK_LABELS = { 10: '趋势热榜', 20: '涨幅榜', 30: '新币上线' };
    const trendingSeen = new Set(narratives.map(n => n.tokens?.[0]?.address).filter(Boolean));
    for (const t of (trendingItems || [])) {
      const sym = t.symbol || t.tokenSymbol || '';
      const addr = t.contractAddress || t.tokenAddress || '';
      if (!sym || !addr || trendingSeen.has(addr)) continue;
      trendingSeen.add(addr);
      const logo = bnImg(t.icon || t.tokenLogo || '');
      const change24h = parseFloat(t.percentChange || t.priceChangeRate || t.priceChange24h || 0);
      const mcap = parseFloat(t.marketCap || t.fullyDilutedValuation || 0);
      const mcapStr = mcap > 1e9 ? `${(mcap/1e9).toFixed(2)}B` : mcap > 1e6 ? `${(mcap/1e6).toFixed(1)}M` : '';
      const rankLabel = TRENDING_RANK_LABELS[t._rankType] || '趋势热榜';
      narratives.push({
        title: `${sym} ${rankLabel}`,
        description: `$${sym} 上榜 Binance ${rankLabel}，24h 涨跌 ${change24h > 0 ? '+' : ''}${change24h.toFixed(1)}%${mcapStr ? `，市值 $${mcapStr}` : ''}。持有者数量 ${t.holders || t.holderCount || '--'} 人，流动性持续吸引链上资金关注。`,
        heat: 50,
        kols: [],
        _originKol: [],
        _topicEn: sym,
        tokens: [{
          symbol: sym,
          name: t.tokenName || '',
          change: change24h,
          address: addr,
          logo,
        }],
        image: logo,
        source: 'Binance Trending',
      });
    }

    // === 6551 Twitter: Crypto KOL Discovery narratives ===
    if (Array.isArray(kolNarratives)) {
      for (const n of kolNarratives) {
        narratives.push({
          ...n,
          _originKol: [],
          _topicEn: n.tokens?.[0]?.symbol || n.title.slice(0, 20),
        });
      }
    }

    // === Smart Money: SOL 24h + 4h inflow ===
    const seenSmAddr = new Set(narratives.map(n => n.tokens?.[0]?.address).filter(Boolean));
    for (const smResp of [smartMoneySol, smartMoneySolIntraday]) {
      const smItems = smResp?.data?.data || smResp?.data || [];
      if (!Array.isArray(smItems)) continue;
      for (const t of smItems) {
        const sym = t.symbol || t.tokenSymbol || '';
        const addr = t.tokenAddress || t.contractAddress || '';
        if (!sym || !addr || seenSmAddr.has(addr)) continue;
        seenSmAddr.add(addr);
        const inflow = parseFloat(t.netInflowUsd || t.inflowAmount || 0);
        const change = parseFloat(t.priceChangeRate || t.percentChange || 0);
        const inflowStr = Math.abs(inflow) > 1e6 ? `$${(inflow/1e6).toFixed(2)}M` : `$${(inflow/1e3).toFixed(0)}K`;
        const logo = bnImg(t.icon || t.tokenLogo || '');
        narratives.push({
          title: `$${sym} 聪明钱净流入`,
          description: `聪明钱地址过去 24h 对 $${sym} 净流入 ${inflowStr}，是当前链上资金流入最集中的代币之一。持续的聪明钱买入通常预示价格潜在上涨动能。`,
          heat: 50,
          kols: [],
          _originKol: [],
          _topicEn: sym,
          tokens: [{
            symbol: sym,
            name: t.tokenName || '',
            change,
            address: addr,
            logo,
          }],
          image: logo,
          source: 'Binance Smart Money',
        });
      }
    }

    // === Heat Score Algorithm (v3): Multi-factor raw score → strict linear rank assignment ===
    // The key insight: normalize by RANK (not by raw value range), guaranteeing
    // every item gets a unique heat score spread evenly from 12 to 98.
    for (const n of narratives) {
      const kols = n.kols || [];
      const tweetCount = n.tweetCount || 0;

      // F1: Binance native progress signal (0-100, already a ranking signal)
      // This is the primary differentiator for Binance items
      const nativeHeat = n.heat || 50; // Binance progress or existing heat
      const nativeScore = nativeHeat * 1.5;

      // F2: Total tweet engagement (log scale — exponential spread for viral content)
      const totalLikes = kols.reduce((s, k) => s + (k.likes || 0), 0);
      const totalRetweets = kols.reduce((s, k) => s + (k.retweets || 0), 0);
      const engagementScore = Math.log1p(totalLikes) * 14 + Math.log1p(totalRetweets) * 22;

      // F3: KOL follower reach quality (log scale, capped to prevent single mega-KOL domination)
      const totalFollowers = kols.reduce((s, k) => s + (k.followers || 0), 0);
      const maxFollowers = kols.reduce((m, k) => Math.max(m, k.followers || 0), 0);
      const kolCount = kols.length;
      const followerScore = Math.log1p(Math.min(totalFollowers, 5e6)) * 6
                          + Math.log1p(Math.min(maxFollowers, 2e6)) * 4
                          + Math.min(kolCount, 8) * 5;

      // F4: Tweet volume diversity (more unique voices = broader narrative)
      const tweetScore = Math.log1p(tweetCount) * 10;

      // F5: Source credibility bonus (6551=real Twitter data, Binance=curated index)
      const srcBonus = n.source === '6551 KOL' ? 35 :
                       n.source === 'Binance Social Rush' ? 15 :
                       n.source === 'Binance Smart Money' ? 12 :
                       n.source === 'Binance Meme Rush' ? 8 : 5;

      // F6: Token price momentum (sharp 24h moves signal active narrative)
      const changes = (n.tokens || []).map(t => Math.abs(t.change || 0));
      const maxChange = changes.length > 0 ? Math.max(...changes) : 0;
      const avgChange = changes.length > 0 ? changes.reduce((a, b) => a + b, 0) / changes.length : 0;
      const priceScore = Math.log1p(maxChange) * 7 + Math.log1p(avgChange) * 3;

      // F7: Recency bonus — real publishedAt (Twitter snowflake) vs synthetic
      const ageMs = n._hasRealTimestamp
        ? (Date.now() - (n.publishedAt ? new Date(n.publishedAt).getTime() : Date.now()))
        : Infinity;
      const ageMin = ageMs / 60000;
      const recencyBonus = ageMin < 30 ? 25 : ageMin < 90 ? 15 : ageMin < 240 ? 7 : ageMin < 720 ? 2 : 0;

      // F8: Content richness — image + description quality
      const descLen = (n.description || '').length;
      const richness = (n.image ? 6 : 0) + Math.min(8, descLen / 50);

      // F9: Deterministic per-topic jitter (wider spread, avoids flat ties)
      // Uses title + topicId so same topic always has same jitter across requests
      const hashBase = (n.title || '') + (n._topicId || '') + (n.source || '');
      const jitter = (hashBase.split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) & 0xFFFF, 0) % 250) / 10;

      n._rawScore = nativeScore + engagementScore + followerScore + tweetScore + srcBonus + priceScore + recencyBonus + richness + jitter;
    }

    // Strict rank-based heat assignment: sort by raw score, then assign heat LINEARLY
    // This guarantees maximum spread — every item gets a unique value from 12 to 98.
    // No normalization artifacts, no clustering at any score range.
    narratives.sort((a, b) => a._rawScore - b._rawScore);
    const count = narratives.length;
    for (let i = 0; i < count; i++) {
      const pct = count > 1 ? i / (count - 1) : 1; // 0 = worst, 1 = best
      // Use sqrt curve: compresses the very bottom, gives good spread in middle/top
      const curved = Math.sqrt(pct);
      narratives[i].heat = Math.round(12 + curved * 86);
    }

    narratives.sort((a, b) => b.heat - a.heat);
    for (const n of narratives) {
      delete n._rawScore;
      n.categories = classifyNarrative(n);
    }

    const total = narratives.length;
    console.log(`Narratives total: ${total}`);

    // Fetch real KOLs + tweet images from 6551 Twitter API for TOP narratives (max 20, parallel)
    const topNarratives = narratives.filter(n => n._topicEn).slice(0, 20);
    const kolPromises = topNarratives.map(async (n) => {
      const kols = await searchKolsForTopicWithImages(n._topicEn, 5);
      const originKols = (n._originKol || []).map(k => ({
        username: k.username,
        name: k.username,
        followers: 0,
        avatar: k.avatar || '',
        tweetUrl: k.tweetUrl,
        tweetText: '',
        likes: 0,
        retweets: 0,
      }));
      const seen = new Set(originKols.map(k => k.username.toLowerCase()));
      const merged = [...originKols];
      for (const k of kols.kols) {
        if (!seen.has(k.username.toLowerCase())) {
          seen.add(k.username.toLowerCase());
          merged.push(k);
        }
      }
      n.kols = merged.slice(0, 5);
      n.tweets = kols.tweets || [];
      // Use tweet media image if available (better than token logo)
      if (kols.bestImage) {
        n.image = kols.bestImage;
      }
    });
    await Promise.all(kolPromises);

    // === AI Launch Score (calculated AFTER KOL data is fetched for accurate follower counts) ===
    // Factor 1 (40%): Twitter热度 — KOL followers quality + KOL count + heat
    // Factor 2 (35%): 新闻热度 — source quality + heat score
    // Factor 3 (25%): 市场空间 — fewer existing tokens = better opportunity
    for (const n of narratives) {
      const kols = n.kols || [];
      const kolCount = kols.length;
      const totalFollowers = kols.reduce((s, k) => s + (k.followers || 0), 0);
      const maxFollowers = kols.reduce((m, k) => Math.max(m, k.followers || 0), 0);
      const avgFollowers = kolCount > 0 ? totalFollowers / kolCount : 0;
      const heat = n.heat || 50;

      // Factor 1: Twitter热度 — KOL quality (0-100)
      // For items WITH KOL data: use follower reach + count
      // For items WITHOUT KOL data: use heat as proxy (guarantees spread)
      let twitterScore;
      if (kolCount > 0) {
        const followerQuality = Math.min(maxFollowers / 1000000, 1) * 45
                              + Math.min(avgFollowers / 300000, 1) * 30
                              + Math.min(kolCount / 5, 1) * 25;
        // KOL quality heavily weighted, with heat as a boost
        twitterScore = Math.min(100, followerQuality * 0.7 + heat * 0.3);
      } else {
        // No KOL data — use heat^1.5 to exaggerate spread (high heat gets much higher score)
        twitterScore = Math.min(100, Math.pow(heat / 100, 1.4) * 90);
      }

      // Factor 2: 新闻热度 — source credibility × heat (multiplicative → more spread)
      const srcMultiplier = n.source?.includes('6551') ? 1.4 :
                            n.source?.includes('Binance Social Rush') ? 1.1 :
                            n.source?.includes('Binance Smart Money') ? 1.05 :
                            0.7;
      // Use heat^1.3 to spread out middle scores
      const newsScore = Math.min(100, Math.pow(heat / 100, 1.3) * 85 * srcMultiplier);

      // Factor 3: 市场空间 — exponential decay by token count (1=100, 5=45, 10+=8)
      const tokenCount = n.tokenCount || n.tokens?.length || 1;
      const satScore = Math.max(5, Math.round(100 * Math.exp(-0.22 * (tokenCount - 1))));

      // Weighted combine → apply power curve for final spread (low scores compress, high expand)
      const rawProb = twitterScore * 0.40 + newsScore * 0.35 + satScore * 0.25;
      // Apply sigmoid-like mapping for maximum 5-95 spread with natural distribution
      const normalized = rawProb / 100;
      const curved = normalized < 0.5
        ? 2 * normalized * normalized  // compress bottom half
        : 1 - 2 * (1 - normalized) * (1 - normalized); // expand top half
      n.aiScore = Math.round(Math.min(95, Math.max(5, curved * 100)));
      n.aiLabel = n.aiScore >= 72 ? '高潜力' : n.aiScore >= 45 ? '中等' : '低概率';
    }

    // Clean up internal fields and auto-translate to Chinese for all narratives
    const cacheRefreshedAt = new Date().toISOString();
    for (const n of narratives) {
      delete n._originKol;
      delete n._topicEn;
      delete n._hasRealTimestamp;
      // Auto-translate English title/description to Chinese
      n.title = roughTranslateToZh(n.title);
      n.description = roughTranslateToZh(n.description);
      // publishedAt = actual tweet time (decoded from Snowflake ID for Twitter data).
      // For Binance/synthetic items with no real timestamp: assign a DETERMINISTIC age
      // based on title hash so the SAME topic always appears in the SAME time window.
      // Hash maps topic → consistent age in range 0..23h, spread across the buffer.
      if (!n.publishedAt) {
        const hashStr = (n.title || '') + (n.source || '') + (n.tokens?.[0]?.symbol || '');
        const hash = hashStr.split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) & 0xFFFFFF, 0);
        // Distribute Binance Social Rush in 0-3h, Meme Rush in 3-6h, others spread 0-12h
        const maxAgeMs = n.source === 'Binance Social Rush' ? 3 * 3600000 :
                         n.source === 'Binance Smart Money' ? 4 * 3600000 :
                         n.source === 'Binance Meme Rush' ? 6 * 3600000 : 12 * 3600000;
        const ageMs = (hash % maxAgeMs);
        n.publishedAt = new Date(Date.now() - ageMs).toISOString();
        n._hasRealTimestamp = false;
      } else {
        n._hasRealTimestamp = true;
      }
      n.fetchedAt = n.publishedAt;
    }

    // Store in 5-min cache AND push to rolling 24h buffer
    setCache(cacheKey, narratives, GLOBAL_NARRATIVE_TTL);
    updateNarrativeBuffer(narratives);

    // Use full buffer (has history from previous fetches) for time window filtering
    const pool = NARRATIVE_BUFFER.length > 0 ? NARRATIVE_BUFFER : narratives;
    const filtered = applyFiltersAndSort(pool);
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);
    res.json({ narratives: paged, total: filtered.length, page, pageSize, timeWindow, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('narratives error:', err);
    res.json({ narratives: [], total: 0, error: err.message });
  }
});

// GET /api/narratives/stream - SSE real-time push (single global stream, client re-fetches on refresh signal)
app.get('/api/narratives/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  sseClients.set(res, true);
  try { res.write(`data: ${JSON.stringify({ type: 'config', refreshMs: GLOBAL_NARRATIVE_TTL })}\n\n`); } catch(e) {}
  const hb = setInterval(() => { try { res.write(': ping\n\n'); } catch(e) {} }, 25000);
  req.on('close', () => { clearInterval(hb); sseClients.delete(res); });
});

// ========== BACKGROUND REFRESH JOBS ==========
async function backgroundRefreshNarratives() {
  const entry = cache['narratives_global'];
  if (entry && Date.now() - entry.ts < GLOBAL_NARRATIVE_TTL * 0.9) return;
  if (!sseClients.size) return;
  try {
    console.log('[bg-refresh] Refreshing global narrative cache');
    const resp = await fetch(`http://localhost:${PORT}/api/narratives?chain=all&source=all&timeWindow=24h&page=1&pageSize=200`);
    await resp.json();
  } catch (e) {
    console.error('[bg-refresh] error:', e.message);
  }
}

function startBackgroundJobs() {
  setInterval(backgroundRefreshNarratives, GLOBAL_NARRATIVE_TTL);
  console.log(`[bg-refresh] Global narrative refresh every ${GLOBAL_NARRATIVE_TTL / 60000}min`);
}
setTimeout(startBackgroundJobs, 5000);

// GET /api/narrative-tokens - 叙事代币榜（从热点叙事中提取代币，按叙事热度排名）
app.get('/api/narrative-tokens', async (req, res) => {
  try {
    const sortBy = req.query.sort || 'heat'; // heat | marketCap | volume
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || 50, 200);

    // Get narratives from buffer or cache
    const pool = NARRATIVE_BUFFER.length > 0 ? NARRATIVE_BUFFER : (cache['narratives_global']?.data || []);

    // Extract and aggregate tokens across all narratives
    const tokenMap = new Map(); // key: address or symbol → aggregated token

    for (const n of pool) {
      if (!n.tokens || !n.tokens.length) continue;
      const narrativeHeat = n.heat || 0;
      const narrativeScore = n.aiScore || 0;

      for (const t of n.tokens) {
        const sym = (t.symbol || '').toUpperCase();
        if (!sym) continue;
        const key = t.address ? `${(t.chain || 'sol').toLowerCase()}:${t.address.toLowerCase()}` : `sym:${sym}`;

        if (tokenMap.has(key)) {
          const existing = tokenMap.get(key);
          existing.narrativeCount++;
          existing.totalHeat += narrativeHeat;
          existing.maxHeat = Math.max(existing.maxHeat, narrativeHeat);
          existing.totalAiScore += narrativeScore;
          existing.maxAiScore = Math.max(existing.maxAiScore, narrativeScore);
          // Track all associated narratives (max 5)
          if (existing.narratives.length < 5) {
            existing.narratives.push({ title: n.title, heat: narrativeHeat, source: n.source });
          }
          // Update best data
          if (!existing.logo && t.logo) existing.logo = t.logo;
          if (!existing.name && t.name) existing.name = t.name;
          if (t.change && !existing.change) existing.change = t.change;
        } else {
          tokenMap.set(key, {
            symbol: sym,
            name: t.name || sym,
            address: t.address || '',
            logo: t.logo || '',
            chain: (t.chain || t.chainId || 'sol').toString().replace('CT_', ''),
            change24h: parseFloat(t.change || 0),
            narrativeCount: 1,
            totalHeat: narrativeHeat,
            maxHeat: narrativeHeat,
            totalAiScore: narrativeScore,
            maxAiScore: narrativeScore,
            narratives: [{ title: n.title, heat: narrativeHeat, source: n.source }],
          });
        }
      }
    }

    let tokens = Array.from(tokenMap.values());

    // Compute composite heat score using raw score → percentile rank (like narrative heat)
    for (const t of tokens) {
      const chainLabel = { '501': 'sol', '56': 'bsc', '1': 'eth' }[t.chain] || t.chain;
      t.chain = chainLabel;
      t.avgHeat = t.narrativeCount > 0 ? t.totalHeat / t.narrativeCount : 0;
      t.avgAiScore = t.narrativeCount > 0 ? t.totalAiScore / t.narrativeCount : 0;

      // Multi-factor raw score with wider spread
      // F1: Narrative breadth — how many narratives mention this token (exponential reward)
      const breadthScore = Math.pow(Math.min(t.narrativeCount, 15), 1.5) * 10;
      // F2: Peak heat — the hottest narrative this token appears in
      const peakScore = t.maxHeat * 0.8;
      // F3: Average heat across all narratives
      const avgScore = t.avgHeat * 0.3;
      // F4: AI success probability
      const aiScore = t.avgAiScore * 0.5;
      // F5: Price momentum — sharp movers get bonus
      const change = Math.abs(t.change24h || 0);
      const momentumScore = Math.log1p(change) * 8;
      // F6: Market data bonus (tokens with real market data rank higher)
      const dataBonus = (t.price ? 5 : 0) + (t.marketCap ? 5 : 0) + (t.volume ? 5 : 0);
      // F7: AI score variance bonus — tokens with very high or very low AI scores stand out
      const aiVariance = Math.abs(t.avgAiScore - 70) * 0.3;
      // F8: Deterministic jitter (wider range to break ties among similar tokens)
      const hash = (t.symbol + (t.address || '')).split('').reduce((s, c) => (s * 31 + c.charCodeAt(0)) & 0xFFFF, 0);
      const jitter = (hash % 500) / 50;

      t._rawScore = breadthScore + peakScore + avgScore + aiScore + momentumScore + dataBonus + aiVariance + jitter;
    }

    // Hybrid: rank-based spread + score-weighted adjustment
    // Step 1: Pure rank spread (guarantees unique values)
    tokens.sort((a, b) => a._rawScore - b._rawScore);
    const tokenCount = tokens.length;
    const minScore = tokenCount > 0 ? tokens[0]._rawScore : 0;
    const maxScore = tokenCount > 0 ? tokens[tokenCount - 1]._rawScore : 1;
    const scoreRange = maxScore - minScore || 1;
    for (let i = 0; i < tokenCount; i++) {
      // 60% rank-based (linear spread, guarantees variety)
      const rankPct = tokenCount > 1 ? i / (tokenCount - 1) : 1;
      // 40% score-based (preserves natural gaps)
      const scorePct = (tokens[i]._rawScore - minScore) / scoreRange;
      const blended = rankPct * 0.6 + scorePct * 0.4;
      tokens[i].compositeHeat = Math.round(8 + blended * 91);
    }
    // Ensure no duplicate heat scores — nudge collisions
    const seen = new Set();
    for (let i = tokenCount - 1; i >= 0; i--) {
      while (seen.has(tokens[i].compositeHeat) && tokens[i].compositeHeat > 8) {
        tokens[i].compositeHeat--;
      }
      seen.add(tokens[i].compositeHeat);
    }
    for (const t of tokens) delete t._rawScore;

    // Try to enrich with market data from token cache
    try {
      const tokenCache = cache['tokens_all_trending'];
      if (tokenCache?.data) {
        const marketMap = new Map();
        for (const mt of tokenCache.data) {
          const k = mt.address ? `${mt.chain}:${mt.address.toLowerCase()}` : `sym:${(mt.symbol||'').toUpperCase()}`;
          marketMap.set(k, mt);
        }
        for (const t of tokens) {
          const k = t.address ? `${t.chain}:${t.address.toLowerCase()}` : `sym:${t.symbol}`;
          const m = marketMap.get(k);
          if (m) {
            t.price = m.price || t.price || 0;
            t.marketCap = m.marketCap || 0;
            t.volume24h = m.volume24h || 0;
            t.holders = m.holders || 0;
            t.change24h = m.change24h || t.change24h || 0;
            if (m.logo && !t.logo) t.logo = m.logo;
          }
        }
      }
    } catch (e) {}

    // Sort
    if (sortBy === 'marketCap') {
      tokens.sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));
    } else if (sortBy === 'volume') {
      tokens.sort((a, b) => (b.volume24h || 0) - (a.volume24h || 0));
    } else {
      // Default: composite heat
      tokens.sort((a, b) => b.compositeHeat - a.compositeHeat);
    }

    const total = tokens.length;
    const paged = tokens.slice((page - 1) * pageSize, page * pageSize);

    res.json({ tokens: paged, total, page, pageSize });
  } catch (err) {
    console.error('narrative-tokens error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tokens - 热门代币排行
const CHAIN_ID_MAP = { '501': 'sol', '1': 'eth', '56': 'bsc', '8453': 'base', '42161': 'arb' };

app.get('/api/tokens', async (req, res) => {
  try {
    const chain = req.query.chain || 'all';
    const sort = req.query.sort || 'trending';
    const tokenCategoryFilter = req.query.category || 'all';

    // When 'all', fetch Solana + BNB Chain in parallel
    const fetchChainIds = chain === 'all' ? ['501', '56'] : [chain];

    const [chainResults, fourMemeHot] = await Promise.all([
      Promise.all(fetchChainIds.map(cid => Promise.all([
        getBinanceTrending(`CT_${cid}`),
        getBinanceSmartMoney(`CT_${cid}`),
      ]))),
      (chain === 'all' || chain === '56') ? getFourMemeHotTokens('Hot') : Promise.resolve([]),
    ]);

    const tokens = [];
    const seen = new Set();

    for (let ci = 0; ci < fetchChainIds.length; ci++) {
      const cid = fetchChainIds[ci];
      const chainLabel = CHAIN_ID_MAP[cid] || cid;
      const [bnTrending, smartMoney] = chainResults[ci];

      // Binance trending: data.tokens or data.data
      const bnItems = bnTrending?.data?.tokens || bnTrending?.data?.data || (Array.isArray(bnTrending?.data) ? bnTrending.data : []);
      for (const t of bnItems) {
        const sym = (t.symbol || t.tokenSymbol || '').toUpperCase();
        const key = `${chainLabel}:${sym}`;
        if (!sym || seen.has(key)) continue;
        seen.add(key);
        // Parse chart24h sparkline data
        let sparkline = [];
        try {
          if (t.chart24h) {
            const chartObj = typeof t.chart24h === 'string' ? JSON.parse(t.chart24h) : t.chart24h;
            const prices = chartObj?.p || {};
            sparkline = Object.entries(prices)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
              .map(([, v]) => parseFloat(v));
          }
        } catch (e) {}

        const vol24h = parseFloat(t.volume24h || 0);
        const ch24h = parseFloat(t.percentChange24h || t.priceChangeRate || 0);
        const holders = parseInt(t.holders || 0);
        const traders = parseInt(t.uniqueTrader24h || 0);
        const txCount = parseInt(t.count24h || 0);
        const searchCount = parseInt(t.searchCount24h || 0);
        // Trending score: log-normalized volume (40%) + capped abs change (20%) + traders (20%) + search (10%) + holders (10%)
        const trendScore = (
          Math.log10(Math.max(vol24h, 1)) * 40 +
          Math.min(Math.abs(ch24h), 500) * 0.2 +
          Math.log10(Math.max(traders, 1)) * 20 +
          Math.log10(Math.max(searchCount, 1)) * 10 +
          Math.log10(Math.max(holders, 1)) * 10
        );

        const rankLabel = t._rankType === 20 ? 'gainers' : t._rankType === 30 ? 'new' : 'trending';

        tokens.push({
          symbol: sym,
          name: t.metaInfo?.name || t.tokenName || t.name || sym,
          price: parseFloat(t.price || t.currentPrice || 0),
          change24h: ch24h,
          change1h: parseFloat(t.percentChange1h || 0),
          volume24h: vol24h,
          volume1h: parseFloat(t.volume1h || 0),
          marketCap: parseFloat(t.marketCap || 0),
          liquidity: parseFloat(t.liquidity || 0),
          holders,
          uniqueTrader24h: traders,
          txCount24h: txCount,
          buyCount24h: parseInt(t.count24hBuy || 0),
          sellCount24h: parseInt(t.count24hSell || 0),
          logo: bnImg(t.icon || t.tokenLogo || ''),
          address: t.contractAddress || t.tokenAddress || t.address || '',
          source: 'Binance',
          chain: chainLabel,
          sparkline,
          launchTime: t.launchTime || 0,
          tags: Object.entries(t.tokenTag || {}).flatMap(([, items]) => items.map(i => i.tagName)).slice(0, 3),
          rankType: rankLabel,
          trendScore,
        });
      }

      // Smart Money tokens (聪明钱在买的代币)
      if (Array.isArray(smartMoney?.data)) {
        for (const t of smartMoney.data.slice(0, 20)) {
          const sym = (t.tokenName || '').toUpperCase();
          const key = `${chainLabel}:${sym}`;
          if (!sym || seen.has(key)) continue;
          seen.add(key);
          tokens.push({
            symbol: sym,
            name: t.tokenName || '',
            price: parseFloat(t.price || 0),
            change24h: parseFloat(t.priceChangeRate || 0),
            volume24h: parseFloat(t.volume || 0),
            marketCap: parseFloat(t.marketCap || 0),
            liquidity: parseFloat(t.liquidity || 0),
            logo: bnImg(t.tokenIconUrl || ''),
            address: t.ca || '',
            source: 'Smart Money',
            chain: chainLabel,
            smTag: true,
          });
        }
      }
    }

    // Four.meme BSC hot tokens
    if (Array.isArray(fourMemeHot)) {
      for (const t of fourMemeHot.slice(0, 50)) {
        const sym = (t.shortName || t.symbol || t.name || '').toUpperCase();
        const addr = t.address || '';
        const key = `bsc:${addr || sym}`;
        if (!sym || seen.has(key)) continue;
        seen.add(key);
        const mcUsd = parseFloat(t.marketCapUsd || 0);
        const vol24h = parseFloat(t.trading || 0);
        const holders = parseInt(t.holders || 0);
        // dayIncrease from Four.meme is already a decimal fraction (e.g. 1.73 = 173%), multiply by 100
        const ch24h = parseFloat(t.dayIncrease || 0) * 100;
        const trendScore = (
          Math.log10(Math.max(vol24h, 1)) * 40 +
          Math.min(Math.abs(ch24h), 500) * 0.2 +
          Math.log10(Math.max(holders, 1)) * 20
        );
        tokens.push({
          symbol: sym,
          name: t.name || sym,
          price: parseFloat(t.price || 0) || (mcUsd && t.totalSupply ? mcUsd / parseFloat(t.totalSupply) : 0),
          change24h: ch24h,
          change1h: 0,
          volume24h: vol24h,
          volume1h: 0,
          marketCap: mcUsd,
          liquidity: 0,
          holders,
          uniqueTrader24h: 0,
          txCount24h: 0,
          buyCount24h: 0,
          sellCount24h: 0,
          logo: t.image || '',
          address: addr,
          source: 'Four.meme',
          chain: 'bsc',
          sparkline: [],
          launchTime: parseInt(t.createDate || 0),
          rankType: 'trending',
          trendScore,
        });
      }
    }

    // Assign category to each token
    for (const t of tokens) {
      t.category = classifyToken(t);
    }

    // Filter by category
    let filteredTokens = tokens;
    if (tokenCategoryFilter !== 'all') {
      filteredTokens = tokens.filter(t => t.category === tokenCategoryFilter);
    }

    // Sort — 'trending': composite trendScore; 'gainers': 24h change; 'volume': volume24h; 'new': launchTime
    if (sort === 'gainers') filteredTokens.sort((a, b) => b.change24h - a.change24h);
    else if (sort === 'volume') filteredTokens.sort((a, b) => b.volume24h - a.volume24h);
    else if (sort === 'new') filteredTokens.sort((a, b) => b.launchTime - a.launchTime);
    else filteredTokens.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0)); // default: trending

    res.json({ tokens: filteredTokens.slice(0, 80), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('tokens error:', err);
    res.json({ tokens: [], error: err.message });
  }
});

const SM_CHAIN_LABEL = { '501': 'sol', '56': 'bsc' };

// GET /api/smart-money - 聪明钱交易监控
app.get('/api/smart-money', async (req, res) => {
  try {
    const chain = req.query.chain || 'all';
    // Binance smart money only supports SOL; BSC uses Four.meme hot tokens
    const solOnly = chain === 'all' || chain === '501';
    const bscIncluded = chain === 'all' || chain === '56';

    const [solSm, solLeaderboard, bscLeaderboard, fourMemeHot] = await Promise.all([
      solOnly ? getBinanceSmartMoney('CT_501') : Promise.resolve(null),
      solOnly ? getBinanceLeaderboard('CT_501') : Promise.resolve(null),
      bscIncluded ? getBinanceLeaderboard('CT_56') : Promise.resolve(null),
      bscIncluded ? getFourMemeHotTokens('Hot') : Promise.resolve([]),
    ]);

    const wallets = [];

    // Leaderboard: data.data 是钱包数组 — 返回全部字段（SOL + BSC 合并）
    const lbItems = [
      ...(solLeaderboard?.data?.data || []).map(i => ({ ...i, _chain: 'sol' })),
      ...(bscLeaderboard?.data?.data || []).map(i => ({ ...i, _chain: 'bsc' })),
    ];
    for (const item of lbItems.slice(0, 100)) {
      // Extract twitter URL from tags
      const twitterTag = (item.genericAddressTagList || []).find(t => t.tagName === 'Twitter');
      wallets.push({
        address: item.address || '',
        label: item.addressLabel || 'Top Trader',
        avatar: item.addressLogo ? (item.addressLogo.startsWith('http') ? item.addressLogo : bnImg(item.addressLogo)) : '',
        pnl: parseFloat(item.realizedPnl || 0),
        pnlPercent: parseFloat(item.realizedPnlPercent || 0),
        winRate: parseFloat(item.winRate || 0),
        totalVolume: parseFloat(item.totalVolume || 0),
        buyVolume: parseFloat(item.buyVolume || 0),
        sellVolume: parseFloat(item.sellVolume || 0),
        totalTxCnt: item.totalTxCnt || 0,
        buyTxCnt: item.buyTxCnt || 0,
        sellTxCnt: item.sellTxCnt || 0,
        totalTradedTokens: item.totalTradedTokens || 0,
        lastActivity: item.lastActivity || 0,
        twitterUrl: twitterTag?.twitterUrl || item.addressTwitterUrl || '',
        twitterHandle: twitterTag?.extraInfo || '',
        tags: (item.genericAddressTagList || []).map(t => t.tagName).filter(t => t !== 'Twitter'),
        topTokens: (item.topEarningTokens || []).slice(0, 3).map(t => ({
          symbol: t.tokenSymbol,
          address: t.tokenAddress,
          logo: t.tokenUrl ? bnImg(t.tokenUrl) : '',
          pnl: parseFloat(t.realizedPnl || 0),
          profitRate: parseFloat(t.profitRate || 0),
        })),
        dailyPNL: (item.dailyPNL || []).map(d => ({ date: d.dt, pnl: parseFloat(d.realizedPnl || 0) })),
        tokenDistribution: item.tokenDistribution || null,
        chain: item._chain || 'sol',
      });
    }

    // Smart Money token inflow: 展示聪明钱正在交易的代币 — 全部链合并，按活跃度排序
    const smTokens = [];

    // SOL: Binance smart money data
    if (Array.isArray(solSm?.data)) {
      for (const t of solSm.data.slice(0, 30)) {
        const inflow = parseFloat(t.inflow || 0);
        smTokens.push({
          symbol: t.tokenName || '',
          address: t.ca || '',
          price: parseFloat(t.price || 0),
          change24h: parseFloat(t.priceChangeRate || 0),
          marketCap: parseFloat(t.marketCap || 0),
          volume: parseFloat(t.volume || 0),
          liquidity: parseFloat(t.liquidity || 0),
          logo: bnImg(t.tokenIconUrl || ''),
          riskLevel: t.tokenRiskLevel || 0,
          holders: parseInt(t.holders || 0),
          holdersTop10: parseFloat(t.holdersTop10Percent || 0),
          txCount: parseInt(t.count || 0),
          buyCount: parseInt(t.countBuy || 0),
          sellCount: parseInt(t.countSell || 0),
          inflow,
          traders: parseInt(t.traders || 0),
          launchTime: t.launchTime || 0,
          twitterUrl: (t.link || []).find(l => l.label === 'x')?.link || '',
          tags: Object.entries(t.tokenTag || {}).flatMap(([cat, items]) => items.map(i => i.tagName)),
          chain: 'sol',
        });
      }
    }

    // BSC: Four.meme hot tokens as smart money proxy
    if (bscIncluded && Array.isArray(fourMemeHot)) {
      for (const t of fourMemeHot.slice(0, 30)) {
        const sym = (t.shortName || t.symbol || '').toUpperCase();
        if (!sym) continue;
        const volume = parseFloat(t.tradingUsd || t.trading || 0);
        smTokens.push({
          symbol: sym,
          address: t.address || '',
          price: parseFloat(t.price || 0),
          change24h: parseFloat(t.dayIncrease || 0) * 100,
          marketCap: parseFloat(t.marketCapUsd || t.marketCap || 0),
          volume,
          liquidity: 0,
          logo: t.image || '',
          riskLevel: 0,
          holders: parseInt(t.holders || 0),
          holdersTop10: parseFloat(t.top10HoldersRate || 0) * 100,
          txCount: 0,
          buyCount: 0,
          sellCount: 0,
          inflow: volume, // use volume as proxy for smart money inflow
          traders: 0,
          launchTime: parseInt(t.createDate || 0),
          twitterUrl: '',
          tags: [],
          chain: 'bsc',
        });
      }
    }

    // 按绝对值排序，正值(净买入)优先，负值(净卖出)在后
    smTokens.sort((a, b) => {
      const aPos = a.inflow >= 0, bPos = b.inflow >= 0;
      if (aPos && !bPos) return -1;
      if (!aPos && bPos) return 1;
      return Math.abs(b.inflow) - Math.abs(a.inflow);
    });

    res.json({
      wallets,
      smartMoneyTokens: smTokens,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('smart-money error:', err);
    res.json({ wallets: [], smartMoneyTokens: [], error: err.message });
  }
});

// GET /api/daily-report - 每日叙事早报 (top 5 narratives, cached 3h)
app.get('/api/daily-report', async (req, res) => {
  try {
    const cacheKey = 'daily_report';
    const cached = getCachedWithTtl(cacheKey);
    if (cached) return res.json(cached);

    // Reuse narrative pipeline — fetch Social Rush + KOL data
    const [socialRushItems, kolNarratives] = await Promise.all([
      getBinanceSocialRushAll(),
      discoverCryptoKolNarratives(),
    ]);

    const narratives = [];

    // Build from Social Rush
    for (const item of socialRushItems) {
      const nameObj = item.name || {};
      const title = nameObj.topicNameCn || nameObj.topicNameEn || '';
      if (!title) continue;
      const summaryObj = item.aiSummary || {};
      const desc = summaryObj.aiSummaryCn || summaryObj.aiSummaryEn || '';
      const tokens = (item.tokenList || []).map(t => ({
        symbol: t.symbol || '',
        name: t.tokenName || '',
        change: parseFloat(t.priceChange24h || t.priceChangeRate || 0),
        logo: bnImg(t.icon),
      }));
      let image = tokens.find(t => t.logo)?.logo || '';
      const originKol = [];
      if (item.topicLink) {
        const m = item.topicLink.match(/x\.com\/([^\/\s]+)/);
        if (m) originKol.push({ username: m[1], tweetUrl: item.topicLink });
      }
      narratives.push({
        title: roughTranslateToZh(title),
        description: roughTranslateToZh(desc),
        heat: Math.min(100, Math.round(parseFloat(item.progress || 50))),
        tokens: tokens.slice(0, 4),
        image,
        source: 'Binance Social Rush',
        tokenCount: item.tokenSize || tokens.length,
        _topicEn: nameObj.topicNameEn || title,
        kols: originKol,
      });
    }

    // Add KOL narratives
    for (const n of kolNarratives) {
      narratives.push({
        title: roughTranslateToZh(n.title || ''),
        description: roughTranslateToZh(n.description || ''),
        heat: n.heat || 50,
        tokens: (n.tokens || []).slice(0, 4),
        image: n.image || '',
        source: n.source || '6551 KOL',
        tokenCount: n.tokenCount || 0,
        _topicEn: n._topicEn || n.title || '',
        kols: [],
      });
    }

    // Score each narrative
    for (const n of narratives) {
      let s = 0;
      s += Math.min((n.tokenCount || n.tokens?.length || 0) * 3, 30);
      s += (n.heat || 0) * 0.5;
      if (n.source?.includes('6551')) s += 20;
      else if (n.source?.includes('Binance Social Rush')) s += 15;
      s += Math.random() * 3;
      n._score = s;
    }
    narratives.sort((a, b) => b._score - a._score);

    // Fetch KOL avatars + tweet images for top 20
    const top15 = narratives.slice(0, 20);
    // Full KOL fetch for top 10, lightweight for the rest
    await Promise.all(top15.map(async (n, i) => {
      if (n._topicEn) {
        if (i < 10) {
          const kols = await searchKolsForTopicWithImages(n._topicEn, 3);
          n.kols = kols.kols || n.kols || [];
          n.tweets = kols.tweets || [];
          if (kols.bestImage) n.image = kols.bestImage;
          // Also try token logo if no image found
          if (!n.image && n.tokens && n.tokens.length > 0) {
            const tokLogo = n.tokens.find(t => t.logo)?.logo;
            if (tokLogo) n.image = tokLogo;
          }
        } else {
          // Just grab an image for the rest
          try {
            const kols = await searchKolsForTopicWithImages(n._topicEn, 1);
            if (kols.bestImage) n.image = kols.bestImage;
            n.kols = n.kols || [];
            n.tweets = [];
            if (!n.image && n.tokens && n.tokens.length > 0) {
              const tokLogo = n.tokens.find(t => t.logo)?.logo;
              if (tokLogo) n.image = tokLogo;
            }
          } catch {}
        }
      }
      delete n._score;
      delete n._topicEn;
    }));

    // Compute aiScore for top 20
    for (const n of top15) {
      const kols = n.kols || [];
      const maxFollowers = kols.reduce((m, k) => Math.max(m, k.followers || 0), 0);
      const kolCount = kols.length;
      const heat = n.heat || 50;
      const twitterScore = Math.min(maxFollowers / 1000000, 1) * 40 + Math.min(kolCount / 5, 1) * 30 + heat * 0.3;
      const newsScore = Math.min(heat * 0.65 + (n.source?.includes('6551') ? 35 : 25), 100);
      const satScore = Math.max(0, Math.round(100 * Math.exp(-0.2 * ((n.tokenCount || 1) - 1))));
      const raw = twitterScore * 0.40 + newsScore * 0.35 + satScore * 0.25;
      // Ensure scores are distributed well — add position bonus for variety
      const posBonus = Math.max(0, 20 - (top15.indexOf(n) * 1.2));
      n.aiScore = Math.round(Math.min(95, Math.max(25, raw + posBonus)));
      n.aiLabel = n.aiScore >= 75 ? '高潜力' : n.aiScore >= 50 ? '中等' : '低概率';
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const result = {
      date: dateStr,
      title: `${dateStr} 叙事早报`,
      narratives: top15,
      updatedAt: now.toISOString(),
    };

    // Cache 2 hours
    setCache(cacheKey, result, 2 * 60 * 60 * 1000);
    res.json(result);
  } catch (err) {
    console.error('daily-report error:', err);
    res.json({ narratives: [], error: err.message });
  }
});

// GET /api/generate-suggestions - AI发币建议
// Accepts optional ?narrative=...&symbol=...&description=... for context-aware suggestions
app.get('/api/generate-suggestions', async (req, res) => {
  try {
    const narrativeTitle = req.query.narrative || '';
    const contextSymbol = req.query.symbol || '';
    const contextDesc = req.query.description || '';
    const contextTokens = req.query.tokens || ''; // comma-separated

    // If narrative context is provided, generate angle-specific suggestions for that narrative
    if (narrativeTitle) {
      const suggestions = generateNarrativeAngleSuggestions(narrativeTitle, contextSymbol, contextDesc, contextTokens);
      return res.json({ suggestions, contextMode: true, updatedAt: new Date().toISOString() });
    }

    // Default: general suggestions from market data
    const socialRush = await getBinanceSocialRushAll().then(items => ({ data: items }));

    const suggestions = [];

    // 基于 Social Rush 热点叙事生成建议
    if (Array.isArray(socialRush?.data)) {
      for (const item of socialRush.data.slice(0, 5)) {
        const nameObj = item.name || {};
        const topic = nameObj.topicNameCn || nameObj.topicNameEn || '';
        const summaryObj = item.aiSummary || {};
        const desc = summaryObj.aiSummaryCn || summaryObj.aiSummaryEn || '';
        if (!topic) continue;

        suggestions.push({
          symbol: generateSymbol(nameObj.topicNameEn || topic),
          name: topic.slice(0, 30),
          description: `🔥 ${topic}！${desc.slice(0, 100)} 🚀 趁热打铁，抢占叙事先机！`,
          narrativeSource: `Binance Social Rush`,
          heat: Math.round(item.progress || 50),
          tokenCount: item.tokenSize || 0,
        });
      }
    }

    res.json({ suggestions, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('generate-suggestions error:', err);
    res.json({ suggestions: [], error: err.message });
  }
});

// Generate multiple angle suggestions for a specific narrative
function generateNarrativeAngleSuggestions(title, symbol, description, tokensStr) {
  const tokens = tokensStr ? tokensStr.split(',').filter(Boolean) : [];
  const mainToken = symbol || tokens[0] || '';

  // Extract key phrases from the narrative
  const titleClean = title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '').trim();
  const words = titleClean.split(/\s+/).filter(w => w.length > 1);
  const enWords = words.filter(w => /^[a-zA-Z]+$/.test(w));
  const cnWords = words.filter(w => /[\u4e00-\u9fa5]/.test(w));

  const suggestions = [];

  // Angle 1: 正面叙事 — 直接蹭热度
  suggestions.push({
    symbol: mainToken ? mainToken.toUpperCase().slice(0, 8) : generateSymbol(title),
    name: title.slice(0, 25),
    description: `🔥 ${title.slice(0, 50)}！直接蹭热度，抢占叙事先机！${description ? ' ' + description.slice(0, 80) : ''} 🚀`,
    narrativeSource: title.slice(0, 30),
    angle: '🎯 正面蹭热度',
    heat: 90,
  });

  // Angle 2: 反讽/Meme 角度
  const memePrefix = ['ANTI', 'FAKE', 'NOT', 'REAL', 'MEGA', 'BABY', 'SUPER', 'DOGE'][Math.floor(Math.random() * 8)];
  const baseSymbol = mainToken ? mainToken.slice(0, 4).toUpperCase() : (enWords[0] || 'MEME').toUpperCase().slice(0, 4);
  suggestions.push({
    symbol: `${memePrefix}${baseSymbol}`,
    name: `${memePrefix} ${title.slice(0, 15)}`,
    description: `😂 反讽角度！当所有人都在追 ${mainToken || title.slice(0, 10)}，我们反着来！${memePrefix}${baseSymbol} = 最会玩的 meme 叙事 🤡`,
    narrativeSource: title.slice(0, 30),
    angle: '🤡 反讽/Meme 角度',
    heat: 75,
  });

  // Angle 3: 衍生概念 — 相关但更细分
  const derivedPrefixes = ['AI', 'DEFI', 'NFT', 'DAO', 'WEB3'];
  const derivedPrefix = derivedPrefixes[Math.floor(Math.random() * derivedPrefixes.length)];
  suggestions.push({
    symbol: `${derivedPrefix}${baseSymbol}`,
    name: `${derivedPrefix} × ${title.slice(0, 12)}`,
    description: `💡 衍生概念！把 ${title.slice(0, 20)} 的热度嫁接到 ${derivedPrefix} 赛道，打造跨叙事爆款！🔗`,
    narrativeSource: title.slice(0, 30),
    angle: '💡 衍生跨界',
    heat: 70,
  });

  // Angle 4: 社区/文化角度
  const culturePrefixes = ['ARMY', 'GANG', 'CULT', 'FAM', 'CLUB'];
  const culturePrefix = culturePrefixes[Math.floor(Math.random() * culturePrefixes.length)];
  suggestions.push({
    symbol: `${baseSymbol}${culturePrefix}`,
    name: `${title.slice(0, 10)} ${culturePrefix}`,
    description: `🫂 社区角度！围绕 ${title.slice(0, 20)} 打造社区文化代币，凝聚信仰者！${baseSymbol}${culturePrefix} = 信仰就是力量 💪`,
    narrativeSource: title.slice(0, 30),
    angle: '🫂 社区文化',
    heat: 65,
  });

  // Angle 5: 时间紧迫感 — 限时叙事
  suggestions.push({
    symbol: `${baseSymbol}RUSH`,
    name: `${title.slice(0, 12)} RUSH`,
    description: `⏰ 限时叙事！${title.slice(0, 30)} 正在爆发中，窗口期稍纵即逝！${baseSymbol}RUSH = 抢在所有人前面 🏃‍♂️`,
    narrativeSource: title.slice(0, 30),
    angle: '⏰ 限时抢跑',
    heat: 85,
  });

  return suggestions;
}

// ========== IMAGE RESIZE HELPER ==========
function resizePngTo400(inputPath, outputPath) {
  try {
    execSync(`python3 -c "
from PIL import Image
img = Image.open('${inputPath}').convert('RGBA')
img = img.resize((400, 400), Image.LANCZOS)
img.save('${outputPath}', 'PNG')
"`, { timeout: 15000 });
    return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000;
  } catch (e) {
    console.error('resizePng err:', e.message);
    return false;
  }
}

// ========== AUTO LOGO GENERATION ==========
async function autoGenerateLogo(symbol, name) {
  const keywords = `${name} ${symbol} meme crypto`;
  const slug = symbol.toLowerCase().replace(/\s+/g, '_');
  const rawPath = `/tmp/logo_${slug}_raw.jpg`;
  const finalPath = `/tmp/logo_${slug}.png`;

  // 1. Search Twitter for images
  let imgUrl = null;
  if (TWITTER_TOKEN) {
    try {
      const searchRes = await fetchJSON('https://ai.6551.io/open/twitter_search', {
        method: 'POST',
        headers: { Authorization: `Bearer ${TWITTER_TOKEN}` },
        body: JSON.stringify({ keywords, product: 'Top', maxResults: 20, minRetweets: 50 }),
      });
      const tweets = searchRes?.data || [];
      let best = [];
      for (const t of tweets) {
        const media = t.media || [];
        for (const m of media) {
          const u = m.thumbUrl || m.mediaUrl || '';
          if (u && u.includes('twimg.com')) {
            const score = (t.retweetCount || 0) * 3 + (t.favoriteCount || 0);
            best.push({ score, url: u });
            break;
          }
        }
      }
      best.sort((a, b) => b.score - a.score);
      if (best.length > 0) imgUrl = best[0].url;
    } catch (e) {
      console.error('auto-logo twitter search err:', e.message);
    }
  }

  // No image found — use default Jumpad logo as fallback (resized to 400x400)
  if (!imgUrl) {
    console.log('auto-logo: no twitter image found, using default logo for', symbol);
    const defaultLogoPath = path.join(__dirname, 'assets', 'default-logo.png');
    if (fs.existsSync(defaultLogoPath)) {
      const resizedPath = `/tmp/logo_${slug}_default.png`;
      if (resizePngTo400(defaultLogoPath, resizedPath)) return resizedPath;
      return defaultLogoPath;
    }
    return null;
  }

  // 3. Download image and convert to PNG
  try {
    const imgRes = await fetch(imgUrl, { timeout: 10000 });
    const buffer = await imgRes.buffer();
    fs.writeFileSync(rawPath, buffer);

    if (buffer.length < 1000) {
      console.error('auto-logo: image too small, falling back to default');
    } else {
      // Use Python PIL to resize to 400x400 PNG
      if (resizePngTo400(rawPath, finalPath)) return finalPath;
    }
  } catch (e) {
    console.error('auto-logo convert err:', e.message);
  }

  // Final fallback: default logo resized
  const defaultLogoPath = path.join(__dirname, 'assets', 'default-logo.png');
  if (fs.existsSync(defaultLogoPath)) {
    const resizedPath = `/tmp/logo_${slug}_default.png`;
    if (resizePngTo400(defaultLogoPath, resizedPath)) return resizedPath;
    return defaultLogoPath;
  }
  return null;
}

// ========== Flap.sh vanity salt computation (CREATE2) ==========
const FLAP_BSC_PORTAL = '0xe2ce6ab80874fa9fa2aae65d277dd6b8e65c9de0';
const FLAP_BSC_TOKEN_IMPL = '0x8B4329947e34B6d56D71A3385caC122BaDe7d78D';
const FLAP_BSC_VANITY = '8888';

function computeFlapVanitySalt(portal, tokenImpl, vanityEnding, maxAttempts = 500000) {
  const implClean = tokenImpl.toLowerCase().replace('0x', '');
  const initCode = '0x3d602d80600a3d3981f3363d3d373d3d3d363d73' + implClean + '5af43d82803e903d91602b57fd5bf3';
  const initCodeHash = ethers.keccak256(initCode);
  const ending = vanityEnding.toLowerCase();
  for (let i = 0; i < maxAttempts; i++) {
    const salt = ethers.hexlify(ethers.randomBytes(32));
    const data = ethers.concat(['0xff', portal, salt, initCodeHash]);
    const hash = ethers.keccak256(data);
    const addr = '0x' + hash.slice(26);
    if (addr.endsWith(ending)) {
      return { salt, predictedAddress: addr };
    }
  }
  throw new Error('Could not find vanity salt after ' + maxAttempts + ' attempts');
}

// POST /api/flapsh/siwe-message — generate SIWE message for flap.sh auth
app.post('/api/flapsh/siwe-message', express.json(), async (req, res) => {
  const { address } = req.body || {};
  if (!address) return res.json({ success: false, error: 'Missing address' });
  const nonce = Math.random().toString(36).slice(2, 12);
  const now = new Date();
  const issuedAt = now.toISOString();
  const message = `flap.sh wants you to sign in with your Ethereum account:\n${address}\n\nSign in to Flap.sh\n\nURI: https://flap.sh\nVersion: 1\nChain ID: 56\nNonce: ${nonce}\nIssued At: ${issuedAt}`;
  // Flap.sh expects hex-encoded SIWE message in headers (no newlines allowed in HTTP headers)
  const messageHex = Buffer.from(message).toString('hex');
  res.json({ success: true, message, messageHex, nonce });
});

// POST /api/fourmeme/nonce — get Four.meme login nonce for user's address
app.post('/api/fourmeme/nonce', express.json(), async (req, res) => {
  const { address } = req.body || {};
  if (!address) return res.json({ success: false, error: 'Missing address' });
  try {
    const r = await fetch('https://four.meme/meme-api/v1/private/user/nonce/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountAddress: address, verifyType: 'LOGIN', networkCode: 'BSC' }),
    });
    const data = await r.json();
    if (data.code !== '0' && data.code !== 0) throw new Error('Nonce failed: ' + JSON.stringify(data));
    const nonce = data.data;
    res.json({ success: true, nonce, message: `You are sign in Meme ${nonce}` });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// POST /api/jumpbot/sign-message — get jumpad.fun login message for user's address
app.post('/api/jumpbot/sign-message', express.json(), async (req, res) => {
  const { address } = req.body || {};
  if (!address) return res.json({ success: false, error: 'Missing address' });
  try {
    const r = await fetch(`${JUMPBOT_API}/user/getSignMessage?address=${address}`);
    const data = await r.json();
    if (data.code !== 200) throw new Error('Failed to get sign message: ' + JSON.stringify(data));
    res.json({ success: true, message: data.data });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

// POST /api/launch-coin - 一键发币到发射器
app.post('/api/launch-coin', upload.single('logo'), async (req, res) => {
  try {
    const { symbol, name, descr, platform } = req.body;
    if (!symbol || !name || !descr) {
      return res.json({ success: false, error: '请填写完整信息' });
    }

    let logoPath = null;

    // 用户上传了 logo
    if (req.file) {
      logoPath = req.file.path;
    } else if (req.body.logoUrl) {
      // 前端传来了叙事图片 URL，直接下载使用
      console.log(`🖼️ 使用叙事图片 logo: ${req.body.logoUrl}`);
      try {
        const slug = symbol.toLowerCase().replace(/\s+/g, '_');
        const rawPath = `/tmp/logo_${slug}_narrative.jpg`;
        const finalPath = `/tmp/logo_${slug}_narrative.png`;
        let imgUrl = req.body.logoUrl;
        // If it's a proxy URL, extract the original
        if (imgUrl.includes('/api/proxy-image?url=')) {
          const match = imgUrl.match(/url=([^&]+)/);
          if (match) imgUrl = decodeURIComponent(match[1]);
        }
        // Twitter _normal.jpg is 48x48 — upgrade to _400x400 for better quality
        imgUrl = imgUrl.replace(/_normal\.(jpg|jpeg|png|webp)$/i, '_400x400.$1');
        // Set Referer based on the image source for proper access
        let referer = 'https://web3.binance.com/';
        if (imgUrl.includes('twimg.com') || imgUrl.includes('twitter.com')) referer = 'https://twitter.com/';
        else if (imgUrl.includes('four.meme')) referer = 'https://four.meme/';
        const imgRes = await fetch(imgUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': referer,
            'Accept': 'image/*,*/*',
          },
        });
        const buffer = await imgRes.buffer();
        console.log(`🖼️ logo download: ${imgUrl} → ${buffer.length} bytes, status ${imgRes.status}`);
        if (buffer.length > 500) {
          fs.writeFileSync(rawPath, buffer);
          // Use Python PIL to resize to 400x400 PNG
          if (resizePngTo400(rawPath, finalPath)) {
            logoPath = finalPath;
          }
        }
      } catch (e) {
        console.error('narrative logo download err:', e.message);
      }
    }

    // 如果上面都没有 logo，才走兜底
    if (!logoPath) {
      if (req.body.logoUrl) {
        // 用户配置了 logo URL 但下载失败，直接用默认 logo，不要搜 Twitter（防止图片不一致）
        console.log(`🎨 configured logo download failed for ${symbol}, using default logo`);
        const defaultLogoPath = path.join(__dirname, 'assets', 'default-logo.png');
        if (fs.existsSync(defaultLogoPath)) {
          const resizedPath = `/tmp/logo_${symbol.toLowerCase().replace(/\s+/g, '_')}_default.png`;
          if (resizePngTo400(defaultLogoPath, resizedPath)) logoPath = resizedPath;
          else logoPath = defaultLogoPath;
        }
      } else {
        console.log(`🎨 为 ${symbol} 自动生成 logo...`);
        logoPath = await autoGenerateLogo(symbol, name);
      }
    }

    if (!logoPath || !fs.existsSync(logoPath)) {
      return res.json({ success: false, error: '未找到合适的图片，无法发射。请手动上传 logo 或换个关键词重试。' });
    }

    // ========== Four.meme agentic path ==========
    if (platform === 'fourmeme') {
      console.log(`Four.meme prepare: ${symbol}`);
      const userAddress = req.body.userAddress;
      const userLoginSig = req.body.fourMemeLoginSig;
      if (!userAddress || !userLoginSig) {
        if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }
        return res.json({ success: false, error: '缺少钱包签名，请重试' });
      }
      try {
        const FM_API = 'https://four.meme/meme-api/v1';
        const safeDescr = descr.replace(/\n/g, ' ').slice(0, 200);

        // Step 1: Login to Four.meme as the user (using their wallet signature)
        const loginRes = await fetch(`${FM_API}/private/user/login/dex`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            region: 'WEB', langType: 'EN', loginIp: '', inviteCode: '',
            verifyInfo: { address: userAddress, networkCode: 'BSC', signature: userLoginSig, verifyType: 'LOGIN' },
            walletName: 'MetaMask',
          }),
        });
        const loginData = await loginRes.json();
        if (loginData.code !== '0' && loginData.code !== 0) {
          if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }
          return res.json({ success: false, error: `Four.meme 登录失败: ${loginData.msg || JSON.stringify(loginData)}` });
        }
        const accessToken = loginData.data;

        // Step 2: Upload logo image
        const imageBuffer = fs.readFileSync(logoPath);
        const formData = new (require('form-data'))();
        formData.append('file', imageBuffer, { filename: require('path').basename(logoPath), contentType: 'image/png' });
        const uploadRes = await fetch(`${FM_API}/private/token/upload`, {
          method: 'POST',
          headers: { 'meme-web-access': accessToken, ...formData.getHeaders() },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }
        if (uploadData.code !== '0' && uploadData.code !== 0) {
          return res.json({ success: false, error: `图片上传失败: ${uploadData.msg || JSON.stringify(uploadData)}` });
        }
        const imgUrl = uploadData.data;

        // Step 3: Get public config (BNB token details)
        const configRes = await fetch(`${FM_API}/public/config`);
        const configData = await configRes.json();
        const symbols = configData.data;
        const published = (symbols || []).filter(c => c.status === 'PUBLISH');
        const list = published.length > 0 ? published : (symbols || []);
        const raisedToken = list.find(c => c.symbol === 'BNB') || list[0];
        if (!raisedToken) return res.json({ success: false, error: 'Four.meme 配置获取失败' });

        // Step 4: Create token → get createArg + signature bound to user's address
        const createBody = {
          name, shortName: symbol, desc: safeDescr,
          totalSupply: Number(raisedToken.totalAmount || 1000000000),
          raisedAmount: Number(raisedToken.totalBAmount || 24),
          saleRate: Number(raisedToken.saleRate || 0.8),
          reserveRate: 0, imgUrl, raisedToken,
          launchTime: Date.now(), funGroup: false, label: 'Meme',
          lpTradingFee: 0.0025, webUrl: 'https://four.meme',
          twitterUrl: '', telegramUrl: '', preSale: '0',
          clickFun: false, symbol: raisedToken.symbol,
          dexType: 'PANCAKE_SWAP', rushMode: false, onlyMPC: false, feePlan: false,
        };
        const createRes = await fetch(`${FM_API}/private/token/create`, {
          method: 'POST',
          headers: { 'meme-web-access': accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify(createBody),
        });
        const createData = await createRes.json();
        if (createData.code !== '0' && createData.code !== 0) {
          const code = createData.code;
          if (code === -9005 || String(createData.msg).includes('sensitive')) {
            return res.json({ success: false, error: '发射失败：代币名称或符号含有敏感词，请换个名称重试' });
          }
          return res.json({ success: false, error: `发射失败：Four.meme 错误 ${code} — ${createData.msg}` });
        }

        const { createArg: rawArg, signature: rawSig } = createData.data;
        const toHex = s => s.startsWith('0x') ? s : ('0x' + Buffer.from(s, /^[0-9a-fA-F]+$/.test(s) ? 'hex' : 'base64').toString('hex'));
        return res.json({
          success: true,
          mode: 'client-sign',
          symbol,
          platform: 'fourmeme',
          createArg: toHex(rawArg),
          signature: toHex(rawSig),
          contractAddress: '0x5c952063c7fc8610FFDB798152D69F0B9550762b',
        });
      } catch (err) {
        if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }
        console.error('fourmeme prepare error:', err.message);
        return res.json({ success: false, error: err.message });
      }
    }

    // ========== Flap.sh path ==========
    if (platform === 'flapsh') {
      console.log(`Flap.sh create: ${symbol}`);
      const userAddress = req.body.userAddress;
      let siweMessage = req.body.siweMessage;
      const siweSignature = req.body.siweSignature;
      if (!userAddress || !siweMessage || !siweSignature) {
        if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }
        return res.json({ success: false, error: '缺少钱包签名，请重试' });
      }
      try {
        // Flap.sh uses flap.sh/api/upload as proxy (bnb.taxed.fun blocks direct access)
        const FLAP_UPLOAD = 'https://flap.sh/api/upload?warmup=true';

        const imgBuffer = fs.readFileSync(logoPath);
        if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }

        // Flap.sh uses multipart GraphQL file upload (graphql-multipart-request-spec)
        // Auth via siwe-message + siwe-signature headers (not JWT)
        const boundary = '----FlapBoundary' + Date.now();
        const operations = JSON.stringify({
          query: `mutation Create($file: Upload!, $meta: MetadataInput!) { create(file: $file, meta: $meta) }`,
          variables: {
            file: null,
            meta: {
              address: userAddress,
              name: name,
              bio: descr.slice(0, 300),
            },
          },
        });
        const map = JSON.stringify({ '0': ['variables.file'] });

        // Build multipart body manually
        let mpBody = '';
        mpBody += `--${boundary}\r\n`;
        mpBody += 'Content-Disposition: form-data; name="operations"\r\n\r\n';
        mpBody += operations + '\r\n';
        mpBody += `--${boundary}\r\n`;
        mpBody += 'Content-Disposition: form-data; name="map"\r\n\r\n';
        mpBody += map + '\r\n';
        const bodyBufPre = Buffer.from(mpBody);
        const fileHeader = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="0"; filename="${symbol}.png"\r\nContent-Type: image/png\r\n\r\n`);
        const fileFooter = Buffer.from(`\r\n--${boundary}--\r\n`);
        const fullBody = Buffer.concat([bodyBufPre, fileHeader, imgBuffer, fileFooter]);

        // Ensure siweMessage is hex-encoded (no newlines allowed in HTTP headers)
        // If it contains newlines or non-hex chars, it's raw text — convert to hex
        if (/[^0-9a-fA-F]/.test(siweMessage)) {
          siweMessage = Buffer.from(siweMessage).toString('hex');
        }
        console.log(`Flap.sh uploading: name=${name}, symbol=${symbol}, addr=${userAddress}, siweHex=${siweMessage.slice(0,40)}...`);
        const createRes = await fetch(FLAP_UPLOAD, {
          method: 'POST',
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'siwe-message': siweMessage,
            'siwe-signature': siweSignature,
            'Origin': 'https://flap.sh',
            'Referer': 'https://flap.sh/',
          },
          body: fullBody,
        });
        const createText = await createRes.text();
        console.log('Flap.sh response:', createText.slice(0, 500));
        let createData;
        try { createData = JSON.parse(createText); } catch (e) {
          return res.json({ success: false, error: `Flap.sh 返回非JSON: ${createText.slice(0, 200)}` });
        }
        if (createData.errors) {
          return res.json({ success: false, error: `Flap.sh 创建失败: ${createData.errors[0]?.message || JSON.stringify(createData.errors)}` });
        }

        // create mutation returns the IPFS metadata URI (not a token address)
        // The actual token creation must happen on-chain via the portal contract
        const metaUri = createData.data?.create;
        if (!metaUri) {
          return res.json({ success: false, error: 'Flap.sh 上传成功但未返回 metadata URI' });
        }
        console.log('Flap.sh metaUri:', metaUri);

        // Compute vanity salt server-side (much faster than browser)
        console.log('Computing vanity salt for Flap.sh (ending: ' + FLAP_BSC_VANITY + ')...');
        const saltStart = Date.now();
        const { salt, predictedAddress } = computeFlapVanitySalt(FLAP_BSC_PORTAL, FLAP_BSC_TOKEN_IMPL, FLAP_BSC_VANITY);
        console.log(`Vanity salt found in ${Date.now() - saltStart}ms, predicted addr: ${predictedAddress}`);

        // Return client-sign mode with pre-computed salt
        return res.json({
          success: true,
          symbol,
          name,
          platform: 'flapsh',
          mode: 'client-sign',
          metaUri,
          salt,
          predictedAddress,
          portalAddress: FLAP_BSC_PORTAL,
          tokenImplAddress: FLAP_BSC_TOKEN_IMPL,
          vanityEnding: FLAP_BSC_VANITY,
          beneficiary: '0x0000000000000000000000000000000000000000',
        });
      } catch (err) {
        if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }
        console.error('flapsh error:', err.message);
        return res.json({ success: false, error: err.message });
      }
    }

    // ========== Jumpbot.fun on-chain path (default) ==========
    console.log(`Jumpbot.fun on-chain deploy: ${symbol}`);
    try {
      const userAddress = req.body.userAddress;
      const jumpbotLoginSig = req.body.jumpbotLoginSig;
      const jumpbotSignMessage = req.body.jumpbotSignMessage;
      if (!userAddress || !jumpbotLoginSig || !jumpbotSignMessage) {
        if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }
        return res.json({ success: false, error: '缺少钱包签名，请重试' });
      }

      // Step 1: Login to jumpad.fun API as the USER (using their wallet signature)
      const loginRes2 = await fetch(`${JUMPBOT_API}/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signMessage: jumpbotSignMessage, address: userAddress, sign: jumpbotLoginSig }),
      });
      const loginJson = await loginRes2.json();
      if (loginJson.code !== 200) throw new Error('Jumpad login failed: ' + JSON.stringify(loginJson));
      const authToken = 'Bearer ' + loginJson.data.token;
      console.log(`Jumpad login OK as user ${userAddress}`);

      // Step 2: Upload image to AWS via jumpad.fun
      const imgBuf = fs.readFileSync(logoPath);
      const blob = new Blob([imgBuf], { type: 'image/png' });
      const uploadForm = new FormData();
      // Use native FormData append with blob for the upload endpoint
      const { Readable } = require('stream');
      const imgStream = Readable.from(imgBuf);
      uploadForm.append('file', imgStream, { filename: 'logo.png', contentType: 'image/png', knownLength: imgBuf.length });
      const uploadRes = await fetch(`${JUMPBOT_API}/aws/upload`, {
        method: 'POST',
        headers: { 'Authorization': authToken, ...uploadForm.getHeaders() },
        body: uploadForm,
      });
      const uploadJson = await uploadRes.json();
      if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }
      if (uploadJson.code !== 200) throw new Error('Jumpad image upload failed: ' + JSON.stringify(uploadJson));
      const imageUrl = uploadJson.data;
      console.log(`Jumpad image uploaded: ${imageUrl}`);

      // Step 3: Get nonce for vanity address
      const nonceRes = await fetch(`${JUMPBOT_API}/memecoin/getSuffixAddressNonce?chainId=56`, {
        headers: { 'Authorization': authToken },
      });
      const nonceJson = await nonceRes.json();
      if (nonceJson.code !== 200) throw new Error('Jumpad nonce failed: ' + JSON.stringify(nonceJson));
      const nonce = nonceJson.data;
      console.log(`Jumpad nonce: ${nonce}`);

      // Step 4: Return client-sign mode — frontend will call createAndBuy from user's wallet
      const safeDescr = descr.replace(/\n/g, ' ').slice(0, 500);
      return res.json({
        success: true,
        mode: 'client-sign',
        platform: 'jumpbot',
        symbol,
        name,
        jumpbotMeta: {
          name,
          symbol,
          image: imageUrl,
          description: safeDescr,
          twitter: '',
          telegram: '',
          website: '',
        },
        nonce: String(nonce),
        routerAddress: JUMPBOT_ROUTER,
      });
    } catch (err) {
      if (logoPath) { try { fs.unlinkSync(logoPath); } catch (e) {} }
      console.error('jumpbot on-chain error:', err.message);
      return res.json({ success: false, error: err.message });
    }
  } catch (err) {
    console.error('launch-coin error:', err);
    res.json({ success: false, error: err.message });
  }
});

// ========== HELPERS ==========
function generateSymbol(topic) {
  if (!topic) return 'MEME';
  const words = topic.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0].slice(0, 3) + words[1].slice(0, 3)).toUpperCase();
  }
  if (words.length === 1) {
    return words[0].toUpperCase().slice(0, 6);
  }
  return 'MEME';
}

// ========== IMAGE PROXY (bypass Binance CDN hotlink protection) ==========
app.get('/api/proxy-image', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url');
  try {
    const imgRes = await fetch(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://web3.binance.com/',
        'Accept': 'image/*,*/*',
      },
    });
    if (!imgRes.ok) return res.status(imgRes.status).send('Image fetch failed');
    const contentType = imgRes.headers.get('content-type') || 'image/png';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    const buffer = await imgRes.buffer();
    res.send(buffer);
  } catch (e) {
    res.status(500).send('Proxy error');
  }
});

// ========== START ==========
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Narrative Hunter running at http://0.0.0.0:${PORT}`);
  console.log(`   Twitter API: ${TWITTER_TOKEN ? 'ok' : 'missing'}`);
  console.log(`   AVE API: ${AVE_API_KEY ? 'ok' : 'missing'}`);
});
