// server/server.js
const express    = require('express');
const cors       = require('cors');
const cron       = require('node-cron');
const bodyParser = require('body-parser');
const fs         = require('fs');
const path       = require('path');
require('dotenv').config();

const { fetchAndParseIcal } = require('./utils/icalParser');
const { calculatePrice }    = require('./utils/priceCalculator');
const { sendBookingEmail }  = require('./utils/emailSender');

const app  = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
// Slouží statické soubory z adresáře 'client'
app.use(express.static(path.join(__dirname,'../client')));

// Update iCal every hour
cron.schedule('0 * * * *', () => {
    console.log('Running hourly iCal update...');
    fetchAndParseIcal().catch(console.error);
});
// Spustí update iCal při startu serveru
console.log('Starting initial iCal update...');
fetchAndParseIcal().catch(console.error);

// GET /api/availability
app.get('/api/availability', (req,res) => {
    const file = path.join(__dirname,'data/booked_dates.json');
    if (!fs.existsSync(file)) {
        console.error('Error: booked_dates.json not found');
        return res.status(500).json({ error:'Availability data not found. Please check server setup.' });
    }
    const dates = JSON.parse(fs.readFileSync(file));
    const min   = new Date();
    min.setDate(min.getDate() + parseInt(process.env.MIN_DAYS_AHEAD));
    res.json({ unavailableDates: dates, minOrderDate: min.toISOString().split('T')[0] });
});

// GET /api/config
app.get('/api/config', (req, res) => {
    // Poskytuje frontendu veřejné konfigurační údaje
    res.json({
        account_czk: process.env.ACCOUNT_CZK,
        account_eur: process.env.ACCOUNT_EUR,
        btc_wallet_address: process.env.BTC_WALLET_ADDRESS
    });
});

// GET /api/translations
app.get('/api/translations', (req, res) => {
    const file = path.join(__dirname, 'data/translations.json');
    if (!fs.existsSync(file)) {
        console.error('Error: translations.json not found');
        return res.status(500).json({ error: 'Translations data not found.' });
    }
    res.sendFile(file);
});

// POST /api/calculate-price
app.post('/api/calculate-price', async (req,res) => {
    try {
        const { startDate, endDate, currency } = req.body;
        const price = await calculatePrice(startDate,endDate,currency);
        res.json({ price });
    } catch(e) {
        console.error('Price calculation error:', e.message);
        res.status(400).json({ error: e.message });
    }
});

// POST /api/book
app.post('/api/book', async (req,res) => {
    try {
        const { startDate,endDate,email,currency } = req.body;
        const price = await calculatePrice(startDate,endDate,currency);
        await sendBookingEmail({ startDate,endDate,email,price,currency });
        res.json({ message:'Booking received. Confirmation after payment.' });
    } catch(e) {
        console.error('Booking error:', e);
        res.status(500).json({ error:'Server error' });
    }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));