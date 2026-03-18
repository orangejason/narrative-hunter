// ========== About Modal ==========
function openAboutModal() {
  document.getElementById('aboutModalOverlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeAboutModal() {
  document.getElementById('aboutModalOverlay').style.display = 'none';
  document.body.style.overflow = '';
}

// ========== Brand Icon Helpers ==========
function icon(id, cls = '') {
  return `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#${id}"></use></svg>`;
}

// ========== Category Labels ==========
const CATEGORY_LABELS = {
  geopolitics: '地缘政治', celebrity: '名人/KOL', tiktok: 'TikTok',
  ai: 'AI', defi: 'DeFi', meme: 'Meme', gamefi: 'GameFi',
  layer1: 'L1/L2', regulation: '监管', exchange: '交易所',
  infra: 'Infra', other: '其他',
};
function getCategoryLabel(cat) { return CATEGORY_LABELS[cat] || cat; }
function rankBadge(idx) {
  if (idx === 0) return `<span class="rank-badge rank-1">1</span>`;
  if (idx === 1) return `<span class="rank-badge rank-2">2</span>`;
  if (idx === 2) return `<span class="rank-badge rank-3">3</span>`;
  return `<span class="rank-badge rank-n">#${idx + 1}</span>`;
}

// ========== i18n ==========
let currentLang = localStorage.getItem('nh_lang') || 'cn';

const i18n = {
  cn: {
    // Header
    siteSubtitle: 'AI \u53D9\u4E8B\u72D9\u51FB\u5E73\u53F0',
    aiEngineInfo: 'AI \u5F15\u64CE\u4FE1\u606F',
    agentLabel: '\u667A\u80FD\u4F53',
    modelLabel: '\u6A21\u578B',
    systemPromptLabel: '\u7CFB\u7EDF\u63D0\u793A\u8BCD',
    // Tabs
    hotNarratives: '\u5B9E\u65F6\u70ED\u70B9\u53D9\u4E8B',
    trendingTokens: '\u70ED\u95E8\u4EE3\u5E01',
    smartMoney: '\u806A\u660E\u94B1',
    oneLaunch: '\u4E00\u952E\u53D1\u5E01',
    // Narratives
    totalNarratives: (n) => `\u5171 ${n} \u6761\u53D9\u4E8B`,
    loadingNarratives: '\u52A0\u8F7D\u70ED\u70B9\u53D9\u4E8B\u4E2D...',
    noNarratives: '\u6682\u65E0\u70ED\u70B9\u53D9\u4E8B\u6570\u636E',
    loadMore: (loaded, total) => `\u52A0\u8F7D\u66F4\u591A (${loaded}/${total})`,
    loadFailed: (msg) => `\u52A0\u8F7D\u5931\u8D25: ${msg}`,
    coinFromNarrative: '\u57FA\u4E8E\u6B64\u53D9\u4E8B\u53D1\u5E01',
    // Source filter
    sourceAll: '\u5168\u90E8\u6765\u6E90',
    source6551: 'Twitter 热点',
    sourceBinance: 'Binance',
    sourceBitget: 'Bitget',
    sourceAve: 'AVE Cloud',
    // Chain filter
    allChains: '\u5168\u94FE',
    chainSolana: 'Solana',
    chainEth: 'Ethereum',
    chainBsc: 'BSC',
    chainBase: 'Base',
    chainArb: 'Arbitrum',
    // Tokens table
    token: '\u4EE3\u5E01',
    priceCol: '\u4EF7\u683C',
    change24h: '24h\u6DA8\u8DCC',
    vol24h: '24h\u4EA4\u6613\u91CF',
    mcap: '\u5E02\u503C',
    liquidity: '\u6D41\u52A8\u6027',
    change1h: '1h',
    chart24h: '24h\u8D70\u52BF',
    txns24h: '\u4EA4\u6613',
    ops: '\u64CD\u4F5C',
    noData: '\u6682\u65E0\u6570\u636E',
    // Token sort
    trendHeat: '\u8D8B\u52BF\u70ED\u5EA6',
    gainers: '\u6DA8\u5E45\u699C',
    volume: '\u4EA4\u6613\u91CF',
    newCoins: '\u65B0\u5E01',
    // Smart Money
    loadingSmartMoney: '\u52A0\u8F7D\u806A\u660E\u94B1\u6570\u636E\u4E2D...',
    noSmartMoney: '\u6682\u65E0\u806A\u660E\u94B1\u6570\u636E',
    smBuying: '\u806A\u660E\u94B1\u6B63\u5728\u4E70\u5165\u7684\u4EE3\u5E01',
    walletRank: '\u94B1\u5305 PnL \u6392\u884C',
    smInflow: '\u806A\u660E\u94B1\u6D41\u5165',
    buySell: '\u4E70/\u5356',
    risk: '\u98CE\u9669',
    riskSafe: '\u5B89\u5168',
    riskLow: '\u4F4E',
    riskMid: '\u4E2D',
    riskHigh: '\u9AD8',
    winRate: '\u80DC\u7387',
    txns: '\u4EA4\u6613\u6B21\u6570',
    tradingVol: '\u4EA4\u6613\u91CF',
    tokenCount: '\u4EE3\u5E01\u6570',
    buySellLabel: '\u4E70/\u5356',
    pnl7d: '7\u65E5PnL',
    topEarners: '\u6700\u8D5A\u4EE3\u5E01:',
    trader: '\u4EA4\u6613\u5458',
    addressCopied: '\u5730\u5740\u5DF2\u590D\u5236',
    // Generator
    aiSuggestions: 'AI \u53D1\u5E01\u5EFA\u8BAE',
    genSuggestions: '\u751F\u6210\u5EFA\u8BAE',
    coinInfo: '\u53D1\u5E01\u4FE1\u606F',
    symbolLabel: '\u4EE3\u5E01\u7B26\u53F7 (Symbol)',
    nameLabel: '\u4EE3\u5E01\u540D\u79F0 (Name)',
    narrativeDesc: '\u53D9\u4E8B\u63CF\u8FF0',
    logo: 'Logo',
    clickUpload: '\u70B9\u51FB\u6216\u62D6\u62FD\u4E0A\u4F20',
    launch: '\u4E00\u952E\u53D1\u5C04',
    submitting: '\u6B63\u5728\u63D0\u4EA4...',
    searchingLogo: 'AI \u6B63\u5728\u641C\u7D22\u5339\u914D\u56FE\u7247...',
    logoGenerated: 'Logo \u5DF2\u751F\u6210\uFF0C\u6B63\u5728\u63D0\u4EA4...',
    launchSuccess: (sym) => `\u53D1\u5C04\u6210\u529F\uFF01$${sym} \u5DF2\u63D0\u4EA4`,
    launchFail: (msg) => `\u53D1\u5C04\u5931\u8D25: ${msg}`,
    networkError: (msg) => `\u7F51\u7EDC\u9519\u8BEF: ${msg}`,
    noSuggestions: '\u6682\u65F6\u6CA1\u6709\u5408\u9002\u7684\u53D1\u5E01\u5EFA\u8BAE',
    suggestionsHint: '\u70B9\u51FB\u300C\u751F\u6210\u5EFA\u8BAE\u300D\uFF0CAI \u5C06\u57FA\u4E8E\u5F53\u524D\u70ED\u70B9\u53D9\u4E8B\u4E3A\u4F60\u63A8\u8350\u53D1\u5E01\u89D2\u5EA6',
    aiGeneratingContext: 'AI \u6B63\u5728\u4E3A\u6B64\u53D9\u4E8B\u751F\u6210\u591A\u89D2\u5EA6\u53D1\u5E01\u5EFA\u8BAE...',
    aiGenerating: 'AI \u6B63\u5728\u5206\u6790\u70ED\u70B9\u53D9\u4E8B\u5E76\u751F\u6210\u53D1\u5E01\u5EFA\u8BAE...',
    genFailed: (msg) => `\u751F\u6210\u5931\u8D25: ${msg}`,
    contextHeader: (title) => `\u57FA\u4E8E\u53D9\u4E8B\u300C${title}\u300D\u7684\u591A\u89D2\u5EA6\u5EFA\u8BAE`,
    narrativeSource: '\u53D9\u4E8B\u6765\u6E90:',
    marketTrend: '\u5E02\u573A\u70ED\u70B9',
    panelDesc: '\u57FA\u4E8E\u5F53\u524D\u70ED\u70B9\u53D9\u4E8B\uFF0CAI \u81EA\u52A8\u751F\u6210\u4EE3\u5E01\u65B9\u6848\uFF0C\u4E00\u952E\u63D0\u4EA4\u5230\u53D1\u5C04\u5668',
    fillInfo: '\u8BF7\u586B\u5199\u5B8C\u6574\u4FE1\u606F',
    aiSearch: 'AI \u641C\u56FE',
    launchCoin: '\u53D1\u5E01',
    symbolPlaceholder: '\u4F8B\u5982 DOGE, PEPE',
    namePlaceholder: '\u4EE3\u5E01\u540D\u79F0',
    descrPlaceholder: '\u53D9\u4E8B\u63CF\u8FF0',
    // Filter labels
    labelSource: '来源',
    labelChain: '链',
    labelSort: '排序',
    // Misc
    refresh: '\u5237\u65B0',
    nextRefresh: (m, s) => `\u4E0B\u6B21\u5237\u65B0: ${m}:${s}`,
    followers: '\u7C89\u4E1D',
    detailWip: '\u8BE6\u60C5\u529F\u80FD\u5F00\u53D1\u4E2D...',
    // Footer
    footerSlogan: 'AI \u53D9\u4E8B\u72D9\u51FB\u5E73\u53F0',
    price: '\u4EF7\u683C',
    marketCap: '\u5E02\u503C',
  },
  en: {
    siteSubtitle: 'AI Narrative Sniper',
    aiEngineInfo: 'AI Engine Info',
    agentLabel: 'Agent',
    modelLabel: 'Model',
    systemPromptLabel: 'System Prompt',
    hotNarratives: 'Hot Narratives',
    trendingTokens: 'Trending Tokens',
    smartMoney: 'Smart Money',
    oneLaunch: 'One-Click Launch',
    totalNarratives: (n) => `${n} narratives`,
    loadingNarratives: 'Loading narratives...',
    noNarratives: 'No narrative data',
    loadMore: (loaded, total) => `Load More (${loaded}/${total})`,
    loadFailed: (msg) => `Load failed: ${msg}`,
    coinFromNarrative: 'Launch from Narrative',
    sourceAll: 'All Sources',
    source6551: 'Twitter 热点',
    sourceBinance: 'Binance',
    sourceBitget: 'Bitget',
    sourceAve: 'AVE Cloud',
    allChains: 'All Chains',
    chainSolana: 'Solana',
    chainEth: 'Ethereum',
    chainBsc: 'BSC',
    chainBase: 'Base',
    chainArb: 'Arbitrum',
    token: 'Token',
    priceCol: 'Price',
    change24h: '24h Change',
    vol24h: '24h Volume',
    mcap: 'MCap',
    change1h: '1h',
    chart24h: '24h Chart',
    txns24h: 'Txns',
    liquidity: 'Liquidity',
    ops: 'Action',
    noData: 'No data',
    trendHeat: 'Trending',
    gainers: 'Gainers',
    volume: 'Volume',
    newCoins: 'New',
    loadingSmartMoney: 'Loading smart money...',
    noSmartMoney: 'No smart money data',
    smBuying: 'Smart Money Buying',
    walletRank: 'Wallet PnL Ranking',
    smInflow: 'SM Inflow',
    buySell: 'Buy/Sell',
    risk: 'Risk',
    riskSafe: 'Safe',
    riskLow: 'Low',
    riskMid: 'Mid',
    riskHigh: 'High',
    winRate: 'Win Rate',
    txns: 'Txns',
    tradingVol: 'Volume',
    tokenCount: 'Tokens',
    buySellLabel: 'Buy/Sell',
    pnl7d: '7d PnL',
    topEarners: 'Top Earners:',
    trader: 'Trader',
    addressCopied: 'Address copied',
    aiSuggestions: 'AI Suggestions',
    genSuggestions: 'Generate',
    coinInfo: 'Token Info',
    symbolLabel: 'Symbol',
    nameLabel: 'Name',
    narrativeDesc: 'Description',
    logo: 'Logo',
    clickUpload: 'Click or drag to upload',
    launch: 'LAUNCH',
    submitting: 'Submitting...',
    searchingLogo: 'AI searching for logo...',
    logoGenerated: 'Logo ready, submitting...',
    launchSuccess: (sym) => `Launched! $${sym} submitted`,
    launchFail: (msg) => `Launch failed: ${msg}`,
    networkError: (msg) => `Network error: ${msg}`,
    noSuggestions: 'No suggestions available',
    suggestionsHint: 'Click "Generate" to get AI suggestions based on hot narratives',
    aiGeneratingContext: 'AI generating suggestions for this narrative...',
    aiGenerating: 'AI analyzing narratives...',
    genFailed: (msg) => `Generation failed: ${msg}`,
    contextHeader: (title) => `Suggestions for "${title}"`,
    narrativeSource: 'Source:',
    marketTrend: 'Market Trend',
    panelDesc: 'AI generates token proposals from hot narratives, one-click launch',
    fillInfo: 'Please fill in all fields',
    aiSearch: 'AI Search',
    launchCoin: 'Launch',
    symbolPlaceholder: 'e.g. DOGE, PEPE',
    namePlaceholder: 'Token name',
    descrPlaceholder: 'Narrative description',
    labelSource: 'Source',
    labelChain: 'Chain',
    labelSort: 'Sort',
    refresh: 'Refresh',
    nextRefresh: (m, s) => `Next: ${m}:${s}`,
    followers: 'followers',
    detailWip: 'Detail feature coming soon...',
    footerSlogan: 'AI Narrative Sniper',
    price: 'Price',
    marketCap: 'MCap',
  }
};

function _t(key, ...args) {
  const val = i18n[currentLang]?.[key] || i18n.cn[key] || key;
  return typeof val === 'function' ? val(...args) : val;
}

// ========== PILL FILTER GROUPS ==========
function getPillValue(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return 'all';
  const active = group.querySelector('.filter-pill.active');
  return active ? active.dataset.value : 'all';
}

function initPillGroup(groupId, onChange) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      group.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      if (onChange) onChange(pill.dataset.value);
    });
  });
}

function toggleLang() {
  currentLang = currentLang === 'cn' ? 'en' : 'cn';
  localStorage.setItem('nh_lang', currentLang);
  document.getElementById('langLabel').textContent = currentLang.toUpperCase();
  applyLang();
  // Re-render active tab data with new language
  reloadActiveTab();
}

function reloadActiveTab() {
  const activeTab = document.querySelector('.tab.active');
  if (!activeTab) return;
  const tabName = activeTab.dataset.tab;
  if (tabName === 'narratives') { narrativePage = 1; loadNarratives(); }
  else if (tabName === 'tokens') loadTokens();
  else if (tabName === 'narrative-tokens') loadNarrativeTokensTab();
  else if (tabName === 'smartmoney') loadSmartMoney();
}

function applyLang() {
  // Subtitle
  const sub = document.getElementById('siteSubtitle');
  if (sub) sub.textContent = _t('siteSubtitle');

  // AI Info bar
  const aiBadge = document.querySelector('.ai-info-badge');
  if (aiBadge) aiBadge.textContent = _t('aiEngineInfo');
  document.querySelectorAll('.ai-info-label').forEach(el => {
    const key = el.dataset.i18n;
    if (key) el.textContent = _t(key);
  });

  // Tab buttons
  const tabMap = { narratives: 'hotNarratives', tokens: 'trendingTokens', smartmoney: 'smartMoney', generator: 'oneLaunch' };
  document.querySelectorAll('.tab').forEach(tab => {
    const key = tabMap[tab.dataset.tab];
    if (key) tab.textContent = _t(key);
  });

  // Panel headers
  const h2Map = {
    'panel-narratives': 'hotNarratives',
    'panel-tokens': 'trendingTokens',
    'panel-smartmoney': 'smartMoney',
  };
  for (const [id, key] of Object.entries(h2Map)) {
    const el = document.querySelector(`#${id} .panel-header h2`);
    if (el) {
      const countSpan = el.querySelector('#narrativeCount');
      el.innerHTML = _t(key) + (countSpan ? ` <span id="narrativeCount" style="font-size:13px;color:var(--text-muted);font-weight:400">${countSpan.textContent}</span>` : '');
    }
  }

  // Generator panel header
  const genH2 = document.querySelector('#panel-generator .panel-header h2');
  if (genH2) genH2.textContent = _t('oneLaunch');
  const genDesc = document.querySelector('#panel-generator .panel-desc');
  if (genDesc) genDesc.textContent = _t('panelDesc');

  // Generator form
  const genSectionH3 = document.querySelector('.gen-section-header h3');
  if (genSectionH3) genSectionH3.textContent = _t('aiSuggestions');
  const genBtn = document.querySelector('.gen-section-header .btn-primary');
  if (genBtn) genBtn.textContent = _t('genSuggestions');
  const formH3 = document.querySelector('.gen-form h3');
  if (formH3) formH3.textContent = _t('coinInfo');

  // Form labels
  document.querySelectorAll('.form-group label').forEach(label => {
    const key = label.dataset.i18n;
    if (key) label.textContent = _t(key);
  });

  // Form placeholders
  const symbolInput = document.getElementById('coinSymbol');
  if (symbolInput) symbolInput.placeholder = _t('symbolPlaceholder');
  const nameInput = document.getElementById('coinName');
  if (nameInput) nameInput.placeholder = _t('namePlaceholder');
  const descrInput = document.getElementById('coinDescr');
  if (descrInput) descrInput.placeholder = _t('descrPlaceholder');

  // Logo upload text
  const logoPreview = document.getElementById('logoPreview');
  if (logoPreview && !logoPreview.querySelector('img')) {
    logoPreview.innerHTML = `<span>${_t('clickUpload')}</span>`;
  }

  // Launch button
  const launchBtn = document.querySelector('.btn-launch');
  if (launchBtn) launchBtn.textContent = _t('launch');

  // Suggestions empty state
  const sugEmpty = document.querySelector('#suggestionsList .empty-state p');
  if (sugEmpty) sugEmpty.textContent = _t('suggestionsHint');

  // Update all pill filter labels via data-i18n
  document.querySelectorAll('.filter-pill[data-i18n]').forEach(pill => {
    const key = pill.dataset.i18n;
    if (key) pill.textContent = _t(key);
  });

  // Update filter labels
  document.querySelectorAll('.filter-label[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (key) el.textContent = _t(key);
  });

  // Update any remaining select options
  document.querySelectorAll('.filter-select option[data-i18n]').forEach(opt => {
    const key = opt.dataset.i18n;
    if (key) opt.textContent = _t(key);
  });

  // Token table headers
  const thKeys = ['', 'token', 'priceCol', 'change1h', 'change24h', 'chart24h', 'vol24h', 'mcap', 'txns24h', 'ops'];
  document.querySelectorAll('.tokens-table > thead th').forEach((th, i) => {
    if (i > 0 && thKeys[i]) th.textContent = _t(thKeys[i]);
  });

  // Sort filter pills are already handled by data-i18n above

  // Footer
  const footerSlogan = document.querySelector('.footer-slogan');
  if (footerSlogan) footerSlogan.textContent = _t('footerSlogan');
}

// Initialize language + theme
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('langLabel').textContent = currentLang.toUpperCase();
  applyLang();
  initThemePicker();
});

// ========== THEME SWITCHER ==========
let currentTheme = localStorage.getItem('nh_theme') || 'cyan';

function toggleThemePicker() {
  const picker = document.getElementById('themePicker');
  if (!picker) return;
  const visible = picker.style.display !== 'none';
  picker.style.display = visible ? 'none' : 'flex';
  if (!visible) {
    const close = (e) => {
      if (!document.getElementById('themePickerWrap').contains(e.target)) {
        picker.style.display = 'none';
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 0);
  }
}

function initThemePicker() {
  document.documentElement.setAttribute('data-theme', currentTheme);
  const picker = document.getElementById('themePicker');
  if (!picker) return;
  picker.querySelectorAll('.theme-dot').forEach(dot => {
    if (dot.dataset.theme === currentTheme) dot.classList.add('active');
    else dot.classList.remove('active');
    dot.addEventListener('click', () => {
      currentTheme = dot.dataset.theme;
      localStorage.setItem('nh_theme', currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
      picker.querySelectorAll('.theme-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      picker.style.display = 'none';
    });
  });
}

// ========== AI INFO TOGGLE ==========
function toggleAiInfo() {
  const panel = document.getElementById('aiInfoPanel');
  const arrow = document.getElementById('aiInfoArrow');
  if (panel.style.display === 'none') {
    panel.style.display = 'block';
    arrow.classList.add('open');
  } else {
    panel.style.display = 'none';
    arrow.classList.remove('open');
  }
}

// ========== CONFIG ==========
const API_BASE = window.location.origin + '/api';

// Proxy Binance CDN images to avoid 403
function proxyImg(url) {
  if (!url) return '';
  if (url.includes('bin.bnbstatic.com') || url.includes('bnbstatic.com')) {
    const full = url.startsWith('/') ? 'https://bin.bnbstatic.com' + url : url;
    return API_BASE + '/proxy-image?url=' + encodeURIComponent(full);
  }
  return url;
}

// ========== TAB SWITCHING ==========
const tabLoaded = {};
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const tabName = tab.dataset.tab;
    document.getElementById('panel-' + tabName).classList.add('active');
    if (!tabLoaded[tabName]) {
      tabLoaded[tabName] = true;
      if (tabName === 'tokens') loadTokens();
      else if (tabName === 'narrative-tokens') loadNarrativeTokensTab();
      else if (tabName === 'smartmoney') loadSmartMoney();
      else if (tabName === 'generator') generateSuggestions();
    }
  });
});

// ========== TIME UPDATE ==========
function updateTime() {
  const now = new Date();
  document.getElementById('updateTime').textContent =
    now.toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' });
}
setInterval(updateTime, 1000);
updateTime();

// ========== NARRATIVES ==========
let narrativePage = 1;
let narrativeTotal = 0;
let narrativeLoading = false;

const NARRATIVE_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
];
let gradientIdx = 0;

// Store narratives data for modal access
const _narrativeStore = [];

function renderNarrativeCard(n) {
  const idx = _narrativeStore.length;
  _narrativeStore.push(n);
  const safeJson = encodeURIComponent(JSON.stringify(n));
  const gradient = NARRATIVE_GRADIENTS[gradientIdx++ % NARRATIVE_GRADIENTS.length];
  const imgUrl = proxyImg(n.image);
  const imgSection = imgUrl
    ? `<div class="narrative-img"><img src="${imgUrl}" alt="" onerror="this.parentElement.style.background='${gradient}';this.parentElement.innerHTML='<div class=\\'narrative-img-text\\'>${(n.title || '').slice(0, 20)}</div>'" /></div>`
    : `<div class="narrative-img" style="background:${gradient}"><div class="narrative-img-text">${(n.title || '').slice(0, 30)}</div></div>`;
  return `
    <div class="narrative-card" onclick="openNarrativeModal(${idx})">
      ${imgSection}
      <div class="narrative-body">
        <div class="narrative-title">
          ${n.title}
          <span class="narrative-heat ${n.heat > 80 ? 'heat-high' : n.heat > 50 ? 'heat-mid' : 'heat-low'}">
            ${n.heat > 80 ? '\uD83D\uDD25' : n.heat > 50 ? '\u2B50' : '\u26A1'} ${n.heat}
          </span>
        </div>
        <div class="narrative-source-tag">
          ${n.source || ''}
          ${(n.categories || []).map(c => `<span class="narrative-cat-tag cat-${c}">${getCategoryLabel(c)}</span>`).join('')}
          ${(n.publishedAt || n.fetchedAt) ? `<span class="narrative-time" title="${new Date(n.publishedAt || n.fetchedAt).toLocaleString('zh-CN')}">${formatAbsTime(n.publishedAt || n.fetchedAt)}</span>` : ''}
        </div>
        <div class="narrative-desc">${n.description || ''}</div>
        ${n.kols && n.kols.length > 0 ? `
          <div class="narrative-kols">
            ${n.kols.map(k => {
              const username = typeof k === 'string' ? k : k.username;
              const displayName = typeof k === 'string' ? k : (k.name || k.username);
              const followers = typeof k === 'object' && k.followers ? ` (${formatCompact(k.followers)} ${_t('followers')})` : '';
              const tweetUrl = typeof k === 'object' && k.tweetUrl ? k.tweetUrl : `https://x.com/${username}`;
              const avatar = typeof k === 'object' && k.avatar ? k.avatar : '';
              const avatarUrl = avatar ? proxyImg(avatar) : `https://unavatar.io/x/${username}`;
              return `<a class="kol-tag" href="${tweetUrl}" target="_blank" rel="noopener" title="${displayName}${followers}" onclick="event.stopPropagation()"><img src="${avatarUrl}" class="kol-mini-avatar" onerror="this.style.display='none'" />@${username}</a>`;
            }).join('')}
          </div>
        ` : ''}
        ${n.tokens && n.tokens.length > 0 ? `
          <div class="narrative-tokens">
            ${n.tokens.map(t => {
              const gmgnUrl = t.address ? `https://gmgn.ai/sol/token/${t.address}` : `https://gmgn.ai/sol/token/${t.symbol}`;
              return `
              <span class="token-badge">
                ${t.symbol}
                <span class="change ${t.change >= 0 ? 'up' : 'down'}">
                  ${t.change >= 0 ? '+' : ''}${(t.change || 0).toFixed(1)}%
                </span>
                <a href="${gmgnUrl}" target="_blank" rel="noopener" class="gmgn-link" title="View on GMGN.ai" onclick="event.stopPropagation()">
                  <img src="gmgn.png" class="gmgn-icon" alt="GMGN" onerror="this.style.display='none'" />
                </a>
              </span>`;
            }).join('')}
          </div>
        ` : ''}
        <div class="narrative-actions">
          <button class="btn-narrative-launch" onclick="event.stopPropagation();useNarrativeForCoin('${safeJson}')">
            ${icon('jb-rocket','icon-sm')} ${_t('coinFromNarrative')}
          </button>
        </div>
      </div>
    </div>
  `;
}

function openNarrativeModal(idx) {
  const n = _narrativeStore[idx];
  if (!n) return;

  // Hero image
  const hero = document.getElementById('nmHero');
  const imgUrl = proxyImg(n.image);
  if (imgUrl) {
    hero.innerHTML = `<img src="${imgUrl}" alt="" onerror="this.parentElement.innerHTML='<div class=\\'nm-hero-placeholder\\'>${icon('jb-fire','icon-xl')}</div>'" />`;
  } else {
    hero.innerHTML = `<div class="nm-hero-placeholder">${icon('jb-fire','icon-xl')}</div>`;
  }

  // Title & heat
  document.getElementById('nmTitle').textContent = n.title || '';
  const heatCls = n.heat > 80 ? 'heat-high' : n.heat > 50 ? 'heat-mid' : 'heat-low';
  const heatIcon = n.heat > 80 ? '\uD83D\uDD25' : n.heat > 50 ? '\u2B50' : '\u26A1';
  const heatEl = document.getElementById('nmHeat');
  heatEl.textContent = `${heatIcon} 热度 ${n.heat}`;
  heatEl.className = `nm-heat-badge ${heatCls}`;

  // Source & token count
  document.getElementById('nmSource').textContent = n.source || '';
  const tc = n.tokenCount || n.tokens?.length || 0;
  document.getElementById('nmTokenCount').textContent = tc > 0 ? `${tc} 个相关代币` : '';

  // AI Score
  const score = n.aiScore || 0;
  const label = n.aiLabel || '';
  document.getElementById('nmAiPct').textContent = `${score}%`;
  const verdictEl = document.getElementById('nmAiLabel');
  verdictEl.textContent = label;
  verdictEl.className = `nm-ai-verdict ${score >= 75 ? 'verdict-high' : score >= 50 ? 'verdict-mid' : 'verdict-low'}`;
  // Animate bar after a small delay
  const bar = document.getElementById('nmAiBar');
  bar.style.width = '0%';
  setTimeout(() => { bar.style.width = `${score}%`; }, 80);

  // AI factors breakdown
  const kolScore = Math.round(Math.min((n.kols?.length || 0) / 5 * 100, 100));
  const srcScore = n.source?.includes('Twitter 热点') || n.source?.includes('6551') ? 90 : n.source?.includes('Binance Social Rush') ? 70 :
    n.source?.includes('AVE') ? 60 : n.source?.includes('Bitget') ? 50 : 40;
  const satScore = Math.max(0, 100 - ((n.tokenCount || n.tokens?.length || 1) - 1) * 12);
  document.getElementById('nmAiFactors').innerHTML = `
    <span class="nm-ai-factor">推特热度 ${Math.round(kolScore * 0.6 + (n.heat || 50) * 0.4)}%</span>
    <span class="nm-ai-factor">新闻热度 ${Math.round(Math.min((n.heat || 50) * 0.7 + (srcScore - 40) / 2, 100))}%</span>
    <span class="nm-ai-factor">市场空间 ${satScore}%</span>
  `;

  // Description
  document.getElementById('nmDesc').textContent = n.description || '暂无详细描述';

  // KOL Tweets
  const tweets = n.tweets || [];
  const kols = n.kols || [];
  const tweetsSection = document.getElementById('nmTweetsSection');
  const tweetsList = document.getElementById('nmTweetsList');
  // Use tweets if available, else show KOLs without content
  const tweetItems = tweets.length > 0 ? tweets : kols.map(k => ({
    username: typeof k === 'string' ? k : k.username,
    name: typeof k === 'string' ? k : (k.name || k.username),
    avatar: typeof k === 'object' ? (k.avatar || '') : '',
    followers: typeof k === 'object' ? (k.followers || 0) : 0,
    tweetText: typeof k === 'object' ? (k.tweetText || '') : '',
    likes: typeof k === 'object' ? (k.likes || 0) : 0,
    retweets: typeof k === 'object' ? (k.retweets || 0) : 0,
    tweetUrl: typeof k === 'object' ? (k.tweetUrl || `https://x.com/${k.username}`) : `https://x.com/${k}`,
  }));

  if (tweetItems.length === 0) {
    tweetsSection.style.display = 'none';
  } else {
    tweetsSection.style.display = '';
    tweetsList.innerHTML = tweetItems.map(t => {
      const avatarUrl = t.avatar ? proxyImg(t.avatar) : '';
      const avatarHtml = avatarUrl
        ? `<img class="nm-tweet-avatar" src="${avatarUrl}" alt="" onerror="this.style.display='none'" />`
        : `<div class="nm-tweet-avatar-placeholder">${(t.username || 'K')[0].toUpperCase()}</div>`;
      const followersStr = t.followers > 0 ? formatCompact(t.followers) + ' 粉丝' : '';
      return `
        <div class="nm-tweet-card">
          <div class="nm-tweet-author">
            ${avatarHtml}
            <div class="nm-tweet-user">
              <div class="nm-tweet-name">${t.name || t.username}</div>
              <div class="nm-tweet-handle">@${t.username}</div>
            </div>
            ${followersStr ? `<div class="nm-tweet-followers">${followersStr}</div>` : ''}
          </div>
          ${t.tweetText ? `<div class="nm-tweet-text">${t.tweetText.slice(0, 280)}</div>` : ''}
          <div class="nm-tweet-footer">
            ${t.likes > 0 ? `<span class="nm-tweet-stat">${icon('jb-star','icon-sm')} ${formatCompact(t.likes)}</span>` : ''}
            ${t.retweets > 0 ? `<span class="nm-tweet-stat">${icon('jb-refresh','icon-sm')} ${formatCompact(t.retweets)}</span>` : ''}
            <a class="nm-tweet-link" href="${t.tweetUrl}" target="_blank" rel="noopener">
              ${icon('jb-tweet','icon-sm')} 查看推文
            </a>
          </div>
        </div>`;
    }).join('');
  }

  // Related tokens
  const tokensSection = document.getElementById('nmTokensSection');
  const tokensList = document.getElementById('nmTokensList');
  if (!n.tokens || n.tokens.length === 0) {
    tokensSection.style.display = 'none';
  } else {
    tokensSection.style.display = '';
    tokensList.innerHTML = n.tokens.map(t => {
      const logoUrl = proxyImg(t.logo || '');
      const logoHtml = logoUrl
        ? `<img class="nm-token-logo" src="${logoUrl}" alt="" onerror="this.style.display='none'" />`
        : `<div class="nm-token-logo-placeholder">${(t.symbol || '?')[0]}</div>`;
      const gmgnUrl = t.address ? `https://gmgn.ai/sol/token/${t.address}` : `https://gmgn.ai/sol/token/${t.symbol}`;
      const chg = t.change || 0;
      return `
        <a class="nm-token-item" href="${gmgnUrl}" target="_blank" rel="noopener">
          ${logoHtml}
          <div class="nm-token-info">
            <div class="nm-token-symbol">$${t.symbol}</div>
            <div class="nm-token-change ${chg >= 0 ? 'up' : 'down'}">${chg >= 0 ? '+' : ''}${chg.toFixed(1)}%</div>
          </div>
        </a>`;
    }).join('');
  }

  // Launch button
  const safeJson = encodeURIComponent(JSON.stringify(n));
  document.getElementById('nmLaunchBtn').onclick = () => {
    closeNarrativeModal();
    useNarrativeForCoin(safeJson);
  };

  // Open modal
  document.getElementById('narrativeModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeNarrativeModal(event) {
  if (event && event.target !== document.getElementById('narrativeModal')) return;
  document.getElementById('narrativeModal').classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on ESC key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeNarrativeModal();
});

async function loadNarratives(append) {
  const grid = document.getElementById('narrativesGrid');
  if (narrativeLoading) return;
  narrativeLoading = true;

  if (!append) {
    narrativePage = 1;
    _narrativeStore.length = 0;
    gradientIdx = 0;
    grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${_t('loadingNarratives')}</p></div>`;
  }

  try {
    const chain = getPillValue('chainFilterGroup');
    const source = getPillValue('sourceFilterGroup');
    const category = getPillValue('narrativeCategoryGroup') || 'all';
    const timeWindow = getPillValue('timeWindowFilterGroup') || '1h';
    const sortBy = getPillValue('narrativeSortGroup') || 'heat';
    const res = await fetch(`${API_BASE}/narratives?chain=${chain}&source=${source}&category=${category}&timeWindow=${timeWindow}&sortBy=${sortBy}&page=${narrativePage}&pageSize=50&lang=${currentLang}`);
    const data = await res.json();
    narrativeTotal = data.total || 0;

    // Show update bar
    const updateBar = document.getElementById('narrativeUpdateBar');
    if (updateBar && data.updatedAt) {
      const updatedMs = Date.now() - new Date(data.updatedAt).getTime();
      const updatedMin = Math.floor(updatedMs / 60000);
      const timeStr = new Date(data.updatedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateBar.style.display = 'block';
      updateBar.textContent = updatedMin < 1
        ? `数据刚刚更新 · ${timeStr}`
        : `数据更新于 ${updatedMin} 分钟前 · ${timeStr}`;
    }

    if (!data.narratives || data.narratives.length === 0) {
      const srcVal2 = getPillValue('sourceFilterGroup'); const is6551empty = srcVal2 === '6551'; if (!append) grid.innerHTML = is6551empty ? '<div class="empty-state"><p style=\"color:var(--accent)\">Twitter 热点暂时不可用</p><p style=\"font-size:12px;opacity:.6;margin-top:6px\">6551 API 额度已用尽，请充值后重试，或切换到 Binance 数据源</p></div>' : `<div class="empty-state"><p>${_t('noNarratives')}</p></div>`;
      narrativeLoading = false;
      return;
    }

    const html = data.narratives.map(renderNarrativeCard).join('');

    if (append) {
      const oldBtn = grid.querySelector('.load-more-wrap');
      if (oldBtn) oldBtn.remove();
      grid.insertAdjacentHTML('beforeend', html);
    } else {
      grid.innerHTML = html;
    }

    const counter = document.getElementById('narrativeCount');
    if (counter) counter.textContent = _t('totalNarratives', narrativeTotal);

    const loaded = narrativePage * 50;
    if (loaded < narrativeTotal) {
      // Show a subtle "scroll for more" hint instead of a button (infinite scroll handles it)
      grid.insertAdjacentHTML('beforeend', `
        <div class="load-more-wrap" style="grid-column:1/-1;text-align:center;padding:12px;color:var(--text-muted);font-size:12px">
          ${_t('loadMore', Math.min(loaded, narrativeTotal), narrativeTotal)} · 向下滚动加载更多
        </div>
      `);
    }
  } catch (err) {
    if (!append) grid.innerHTML = `<div class="empty-state"><p>${_t('loadFailed', err.message)}</p></div>`;
  }
  narrativeLoading = false;
}

// ========== TOKENS ==========
function renderTokenSparkline(data, change) {
  if (!data || data.length < 3) return '<span class="spark-empty">--</span>';
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`).join(' ');
  const color = change >= 0 ? 'var(--green)' : 'var(--red)';
  const fillColor = change >= 0 ? 'rgba(0,212,170,0.08)' : 'rgba(246,70,93,0.08)';
  const lastY = h - ((data[data.length - 1] - min) / range) * (h - 2) - 1;
  return `<svg class="token-spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs><linearGradient id="sg${Math.random().toString(36).slice(2,6)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity="0.15"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    <polygon points="0,${h} ${points} ${w},${h}" fill="${fillColor}" />
    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="${w}" cy="${lastY}" r="2" fill="${color}" />
  </svg>`;
}

function formatTokenAge(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + 'm';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd';
  return Math.floor(days / 30) + 'mo';
}

async function loadTokens() {
  const tbody = document.getElementById('tokensBody');
  tbody.innerHTML = `<tr><td colspan="10" class="loading-state"><div class="spinner"></div></td></tr>`;

  try {
    const chain = getPillValue('tokenChainFilterGroup');
    const sort = getPillValue('tokenSortFilterGroup');

    const tokenCategory = getPillValue('tokenCategoryGroup') || 'all';
    const res = await fetch(`${API_BASE}/tokens?chain=${chain}&sort=${sort}&category=${tokenCategory}`);
    const data = await res.json();

    if (!data.tokens || data.tokens.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty-state">${_t('noData')}</td></tr>`;
      return;
    }

    tbody.innerHTML = data.tokens.map((t, i) => {
      const ch24 = t.change24h || 0;
      const ch1h = t.change1h || 0;
      const age = formatTokenAge(t.launchTime);
      const tags = (t.tags || []).slice(0, 2).map(tag => `<span class="tk-tag">${tag}</span>`).join('');
      const sparkHtml = renderTokenSparkline(t.sparkline, ch24);
      const chainKey = t.chain || 'sol';
      const gmgnChain = { sol: 'sol', bsc: 'bsc', eth: 'eth', base: 'base', arb: 'arb' }[chainKey] || 'sol';
      const gmgnUrl = t.address ? `https://gmgn.ai/${gmgnChain}/token/${t.address}` : `https://gmgn.ai/${gmgnChain}/token/${t.symbol}`;
      const chainBadgeColor = { sol: '#9945ff', bsc: '#f0b90b', eth: '#627eea', base: '#0052ff', arb: '#12aaff' }[chainKey] || '#9945ff';
      const chainBadge = `<span class="tk-chain-badge" style="background:${chainBadgeColor}">${chainKey.toUpperCase()}</span>`;
      const rankBadge = t.rankType === 'gainers' ? '<span class="tk-rank-badge tk-rank-up">涨幅</span>' : t.rankType === 'new' ? '<span class="tk-rank-badge tk-rank-new">新币</span>' : '';
      const tokenCatBadge = t.category && t.category !== 'other' ? `<span class="tk-cat-badge cat-${t.category}">${getCategoryLabel(t.category)}</span>` : '';
      const safeName = (t.name || '').replace(/'/g, "\\'");
      const safeLogo = (t.logo || '').replace(/'/g, "\\'");

      return `<tr>
        <td class="tk-rank">${i + 1}</td>
        <td>
          <div class="tk-token-cell">
            <div class="tk-logo-wrap">
              ${t.logo ? `<img class="tk-logo" src="${proxyImg(t.logo)}" alt="${t.symbol}" onerror="this.replaceWith(tokenPlaceholder('${t.symbol}'))" />` : tokenPlaceholderHTML(t.symbol)}
            </div>
            <div class="tk-info">
              <div class="tk-sym">${t.symbol}${t.smTag ? '<span class="tk-sm-badge">SM</span>' : ''}${chainBadge}${rankBadge}${tokenCatBadge}</div>
              <div class="tk-meta">${t.name || ''}${age ? ' <span class="tk-age">' + age + '</span>' : ''}${tags ? ' ' + tags : ''}</div>
            </div>
          </div>
        </td>
        <td class="mono tk-price">$${formatNumber(t.price)}</td>
        <td class="mono ${ch1h >= 0 ? 'change up' : 'change down'}">${ch1h >= 0 ? '+' : ''}${ch1h.toFixed(1)}%</td>
        <td class="mono ${ch24 >= 0 ? 'change up' : 'change down'}">${ch24 >= 0 ? '+' : ''}${ch24.toFixed(1)}%</td>
        <td class="tk-spark-cell">${sparkHtml}</td>
        <td class="mono">$${formatCompact(t.volume24h)}</td>
        <td class="mono">$${formatCompact(t.marketCap)}</td>
        <td class="mono tk-txn">${t.txCount24h ? formatCompact(t.txCount24h) : '--'} <span class="tk-bs"><span class="change up">${formatCompact(t.buyCount24h || 0)}</span>/<span class="change down">${formatCompact(t.sellCount24h || 0)}</span></span></td>
        <td class="tk-ops">
          <a href="${gmgnUrl}" target="_blank" rel="noopener" class="gmgn-link-table" title="GMGN">
            <img src="gmgn.png" class="gmgn-icon" alt="GMGN" onerror="this.style.display='none'" />
          </a>
          <button class="btn btn-sm btn-orange" onclick="fillCoinFromToken('${t.symbol}', '${safeName}', '${safeLogo}')">
            ${_t('launchCoin')}
          </button>
        </td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-state">${_t('loadFailed', err.message)}</td></tr>`;
  }
}

// ========== NARRATIVE TOKENS (独立 Tab) ==========
let narrativeTokenPage = 1;

function getNtSort() {
  return getPillValue('ntSortGroup') || 'heat';
}

// Wire up ntSortGroup pills
document.querySelectorAll('#ntSortGroup .filter-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#ntSortGroup .filter-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    narrativeTokenPage = 1;
    loadNarrativeTokensTab();
  });
});

async function loadNarrativeTokensTab() {
  const tbody = document.getElementById('ntTokensBody');
  const pageNav = document.getElementById('ntPageNav');
  tbody.innerHTML = `<tr><td colspan="10" class="loading-state"><div class="spinner"></div></td></tr>`;
  if (pageNav) pageNav.innerHTML = '';

  try {
    const sort = getNtSort();
    const res = await fetch(`${API_BASE}/narrative-tokens?sort=${sort}&page=${narrativeTokenPage}&pageSize=50`);
    const data = await res.json();

    if (!data.tokens || data.tokens.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" class="empty-state">暂无叙事代币数据</td></tr>`;
      return;
    }

    // Page nav
    if (pageNav) {
      const totalPages = Math.ceil(data.total / 50);
      pageNav.innerHTML = `
        <span class="nt-page-info">第 ${data.page}/${totalPages} 页 · 共 ${data.total} 个代币</span>
        ${data.page > 1 ? `<button class="btn btn-sm" onclick="narrativeTokenPage--;loadNarrativeTokensTab()">上一页</button>` : ''}
        ${data.page * 50 < data.total ? `<button class="btn btn-sm" onclick="narrativeTokenPage++;loadNarrativeTokensTab()">下一页</button>` : ''}
      `;
    }

    const rows = data.tokens.map((t, i) => {
      const rank = (data.page - 1) * 50 + i + 1;
      const ch24 = t.change24h || 0;
      const chainKey = t.chain || 'sol';
      const chainBadgeColor = { sol: '#9945ff', bsc: '#f0b90b', eth: '#627eea' }[chainKey] || '#9945ff';
      const chainBadge = `<span class="tk-chain-badge" style="background:${chainBadgeColor}">${chainKey.toUpperCase()}</span>`;
      const gmgnChain = { sol: 'sol', bsc: 'bsc', eth: 'eth' }[chainKey] || 'sol';
      const gmgnUrl = t.address ? `https://gmgn.ai/${gmgnChain}/token/${t.address}` : '#';
      const safeName = (t.name || '').replace(/'/g, "\\'");
      const safeLogo = (t.logo || '').replace(/'/g, "\\'");

      // Heat bar
      const heatPct = Math.min(100, t.compositeHeat || 0);
      const heatColor = heatPct > 70 ? '#ef4444' : heatPct > 40 ? '#f59e0b' : '#22c55e';
      const heatBar = `<div class="nt-heat-wrap">
        <span class="nt-heat-num" style="color:${heatColor}">${heatPct}</span>
        <div class="nt-heat-bar"><div class="nt-heat-fill" style="width:${heatPct}%;background:${heatColor}"></div></div>
      </div>`;

      // Narrative tags — clickable to jump to related narrative
      const narrativeTags = (t.narratives || []).slice(0, 3).map(n => {
        const safeTitle = (n.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const srcColor = (n.source || '').includes('Rush') ? '#f59e0b' : (n.source || '').includes('6551') ? '#3b82f6' : '#8b5cf6';
        return `<span class="nt-narrative-tag" onclick="jumpToNarrative('${safeTitle}')" title="点击查看叙事: ${safeTitle}" style="border-color:${srcColor}40;color:${srcColor}">${(n.title || '').slice(0, 15)}${(n.title || '').length > 15 ? '...' : ''}</span>`;
      }).join('');

      // "查看叙事" button for the first narrative
      const firstNarrative = (t.narratives || [])[0];
      const viewNarrativeBtn = firstNarrative
        ? `<button class="btn btn-sm btn-narrative-jump" onclick="jumpToNarrative('${(firstNarrative.title || '').replace(/'/g, "\\'")}')" title="跳转到关联叙事">
            <svg class="icon icon-xs" aria-hidden="true"><use href="#jb-external"></use></svg> 叙事
          </button>`
        : '';

      return `<tr>
        <td class="tk-rank">${rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : rank}</td>
        <td>
          <div class="tk-token-cell">
            <div class="tk-logo-wrap">
              ${t.logo ? `<img class="tk-logo" src="${proxyImg(t.logo)}" alt="${t.symbol}" onerror="this.replaceWith(tokenPlaceholder('${t.symbol}'))" />` : tokenPlaceholderHTML(t.symbol)}
            </div>
            <div class="tk-info">
              <div class="tk-sym">${t.symbol}${chainBadge}</div>
              <div class="tk-meta">${t.name || ''}</div>
            </div>
          </div>
        </td>
        <td>${heatBar}</td>
        <td class="mono ${ch24 >= 0 ? 'change up' : 'change down'}">${ch24 >= 0 ? '+' : ''}${ch24.toFixed(1)}%</td>
        <td class="nt-narratives-cell">${narrativeTags || '--'}</td>
        <td class="mono tk-price">${t.price ? '$' + formatNumber(t.price) : '--'}</td>
        <td class="mono">${t.marketCap ? '$' + formatCompact(t.marketCap) : '--'}</td>
        <td class="mono">${t.volume24h ? '$' + formatCompact(t.volume24h) : '--'}</td>
        <td class="mono nt-count"><span class="nt-count-badge">${t.narrativeCount || 1}</span></td>
        <td class="tk-ops">
          ${viewNarrativeBtn}
          <a href="${gmgnUrl}" target="_blank" rel="noopener" class="gmgn-link-table" title="GMGN">
            <img src="gmgn.png" class="gmgn-icon" alt="GMGN" onerror="this.style.display='none'" />
          </a>
          <button class="btn btn-sm btn-orange" onclick="fillCoinFromToken('${t.symbol}', '${safeName}', '${safeLogo}')">
            ${_t('launchCoin')}
          </button>
        </td>
      </tr>`;
    }).join('');

    tbody.innerHTML = rows;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty-state">${_t('loadFailed', err.message)}</td></tr>`;
  }
}

// Jump to narrative tab and highlight matching narrative
function jumpToNarrative(title) {
  // Switch to narratives tab
  const narrativesTab = document.querySelector('.tab[data-tab="narratives"]');
  if (narrativesTab) narrativesTab.click();
  // After a small delay, try to find and scroll to the matching narrative card
  setTimeout(() => {
    const cards = document.querySelectorAll('.narrative-card');
    for (const card of cards) {
      const cardTitle = card.querySelector('.narrative-title');
      if (cardTitle && cardTitle.textContent.includes(title.slice(0, 10))) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.boxShadow = '0 0 0 2px var(--accent), 0 0 20px var(--accent-dim)';
        setTimeout(() => { card.style.boxShadow = ''; }, 3000);
        break;
      }
    }
  }, 500);
}

// ========== SMART MONEY ==========
async function loadSmartMoney() {
  const grid = document.getElementById('smartMoneyGrid');
  grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${_t('loadingSmartMoney')}</p></div>`;

  try {
    const chain = getPillValue('smChainFilterGroup');
    const res = await fetch(`${API_BASE}/smart-money?chain=${chain}`);
    const data = await res.json();

    const hasWallets = data.wallets && data.wallets.length > 0;
    const hasTokens = data.smartMoneyTokens && data.smartMoneyTokens.length > 0;

    if (!hasWallets && !hasTokens) {
      grid.innerHTML = `<div class="empty-state"><p>${_t('noSmartMoney')}</p></div>`;
      return;
    }

    let html = '';

    // Smart money tokens table
    if (hasTokens) {
      html += `<div class="sm-section-full">
        <h3 class="sm-section-title">聪明钱动向（买入为绿 / 卖出为红）</h3>
        <div class="sm-tokens-table-wrap">
          <table class="sm-tokens-table">
            <thead><tr>
              <th>#</th>
              <th>${_t('token')}</th>
              <th>${_t('priceCol')}</th>
              <th>${_t('change24h')}</th>
              <th>${_t('mcap')}</th>
              <th>${_t('vol24h')}</th>
              <th>${_t('smInflow')}</th>
              <th>${_t('buySell')}</th>
              <th>${_t('risk')}</th>
              <th></th>
            </tr></thead>
            <tbody>
              ${data.smartMoneyTokens.map((t, i) => {
                const riskClass = t.riskLevel === 0 ? 'risk-safe' : t.riskLevel === 1 ? 'risk-low' : t.riskLevel === 2 ? 'risk-mid' : 'risk-high';
                const riskKey = t.riskLevel === 0 ? 'riskSafe' : t.riskLevel === 1 ? 'riskLow' : t.riskLevel === 2 ? 'riskMid' : 'riskHigh';
                const age = t.launchTime ? formatAge(t.launchTime) : '';
                const tags = (t.tags || []).slice(0, 2).map(tag => `<span class="sm-tag">${tag}</span>`).join('');
                const ch = parseFloat(t.change24h) || 0;
                return `<tr>
                  <td>${i + 1}</td>
                  <td>
                    <div class="sm-token-cell">
                      <div class="sm-token-logo-wrap">
                        ${t.logo ? `<img class="sm-token-logo" src="${proxyImg(t.logo)}" alt="${t.symbol}" onerror="this.replaceWith(tokenPlaceholder('${t.symbol}'))" />` : tokenPlaceholderHTML(t.symbol)}
                      </div>
                      <div class="sm-token-info">
                        <div class="sm-token-name">${t.symbol}</div>
                        <div class="sm-token-meta">${age}${tags ? ' ' + tags : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td class="mono">$${formatNumber(t.price)}</td>
                  <td class="mono ${ch >= 0 ? 'change up' : 'change down'}">${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%</td>
                  <td class="mono">$${formatCompact(t.marketCap)}</td>
                  <td class="mono">$${formatCompact(t.volume)}</td>
                  <td class="mono ${(t.inflow||0) >= 0 ? 'change up' : 'change down'}">${icon((t.inflow||0) >= 0 ? 'jb-trending-up' : 'jb-trending-down','icon-sm')} $${formatCompact(Math.abs(t.inflow||0))}</td>
                  <td class="mono">${t.buyCount ? `<span class="change up">${formatCompact(t.buyCount)}</span>/<span class="change down">${formatCompact(t.sellCount)}</span>` : '<span style="opacity:.4">--</span>'}</td>
                  <td><span class="${riskClass}">${_t(riskKey)}</span></td>
                  <td>
                    <div class="sm-ops">
                      ${t.address ? `<a href="https://gmgn.ai/${{'sol':'sol','bsc':'bsc','eth':'eth','base':'base'}[t.chain]||'sol'}/token/${t.address}" target="_blank" rel="noopener" class="gmgn-link-table" title="GMGN"><img src="gmgn.png" class="gmgn-icon" alt="GMGN" onerror="this.style.display='none'" /></a>` : ''}
                      <button class="btn btn-sm btn-orange" onclick="fillCoinFromToken('${t.symbol}', '${(t.name||t.symbol).replace(/'/g,'')}', '${(t.logo||'').replace(/'/g,'')}')">发射</button>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
    }

    // Wallet PnL ranking
    if (hasWallets) {
      html += `<div class="sm-section-full" style="margin-top:24px">
        <h3 class="sm-section-title">${_t('walletRank')}</h3>
        <div class="sm-wallets-grid">
          ${data.wallets.map((w, i) => {
            const winPct = (w.winRate * 100).toFixed(1);
            const pnlPct = (w.pnlPercent * 100).toFixed(1);
            const tagBadges = (w.tags || []).map(t => `<span class="wallet-tag">${t}</span>`).join('');
            const topTokensHtml = (w.topTokens || []).map(t => `
              <div class="wallet-top-token">
                ${t.logo ? `<img src="${proxyImg(t.logo)}" class="wallet-top-token-logo" onerror="this.style.display='none'" />` : ''}
                <span class="wallet-top-token-sym">${t.symbol}</span>
                <span class="change up">+$${formatCompact(t.pnl)}</span>
              </div>
            `).join('');
            const sparkData = (w.dailyPNL || []).map(d => d.pnl);
            const sparkHtml = renderMiniSpark(sparkData);
            return `
            <div class="sm-wallet-card">
              <div class="sm-wallet-header">
                <div class="sm-wallet-rank">#${i + 1}</div>
                <div class="sm-wallet-identity">
                  ${w.avatar ? `<img src="${proxyImg(w.avatar)}" class="sm-wallet-avatar" onerror="this.style.display='none'" />` : '<div class="sm-wallet-avatar-placeholder"></div>'}
                  <div>
                    <div class="sm-wallet-label">${w.label || _t('trader')} ${tagBadges}</div>
                    <div class="sm-wallet-addr" onclick="copyAddress('${w.address}')" title="Click to copy">
                      ${w.address.slice(0, 6)}...${w.address.slice(-4)} <span class="copy-icon">${icon('jb-copy','icon-sm')}</span>
                      ${w.twitterUrl ? `<a href="${w.twitterUrl}" target="_blank" rel="noopener" class="sm-twitter-link" onclick="event.stopPropagation()"><img src="${w.avatar ? proxyImg(w.avatar) : (w.twitterHandle ? `https://unavatar.io/x/${w.twitterHandle}` : '')}" class="sm-kol-mini-avatar" onerror="this.style.display='none'" />@${w.twitterHandle || 'X'}</a>` : ''}
                    </div>
                  </div>
                </div>
                <div class="sm-wallet-pnl ${w.pnl >= 0 ? 'up' : 'down'}">
                  ${w.pnl >= 0 ? '+' : ''}$${formatCompact(w.pnl)}
                  <span class="sm-wallet-pnl-pct">${pnlPct}%</span>
                </div>
              </div>
              <div class="sm-wallet-stats">
                <div class="sm-stat">
                  <span class="sm-stat-label">${_t('winRate')}</span>
                  <span class="sm-stat-value ${parseFloat(winPct) >= 50 ? 'change up' : 'change down'}">${winPct}%</span>
                </div>
                <div class="sm-stat">
                  <span class="sm-stat-label">${_t('txns')}</span>
                  <span class="sm-stat-value">${formatCompact(w.totalTxCnt)}</span>
                </div>
                <div class="sm-stat">
                  <span class="sm-stat-label">${_t('tradingVol')}</span>
                  <span class="sm-stat-value">$${formatCompact(w.totalVolume)}</span>
                </div>
                <div class="sm-stat">
                  <span class="sm-stat-label">${_t('tokenCount')}</span>
                  <span class="sm-stat-value">${w.totalTradedTokens}</span>
                </div>
                <div class="sm-stat">
                  <span class="sm-stat-label">${_t('buySellLabel')}</span>
                  <span class="sm-stat-value"><span class="change up">${formatCompact(w.buyTxCnt)}</span>/<span class="change down">${formatCompact(w.sellTxCnt)}</span></span>
                </div>
                <div class="sm-stat">
                  <span class="sm-stat-label">${_t('pnl7d')}</span>
                  <span class="sm-stat-value">${sparkHtml}</span>
                </div>
              </div>
              ${topTokensHtml ? `<div class="sm-wallet-top-tokens"><span class="sm-stat-label">${_t('topEarners')}</span>${topTokensHtml}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }

    grid.innerHTML = html;
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>${_t('loadFailed', err.message)}</p></div>`;
  }
}

function formatAge(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + 'm';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h';
  const days = Math.floor(hrs / 24);
  return days + 'd';
}

function renderMiniSpark(data) {
  if (!data || data.length < 2) return '--';
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60, h = 20;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  const color = data[data.length - 1] >= data[0] ? 'var(--green)' : 'var(--red)';
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="vertical-align:middle"><polyline points="${points}" fill="none" stroke="${color}" stroke-width="1.5" /></svg>`;
}

// ========== GENERATOR ==========
async function generateSuggestions(narrativeContext) {
  const list = document.getElementById('suggestionsList');
  const isContext = !!narrativeContext;
  list.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${isContext ? _t('aiGeneratingContext') : _t('aiGenerating')}</p></div>`;

  try {
    let url = `${API_BASE}/generate-suggestions`;
    if (isContext) {
      const params = new URLSearchParams();
      if (narrativeContext.title) params.set('narrative', narrativeContext.title);
      if (narrativeContext.symbol) params.set('symbol', narrativeContext.symbol);
      if (narrativeContext.description) params.set('description', narrativeContext.description);
      if (narrativeContext.tokens) params.set('tokens', narrativeContext.tokens);
      url += '?' + params.toString();
    }
    const res = await fetch(url);
    const data = await res.json();

    if (!data.suggestions || data.suggestions.length === 0) {
      list.innerHTML = `<div class="empty-state"><p>${_t('noSuggestions')}</p></div>`;
      return;
    }

    list.innerHTML = (isContext ? `<div class="suggestions-context-header">${_t('contextHeader', narrativeContext.title.slice(0, 30))}</div>` : '') +
      data.suggestions.map((s, i) => `
      <div class="suggestion-card" onclick="selectSuggestion(${i})">
        ${s.angle ? `<div class="suggestion-angle">${s.angle}</div>` : ''}
        <div class="suggestion-symbol">$${s.symbol}</div>
        <div class="suggestion-name">${s.name}</div>
        <div class="suggestion-desc">${s.description}</div>
        <div class="suggestion-narrative-source">
          ${_t('narrativeSource')} ${s.narrativeSource || _t('marketTrend')}
        </div>
      </div>
    `).join('');

    window._suggestions = data.suggestions;
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>${_t('genFailed', err.message)}</p></div>`;
  }
}

function selectSuggestion(index) {
  const s = window._suggestions?.[index];
  if (!s) return;

  document.querySelectorAll('.suggestion-card').forEach((c, i) => {
    c.classList.toggle('selected', i === index);
  });

  document.getElementById('coinSymbol').value = s.symbol;
  document.getElementById('coinName').value = s.name;
  document.getElementById('coinDescr').value = s.description;
}

// ========== PLATFORM TOGGLE ==========
let _selectedPlatform = 'jumppad';

function selectPlatform(platform) {
  _selectedPlatform = platform;
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.platform === platform);
  });
}

// ========== FOUR.MEME CLIENT-SIDE SIGNING ==========

// ABI-encode createToken(bytes args, bytes signature) calldata using ethers.js
function encodeFourMemeCalldata(createArg, signature) {
  const iface = new ethers.Interface(['function createToken(bytes args, bytes signature) payable']);
  return iface.encodeFunctionData('createToken', [createArg, signature]);
}

// Poll BSC for token address from receipt
async function pollFourMemeTokenAddress(txHash) {
  const TM2 = '0x5c952063c7fc8610ffdb798152d69f0b9550762b';
  const TOKEN_CREATED = '0x396d5e902b675b032348d3d2e9517ee8f0c4a926603fbc075d3d282ff00cad20';
  const BSC_RPC = 'https://bsc-dataseed.binance.org';
  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await fetch(BSC_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [txHash], id: 1 }),
      });
      const json = await res.json();
      const receipt = json.result;
      if (receipt && receipt.logs) {
        const log = receipt.logs.find(l =>
          l.address.toLowerCase() === TM2 &&
          l.topics[0].toLowerCase() === TOKEN_CREATED
        );
        if (log) {
          return '0x' + log.data.slice(2).slice(88, 128);
        }
      }
    } catch {}
  }
  return null;
}

// Ensure user's EVM wallet is on BSC (chainId 0x38 = 56)
async function ensureBscNetwork() {
  const provider = getActiveEvmProvider();
  if (!provider) return false;
  try {
    const chainId = await provider.request({ method: 'eth_chainId' });
    if (chainId === '0x38') return true;
    // Try switching
    try {
      await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
      return true;
    } catch (switchErr) {
      if (switchErr.code === 4902) {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{ chainId: '0x38', chainName: 'BNB Smart Chain', rpcUrls: ['https://bsc-dataseed.binance.org'], nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 }, blockExplorerUrls: ['https://bscscan.com'] }],
        });
        return true;
      }
      return false;
    }
  } catch { return false; }
}

// ========== Jumpbot.fun helpers ==========

// Encode createAndBuy calldata for the Jumpbot.fun router contract
function encodeJumpbotCreateAndBuy(meta, nonce) {
  const iface = new ethers.Interface([
    'function createAndBuy(tuple(string name, string symbol, string image, string description, string twitter, string telegram, string website) meta, uint256 _buyTokenAmount, uint256 _nonce, uint256 _taxFeeRateBps, address _donateAddress, uint256 _donateWeightBps) payable returns (address token)'
  ]);
  return iface.encodeFunctionData('createAndBuy', [
    [meta.name, meta.symbol, meta.image, meta.description, meta.twitter || '', meta.telegram || '', meta.website || ''],
    0,  // buyTokenAmount = 0 (create only)
    nonce,
    0,  // taxFeeRateBps = 0
    '0x0000000000000000000000000000000000000000', // donateAddress
    0,  // donateWeightBps
  ]);
}

// Poll BSC tx receipt for Jumpbot.fun token address (Transfer from 0x0)
async function pollJumpbotTokenAddress(txHash) {
  const BSC_RPC = 'https://bsc-dataseed.binance.org';
  const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
  const ROUTER_LC = '0xed66076762747dcadd45f2d754ca938bd96c9990';
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await fetch(BSC_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [txHash], id: 1 }),
      });
      const json = await res.json();
      const receipt = json.result;
      if (!receipt) continue;
      // Check if tx reverted
      if (receipt.status === '0x0') return null;
      if (receipt.logs) {
        // Find Transfer event from address(0) — that's the token mint
        for (const log of receipt.logs) {
          if (log.topics[0] === TRANSFER_TOPIC) {
            const from = '0x' + (log.topics[1] || '').slice(26);
            if (from === '0x0000000000000000000000000000000000000000') {
              return log.address; // token contract address
            }
          }
        }
        // Fallback: find any log address that isn't the router
        for (const log of receipt.logs) {
          if (log.address.toLowerCase() !== ROUTER_LC) {
            return log.address;
          }
        }
      }
    } catch {}
  }
  return null;
}

// ========== Flap.sh helpers ==========

// Encode newTokenV2 calldata for the Flap.sh portal contract
function encodeFlapNewTokenV2({ name, symbol, meta, salt, beneficiary }) {
  // newTokenV2 takes a single tuple param: (name, symbol, meta, dexThresh, salt, taxRate, migratorType, quoteToken, quoteAmt, beneficiary, permitData)
  const iface = new ethers.Interface([
    'function newTokenV2(tuple(string name, string symbol, string meta, uint8 dexThresh, bytes32 salt, uint16 taxRate, uint8 migratorType, address quoteToken, uint256 quoteAmt, address beneficiary, bytes permitData) params) returns (address token)'
  ]);
  return iface.encodeFunctionData('newTokenV2', [{
    name,
    symbol,
    meta,
    dexThresh: 1,
    salt,
    taxRate: 0,
    migratorType: 0,
    quoteToken: '0x0000000000000000000000000000000000000000', // native BNB
    quoteAmt: 0,
    beneficiary: beneficiary || '0x0000000000000000000000000000000000000000',
    permitData: '0x',
  }]);
}

// Find a salt that produces a token address ending with vanityEnding
// Uses CREATE2: address = keccak256(0xff ++ portal ++ salt ++ keccak256(initCode))[12:]
async function findFlapSalt(metaUri, vanityEnding, portalAddress, tokenImplAddress) {
  // For simplicity, use a random salt (skip vanity mining in browser)
  // The contract may or may not enforce the vanity ending — if it does,
  // we'll need a more complex approach. Try random first.
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return '0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Poll BSC for token address from tx receipt (generic, works for any platform)
async function pollTokenAddressFromReceipt(txHash) {
  const BSC_RPC = 'https://bsc-dataseed.binance.org';
  const PORTAL = '0xe2ce6ab80874fa9fa2aae65d277dd6b8e65c9de0';
  const ZERO = '0x0000000000000000000000000000000000000000';
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const res = await fetch(BSC_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_getTransactionReceipt', params: [txHash], id: 1 }),
      });
      const json = await res.json();
      const receipt = json.result;
      if (!receipt) continue;
      if (receipt.status === '0x0') return null; // tx reverted = failed

      if (receipt.logs && receipt.logs.length > 0) {
        // Strategy 1: Look for Transfer event from address(0) — token minting = new token
        // Transfer(address,address,uint256) topic0 = 0xddf252ad...
        const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
        for (const log of receipt.logs) {
          if (log.topics && log.topics[0] === TRANSFER_TOPIC && log.topics.length >= 3) {
            const from = '0x' + (log.topics[1] || '').slice(26);
            if (from === ZERO) {
              // This log's address IS the new token contract
              return log.address;
            }
          }
        }
        // Strategy 2: contractAddress in receipt (direct contract creation)
        if (receipt.contractAddress && receipt.contractAddress !== ZERO) {
          return receipt.contractAddress;
        }
        // Strategy 3: First log address that isn't portal/zero/known
        for (const log of receipt.logs) {
          const la = log.address?.toLowerCase();
          if (la && la !== PORTAL && la !== ZERO && la !== '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c') {
            return log.address;
          }
        }
      }
    } catch {}
  }
  return null;
}

async function submitCoin(e) {
  e.preventDefault();
  const result = document.getElementById('launchResult');
  result.style.display = 'block';
  result.className = 'launch-result';

  // Wallet check — all platforms require a connected wallet
  if (!walletState) {
    result.className = 'launch-result error';
    result.innerHTML = `请先连接钱包再发射代币 <button class="btn btn-sm" style="margin-left:8px" onclick="openWalletModal()">连接钱包</button>`;
    return;
  }

  // Four.meme requires EVM wallet on BSC
  let fourMemeLoginSig = null;
  let flapSiweMessage = null;
  let flapSiweSignature = null;
  if (_selectedPlatform === 'fourmeme') {
    if (walletState.chain !== 'evm' || !getActiveEvmProvider()) {
      result.className = 'launch-result error';
      result.textContent = 'Four.meme 发射需要 EVM 钱包（MetaMask / OKX Wallet）并连接到 BSC 网络';
      return;
    }
    // Get nonce from Four.meme and sign with user's wallet
    result.textContent = '正在获取签名授权...';
    try {
      const nonceRes = await fetch(`${API_BASE}/fourmeme/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletState.address }),
      });
      const nonceData = await nonceRes.json();
      if (!nonceData.success) throw new Error(nonceData.error || '获取 nonce 失败');
      result.textContent = '请在钱包中签名授权 Four.meme 登录...';
      const provider = getActiveEvmProvider();
      fourMemeLoginSig = await provider.request({
        method: 'personal_sign',
        params: [nonceData.message, walletState.address],
      });
    } catch (signErr) {
      result.className = 'launch-result error';
      result.textContent = signErr.code === 4001 ? '用户已取消签名' : ('签名失败: ' + (signErr.message || signErr));
      return;
    }
  }

  // Flap.sh requires EVM wallet + SIWE signing
  if (_selectedPlatform === 'flapsh') {
    if (walletState.chain !== 'evm' || !getActiveEvmProvider()) {
      result.className = 'launch-result error';
      result.textContent = 'Flap.sh 发射需要 EVM 钱包（MetaMask / OKX Wallet）';
      return;
    }
    result.textContent = '正在获取 Flap.sh 签名授权...';
    try {
      const siweRes = await fetch(`${API_BASE}/flapsh/siwe-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletState.address }),
      });
      const siweData = await siweRes.json();
      if (!siweData.success) throw new Error(siweData.error || '获取 SIWE message 失败');
      result.textContent = '请在钱包中签名登录 Flap.sh...';
      const provider = getActiveEvmProvider();
      // Flap.sh expects hex-encoded SIWE message in headers (newlines not allowed in HTTP headers)
      flapSiweMessage = siweData.messageHex; // hex-encoded, no newlines
      flapSiweSignature = await provider.request({
        method: 'personal_sign',
        params: ['0x' + siweData.messageHex, walletState.address],
      });
    } catch (signErr) {
      result.className = 'launch-result error';
      result.textContent = signErr.code === 4001 ? '用户已取消签名' : ('签名失败: ' + (signErr.message || signErr));
      return;
    }
  }

  const logoFile = document.getElementById('coinLogo').files[0];
  result.textContent = logoFile || window._narrativeLogoUrl ? _t('submitting') : _t('searchingLogo');

  const formData = new FormData();
  formData.append('symbol', document.getElementById('coinSymbol').value);
  formData.append('name', document.getElementById('coinName').value);
  formData.append('descr', document.getElementById('coinDescr').value);
  formData.append('platform', _selectedPlatform);
  if (logoFile) formData.append('logo', logoFile);
  else if (window._narrativeLogoUrl) formData.append('logoUrl', window._narrativeLogoUrl);
  if (fourMemeLoginSig) {
    formData.append('userAddress', walletState.address);
    formData.append('fourMemeLoginSig', fourMemeLoginSig);
  }
  if (flapSiweMessage && flapSiweSignature) {
    formData.append('userAddress', walletState.address);
    formData.append('siweMessage', flapSiweMessage);
    formData.append('siweSignature', flapSiweSignature);
  }
  // Jumpbot.fun needs user to sign login message for jumpad.fun API auth
  let jumpbotLoginSig = null;
  let jumpbotSignMessage = null;
  if (_selectedPlatform === 'jumppad') {
    if (walletState.chain !== 'evm' || !getActiveEvmProvider()) {
      result.className = 'launch-result error';
      result.textContent = 'Jumpbot.fun 发射需要 EVM 钱包（MetaMask / OKX Wallet）并连接到 BSC 网络';
      return;
    }
    result.textContent = '正在获取 Jumpbot.fun 签名授权...';
    try {
      const msgRes = await fetch(`${API_BASE}/jumpbot/sign-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: walletState.address }),
      });
      const msgData = await msgRes.json();
      if (!msgData.success) throw new Error(msgData.error || '获取签名消息失败');
      result.textContent = '请在钱包中签名授权 Jumpbot.fun 登录...';
      const provider = getActiveEvmProvider();
      jumpbotSignMessage = msgData.message;
      jumpbotLoginSig = await provider.request({
        method: 'personal_sign',
        params: [msgData.message, walletState.address],
      });
    } catch (signErr) {
      result.className = 'launch-result error';
      result.textContent = signErr.code === 4001 ? '用户已取消签名' : ('签名失败: ' + (signErr.message || signErr));
      return;
    }
    formData.append('userAddress', walletState.address);
    formData.append('jumpbotLoginSig', jumpbotLoginSig);
    formData.append('jumpbotSignMessage', jumpbotSignMessage);
  }

  try {
    if (!logoFile && !window._narrativeLogoUrl) {
      setTimeout(() => { if (result.textContent.includes('AI')) result.textContent = _t('logoGenerated'); }, 3000);
    }

    const res = await fetch(`${API_BASE}/launch-coin`, { method: 'POST', body: formData });
    const data = await res.json();

    if (!data.success) {
      result.className = 'launch-result error';
      result.textContent = _t('launchFail', data.error || 'Unknown error');
      return;
    }

    // Four.meme client-side signing flow
    if (data.mode === 'client-sign' && data.platform === 'fourmeme') {
      result.textContent = '切换到 BSC 网络中...';

      const onBsc = await ensureBscNetwork();
      if (!onBsc) {
        result.className = 'launch-result error';
        result.textContent = '请在钱包中切换到 BNB Smart Chain 网络后重试';
        return;
      }

      result.textContent = '等待钱包确认交易...';
      let calldata;
      try {
        calldata = encodeFourMemeCalldata(data.createArg, data.signature);
      } catch (encErr) {
        result.className = 'launch-result error';
        result.textContent = 'ABI 编码失败: ' + encErr.message;
        return;
      }

      let txHash;
      try {
        const evmProvider = getActiveEvmProvider();
        txHash = await evmProvider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletState.address,
            to: data.contractAddress,
            data: calldata,
            value: '0x0',
            chainId: '0x38',
          }],
        });
      } catch (txErr) {
        result.className = 'launch-result error';
        result.textContent = txErr.code === 4001 ? '用户已取消交易' : ('交易失败: ' + (txErr.message || txErr));
        return;
      }

      result.textContent = `交易已提交，等待链上确认... TX: ${txHash.slice(0, 16)}...`;

      // Poll for token address
      const tokenAddress = await pollFourMemeTokenAddress(txHash);
      const fourMemeUrl = tokenAddress ? `https://four.meme/token/${tokenAddress}` : null;
      renderLaunchSuccess(result, { symbol: data.symbol, ca: tokenAddress, tx: txHash, platform: 'fourmeme', tokenUrl: fourMemeUrl });

      // Only save to history if CA was found (real success)
      if (tokenAddress) {
        const logoPreviewImg = document.querySelector('#logoPreview img');
        saveLaunchToHistory({
          symbol: data.symbol,
          name: document.getElementById('coinName').value,
          platform: 'fourmeme',
          logo: logoPreviewImg ? logoPreviewImg.src : null,
          ca: tokenAddress,
          tx: txHash,
          url: fourMemeUrl,
        });
      }
      return;
    }

    // Flap.sh client-sign flow — upload done, now create token on-chain via portal
    if (data.mode === 'client-sign' && data.platform === 'flapsh') {
      result.textContent = '切换到 BSC 网络中...';
      const onBsc = await ensureBscNetwork();
      if (!onBsc) {
        result.className = 'launch-result error';
        result.textContent = '请在钱包中切换到 BNB Smart Chain 网络后重试';
        return;
      }

      // Salt is pre-computed server-side (much faster)
      const salt = data.salt;
      if (!salt) {
        result.className = 'launch-result error';
        result.textContent = '服务端未返回 vanity salt，请重试';
        return;
      }
      console.log('Flap.sh salt:', salt, 'predicted addr:', data.predictedAddress);
      console.log('Flap.sh metaUri:', data.metaUri);
      console.log('Flap.sh portal:', data.portalAddress, 'tokenImpl:', data.tokenImplAddress);

      result.textContent = '请在钱包中确认发币交易...';

      // Encode newTokenV2 calldata
      let calldata;
      try {
        calldata = encodeFlapNewTokenV2({
          name: data.name,
          symbol: data.symbol,
          meta: data.metaUri,
          salt: salt,
          beneficiary: data.beneficiary || '0x0000000000000000000000000000000000000000',
        });
        console.log('Flap.sh calldata selector:', calldata.slice(0, 10), 'length:', calldata.length);
      } catch (encErr) {
        result.className = 'launch-result error';
        result.textContent = 'ABI编码失败: ' + encErr.message;
        console.error('Flap.sh encode error:', encErr);
        return;
      }

      let txHash;
      try {
        const evmProvider = getActiveEvmProvider();
        console.log('Flap.sh sending tx to portal:', data.portalAddress);
        txHash = await evmProvider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletState.address,
            to: data.portalAddress,
            data: calldata,
            value: '0x0',
          }],
        });
      } catch (txErr) {
        console.error('Flap.sh tx error:', txErr);
        result.className = 'launch-result error';
        if (txErr.code === 4001) {
          result.textContent = '用户已取消交易';
        } else if (txErr.message && txErr.message.includes('execution reverted')) {
          result.textContent = '合约执行失败，可能是 vanity salt 不匹配或参数错误。请重试。';
        } else {
          result.textContent = '交易失败: ' + (txErr.message || JSON.stringify(txErr));
        }
        return;
      }

      result.textContent = `交易已提交，等待链上确认... TX: ${txHash.slice(0, 16)}...`;

      // Poll for token address from tx receipt
      const tokenAddress = await pollTokenAddressFromReceipt(txHash);
      const flapUrl = tokenAddress ? `https://flap.sh/coin/${tokenAddress}` : null;
      renderLaunchSuccess(result, { symbol: data.symbol, ca: tokenAddress, tx: txHash, platform: 'flapsh', tokenUrl: flapUrl });

      // Only save to history if CA was found (real success)
      if (tokenAddress) {
        const logoPreviewImg2 = document.querySelector('#logoPreview img');
        saveLaunchToHistory({
          symbol: data.symbol,
          name: document.getElementById('coinName').value,
          platform: 'flapsh',
          logo: logoPreviewImg2 ? logoPreviewImg2.src : null,
          ca: tokenAddress, tx: txHash, url: flapUrl,
        });
      }
      return;
    }

    // Jumpbot.fun client-sign flow — on-chain createAndBuy via user's wallet
    if (data.mode === 'client-sign' && data.platform === 'jumpbot') {
      result.textContent = '切换到 BSC 网络中...';
      const onBsc = await ensureBscNetwork();
      if (!onBsc) {
        result.className = 'launch-result error';
        result.textContent = '请在钱包中切换到 BNB Smart Chain 网络后重试';
        return;
      }

      result.textContent = '请在钱包中确认发币交易...';
      let calldata;
      try {
        calldata = encodeJumpbotCreateAndBuy(data.jumpbotMeta, data.nonce);
        console.log('Jumpbot calldata length:', calldata.length);
      } catch (encErr) {
        result.className = 'launch-result error';
        result.textContent = 'ABI 编码失败: ' + encErr.message;
        return;
      }

      let txHash;
      try {
        const evmProvider = getActiveEvmProvider();
        txHash = await evmProvider.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletState.address,
            to: data.routerAddress,
            data: calldata,
            value: '0x0',
            chainId: '0x38',
          }],
        });
      } catch (txErr) {
        result.className = 'launch-result error';
        result.textContent = txErr.code === 4001 ? '用户已取消交易' : ('交易失败: ' + (txErr.message || txErr));
        return;
      }

      result.textContent = `交易已提交，等待链上确认... TX: ${txHash.slice(0, 16)}...`;

      const tokenAddress = await pollJumpbotTokenAddress(txHash);
      const jumpbotUrl = tokenAddress ? `https://jumpad.fun/token/${tokenAddress}` : null;
      renderLaunchSuccess(result, { symbol: data.symbol, ca: tokenAddress, tx: txHash, platform: 'jumppad', tokenUrl: jumpbotUrl });

      if (tokenAddress) {
        const logoPreviewImg3 = document.querySelector('#logoPreview img');
        saveLaunchToHistory({
          symbol: data.symbol,
          name: document.getElementById('coinName').value,
          platform: 'jumppad',
          logo: logoPreviewImg3 ? logoPreviewImg3.src : null,
          ca: tokenAddress, tx: txHash, url: jumpbotUrl,
        });
      }
      return;
    }

    // Jumppad / legacy fallback flow
    const ca = data.tokenAddress || null;
    const tx = data.txHash || null;
    const jumppadUrl = data.jumppadUrl || getLaunchTokenUrl('jumppad', ca);
    const sym = data.symbol || data.data?.symbol;

    if (ca) {
      renderLaunchSuccess(result, { symbol: sym, ca, tx, platform: _selectedPlatform || 'jumppad', tokenUrl: jumppadUrl });
      const logoPreviewImg = document.querySelector('#logoPreview img');
      saveLaunchToHistory({
        symbol: sym,
        name: document.getElementById('coinName').value,
        platform: _selectedPlatform || 'jumppad',
        logo: logoPreviewImg ? logoPreviewImg.src : null,
        ca: ca, tx: tx, url: jumppadUrl,
      });
    } else {
      result.className = 'launch-result error';
      result.textContent = '发射失败：未获取到代币合约地址，请重试';
    }
  } catch (err) {
    result.className = 'launch-result error';
    result.textContent = _t('networkError', err.message);
  }
}

// ========== LAUNCH RESULT HELPERS ==========
function getLaunchTokenUrl(platform, ca) {
  if (!ca) return null;
  if (platform === 'fourmeme') return `https://four.meme/token/${ca}`;
  if (platform === 'flapsh') return `https://flap.sh/coin/${ca}`;
  return `https://jumpad.fun/token/${ca}`;
}

function getLaunchTxUrl(platform, tx) {
  if (!tx) return null;
  if (platform === 'fourmeme' || platform === 'flapsh' || tx.startsWith('0x')) return `https://bscscan.com/tx/${tx}`;
  return `https://solscan.io/tx/${tx}`;
}

function getLaunchPlatformName(platform) {
  if (platform === 'fourmeme') return 'Four.meme';
  if (platform === 'flapsh') return 'Flap.sh';
  return 'Jumpbot.fun';
}

function renderLaunchSuccess(resultEl, { symbol, ca, tx, platform, tokenUrl }) {
  const pName = getLaunchPlatformName(platform);
  const txUrl = getLaunchTxUrl(platform, tx);

  // No CA = launch failed
  if (!ca) {
    resultEl.className = 'launch-result error';
    let html = `${icon('jb-close','icon-md')} ${symbol} 发射失败（${pName}）— 未获取到代币合约地址`;
    if (tx) {
      html += `<br>TX: <span class="copy-addr" onclick="copyText('${tx}',this)" title="点击复制">${tx.slice(0,16)}... ${icon('jb-copy','icon-sm')}</span>`;
      if (txUrl) html += ` <a href="${txUrl}" target="_blank" rel="noopener">[查看交易详情]</a>`;
      html += `<br><span style="opacity:0.7;font-size:13px">交易可能已上链但未成功创建代币，请在区块浏览器查看交易状态</span>`;
    } else {
      html += `<br><span style="opacity:0.7;font-size:13px">请检查钱包余额是否足够支付 gas 费用，然后重试</span>`;
    }
    resultEl.innerHTML = html;
    return;
  }

  // Has CA = real success
  const finalTokenUrl = tokenUrl || getLaunchTokenUrl(platform, ca);
  resultEl.className = 'launch-result success';
  let html = `${icon('jb-celebrate','icon-md icon-accent')} ${symbol} 发射成功！（${pName}）`;
  html += `<br>CA: <span class="copy-addr" onclick="copyText('${ca}',this)" title="点击复制">${ca.slice(0,8)}...${ca.slice(-6)} ${icon('jb-copy','icon-sm')}</span>`;
  if (finalTokenUrl) html += ` <a href="${finalTokenUrl}" target="_blank" rel="noopener" style="font-weight:bold;text-decoration:underline">[${pName}]</a>`;
  if (tx) {
    html += `<br>TX: <span class="copy-addr" onclick="copyText('${tx}',this)" title="点击复制">${tx.slice(0,16)}... ${icon('jb-copy','icon-sm')}</span>`;
    if (txUrl) html += ` <a href="${txUrl}" target="_blank" rel="noopener" style="font-weight:bold;text-decoration:underline">[Explorer]</a>`;
  }
  resultEl.innerHTML = html;
}

// ========== HELPERS ==========
function useNarrativeForCoin(encodedNarrative) {
  const n = JSON.parse(decodeURIComponent(encodedNarrative));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-tab="generator"]').classList.add('active');
  document.getElementById('panel-generator').classList.add('active');

  const titleWords = (n.title || '').replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/).filter(Boolean);
  let autoSymbol = '';
  if (n.tokens && n.tokens.length > 0 && n.tokens[0].symbol) {
    autoSymbol = n.tokens[0].symbol.toUpperCase();
  } else if (titleWords.length >= 2) {
    autoSymbol = (titleWords[0].slice(0, 3) + titleWords[1].slice(0, 3)).toUpperCase();
  } else if (titleWords.length === 1) {
    autoSymbol = titleWords[0].toUpperCase().slice(0, 6);
  }

  document.getElementById('coinSymbol').value = autoSymbol || 'MEME';
  const coinDisplayName = (n.tokens && n.tokens[0] && n.tokens[0].name) || n._topicEn || autoSymbol || 'MEME';
  document.getElementById('coinName').value = coinDisplayName.slice(0, 30);
  document.getElementById('coinDescr').value = n.description || '';

  // Clear any previously uploaded file to prevent stale file overriding the narrative logo
  document.getElementById('coinLogo').value = '';
  window._narrativeLogoUrl = null;
  if (n.image) {
    const preview = document.getElementById('logoPreview');
    const imgUrl = proxyImg(n.image);
    window._narrativeLogoUrl = n.image;
    preview.innerHTML = `<img src="${imgUrl}" alt="Logo Preview" /><div style="position:absolute;bottom:4px;right:4px;font-size:10px;color:var(--text-muted);background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:4px">${_t('aiSearch')}</div>`;
  }

  const tokenSymbols = (n.tokens || []).map(t => t.symbol).filter(Boolean).join(',');
  generateSuggestions({
    title: n.title || '',
    symbol: autoSymbol || '',
    description: n.description || n.title || '',
    tokens: tokenSymbols,
  });

  document.getElementById('launchForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function fillCoinFromToken(symbol, name, logoUrl) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-tab="generator"]').classList.add('active');
  document.getElementById('panel-generator').classList.add('active');
  document.getElementById('coinSymbol').value = symbol;
  document.getElementById('coinName').value = name;
  // Clear any previously uploaded file to prevent stale file overriding the narrative logo
  document.getElementById('coinLogo').value = '';
  // Set logo preview if available, skip auto-search
  window._narrativeLogoUrl = logoUrl || null;
  const preview = document.getElementById('logoPreview');
  if (logoUrl) {
    preview.innerHTML = `<img src="${proxyImg(logoUrl)}" alt="Logo Preview" />`;
  } else {
    preview.innerHTML = `<span>${_t('clickUpload')}</span>`;
  }
  document.getElementById('launchForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function viewNarrativeDetail(encodedTitle) {
  alert(_t('detailWip'));
}

function copyAddress(address) {
  const textarea = document.createElement('textarea');
  textarea.value = address;
  textarea.style.cssText = 'position:fixed;opacity:0;left:-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  const toast = document.createElement('div');
  toast.textContent = _t('addressCopied');
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:8px 16px;border-radius:8px;font-size:14px;z-index:9999;animation:fadeOut 1.5s forwards';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

function copyText(text, el) {
  navigator.clipboard.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
  if (el) {
    const orig = el.innerHTML;
    el.innerHTML = orig.replace(icon('jb-copy','icon-sm'), icon('jb-check','icon-sm icon-success'));
    setTimeout(() => { el.innerHTML = orig; }, 1500);
  }
}

// ========== TOKEN LOGO PLACEHOLDER ==========
const PLACEHOLDER_COLORS = ['#f59e0b','#ef4444','#8b5cf6','#10b981','#3b82f6','#ec4899','#06b6d4','#f97316'];
function getPlaceholderColor(symbol) {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}
function tokenPlaceholder(symbol) {
  const el = document.createElement('div');
  el.className = 'token-icon-placeholder';
  el.style.background = getPlaceholderColor(symbol);
  el.textContent = (symbol || '?')[0].toUpperCase();
  return el;
}
function tokenPlaceholderHTML(symbol) {
  const color = getPlaceholderColor(symbol);
  const letter = (symbol || '?')[0].toUpperCase();
  return `<div class="token-icon-placeholder" style="background:${color}">${letter}</div>`;
}

function formatNumber(num) {
  if (!num) return '0';
  if (num < 0.0001) return num.toExponential(2);
  if (num < 1) return num.toFixed(6);
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatCompact(num) {
  if (!num) return '0';
  const abs = Math.abs(num);
  if (abs >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (abs >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (abs >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toFixed(2);
}

function formatRelativeTime(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}秒前`;
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

// Show absolute time HH:MM (avoids "0秒前" on fresh data)
function formatAbsTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  // Show HH:MM if today, else show M/D HH:MM
  const hhmm = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  const isToday = d.toDateString() === now.toDateString();
  return isToday ? hhmm : `${d.getMonth()+1}/${d.getDate()} ${hhmm}`;
}

// ========== LOGO PREVIEW ==========
document.getElementById('coinLogo')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  window._narrativeLogoUrl = null;
  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('logoPreview').innerHTML = `<img src="${ev.target.result}" />`;
  };
  reader.readAsDataURL(file);
});

// ========== AUTO REFRESH (every hour) ==========
const AUTO_REFRESH_MS = 60 * 60 * 1000;
let lastRefreshTime = Date.now();

function updateRefreshCountdown() {
  const el = document.getElementById('refreshCountdown');
  if (!el) return;
  const elapsed = Date.now() - lastRefreshTime;
  const remaining = Math.max(0, AUTO_REFRESH_MS - elapsed);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  el.textContent = _t('nextRefresh', mins, secs.toString().padStart(2, '0'));
}

setInterval(() => {
  updateRefreshCountdown();
}, 1000);

setInterval(() => {
  console.log('Auto-refreshing narratives...');
  lastRefreshTime = Date.now();
  loadNarratives();
}, AUTO_REFRESH_MS);

// ========== SSE REAL-TIME PUSH ==========
let _sseConn = null;
let _sseReconnectTimer = null;

function connectNarrativeSSE() {
  if (_sseConn) { try { _sseConn.close(); } catch(e){} _sseConn = null; }
  if (_sseReconnectTimer) { clearTimeout(_sseReconnectTimer); _sseReconnectTimer = null; }
  _sseConn = new EventSource(`${API_BASE}/narratives/stream`);
  _sseConn.onopen = () => {
    const dot = document.getElementById('liveDot');
    if (dot) { dot.style.display = 'inline-block'; dot.title = '实时推送'; }
  };
  _sseConn.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'config') return;
      // Server signals global cache refreshed — reload current view
      if (msg.type === 'refresh') { narrativePage = 1; loadNarratives(); }
    } catch(err) {}
  };
  _sseConn.onerror = () => {
    const dot = document.getElementById('liveDot');
    if (dot) dot.style.display = 'none';
    if (_sseConn) { try { _sseConn.close(); } catch(e){} _sseConn = null; }
    _sseReconnectTimer = setTimeout(connectNarrativeSSE, 15000);
  };
}
connectNarrativeSSE();

// ========== INFINITE SCROLL ==========
function setupInfiniteScroll() {
  let scrolling = false;
  window.addEventListener('scroll', () => {
    if (scrolling || narrativeLoading) return;
    const tab = document.querySelector('.tab.active')?.dataset?.tab;
    if (tab !== 'narratives') return;
    const distFromBottom = document.documentElement.scrollHeight - window.scrollY - window.innerHeight;
    if (distFromBottom < 200 && narrativePage * 50 < narrativeTotal) {
      scrolling = true;
      narrativePage++;
      loadNarratives(true).finally(() => { scrolling = false; });
    }
  }, { passive: true });
}
setupInfiniteScroll();

// ========== FILTER EVENT LISTENERS ==========
initPillGroup('sourceFilterGroup', () => { narrativePage = 1; loadNarratives(); });
initPillGroup('chainFilterGroup', () => { narrativePage = 1; loadNarratives(); });
initPillGroup('narrativeSortGroup', () => { narrativePage = 1; loadNarratives(); });
initPillGroup('timeWindowFilterGroup', () => { narrativePage = 1; loadNarratives(); });
initPillGroup('smChainFilterGroup', () => { loadSmartMoney(); });
initPillGroup('tokenChainFilterGroup', () => { loadTokens(); });
initPillGroup('tokenSortFilterGroup', () => { loadTokens(); });
initPillGroup('narrativeCategoryGroup', () => { narrativePage = 1; loadNarratives(); });
initPillGroup('tokenCategoryGroup', () => { loadTokens(); });

// ========== DAILY REPORT ==========
function openDailyReportModal() {
  const overlay = document.getElementById('drModalOverlay');
  if (!overlay) return;
  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  renderDailyReportModal();
}

function closeDailyReportModal() {
  const overlay = document.getElementById('drModalOverlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

let _drCurrentSlide = 0;

function renderDailyReportModal() {
  const narratives = window._dailyReportData || [];
  const track = document.getElementById('drSliderTrack');
  const dotsEl = document.getElementById('drSliderDots');
  if (!track) return;
  if (narratives.length === 0) {
    track.innerHTML = '<div class="loading-state" style="padding:60px 20px"><div class="spinner"></div><p>加载中...</p></div>';
    return;
  }

  _drCurrentSlide = 0;
  track.innerHTML = narratives.map((n, idx) => {
    const scoreClass = n.aiScore >= 75 ? 'high' : n.aiScore >= 50 ? 'mid' : 'low';
    const rankLabel = rankBadge(idx);
    const scoreColor = n.aiScore >= 75 ? '#00c864' : n.aiScore >= 50 ? '#f0b429' : '#F6465D';
    const tokensHtml = (n.tokens || []).slice(0, 4).map(t =>
      t.symbol ? `<span class="dr-card-token">$${escHtml(t.symbol)}</span>` : ''
    ).join('');
    const imgSrc = proxyImg(n.image || '');
    const imgHtml = imgSrc
      ? `<img class="dr-card-img" src="${escHtml(imgSrc)}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="dr-card-img-fallback" style="display:none">${icon('jb-fire','icon-xl')}</div>`
      : `<div class="dr-card-img-fallback">${icon('jb-fire','icon-xl')}</div>`;
    const descText = (n.description || '').slice(0, 100) + ((n.description || '').length > 100 ? '…' : '');

    return `
      <div class="dr-card" data-idx="${idx}">
        <div class="dr-card-rank-badge">${rankLabel}</div>
        <div class="dr-card-img-wrap">${imgHtml}</div>
        <div class="dr-card-body">
          <div class="dr-card-title">${escHtml(n.title || '')}</div>
          <div class="dr-card-desc">${escHtml(descText)}</div>
          <div class="dr-card-tokens">${tokensHtml}</div>
        </div>
        <div class="dr-card-footer">
          <div class="dr-card-score-wrap">
            <span class="dr-card-score-label" style="color:${scoreColor}">AI评分</span>
            <span class="dr-card-score-val" style="color:${scoreColor}">${n.aiScore || 0}%</span>
            <div class="dr-card-bar-bg"><div class="dr-card-bar" style="width:${n.aiScore || 0}%;background:${scoreColor}"></div></div>
            <span class="dr-card-score-tag ${scoreClass}">${escHtml(n.aiLabel || '')}</span>
          </div>
          <div class="dr-card-actions">
            <button class="dr-card-detail-btn" onclick="openNarrativeFromDailyReport(${idx})">详情</button>
            <button class="dr-card-launch-btn" onclick="event.stopPropagation();closeDailyReportModal();launchFromDailyReport(${idx})">一键发币</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Build dots
  if (dotsEl) {
    dotsEl.innerHTML = narratives.map((_, i) =>
      `<span class="dr-dot ${i === 0 ? 'active' : ''}" onclick="drGoTo(${i})"></span>`
    ).join('');
  }

  drUpdateSlider();
  drInitTouch();
}

function drSlide(dir) {
  const narratives = window._dailyReportData || [];
  _drCurrentSlide = Math.max(0, Math.min(_drCurrentSlide + dir, narratives.length - 1));
  drUpdateSlider();
}

function drGoTo(idx) {
  _drCurrentSlide = idx;
  drUpdateSlider();
}

function drUpdateSlider() {
  const track = document.getElementById('drSliderTrack');
  const dotsEl = document.getElementById('drSliderDots');
  const prevBtn = document.getElementById('drPrevBtn');
  const nextBtn = document.getElementById('drNextBtn');
  const narratives = window._dailyReportData || [];
  if (!track) return;

  const cardWidth = track.querySelector('.dr-card')?.offsetWidth || 300;
  const gap = 16;
  track.scrollTo({ left: _drCurrentSlide * (cardWidth + gap), behavior: 'smooth' });

  if (dotsEl) {
    dotsEl.querySelectorAll('.dr-dot').forEach((d, i) =>
      d.classList.toggle('active', i === _drCurrentSlide)
    );
  }
  if (prevBtn) prevBtn.style.opacity = _drCurrentSlide <= 0 ? '0.3' : '1';
  if (nextBtn) nextBtn.style.opacity = _drCurrentSlide >= narratives.length - 1 ? '0.3' : '1';
}

function drInitTouch() {
  const track = document.getElementById('drSliderTrack');
  if (!track || track._touchBound) return;
  track._touchBound = true;
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) drSlide(dx < 0 ? 1 : -1);
  }, { passive: true });
}

async function loadDailyReport() {
  try {
    const res = await fetch(`${API_BASE}/daily-report`);
    const data = await res.json();
    const banner = document.getElementById('dailyReportBanner');
    const titleEl = document.getElementById('dailyReportTitle');
    const modalTitleEl = document.getElementById('drModalTitle');
    const previewEl = document.getElementById('drPreviewTokens');

    if (!data.narratives || data.narratives.length === 0) return;

    window._dailyReportData = data.narratives;

    banner.style.display = '';
    const dateLabel = data.date ? `${data.date} 叙事早报` : '今日叙事早报';
    if (titleEl) titleEl.textContent = dateLabel;
    if (modalTitleEl) modalTitleEl.textContent = dateLabel;

    // Show preview: top 3 narrative titles in the banner
    if (previewEl) {
      previewEl.innerHTML = data.narratives.slice(0, 3).map((n, i) =>
        `<span class="dr-preview-item">${rankBadge(i)} ${escHtml((n.title || '').slice(0, 10))}</span>`
      ).join('');
    }
  } catch (e) {
    console.warn('daily-report load failed:', e);
  }
}

function openNarrativeFromDailyReport(idx) {
  const n = (window._dailyReportData || [])[idx];
  if (!n) return;
  closeDailyReportModal();
  const storeIdx = 9000 + idx;
  _narrativeStore[storeIdx] = n;
  openNarrativeModal(storeIdx);
}

function launchFromDailyReport(idx) {
  const n = (window._dailyReportData || [])[idx];
  if (!n) return;
  useNarrativeForCoin(encodeURIComponent(JSON.stringify(n)));
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ========== INIT ==========
loadNarratives();
loadDailyReport();

// ========== WALLET ==========
const WALLET_KEY = 'nh_wallet';

let walletState = (() => {
  try { return JSON.parse(localStorage.getItem(WALLET_KEY)) || null; } catch { return null; }
})();
let walletBalance = null; // { amount, symbol }

function saveWalletState(s) {
  walletState = s;
  if (s) localStorage.setItem(WALLET_KEY, JSON.stringify(s));
  else localStorage.removeItem(WALLET_KEY);
}

function openWalletModal() {
  if (walletState) { window.location.href = '/profile.html'; return; }
  document.getElementById('walletModalOverlay').style.display = 'block';
  document.getElementById('walletModal').style.display = 'block';
}

function closeWalletModal() {
  document.getElementById('walletModalOverlay').style.display = 'none';
  document.getElementById('walletModal').style.display = 'none';
}

async function connectWallet(type) {
  const body = document.querySelector('.wallet-modal-body');
  const orig = body.innerHTML;
  body.innerHTML = '<div class="wallet-installing"><div class="spinner" style="width:16px;height:16px;border-width:2px"></div> 连接中...</div>';

  try {
    let address, chain;

    if (type === 'metamask') {
      if (!window.ethereum) { window.open('https://metamask.io/download/', '_blank'); body.innerHTML = orig; return; }
      const provider = getEthProvider('metamask');
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      address = accounts[0];
      chain = 'evm';
    } else if (type === 'okx') {
      if (window.okxwallet) {
        const accounts = await window.okxwallet.request({ method: 'eth_requestAccounts' });
        address = accounts[0]; chain = 'evm';
      } else if (window.okxwallet?.solana) {
        const resp = await window.okxwallet.solana.connect();
        address = resp.publicKey.toString(); chain = 'sol';
      } else {
        window.open('https://www.okx.com/web3', '_blank'); body.innerHTML = orig; return;
      }
    } else if (type === 'phantom') {
      const ph = window.phantom?.solana || window.solana;
      if (!ph) { window.open('https://phantom.app/', '_blank'); body.innerHTML = orig; return; }
      const resp = await ph.connect();
      address = resp.publicKey.toString(); chain = 'sol';
    } else if (type === 'backpack') {
      const bp = window.backpack?.solana || window.backpack;
      if (!bp) { window.open('https://backpack.app/', '_blank'); body.innerHTML = orig; return; }
      const resp = await bp.connect();
      address = resp.publicKey.toString(); chain = 'sol';
    } else if (type === 'trust') {
      if (!window.ethereum) { window.open('https://trustwallet.com/', '_blank'); body.innerHTML = orig; return; }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      address = accounts[0]; chain = 'evm';
    } else if (type === 'tokenpocket') {
      if (!window.ethereum) { window.open('https://www.tokenpocket.pro/', '_blank'); body.innerHTML = orig; return; }
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      address = accounts[0]; chain = 'evm';
    }

    if (address) {
      let chainId = null;
      if (chain === 'evm') {
        // Use the correct provider for this wallet type to get chainId
        const p = type === 'okx' ? (window.okxwallet || window.ethereum) : window.ethereum;
        if (p) { try { chainId = await p.request({ method: 'eth_chainId' }); } catch {} }
      }
      saveWalletState({ type, address, chain, chainId });
      updateWalletBtn();
      closeWalletModal();
      window.location.href = '/profile.html';
    } else {
      body.innerHTML = orig;
    }
  } catch (e) {
    console.error('Wallet connect error:', e);
    body.innerHTML = orig;
    body.innerHTML = `<div class="wallet-installing" style="color:#F6465D">连接失败：${e.message || '用户拒绝或钱包未解锁'}</div>` + orig;
  }
}

function getEthProvider(type) {
  if (type === 'metamask' && window.ethereum?.providers) {
    return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum;
  }
  return window.ethereum;
}

// Returns the correct EVM provider for the currently connected wallet
function getActiveEvmProvider() {
  if (!walletState || walletState.chain !== 'evm') return null;
  const type = walletState.type;
  if (type === 'okx') {
    // OKX wallet has its own provider; may also inject window.ethereum but not reliably
    return window.okxwallet || window.ethereum;
  }
  if (type === 'metamask') return getEthProvider('metamask');
  return window.ethereum;
}

function disconnectWallet() {
  saveWalletState(null);
  updateWalletBtn();
  closeProfilePanel();
}

function updateWalletBtn() {
  const btn = document.getElementById('walletBtn');
  if (!btn) return;
  if (walletState) {
    const short = walletState.chain === 'sol'
      ? walletState.address.slice(0,4) + '...' + walletState.address.slice(-4)
      : walletState.address.slice(0,6) + '...' + walletState.address.slice(-4);
    // Chain info
    let chainName = 'SOL';
    let chainColor = '#9945FF';
    if (walletState.chain === 'evm') {
      const meta = CHAIN_META[walletState.chainId] || CHAIN_META['0x38'];
      chainName = meta ? meta.name.replace(' Chain','').replace('BNB','BSC') : 'EVM';
      chainColor = meta ? meta.color : '#F0B90B';
    }
    // Balance
    const balText = walletBalance ? `${walletBalance.amount} ${walletBalance.symbol}` : '';
    btn.classList.add('connected');
    btn.innerHTML = `
      <span class="wallet-dot"></span>
      <span class="wallet-chain-badge" style="background:${chainColor}22;color:${chainColor};border:1px solid ${chainColor}44">${chainName}</span>
      <span class="wallet-addr">${short}</span>
      ${balText ? `<span class="wallet-bal">${balText}</span>` : ''}
    `;
  } else {
    btn.classList.remove('connected');
    btn.innerHTML = `<svg class="icon icon-sm" aria-hidden="true"><use href="#jb-wallet"></use></svg><span>连接钱包</span>`;
  }
}

// Chain metadata map
const CHAIN_META = {
  '0x1':    { name: 'Ethereum',  symbol: 'ETH',  color: '#627EEA', explorer: 'https://etherscan.io' },
  '0x38':   { name: 'BNB Chain', symbol: 'BNB',  color: '#F0B90B', explorer: 'https://bscscan.com' },
  '0x89':   { name: 'Polygon',   symbol: 'MATIC', color: '#8247E5', explorer: 'https://polygonscan.com' },
  '0x2105': { name: 'Base',      symbol: 'ETH',  color: '#0052FF', explorer: 'https://basescan.org' },
  '0xa4b1': { name: 'Arbitrum',  symbol: 'ETH',  color: '#28A0F0', explorer: 'https://arbiscan.io' },
};

// ========== PROFILE PANEL ==========
function openProfilePanel() {
  if (!walletState) return;
  document.getElementById('profileOverlay').style.display = 'block';
  const panel = document.getElementById('profilePanel');
  panel.style.display = 'flex';

  const { address, chain, type } = walletState;

  // Avatar
  drawBlockie(address, document.getElementById('profileAvatar'));

  // Chain switcher: show only for EVM wallets
  const switcherSection = document.getElementById('chainSwitcherSection');
  if (chain === 'evm') {
    switcherSection.style.display = 'block';
    // Detect current chainId
    const _activeProv = getActiveEvmProvider();
    if (_activeProv) {
      _activeProv.request({ method: 'eth_chainId' }).then(cid => {
        highlightActiveChain(cid);
      }).catch(() => {});
    }
  } else {
    switcherSection.style.display = 'none';
  }

  // Chain badge
  updateChainBadge(chain, walletState.chainId);

  // Address
  document.getElementById('profileAddress').textContent = address;

  // Balance
  fetchWalletBalance(address, chain, walletState.chainId);

  // History
  loadLaunchHistory();
}

function updateChainBadge(chain, chainId) {
  const chainBadge = document.getElementById('profileChainBadge');
  if (chain === 'sol') {
    chainBadge.innerHTML = `${icon('jb-dot','icon-sm icon-success')} Solana`;
    chainBadge.style.color = '#A78BFA';
    chainBadge.style.background = 'rgba(139,92,246,0.12)';
    chainBadge.style.borderColor = 'rgba(139,92,246,0.3)';
  } else {
    const meta = CHAIN_META[chainId] || CHAIN_META['0x38'];
    chainBadge.innerHTML = `${icon('jb-dot','icon-sm icon-success')} ${meta.name}`;
    chainBadge.style.color = meta.color;
    chainBadge.style.background = meta.color + '1a';
    chainBadge.style.borderColor = meta.color + '40';
  }
}

function highlightActiveChain(chainId) {
  document.querySelectorAll('.chain-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.chainid === chainId);
  });
}

async function switchChain(chainId) {
  const evmProv = getActiveEvmProvider();
  if (!evmProv) return;
  try {
    await evmProv.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
    walletState.chainId = chainId;
    saveWalletState(walletState);
    highlightActiveChain(chainId);
    updateChainBadge('evm', chainId);
    fetchWalletBalance(walletState.address, 'evm', chainId);
  } catch (e) {
    // Chain not added to wallet yet — try to add it
    const chainConfigs = {
      '0x89':   { chainId: '0x89',   chainName: 'Polygon', nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }, rpcUrls: ['https://polygon-rpc.com'], blockExplorerUrls: ['https://polygonscan.com'] },
      '0x2105': { chainId: '0x2105', chainName: 'Base',    nativeCurrency: { name: 'Ether', symbol: 'ETH',  decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] },
      '0xa4b1': { chainId: '0xa4b1', chainName: 'Arbitrum One', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://arb1.arbitrum.io/rpc'], blockExplorerUrls: ['https://arbiscan.io'] },
    };
    if (e.code === 4902 && chainConfigs[chainId]) {
      try {
        await evmProv.request({ method: 'wallet_addEthereumChain', params: [chainConfigs[chainId]] });
        walletState.chainId = chainId;
        saveWalletState(walletState);
        highlightActiveChain(chainId);
        updateChainBadge('evm', chainId);
        fetchWalletBalance(walletState.address, 'evm', chainId);
      } catch (err2) { console.error('Add chain failed', err2); }
    }
  }
}

function closeProfilePanel() {
  document.getElementById('profileOverlay').style.display = 'none';
  document.getElementById('profilePanel').style.display = 'none';
}

async function copyProfileAddress() {
  if (!walletState) return;
  try {
    await navigator.clipboard.writeText(walletState.address);
    const btn = document.getElementById('profileCopyBtn');
    btn.innerHTML = `已复制 ${icon('jb-check','icon-sm icon-success')}`;
    setTimeout(() => { btn.textContent = '复制地址'; btn.innerHTML = '复制地址'; }, 2000);
  } catch {}
}

const EVM_RPC = {
  '0x1':    'https://cloudflare-eth.com',
  '0x38':   'https://bsc-dataseed.binance.org/',
  '0x89':   'https://polygon-rpc.com',
  '0x2105': 'https://mainnet.base.org',
  '0xa4b1': 'https://arb1.arbitrum.io/rpc',
};

async function fetchWalletBalance(address, chain, chainId) {
  const el = document.getElementById('profileBalance');
  el.innerHTML = '<div class="spinner" style="width:14px;height:14px;border-width:2px"></div>';
  try {
    if (chain === 'sol') {
      const resp = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address] })
      });
      const data = await resp.json();
      const sol = (data.result?.value || 0) / 1e9;
      walletBalance = { amount: sol.toFixed(4), symbol: 'SOL' };
      el.innerHTML = `<span class="profile-balance-amount">${sol.toFixed(4)}</span><span class="profile-balance-symbol">SOL</span>`;
      updateWalletBtn();
    } else {
      const cid = chainId || '0x38';
      const meta = CHAIN_META[cid] || CHAIN_META['0x38'];
      const rpc = EVM_RPC[cid] || EVM_RPC['0x38'];
      const resp = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [address, 'latest'] })
      });
      const data = await resp.json();
      const bal = parseInt(data.result || '0x0', 16) / 1e18;
      walletBalance = { amount: bal.toFixed(4), symbol: meta.symbol };
      el.innerHTML = `<span class="profile-balance-amount">${bal.toFixed(4)}</span><span class="profile-balance-symbol">${meta.symbol}</span>`;
      updateWalletBtn();
    }
  } catch {
    const meta = CHAIN_META[chainId] || CHAIN_META['0x38'];
    el.innerHTML = `<span class="profile-balance-amount">--</span><span class="profile-balance-symbol">${chain === 'sol' ? 'SOL' : meta.symbol}</span>`;
  }
}

function loadLaunchHistory() {
  const el = document.getElementById('profileHistory');
  const countEl = document.getElementById('profileHistoryCount');
  let history = [];
  try { history = JSON.parse(localStorage.getItem('nh_launch_history')) || []; } catch {}

  if (countEl) countEl.textContent = history.length ? `(${history.length})` : '';

  if (!history.length) {
    el.innerHTML = '<div class="profile-empty">暂无发射记录</div>';
    return;
  }

  el.innerHTML = history.slice(0, 20).map(h => {
    const platformLabel = h.platform === 'fourmeme'
      ? `${icon('jb-frog','icon-sm')} Four.meme`
      : h.platform === 'flapsh'
      ? `${icon('jb-butterfly','icon-sm')} Flap.sh`
      : `${icon('jb-rocket','icon-sm')} Jumpbot.fun`;
    const dateStr = new Date(h.time).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const shortCa = h.ca ? h.ca.slice(0, 8) + '...' + h.ca.slice(-6) : '';

    // Build links — always show platform link even without CA
    let links = '';
    const tokenUrl = h.url || getLaunchTokenUrl(h.platform, h.ca);
    const platformHome = h.platform === 'fourmeme' ? 'https://four.meme' : h.platform === 'flapsh' ? 'https://flap.sh' : 'https://jumpad.fun';
    const platformLink = tokenUrl || platformHome;
    links += `<a class="history-item-link" href="${platformLink}" target="_blank">[${getLaunchPlatformName(h.platform)}]</a>`;
    if (h.tx) {
      links += `<a class="history-item-link" href="${getLaunchTxUrl(h.platform, h.tx)}" target="_blank">[TX]</a>`;
    }
    if (h.ca && !tokenUrl) {
      const isBsc2 = h.platform === 'fourmeme' || h.platform === 'flapsh' || (h.ca && h.ca.startsWith('0x'));
      const addrExplorer = isBsc2 ? `https://bscscan.com/token/${h.ca}` : `https://solscan.io/token/${h.ca}`;
      links += `<a class="history-item-link" href="${addrExplorer}" target="_blank">[合约]</a>`;
    }

    return `
    <div class="history-item">
      ${h.logo ? `<img class="history-item-logo" src="${h.logo}" onerror="this.style.display='none'" />` : `<div class="history-item-logo" style="background:var(--accent-dim)"></div>`}
      <div class="history-item-info">
        <div class="history-item-name">${h.name || h.symbol} <span style="font-size:11px;color:var(--text-muted);font-weight:400">$${h.symbol}</span></div>
        <div class="history-item-meta">${platformLabel} · ${dateStr}</div>
        ${shortCa ? `<div class="history-item-ca" onclick="copyText('${h.ca}',this)" title="点击复制 CA">CA: ${shortCa} ${icon('jb-copy','icon-sm')}</div>` : ''}
        ${links ? `<div class="history-item-links">${links}</div>` : ''}
      </div>
    </div>
  `}).join('');
}

// ========== BLOCKIE AVATAR ==========
function drawBlockie(seed, canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 8;
  const scale = canvas.width / size;
  const colors = generateColors(seed);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const hash = hashCode(seed.toLowerCase());
  for (let i = 0; i < size * size; i++) {
    const x = i % size; const y = Math.floor(i / size);
    if ((hash >> i) & 1) {
      ctx.fillStyle = (hash >> (i + 1)) & 1 ? colors.spot : colors.color;
      const mirrorX = size - 1 - x;
      ctx.fillRect(x * scale, y * scale, scale, scale);
      if (x < size / 2) ctx.fillRect(mirrorX * scale, y * scale, scale, scale);
    }
  }
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h;
}

function generateColors(seed) {
  const h = Math.abs(hashCode(seed));
  const hue = (h % 360);
  const hue2 = (hue + 180) % 360;
  return {
    color: `hsl(${hue},60%,55%)`,
    bg: `hsl(${hue2},20%,12%)`,
    spot: `hsl(${hue},40%,35%)`
  };
}

// ========== SAVE LAUNCH TO HISTORY ==========
function saveLaunchToHistory(entry) {
  let history = [];
  try { history = JSON.parse(localStorage.getItem('nh_launch_history')) || []; } catch {}
  history.unshift({ ...entry, time: Date.now() });
  if (history.length > 50) history = history.slice(0, 50);
  localStorage.setItem('nh_launch_history', JSON.stringify(history));
}

// Init wallet state on load
updateWalletBtn();
