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

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'../client')));

// aktualizace iCal každou hodinu
cron.schedule('0 * * * *', fetchAndParseIcal);
fetchAndParseIcal().catch(console.error);

// GET /api/availability
app.get('/api/availability', (req, res) => {
    const file = path.join(__dirname,'data/booked_dates.json');
    if (!fs.existsSync(file)) return res.status(500).json({error:'No data'});
    const dates = JSON.parse(fs.readFileSync(file));
    const min = new Date();
    min.setDate(min.getDate() + parseInt(process.env.MIN_DAYS_AHEAD));
    res.json({ unavailableDates: dates, minOrderDate: min.toISOString().split('T')[0] });
});

// POST /api/calculate-price
app.post('/api/calculate-price', async (req, res) => {
    try {
        const { startDate, endDate, currency } = req.body;
        const price = await calculatePrice(startDate, endDate, currency);
        res.json({ price });
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// POST /api/book
app.post('/api/book', async (req, res) => {
    try {
        const { startDate, endDate, email, currency } = req.body;
        const price = await calculatePrice(startDate, endDate, currency);
        await sendBookingEmail({ startDate, endDate, email, price, currency });
        res.json({ message: 'Objednávka přijata. Zkontrolujeme a potvrdíme.' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
