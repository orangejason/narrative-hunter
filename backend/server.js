const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const upload = multer({ dest: '/tmp/uploads/' });

// ========== ENV ==========
const TWITTER_TOKEN = process.env.TWITTER_TOKEN || '';
const AVE_API_KEY = process.env.AVE_API_KEY || '';

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

// Social Rush - 叙事话题列表
async function getBinanceSocialRush() {
  try {
    const url = `${BN_BASE}/buw/wallet/market/token/social-rush/rank/list?chainId=CT_501&rankType=30&sort=30&asc=false`;
    return await fetchJSON(url);
  } catch (e) { console.error('socialRush err:', e.message); return null; }
}

// Social Hype - token社交热度排行
async function getBinanceSocialHype(chainId = 'CT_501') {
  try {
    const url = `${BN_BASE}/buw/wallet/market/token/pulse/social/hype/rank/leaderboard?chainId=${chainId}&sentiment=All&socialLanguage=ALL&targetLanguage=zh&timeRange=1`;
    return await fetchJSON(url);
  } catch (e) { console.error('socialHype err:', e.message); return null; }
}

// Trending tokens
async function getBinanceTrending(chainId = 'CT_501') {
  try {
    return await fetchJSON(`${BN_BASE}/buw/wallet/market/token/pulse/unified/rank/list`, {
      method: 'POST',
      body: JSON.stringify({
        rankType: 10, chainId, period: 50, sortBy: 70, orderAsc: false,
        page: 1, size: 20,
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
    });
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
        chainId, rankType: 10, limit: 20,
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
    const url = `${BN_BASE}/market/leaderboard/query?chainId=${chainId}&tag=ALL&pageNo=1&pageSize=10&sortBy=0&orderBy=0&period=7d`;
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

// ========== AVE CLOUD ==========
async function getAveTrending(chain = 'solana') {
  if (!AVE_API_KEY) return null;
  try {
    return await fetchJSON(`https://ave.ai/api/v2/tokens/trending?chain=${chain}&page=0&pageSize=20`, {
      headers: { 'X-API-KEY': AVE_API_KEY },
    });
  } catch (e) { console.error('ave err:', e.message); return null; }
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

// ========== HELPER: resolve Binance image URL ==========
function bnImg(iconPath) {
  if (!iconPath) return '';
  if (iconPath.startsWith('http')) return iconPath;
  return BN_IMG_BASE + iconPath;
}

// ================================================================
// API ENDPOINTS
// ================================================================

// GET /api/narratives - 热点叙事聚合
app.get('/api/narratives', async (req, res) => {
  try {
    const chain = req.query.chain || 'all';
    const chainId = chain === 'all' ? 'CT_501' : `CT_${chain}`;

    // Parallel fetch
    const [socialRush, memeRush, aveTrending] = await Promise.all([
      getBinanceSocialRush(),
      getBinanceMemeRush(chainId),
      getAveTrending(),
    ]);

    const narratives = [];

    // Social Rush: data 直接是数组, 每个item有 name:{topicNameEn,topicNameCn}, aiSummary:{...}, tokenList:[...]
    if (Array.isArray(socialRush?.data)) {
      for (const item of socialRush.data.slice(0, 12)) {
        const nameObj = item.name || {};
        const title = nameObj.topicNameCn || nameObj.topicNameEn || '未知叙事';
        const summaryObj = item.aiSummary || {};
        const desc = summaryObj.aiSummaryCn || summaryObj.aiSummaryEn || '';

        const tokens = (item.tokenList || []).map(t => ({
          symbol: t.symbol || '',
          name: t.tokenName || '',
          change: parseFloat(t.priceChangeRate || t.percentChange || 0),
          address: t.contractAddress || '',
          logo: bnImg(t.icon),
          chain: t.chainId || '',
        }));

        // 从 tokenList 中提取 KOL（twitter链接）
        const kols = [];
        for (const t of (item.tokenList || [])) {
          const links = t.previewLink?.x || [];
          for (const link of links) {
            const match = link.match(/x\.com\/(\w+)\//);
            if (match && !kols.includes(match[1])) kols.push(match[1]);
          }
        }

        narratives.push({
          title,
          description: desc,
          heat: Math.min(100, Math.round(item.progress || 50)),
          kols: kols.slice(0, 5),
          tokens: tokens.slice(0, 6),
          source: 'Binance Social Rush',
          tokenCount: item.tokenSize || tokens.length,
        });
      }
    }

    // Meme Rush: data.data 是数组
    const memeItems = memeRush?.data?.data || (Array.isArray(memeRush?.data) ? memeRush.data : []);
    if (memeItems.length > 0) {
      const memeTokens = memeItems.slice(0, 8);
      narratives.push({
        title: '🐸 Pump.fun 新 Meme 热潮',
        description: `${memeTokens.length} 个新 meme 代币正在冲击 bonding curve`,
        heat: 85,
        kols: [],
        tokens: memeTokens.map(t => ({
          symbol: t.symbol || t.tokenSymbol || '',
          name: t.tokenName || '',
          change: parseFloat(t.priceChange || t.priceChangeRate || 0),
          address: t.tokenAddress || t.contractAddress || '',
          logo: bnImg(t.tokenLogo || t.icon || ''),
        })),
        source: 'Binance Meme Rush',
      });
    }

    // AVE trending
    if (aveTrending?.data && Array.isArray(aveTrending.data)) {
      const aveTokens = aveTrending.data.slice(0, 5);
      if (aveTokens.length > 0) {
        narratives.push({
          title: '📈 AVE Trending 热门',
          description: `AVE 全链热门代币实时追踪`,
          heat: 75,
          kols: [],
          tokens: aveTokens.map(t => ({
            symbol: t.symbol || '',
            name: t.name || '',
            change: parseFloat(t.priceChange24h || t.change24h || 0),
            address: t.address || '',
            logo: t.logo || '',
          })),
          source: 'AVE Cloud',
        });
      }
    }

    // Sort by heat
    narratives.sort((a, b) => b.heat - a.heat);

    res.json({ narratives, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('narratives error:', err);
    res.json({ narratives: [], error: err.message });
  }
});

// GET /api/tokens - 热门代币排行
app.get('/api/tokens', async (req, res) => {
  try {
    const chain = req.query.chain || 'all';
    const sort = req.query.sort || 'trending';
    const chainId = chain === 'all' ? 'CT_501' : `CT_${chain}`;

    const [bnTrending, smartMoney, bitgetGainers] = await Promise.all([
      getBinanceTrending(chainId),
      getBinanceSmartMoney(chainId),
      getBitgetRankings(sort === 'gainers' ? 'topGainers' : 'topGainers'),
    ]);

    const tokens = [];
    const seen = new Set();

    // Binance trending: data.data 是数组
    const bnItems = bnTrending?.data?.data || (Array.isArray(bnTrending?.data) ? bnTrending.data : []);
    for (const t of bnItems) {
      const sym = (t.symbol || t.tokenSymbol || '').toUpperCase();
      if (!sym || seen.has(sym)) continue;
      seen.add(sym);
      tokens.push({
        symbol: sym,
        name: t.tokenName || t.name || '',
        price: parseFloat(t.price || t.currentPrice || 0),
        change24h: parseFloat(t.percentChange || t.priceChangeRate || t.priceChange24h || 0),
        volume24h: parseFloat(t.volume || t.volume24h || 0),
        marketCap: parseFloat(t.marketCap || 0),
        liquidity: parseFloat(t.liquidity || 0),
        logo: bnImg(t.tokenLogo || t.icon || ''),
        address: t.tokenAddress || t.contractAddress || t.address || '',
        source: 'Binance',
      });
    }

    // Smart Money tokens (聪明钱在买的代币)
    if (Array.isArray(smartMoney?.data)) {
      for (const t of smartMoney.data.slice(0, 20)) {
        const sym = (t.tokenName || '').toUpperCase();
        if (!sym || seen.has(sym)) continue;
        seen.add(sym);
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
          smTag: true,
        });
      }
    }

    // Bitget gainers
    if (bitgetGainers?.data) {
      const gainers = Array.isArray(bitgetGainers.data) ? bitgetGainers.data : (bitgetGainers.data.items || []);
      for (const t of gainers) {
        const sym = (t.symbol || t.tokenSymbol || '').toUpperCase();
        if (!sym || seen.has(sym)) continue;
        seen.add(sym);
        tokens.push({
          symbol: sym,
          name: t.tokenName || t.name || '',
          price: parseFloat(t.price || t.currentPrice || 0),
          change24h: parseFloat(t.changePercent24h || t.priceChange24h || 0),
          volume24h: parseFloat(t.volume24h || t.volume || 0),
          marketCap: parseFloat(t.marketCap || 0),
          liquidity: parseFloat(t.liquidity || 0),
          logo: t.tokenLogo || t.logo || '',
          address: t.tokenAddress || t.address || '',
          source: 'Bitget',
        });
      }
    }

    // Sort
    if (sort === 'gainers') tokens.sort((a, b) => b.change24h - a.change24h);
    else if (sort === 'volume') tokens.sort((a, b) => b.volume24h - a.volume24h);
    else tokens.sort((a, b) => b.volume24h - a.volume24h);

    res.json({ tokens: tokens.slice(0, 50), updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('tokens error:', err);
    res.json({ tokens: [], error: err.message });
  }
});

// GET /api/smart-money - 聪明钱交易监控
app.get('/api/smart-money', async (req, res) => {
  try {
    const chain = req.query.chain || '501';
    const chainId = `CT_${chain}`;

    const [smartMoney, leaderboard] = await Promise.all([
      getBinanceSmartMoney(chainId),
      getBinanceLeaderboard(chainId),
    ]);

    const wallets = [];

    // Leaderboard: data.data 是钱包数组
    const lbItems = leaderboard?.data?.data || [];
    for (const item of lbItems.slice(0, 10)) {
      wallets.push({
        address: item.address || '',
        label: item.addressLabel || 'Top Trader',
        avatar: item.addressLogo ? bnImg(item.addressLogo) : '',
        pnl: parseFloat(item.realizedPnl || 0),
        pnlPercent: parseFloat(item.realizedPnlPercent || 0),
        trades: [], // leaderboard不含trade明细
      });
    }

    // Smart Money token inflow: data 直接是代币数组，展示聪明钱在买什么
    const smTokens = [];
    if (Array.isArray(smartMoney?.data)) {
      for (const t of smartMoney.data.slice(0, 15)) {
        smTokens.push({
          symbol: t.tokenName || '',
          address: t.ca || '',
          price: parseFloat(t.price || 0),
          change24h: parseFloat(t.priceChangeRate || 0),
          marketCap: parseFloat(t.marketCap || 0),
          volume: parseFloat(t.volume || 0),
          logo: bnImg(t.tokenIconUrl || ''),
          riskLevel: t.tokenRiskLevel || 0,
        });
      }
    }

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

// GET /api/generate-suggestions - AI发币建议
app.get('/api/generate-suggestions', async (req, res) => {
  try {
    const [socialRush, aveTrending] = await Promise.all([
      getBinanceSocialRush(),
      getAveTrending(),
    ]);

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

    // 基于 AVE 热门代币做衍生
    if (aveTrending?.data && Array.isArray(aveTrending.data)) {
      for (const t of aveTrending.data.slice(0, 3)) {
        const sym = t.symbol || '';
        if (!sym) continue;
        suggestions.push({
          symbol: `MEGA${sym.slice(0, 4).toUpperCase()}`,
          name: `超级${t.name || sym}`,
          description: `📈 ${sym} 正在 AVE 热门榜！做衍生叙事正当时 💎`,
          narrativeSource: 'AVE Cloud Trending',
          heat: 60,
        });
      }
    }

    res.json({ suggestions, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('generate-suggestions error:', err);
    res.json({ suggestions: [], error: err.message });
  }
});

// POST /api/launch-coin - 一键发币到 Jumpbot
app.post('/api/launch-coin', upload.single('logo'), async (req, res) => {
  try {
    const { symbol, name, descr } = req.body;
    if (!symbol || !name || !descr) {
      return res.json({ success: false, error: '请填写完整信息' });
    }

    const form = new FormData();
    form.append('symbol', symbol);
    form.append('name', name);
    form.append('descr', descr);

    if (req.file) {
      form.append('logo', fs.createReadStream(req.file.path), {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
    }

    const response = await fetch('https://jumpad.fun/api/memecoin/openClawBot', {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
      timeout: 30000,
    });

    const data = await response.json();

    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }

    res.json({ success: true, symbol, data });
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

// ========== START ==========
const PORT = process.env.PORT || 80;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Narrative Hunter running at http://0.0.0.0:${PORT}`);
  console.log(`   Twitter API: ${TWITTER_TOKEN ? '✅' : '❌'}`);
  console.log(`   AVE API: ${AVE_API_KEY ? '✅' : '❌'}`);
});
