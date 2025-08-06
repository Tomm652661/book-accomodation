// server/utils/emailSender.js
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
require('dotenv').config();

async function sendBookingEmail({startDate,endDate,email,price,currency}) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: +process.env.SMTP_PORT,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });

    let paymentHtml = '';
    if (currency === 'CZK') {
        paymentHtml = `<p>Účet CZK: <b>${process.env.ACCOUNT_CZK}</b></p>`;
    } else if (currency === 'EUR') {
        paymentHtml = `<p>Účet EUR: <b>${process.env.ACCOUNT_EUR}</b></p>`;
    } else {
        const uri = `bitcoin:${process.env.BTC_WALLET_ADDRESS}?amount=${price}`;
        const qr  = await QRCode.toDataURL(uri);
        paymentHtml = `<p>BTC adresa: <b>${process.env.BTC_WALLET_ADDRESS}</b></p>
                   <img src="${qr}" width="150" alt="QR">`;
    }

    await transporter.sendMail({
        from: process.env.SMTP_USER,
        to:   `${email},${process.env.ADMIN_EMAIL}`,
        subject: 'Potvrzení rezervace',
        html: `<h3>Vaše rezervace</h3>
           <ul>
             <li>Od: ${startDate}</li>
             <li>Do: ${endDate}</li>
             <li>Cena: ${price} ${currency}</li>
           </ul>
           ${paymentHtml}`
    });
}

module.exports = { sendBookingEmail };
