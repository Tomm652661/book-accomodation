// server/utils/icalParser.js
const https = require('https');
const ical = require('ical.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const config = require('../config/config.json');
const cachePath = path.join(__dirname, '../data/booked_dates.json');

async function fetchAndParseIcal() {
    const url = process.env.ICAL_URL;
    if (!url) throw new Error('Missing ICAL_URL');
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try {
                    const jcal = ical.parse(raw);
                    const comp = new ical.Component(jcal);
                    const vevents = comp.getAllSubcomponents('vevent');
                    const dates = [];
                    vevents.forEach(ev => {
                        let start = ev.getFirstPropertyValue('dtstart').toJSDate();
                        let end   = ev.getFirstPropertyValue('dtend').toJSDate();
                        start.setDate(start.getDate() + config.pause_days_before);
                        end.setDate(end.getDate() + config.pause_days_after);
                        for (let d = new Date(start); d < end; d.setDate(d.getDate()+1)) {
                            dates.push(d.toISOString().split('T')[0]);
                        }
                    });
                    fs.writeFileSync(cachePath, JSON.stringify(dates, null, 2));
                    console.log('iCal updated:', dates.length, 'dates');
                    resolve(dates);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', err => reject(err));
    });
}

module.exports = { fetchAndParseIcal };
