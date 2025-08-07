document.addEventListener('DOMContentLoaded', () => {
    // Globální stav aplikace
    const API_BASE_URL = '/api';
    const contentEl = document.getElementById('content');
    let translations = {};
    let currentLang = 'cs';
    let unavailableDates = [];
    let minOrderDate = new Date().toISOString().split('T')[0];
    let publicConfig = {};
    let lastCalculatedPrice = null;

    const contactHTML = `...`; // beze změny

    const pageTemplates = {
        page_index: `
            <div id="page_index" class="pagediv">
                <h3 data-lang-key="menu_pricelist"></h3>
                <div data-lang-key="pricelist_intro"></div><br>
                <table class="pricing-table">
                    <tr><td><strong data-lang-key="min_nights"></strong></td><td><strong data-lang-key="max_persons"></strong></td></tr>
                    <tr><td data-lang-key="price_label"></td><td data-lang-key="price_value"></td></tr>
                    <tr><td></td><td data-lang-key="price_eur_value"></td></tr>
                    <tr><td></td><td data-lang-key="price_btc_value"></td></tr>
                    <tr><td data-lang-key="address_label"></td><td data-lang-key="address_value"></td></tr>
                    <tr><td data-lang-key="wifi_free"></td><td data-lang-key="parking_free"></td></tr>
                    <tr>
                        <td colspan="2" style="padding-top: 20px;">
                            <a href="https://1url.cz/muFX9" target="_blank" rel="noopener" class="booking-link-layout">
                                <img src="img/booking.png" alt="Booking.com" style="width: 250px; height: 200px; object-fit: contain;">
                                <p data-lang-key="booking_reviews_text"></p>
                            </a>
                        </td>
                    </tr>
                    <tr><td colspan="2">${contactHTML}</td></tr>
                </table>
            </div>
            <div id="booking-container" class="pagediv">
                <h3 data-lang-key="booking_heading"></h3>
                <form id="booking-form">
                    <div class="form-group"><label for="start-date" data-lang-key="checkin_date"></label><input type="date" id="start-date" required></div>
                    <div class="form-group"><label for="end-date" data-lang-key="checkout_date"></label><input type="date" id="end-date" required></div>
                    <div class="form-group"><label for="email" data-lang-key="email_label"></label><input type="email" id="email" required></div>
                    <div class="form-group"><label for="currency" data-lang-key="currency_label"></label><select id="currency"><option>CZK</option><option>EUR</option><option>BTC</option></select></div>
                    <div id="price-display"></div>
                    <div id="error-message"></div>
                    <button type="submit" data-lang-key="submit_button" disabled></button>
                </form>
                <div id="payment-options" style="display:none;">
                    <h4 data-lang-key="payment_options"></h4><p data-lang-key="booking_confirmation_message"></p>
                    <div id="payment-czk" class="payment-info" style="display:none;"><p><span data-lang-key="account_czk_label"></span> <b class="account-czk"></b></p></div>
                    <div id="payment-eur" class="payment-info" style="display:none;"><p><span data-lang-key="account_eur_label"></span> <b class="account-eur"></b></p></div>
                    <div id="payment-btc" class="payment-info" style="display:none;"><p><span data-lang-key="btc_address_label"></span> <b class="btc-address"></b></p><img id="btc-qr" alt="BTC QR Code"></div>
                    <p data-lang-key="payment_info"></p>
                </div>
            </div>`,
        page_amenities: `...`, // beze změny
        page_gallery: `...`, // beze změny
        page_contact: `...` // beze změny
    };

    const formatDateToYYYYMMDD = (date) => { /* ... obsah beze změny ... */ };
    const populateContactInfo = () => { /* ... obsah beze změny ... */ };
    const localizeContent = () => { /* ... obsah beze změny ... */ };
    const setupBookingForm = () => { /* ... obsah beze změny ... */ };
    const renderPage = (pageId) => { /* ... obsah beze změny ... */ };
    const initializeApp = async () => { /* ... obsah beze změny ... */ };

    initializeApp();
});