# Accommodation

## 1. Purpose
This document describes how to deploy and run the “Accommodation” application  
and exactly where to place all static images.

## 2. Project Structure
```
/accommodation
│
├── client
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── img/
│       ├── kalen.jpg
│       ├── kalen2.jpg
│       ├── kalen3.jpg
│       ├── zbr4.jpg
│       ├── ... (all other images)
│       ├── booking.png
│       └── tlf.png
│
├── server
│   ├── config
│   │   └── config.json
│   ├── data
│   │   └── booked_dates.json  ← initialize as []
│   ├── utils
│   │   ├── icalParser.js
│   │   ├── priceCalculator.js
│   │   └── emailSender.js
│   └── server.js
│
├── .env
├── package.json
└── README.html
```

## 3. Image Placement
Place all static images in:
```
/accommodation/client/img/
```

## 4. References in `index.html`
```html
<img src="img/kalen3.jpg" alt="Photo">
<img src="img/booking.png" alt="Booking.com">
<img src="img/tlf.png" alt="Phone icon">
```

## 5. Running the App
1. Install Node.js (v16+) and npm.  
2. Clone the repo and install dependencies:
   ```bash
   git clone <url>
   cd accommodation
   npm install
   ```
3. Create `.env` (see template in repo root).  
4. Initialize `server/data/booked_dates.json` as `[]`.  
5. Start server:
   ```bash
   npm start
   ```
   or with PM2:
   ```bash
   pm2 start server/server.js --name accommodation
   ```
6. Open in browser: `http://localhost:3000`.

Your “Accommodation” app is now production-ready.
