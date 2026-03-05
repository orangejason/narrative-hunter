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

// ========== TAB SWITCHING ==========
const tabLoaded = {};
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const tabName = tab.dataset.tab;
    document.getElementById('panel-' + tabName).classList.add('active');
    // Lazy-load tab data on first switch
    if (!tabLoaded[tabName]) {
      tabLoaded[tabName] = true;
      if (tabName === 'tokens') loadTokens();
      else if (tabName === 'smart-money') loadSmartMoney();
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
async function loadNarratives() {
  const grid = document.getElementById('narrativesGrid');
  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>加载热点叙事中...</p></div>';

  try {
    const chain = document.getElementById('chainFilter').value;
    const res = await fetch(`${API_BASE}/narratives?chain=${chain}`);
    const data = await res.json();

    if (!data.narratives || data.narratives.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>暂无热点叙事数据</p></div>';
      return;
    }

    grid.innerHTML = data.narratives.map(n => `
      <div class="narrative-card">
        <div class="narrative-title">
          ${n.title}
          <span class="narrative-heat ${n.heat > 80 ? 'heat-high' : n.heat > 50 ? 'heat-mid' : 'heat-low'}">
            🔥 ${n.heat}
          </span>
        </div>
        <div class="narrative-desc">${n.description}</div>
        ${n.kols && n.kols.length > 0 ? `
          <div class="narrative-kols">
            ${n.kols.map(k => `<span class="kol-tag">@${k}</span>`).join('')}
          </div>
        ` : ''}
        ${n.tokens && n.tokens.length > 0 ? `
          <div class="narrative-tokens">
            ${n.tokens.map(t => `
              <span class="token-badge">
                ${t.symbol}
                <span class="change ${t.change >= 0 ? 'up' : 'down'}">
                  ${t.change >= 0 ? '+' : ''}${t.change.toFixed(1)}%
                </span>
              </span>
            `).join('')}
          </div>
        ` : ''}
        <div class="narrative-actions">
          <button class="btn btn-sm btn-green" onclick="useNarrativeForCoin('${encodeURIComponent(JSON.stringify(n))}')">
            🚀 基于此叙事发币
          </button>
          <button class="btn btn-sm" onclick="viewNarrativeDetail('${encodeURIComponent(n.title)}')">
            📖 详情
          </button>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>加载失败: ${err.message}</p></div>`;
  }
}

// ========== TOKENS ==========
async function loadTokens() {
  const tbody = document.getElementById('tokensBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-state"><div class="spinner"></div></td></tr>';

  try {
    const chain = document.getElementById('tokenChainFilter').value;
    const sort = document.getElementById('tokenSortFilter').value;
    const res = await fetch(`${API_BASE}/tokens?chain=${chain}&sort=${sort}`);
    const data = await res.json();

    if (!data.tokens || data.tokens.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无数据</td></tr>';
      return;
    }

    tbody.innerHTML = data.tokens.map((t, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>
          <div class="token-info">
            ${t.logo ? `<img class="token-icon" src="${t.logo}" alt="${t.symbol}" onerror="this.style.display='none'" />` : ''}
            <div>
              <div class="token-name">${t.symbol}</div>
              <div class="token-symbol-sub">${t.name || ''}</div>
            </div>
          </div>
        </td>
        <td>$${formatNumber(t.price)}</td>
        <td class="${t.change24h >= 0 ? 'change up' : 'change down'}">
          ${t.change24h >= 0 ? '+' : ''}${t.change24h?.toFixed(2) || '0'}%
        </td>
        <td>$${formatCompact(t.volume24h)}</td>
        <td>$${formatCompact(t.marketCap)}</td>
        <td>$${formatCompact(t.liquidity)}</td>
        <td>
          <button class="btn btn-sm btn-orange" onclick="fillCoinFromToken('${t.symbol}', '${t.name || ''}')">
            发币
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">加载失败: ${err.message}</td></tr>`;
  }
}

// ========== SMART MONEY ==========
async function loadSmartMoney() {
  const grid = document.getElementById('smartMoneyGrid');
  grid.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>加载聪明钱数据中...</p></div>';

  try {
    const chain = document.getElementById('smChainFilter').value;
    const res = await fetch(`${API_BASE}/smart-money?chain=${chain}`);
    const data = await res.json();

    const hasWallets = data.wallets && data.wallets.length > 0;
    const hasTokens = data.smartMoneyTokens && data.smartMoneyTokens.length > 0;

    if (!hasWallets && !hasTokens) {
      grid.innerHTML = '<div class="empty-state"><p>暂无聪明钱数据</p></div>';
      return;
    }

    let html = '';

    // 聪明钱在买的代币
    if (hasTokens) {
      html += '<div style="grid-column:1/-1;margin-bottom:8px"><h3 style="font-size:16px;font-weight:700;margin-bottom:12px">💰 聪明钱正在买入的代币</h3></div>';
      html += data.smartMoneyTokens.map(t => `
        <div class="sm-card">
          <div class="sm-header">
            <div style="display:flex;align-items:center;gap:8px">
              ${t.logo ? `<img src="${t.logo}" style="width:24px;height:24px;border-radius:50%" onerror="this.style.display='none'" />` : ''}
              <span style="font-weight:800;font-size:15px">${t.symbol}</span>
            </div>
            <span class="sm-pnl ${t.change24h >= 0 ? 'change up' : 'change down'}">
              ${t.change24h >= 0 ? '+' : ''}${parseFloat(t.change24h).toFixed(1)}%
            </span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);margin-top:8px">
            <span>价格: $${formatNumber(t.price)}</span>
            <span>市值: $${formatCompact(t.marketCap)}</span>
          </div>
          <div style="margin-top:10px">
            <button class="btn btn-sm btn-orange" onclick="fillCoinFromToken('${t.symbol}', '${t.symbol}')">发币</button>
          </div>
        </div>
      `).join('');
    }

    // 钱包 PnL 排行
    if (hasWallets) {
      html += '<div style="grid-column:1/-1;margin-top:16px;margin-bottom:8px"><h3 style="font-size:16px;font-weight:700;margin-bottom:12px">🏆 钱包 PnL 排行</h3></div>';
      html += data.wallets.map(w => `
        <div class="sm-card">
          <div class="sm-header">
            <div style="display:flex;align-items:center;gap:8px">
              ${w.avatar ? `<img src="${w.avatar}" style="width:24px;height:24px;border-radius:50%" onerror="this.style.display='none'" />` : ''}
              <span class="sm-address">${w.label || (w.address.slice(0, 6) + '...' + w.address.slice(-4))}</span>
            </div>
            <span class="sm-pnl ${w.pnl >= 0 ? 'change up' : 'change down'}">
              PnL: ${w.pnl >= 0 ? '+' : ''}$${formatCompact(w.pnl)}
            </span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:6px;font-family:monospace">
            ${w.address.slice(0, 8)}...${w.address.slice(-6)}
          </div>
        </div>
      `).join('');
    }

    grid.innerHTML = html;
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>加载失败: ${err.message}</p></div>`;
  }
}

// ========== GENERATOR ==========
async function generateSuggestions() {
  const list = document.getElementById('suggestionsList');
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>AI 正在分析热点叙事并生成发币建议...</p></div>';

  try {
    const res = await fetch(`${API_BASE}/generate-suggestions`);
    const data = await res.json();

    if (!data.suggestions || data.suggestions.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>暂时没有合适的发币建议</p></div>';
      return;
    }

    list.innerHTML = data.suggestions.map((s, i) => `
      <div class="suggestion-card" onclick="selectSuggestion(${i})">
        <div class="suggestion-symbol">$${s.symbol}</div>
        <div class="suggestion-name">${s.name}</div>
        <div class="suggestion-desc">${s.description}</div>
        <div class="suggestion-narrative-source">
          📌 叙事来源: ${s.narrativeSource || '市场热点'}
        </div>
      </div>
    `).join('');

    window._suggestions = data.suggestions;
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p>生成失败: ${err.message}</p></div>`;
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

async function submitCoin(e) {
  e.preventDefault();
  const result = document.getElementById('launchResult');
  result.style.display = 'block';
  result.className = 'launch-result';
  result.textContent = '🚀 正在提交到 Jumpbot...';

  const formData = new FormData();
  formData.append('symbol', document.getElementById('coinSymbol').value);
  formData.append('name', document.getElementById('coinName').value);
  formData.append('descr', document.getElementById('coinDescr').value);

  const logoFile = document.getElementById('coinLogo').files[0];
  if (logoFile) formData.append('logo', logoFile);

  try {
    const res = await fetch(`${API_BASE}/launch-coin`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (data.success) {
      result.className = 'launch-result success';
      result.textContent = `✅ 发射成功！代币 $${data.symbol} 已提交到 Jumpbot.ai`;
    } else {
      result.className = 'launch-result error';
      result.textContent = `❌ 发射失败: ${data.error || '未知错误'}`;
    }
  } catch (err) {
    result.className = 'launch-result error';
    result.textContent = `❌ 网络错误: ${err.message}`;
  }
}

// ========== HELPERS ==========
function useNarrativeForCoin(encodedNarrative) {
  const n = JSON.parse(decodeURIComponent(encodedNarrative));
  // Switch to generator tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-tab="generator"]').classList.add('active');
  document.getElementById('panel-generator').classList.add('active');
  // Pre-fill description
  document.getElementById('coinDescr').value = n.description;
}

function fillCoinFromToken(symbol, name) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector('[data-tab="generator"]').classList.add('active');
  document.getElementById('panel-generator').classList.add('active');
  document.getElementById('coinSymbol').value = symbol;
  document.getElementById('coinName').value = name;
}

function viewNarrativeDetail(encodedTitle) {
  // TODO: modal with full narrative detail
  alert('详情功能开发中...');
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

// ========== LOGO PREVIEW ==========
document.getElementById('coinLogo')?.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById('logoPreview').innerHTML = `<img src="${ev.target.result}" />`;
  };
  reader.readAsDataURL(file);
});

// ========== INIT ==========
loadNarratives();
