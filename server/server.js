const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { fetchAndParseIcal } = require('./utils/icalParser');
const { calculatePrice } = require('./utils/priceCalculator');
const { sendBookingEmail } = require('./utils/emailSender');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client')));

cron.schedule('0 * * * *', fetchAndParseIcal);
fetchAndParseIcal().catch(console.error);

app.get('/api/availability', (req, res) => {
    const file = path.join(__dirname, 'data/booked_dates.json');
    if (!fs.existsSync(file)) return res.status(500).json({ error: 'No data' });
    const dates = JSON.parse(fs.readFileSync(file));
    const min = new Date();
    min.setDate(min.getDate() + parseInt(process.env.MIN_DAYS_AHEAD));
    res.json({ unavailableDates: dates, minOrderDate: min.toISOString().split('T')[0] });
});

app.get('/api/config', (req, res) => {
    res.json({
        account_czk: process.env.ACCOUNT_CZK,
        account_eur: process.env.ACCOUNT_EUR,
        btc_wallet_address: process.env.BTC_WALLET_ADDRESS,
        min_night_count: require('./config/config.json').min_night_count
    });
});

app.get('/api/translations', (req, res) => {
    res.sendFile(path.join(__dirname, 'data/translations.json'));
});

app.post('/api/calculate-price', async (req, res) => {
    try {
        const { startDate, endDate, currency } = req.body;
        const price = await calculatePrice(startDate, endDate, currency);
        res.json({ price });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/book', async (req, res) => {
    try {
        const { startDate, endDate, email, currency } = req.body;
        const price = await calculatePrice(startDate, endDate, currency);
        await sendBookingEmail({ startDate, endDate, email, price, currency });
        res.json({ message: 'Booking received. Confirmation after payment.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => console.log(`Server running on http://localhost:${port}`));