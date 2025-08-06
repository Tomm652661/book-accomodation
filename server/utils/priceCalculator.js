const config = require('../config/config.json');
const fetch = require('node-fetch');

async function getBtcEurRate() {
    try {
        const response = await fetch(config.currency_api_url);
        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data.bitcoin.eur;
    } catch (e) {
        console.error('Nepodařilo se načíst kurz BTC/EUR, používá se záložní hodnota.', e.message);
        return 60000;
    }
}

async function calculatePrice(startDate, endDate, currency) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        throw new Error('Neplatné datum. Datum odjezdu musí být po datu příjezdu.');
    }

    const nights = (end - start) / (1000 * 3600 * 24);
    if (nights < config.min_night_count) {
        throw new Error(`Minimální délka pobytu je ${config.min_night_count} nocí.`);
    }

    let totalPrice = 0;
    const specialPrices = config.special_day_prices;

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `${month}-${day}`;
        totalPrice += specialPrices[key] || config.min_day_price;
    }

    switch (currency.toUpperCase()) {
        case 'EUR':
            return Math.round((totalPrice / config.czk_eur_rate) * 100) / 100;
        case 'BTC':
            const priceInEur = totalPrice / config.czk_eur_rate;
            const btcRate = await getBtcEurRate();
            return (priceInEur / btcRate).toFixed(8);
        default:
            return totalPrice;
    }
}

module.exports = { calculatePrice };