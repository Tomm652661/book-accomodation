const https = require('https');
const ical = require('ical.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const config = require('../config/config.json');

const cachePath = path.join(__dirname, '../data/booked_dates.json');

async function fetchAndParseIcal() {
    const url = process.env.ICAL_URL;
    if (!url) {
        console.error('Chyba: ICAL_URL není definována v .env souboru.');
        return [];
    }

    return new Promise((resolve, reject) => {
        https.get(url, res => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Nepodařilo se načíst iCal feed. Status: ${res.statusCode}`));
            }

            let rawData = '';
            res.on('data', chunk => rawData += chunk);
            res.on('end', () => {
                try {
                    const jcalData = ical.parse(rawData);
                    const component = new ical.Component(jcalData);
                    const vevents = component.getAllSubcomponents('vevent');
                    const dates = [];

                    vevents.forEach(event => {
                        const startProp = event.getFirstPropertyValue('dtstart');
                        const endProp = event.getFirstPropertyValue('dtend');
                        if (!startProp || !endProp) return;

                        let startDate = startProp.toJSDate();
                        let endDate = endProp.toJSDate();

                        startDate.setDate(startDate.getDate() + config.pause_days_before);
                        endDate.setDate(endDate.getDate() + config.pause_days_after);

                        for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
                            // --- OPRAVA ZDE ---
                            // Ruční formátování data na YYYY-MM-DD, aby se předešlo chybám s časovou zónou.
                            // Nahrazuje původní d.toISOString().split('T')[0], které způsobovalo posun.
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            dates.push(`${year}-${month}-${day}`);
                        }
                    });

                    const uniqueDates = [...new Set(dates)].sort();
                    fs.writeFileSync(cachePath, JSON.stringify(uniqueDates, null, 2));
                    console.log(`iCal feed úspěšně aktualizován: ${uniqueDates.length} dnů označeno jako obsazených.`);
                    resolve(uniqueDates);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

module.exports = { fetchAndParseIcal };