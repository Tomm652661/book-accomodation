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
const port = process.env.PORT || 3000;

// Definice cest k datovým souborům
const bookedDatesPath = path.join(__dirname, 'data/booked_dates.json');
const translationsPath = path.join(__dirname, 'data/translations.json');
const configPath = path.join(__dirname, 'config/config.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
// Nastavení servírování statických souborů (CSS, JS, obrázky) ze složky 'client'
app.use(express.static(path.join(__dirname, '../client')));

// Inicializace a naplánování synchronizace iCal (každou hodinu)
cron.schedule('0 */1 * * *', () => {
    console.log('Spouštím plánovanou aktualizaci iCal feedu...');
    fetchAndParseIcal().catch(error => console.error('Při plánované aktualizaci iCal došlo k chybě:', error));
});

// Prvotní synchronizace iCal hned po startu serveru
console.log('Spouštím prvotní aktualizaci iCal feedu při startu serveru...');
fetchAndParseIcal().catch(error => console.error('Při prvotní aktualizaci iCal došlo k chybě:', error));

// --- API Endpoints ---

// Endpoint pro zjištění dostupnosti a minimálního data pro objednávku
app.get('/api/availability', (req, res) => {
    try {
        if (!fs.existsSync(bookedDatesPath)) {
            console.warn(`Soubor ${bookedDatesPath} nebyl nalezen. Vytvářím prázdný soubor.`);
            fs.writeFileSync(bookedDatesPath, '[]');
        }
        const dates = JSON.parse(fs.readFileSync(bookedDatesPath));
        const minDate = new Date();
        minDate.setDate(minDate.getDate() + parseInt(process.env.MIN_DAYS_AHEAD || '1'));
        res.json({
            unavailableDates: dates,
            minOrderDate: minDate.toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Chyba v /api/availability:', error);
        res.status(500).json({ error: 'Server error while getting availability.' });
    }
});

// Endpoint pro veřejnou konfiguraci (čísla účtů, atd.)
app.get('/api/config', (req, res) => {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        res.json({
            account_czk: process.env.ACCOUNT_CZK,
            account_eur: process.env.ACCOUNT_EUR,
            btc_wallet_address: process.env.BTC_WALLET_ADDRESS,
            min_night_count: config.min_night_count
        });
    } catch (error) {
        console.error('Chyba v /api/config:', error);
        res.status(500).json({ error: 'Server configuration error.' });
    }
});

// **OPRAVENÝ ENDPOINT** pro načítání překladů
app.get('/api/translations', (req, res) => {
    try {
        const translationsData = fs.readFileSync(translationsPath, 'utf8');
        res.setHeader('Content-Type', 'application/json');
        res.send(translationsData);
    } catch (error) {
        console.error(`KRITICKÁ CHYBA: Nepodařilo se načíst soubor s překlady na cestě ${translationsPath}`, error);
        res.status(500).json({ error: 'Server configuration error: Cannot read translations file.' });
    }
});

// Endpoint pro kalkulaci ceny
app.post('/api/calculate-price', async (req, res) => {
    try {
        const { startDate, endDate, currency } = req.body;
        const price = await calculatePrice(startDate, endDate, currency);
        res.json({ price });
    } catch (e) {
        console.error('Chyba při kalkulaci ceny:', e.message);
        res.status(400).json({ error: e.message });
    }
});

// **OPRAVENÝ ENDPOINT** pro vytvoření rezervace s prevencí dvojitého bookingu
app.post('/api/book', async (req, res) => {
    try {
        const { startDate, endDate, email, currency } = req.body;

        // --- Kritická sekce: Zamezení dvojité rezervace ---
        const currentlyBooked = JSON.parse(fs.readFileSync(bookedDatesPath, 'utf-8'));
        const newBookingDates = [];
        for (let d = new Date(startDate); d < new Date(endDate); d.setDate(d.getDate() + 1)) {
            const dateString = d.toISOString().split('T')[0];
            if (currentlyBooked.includes(dateString)) {
                console.warn(`Pokus o rezervaci již obsazeného termínu: ${dateString} od ${email}`);
                return res.status(409).json({ error: 'conflict' }); // 409 Conflict
            }
            newBookingDates.push(dateString);
        }

        const price = await calculatePrice(startDate, endDate, currency);
        await sendBookingEmail({ startDate, endDate, email, price, currency });

        // Přidání nové rezervace do souboru
        const updatedBookedDates = [...new Set([...currentlyBooked, ...newBookingDates])].sort();
        fs.writeFileSync(bookedDatesPath, JSON.stringify(updatedBookedDates, null, 2));
        console.log(`Nová rezervace úspěšně uložena pro termín ${startDate} - ${endDate}.`);
        // --- Konec kritické sekce ---

        res.status(200).json({ message: 'booking_confirmation_message', price: price });

    } catch (e) {
        console.error('Došlo k chybě při zpracování rezervace:', e);
        if (e.message.includes('Minimální délka pobytu')) {
            return res.status(400).json({ error: e.message });
        }
        res.status(500).json({ error: 'server_error' });
    }
});

// Start serveru
app.listen(port, () => console.log(`Server běží na portu ${port}`));