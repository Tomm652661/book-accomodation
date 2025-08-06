// server/utils/priceCalculator.js
const config = require('../config/config.json');

async function calculatePrice(startDate, endDate, currency) {
    const start = new Date(startDate);
    const end   = new Date(endDate);
    if (end <= start) throw new Error('Datum odjezdu musí být po datu příjezdu');
    const nights = (end - start) / (1000*3600*24);
    if (nights < config.min_night_count) {
        throw new Error(`Minimálně ${config.min_night_count} nocí`);
    }

    let total = 0;
    const specials = config.special_day_prices;
    for (let d = new Date(start); d < end; d.setDate(d.getDate()+1)) {
        const key = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        total += specials[key] ?? config.min_day_price;
    }

    if (currency === 'EUR') {
        return Math.round((total / config.czk_eur_rate) * 100) / 100;
    }
    if (currency === 'BTC') {
        const eur = total / config.czk_eur_rate;
        return Math.round((eur / config.btc_eur_rate) * 100000000) / 100000000;
    }
    return total;
}

module.exports = { calculatePrice };
