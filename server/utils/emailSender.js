const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
require('dotenv').config();

async function sendBookingEmail({ startDate, endDate, email, price, currency }) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: +process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    let paymentDetailsHtml = '';
    const formattedPrice = `${price} ${currency}`;

    if (currency === 'CZK') {
        paymentDetailsHtml = `
            <p><strong>Částka k úhradě:</strong> ${formattedPrice}</p>
            <p><strong>Číslo účtu (CZK):</strong> ${process.env.ACCOUNT_CZK}</p>`;
    } else if (currency === 'EUR') {
        paymentDetailsHtml = `
            <p><strong>Amount to pay:</strong> ${formattedPrice}</p>
            <p><strong>Account (EUR):</strong> ${process.env.ACCOUNT_EUR}</p>`;
    } else if (currency === 'BTC') {
        const btcUri = `bitcoin:${process.env.BTC_WALLET_ADDRESS}?amount=${price}`;
        const qrCodeDataUrl = await QRCode.toDataURL(btcUri);
        paymentDetailsHtml = `
            <p><strong>Amount to pay:</strong> ${formattedPrice}</p>
            <p><strong>BTC Wallet Address:</strong> ${process.env.BTC_WALLET_ADDRESS}</p>
            <p>Pro snadnou platbu naskenujte QR kód:</p>
            <img src="${qrCodeDataUrl}" width="150" height="150" alt="BTC Payment QR Code">`;
    }

    const mailOptions = {
        from: `"Ubytování Praha Zbraslav" <${process.env.SMTP_USER}>`,
        to: `${email}, ${process.env.ADMIN_EMAIL}`, // Odeslání klientovi i administrátorovi
        subject: 'Potvrzení přijetí objednávky / Booking Request Confirmation',
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Děkujeme za Vaši objednávku / Thank You for Your Booking Request</h2>
                <p>Přijali jsme Vaši poptávku na ubytování v termínu:</p>
                <p>We have received your booking request for the following dates:</p>
                <ul>
                    <li><strong>Příjezd / Check-in:</strong> ${startDate}</li>
                    <li><strong>Odjezd / Check-out:</strong> ${endDate}</li>
                    <li><strong>Celková cena / Total Price:</strong> ${formattedPrice}</li>
                </ul>
                <hr>
                <h3>Platební údaje / Payment Information</h3>
                <p>Vaše rezervace bude finálně potvrzena po obdržení platby.</p>
                <p>Your booking will be confirmed upon receipt of payment.</p>
                ${paymentDetailsHtml}
                <br>
                <p>S pozdravem,</p>
                <p>Ubytování Praha Zbraslav</p>
            </div>`
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email s potvrzením odeslán na ${email}.`);
}

module.exports = { sendBookingEmail };