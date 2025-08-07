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
    if (nights <= 0) {
        throw new Error('Pobyt musí trvat alespoň jednu noc.');
    }

    let totalPrice = 0;

    // --- ZMĚNA LOGIKY PRO VÝPOČET CENY ---
    // Pokud je pobyt kratší nebo roven minimálnímu počtu nocí (např. 1-6 nocí)
    if (nights <= config.min_night_count) {
        // Cena je fixní paušál: minimální počet nocí * cena za den.
        // Speciální ceny (např. Vánoce) se pro tento paušál neuplatňují.
        totalPrice = config.min_night_count * config.min_day_price;
    } else {
        // Pokud je pobyt delší (7+ nocí), použije se původní logika s denní sazbou
        // a zohledněním speciálních cen.
        const specialPrices = config.special_day_prices;
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const key = `${month}-${day}`;
            totalPrice += specialPrices[key] || config.min_day_price;
        }
    }
    // --- KONEC ZMĚNY LOGIKY ---

    // Převod na měny zůstává beze změny
    switch (currency.toUpperCase()) {
        case 'EUR':
            return Math.round((totalPrice / config.czk_eur_rate) * 100) / 100;
        case 'BTC':
            const priceInEur = totalPrice / config.czk_eur_rate;
            const btcRate = await getBtcEurRate();
            return (priceInEur / btcRate).toFixed(8);
        default: // CZK
            return totalPrice;
    }
}

module.exports = { calculatePrice };