# Narrative Hunter 🔍

**实时加密叙事发现 + 一键发币平台**

Powered by **OKX OnchainOS** | Built with 6551.io MCP

> 🌐 Live: [web4.jumpbot.fun](https://web4.jumpbot.fun)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (Vanilla JS)              │
│   Narrative Cards · Token Rankings · Wallet Connect  │
│   One-Click Launch · Smart Money · Daily Report      │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                 Backend (Node.js + Express)           │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │            OKX OnchainOS Integration             │ │
│  │                                                   │ │
│  │  • DEX Market API — 实时代币价格 & K线数据        │ │
│  │  • DEX Token API — 代币搜索 & 热门代币排名        │ │
│  │  • DEX Swap API — 最优路由 & 跨DEX聚合           │ │
│  │  • Wallet Portfolio API — 钱包余额 & 持仓查询     │ │
│  │  • Onchain Gateway — 交易广播 & Gas估算           │ │
│  │  • Signal API — 聪明钱/KOL/巨鲸链上信号           │ │
│  │                                                   │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ 6551 OpenNews │  │6551 OpenTwitter│ │ Binance W3  │ │
│  │  新闻聚合      │  │  推特KOL追踪   │  │ Social Rush │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## ⚡ OKX OnchainOS — 核心引擎

本项目深度集成 **OKX OnchainOS** 全栈链上能力，作为产品的核心数据引擎：

| OnchainOS 模块 | 用途 | 说明 |
|---|---|---|
| **DEX Market** | 代币实时价格 | K线图、交易历史、指数价格 |
| **DEX Token** | 代币发现 | 热门代币排名、代币搜索、持仓分析 |
| **DEX Swap** | 代币交易 | 500+ DEX聚合路由、最优价格 |
| **Signal API** | 链上信号 | 聪明钱追踪、KOL持仓、巨鲸动向 |
| **Wallet Portfolio** | 钱包管理 | 多链余额、DeFi持仓、资产估值 |
| **Onchain Gateway** | 链上交互 | 交易广播、Gas估算、交易状态追踪 |

支持链: **Solana · BSC · Base · Ethereum · Arbitrum · Polygon** 等 20+ 公链

---

## ✨ Features

### 📡 实时热点叙事
- 多时间维度 (1h / 6h / 12h / 24h) 叙事追踪
- 融合 Binance Social Rush、6551 Twitter KOL、新闻聚合等多数据源
- 叙事热度评分算法，智能去重排序
- SSE 实时推送，无需手动刷新

### 🪙 一键发币 (Multi-Launcher)
支持三大发射平台一键切换：
- **Jumpbot.fun** — BSC链 createAndBuy 合约部署
- **Four.meme** — BSC链 Agentic 模式发射
- **Flap.sh** — BSC链 CREATE2 + Vanity Address (8888)

全部通过用户连接的钱包签名，支持 MetaMask / OKX Wallet / Phantom / Trust Wallet

### 💰 聪明钱追踪
- OKX Signal API 驱动的三维信号：Smart Money + KOL + Whale
- 多链扫描 (SOL / BSC / BASE)
- 实时买入/卖出方向展示

### 📊 热门代币排名
- 叙事关联代币榜单
- Binance Meme Rush + OKX DEX Token 数据融合
- 代币热度打分、涨跌幅展示

### 📰 每日叙事早报
- 自动生成24小时叙事总结
- 多数据源交叉验证
- 中文叙事解读

### 👛 钱包集成
- 多钱包支持 (MetaMask / OKX Wallet / Phantom / Trust Wallet)
- BSC 网络自动切换
- 个人中心：钱包状态、发射历史

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16
- npm

### Installation

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

```env
TWITTER_TOKEN=your_6551_api_key
AVE_API_KEY=your_ave_api_key
PRIVATE_KEY=your_wallet_private_key  # Optional: for server-side operations
```

### Run

```bash
node server.js
# Server starts on port 3001
# Visit http://localhost:3001
```

### Production (PM2)

```bash
pm2 start server.js --name narrative-hunter
```

---

## 🔗 API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/narratives` | 获取实时热点叙事 |
| `GET /api/tokens` | 热门代币排名 |
| `GET /api/smart-money` | 聪明钱追踪数据 |
| `GET /api/narrative-tokens` | 叙事关联代币 |
| `GET /api/daily-report` | 每日叙事早报 |
| `GET /api/narratives/stream` | SSE 实时叙事推送 |
| `POST /api/launch-coin` | 一键发币 |

---

## 📦 Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JS
- **Blockchain**: ethers.js v6, BSC (BNB Chain)
- **Data Sources**:
  - [OKX OnchainOS](https://www.okx.com/web3/build/docs/waas/introduction-to-developer-portal-interface) — 核心链上数据引擎
  - [6551.io MCP](https://6551.io) — OpenNews + OpenTwitter
  - Binance Web3 API — Social Rush, Meme Rush
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx + Let's Encrypt SSL

---

## 🤝 Credits

- **OKX OnchainOS** — 提供全栈链上基础设施，包括 DEX 聚合、代币数据、钱包管理、链上信号等核心能力
- **6551.io** — 提供 OpenNews 和 OpenTwitter MCP 数据服务
- **Binance Web3** — 提供 Social Rush 和 Meme Rush 数据

---

## 📄 License

MIT
