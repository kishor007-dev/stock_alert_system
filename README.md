# 📈 Global Stock Alert Engine
**A high-performance concurrent background worker system for real-time market tracking and push notifications across Indian and US stock markets.**

---

## 🌐 Live Demo

| Panel | Link |
| :--- | :--- |
| 🖥️ Frontend UI | [stockalertsystem.vercel.app](https://stockalertsystem.vercel.app) |
| ⚙️ Backend API | (https://stock-alert-system-fctp.onrender.com) |

---

## 🚀 Overview
The Global Stock Alert Engine is a full-stack trading application that monitors real-time market data without exhausting API rate limits.

It allows:
- Users to search over 34,000 global equities and set strict condition-based price alerts.
- The background engine to batch-process thousands of alerts asynchronously.
- The system to deliver native OS push notifications directly to the user's screen the moment a price target is hit.

The system combines **Concurrency Locks, In-Memory Caching, and Service Workers** to deliver a production-ready, Zerodha-style trading architecture.

---

## 🔥 Key Features

### 📊 Market Tracking
- Search and monitor ~5,000 Indian Equities (NSE)
- Search and monitor ~24,000 US Equities and ETFs (NASDAQ/NYSE)
- Lightning-fast local database search (bypassing external API latency)

### 🔔 Alert Engine
- Set complex price conditions (Crosses Above `>`, Drops Below `<`)
- Set recurring timer updates (for every X minutes)
- Asynchronous background worker loop runs every 15 seconds
- Native OS push notifications even when the web app is closed

### ⚡ Backend Architecture
- **Concurrency Locks:** Prevents overlapping worker cycles during heavy loads.
- **Worker Batching:** Groups alerts by instrument, reducing `O(N)` API calls to `O(1)` per stock.
- **In-Memory Rate Limiting:** Utilizes `NodeCache` to serve live prices from RAM, preventing Upstox/Finnhub API bans.
- **Stream Parsing:** Downloads and unzips `.csv.gz` files using Node.js Streams to index massive datasets without memory crashes.

### 🌐 Holographic UI
- Physics-driven 3D globe rendering using `Three.js`
- Glassmorphism design and real-time dashboard updates

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas / Mongoose |
| Memory/Cache | NodeCache, JavaScript `Set` Deduplication |
| Frontend | HTML, CSS, JavaScript, Three.js |
| APIs | Upstox API v2, Finnhub API |
| Real-time / Push | Firebase Admin SDK, FCM Service Workers |
| Data Processing | Axios, Zlib, CSV-Parser (Streams) |

---

## 🆕 Recent Updates
- ✅ Stream parsing & deduplication of the Upstox Master Contract CSV
- ✅ Dual-market integration (Indian & US stocks)
- ✅ In-memory rate limiting implementation to bypass API restrictions
- ✅ Firebase native OS push notifications via Service Workers
- ✅ Dynamic caching and background worker concurrency locks
- ✅ Environment-based configuration (.env)
- ✅ Live deployment on Vercel

---

## 📂 Project Structure

```text
STOCK_ANALYZER/
│
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   ├── firebase-service-account.json
│   │   └── firebase.js
│   ├── models/
│   │   ├── alert.js
│   │   └── Instrument.js
│   ├── routes/
│   │   ├── alert.js
│   │   └── search.js
│   ├── scripts/
│   │   └── seedAll.js
│   ├── services/
│   │   ├── notificationService.js
│   │   ├── priceService.js
│   │   ├── searchService.js
│   │   └── stockResolver.js
│   ├── .env
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── worker.js
│
├── frontend/
│   ├── app.js
│   ├── firebase-messaging-sw.js
│   ├── index.html
│   ├── manifest.json
│   └── styles.css
│
├── .gitignore
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository
```bash
git clone https://github.com/kishor007-dev/stock_alert_system.git
cd stock_alert_system
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

### 3️⃣ Environment Variables
Create a `.env` file in the backend folder:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stock-alert-system

# External APIs
UPSTOX_ACCESS_TOKEN=your_upstox_analytics_token
FINNHUB_API_KEY=your_finnhub_api_key

# Firebase Admin Credentials
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key"
```

### 4️⃣ Seed Master Database
Download, unzip, and parse the 34,000+ global stocks into your local database:
```bash
npm run seed
```

### 5️⃣ Boot the Backend Engine
Start the API gateway and the background alert worker:
```bash
npm run dev
```

### 6️⃣ Run the Frontend Locally
The frontend is already live at [stock-alert-system-vert.vercel.app](https://stock-alert-system-vert.vercel.app). To run it locally instead (e.g. for development), open a new terminal, navigate to the `frontend` folder, and serve it to enable Service Workers:
```bash
cd frontend
npx serve -l 5000
```
Open http://localhost:5000 in your browser.

---

## 🔗 Repository
https://github.com/kishor007-dev/stock_alert_system

---

## 📌 Future Improvements
- [ ] JWT-based user authentication & session management
- [ ] OAuth broker login (Zerodha/Upstox) for automated trade execution
- [ ] WebSockets integration for a live-ticking chart UI
- [ ] Options & Futures contract support
- [ ] Docker containerization for cloud deployment

---

## 🧠 Learnings
- Built highly scalable background workers utilizing concurrency locks.
- Processed massive data sets securely using Node.js Streams and in-memory Set deduplication.
- Protected third-party API limits using strict NodeCache strategies.
- Implemented Firebase Service Workers for offline/background web push notifications.
- Separated modular architecture (Services, Routes, Config, Workers) for enterprise-level maintainability.

---

## 📜 License
This project is for educational and portfolio purposes.