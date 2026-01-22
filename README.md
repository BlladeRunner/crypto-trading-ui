# BlockView ⎔

**BlockView** is a modern crypto market screener inspired by Binance-style UI.  
Built with **React + Vite + Tailwind CSS**, focused on clean UX, performance, and real-time market data.

> Portfolio project demonstrating frontend, UI engineering, and data-driven interfaces.

---

## ✨ Features

- 📈 **Real-time market data** (CoinGecko API)
- 🔍 **Fast coin search** with `/` hotkey
- ↕️ **Sortable screener**
  - Price
  - 24h Change
  - Market Cap
  - Volume (24h)
- ⭐ **Watchlist** (persisted via LocalStorage)
- 📊 **Mini sparklines (24h trends)**
- 🎨 **Custom SVG branding & dark UI**
- ⚡ **Optimized rendering** using `useMemo`
- 🧠 Clean component & hooks architecture

---

## 🧱 Tech Stack

- **React**
- **Vite**
- **Tailwind CSS v4**
- **JavaScript (ES6+)**
- **CoinGecko API**

---

## 🚀 Getting Started

### Install dependencies
```bash
npm install
npm run dev
http://localhost:5173
```

## 📂 Project Structure
src/
├─ api/          # API clients (CoinGecko)
├─ components/   # UI components (Table, Footer, Logo)
├─ hooks/        # Custom hooks
├─ utils/        # Helpers & formatters
├─ data/         # Mock / static data

## 🛣 Roadmap
Planned improvements:
- ⏱ Timeframes (1h / 24h / 7d)
- 📉 Full coin view (modal / page)
- 🎯 Gainers / Losers logic
- 💡 Hover insights & tooltips
- 🧪 Skeleton loaders
- 🌐 Deployment (Vercel)

## ⚠️ Disclaimer
Market data is provided for informational purposes only
This project is not financial advice.

## 👤 Author
Built as a portfolio project to demonstrate frontend & UI engineering skills.

🔙 [Back to Portfolio](https://github.com/BlladeRunner)