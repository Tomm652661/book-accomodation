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

    const contactHTML = `
        <div class="contact-info-block">
            <p><strong>Telefon:</strong> <a id="kontakt-telefon" href="#"></a></p>
            <p><strong>Email:</strong> <a id="kontakt-email" href="#"></a></p>
        </div>
    `;

    const pageTemplates = {
        page_index: `
            <div id="page_index" class="pagediv">
                <h3 data-lang-key="menu_pricelist"></h3>
                <div data-lang-key="pricelist_intro"></div>
                <br>
                <table class="pricing-table">
                    <tr><td><strong data-lang-key="min_nights"></strong></td><td><strong data-lang-key="max_persons"></strong></td></tr>
                    <tr><td data-lang-key="price_label"></td><td data-lang-key="price_value"></td></tr>
                    <tr><td></td><td data-lang-key="price_eur_value"></td></tr>
                    <tr><td></td><td data-lang-key="price_btc_value"></td></tr>
                    <tr><td data-lang-key="address_label"></td><td data-lang-key="address_value"></td></tr>
                    <tr><td data-lang-key="wifi_free"></td><td data-lang-key="parking_free"></td></tr>
                    <tr>
                        <td colspan="2" style="padding-top: 20px;"><a href="https://www.booking.com/hotel/cz/prague-zbraslav-apartment.cs.html" target="_blank" rel="noopener"><img src="img/booking.png" alt="Booking.com" style="height: 32px;"></a></td>
                    </tr>
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
                    <h4 data-lang-key="payment_options"></h4>
                    <p data-lang-key="booking_confirmation_message"></p>
                    <div id="payment-czk" class="payment-info" style="display:none;"><p><span data-lang-key="account_czk_label"></span> <b class="account-czk"></b></p></div>
                    <div id="payment-eur" class="payment-info" style="display:none;"><p><span data-lang-key="account_eur_label"></span> <b class="account-eur"></b></p></div>
                    <div id="payment-btc" class="payment-info" style="display:none;">
                        <p><span data-lang-key="btc_address_label"></span> <b class="btc-address"></b></p>
                        <img id="btc-qr" alt="BTC QR Code">
                    </div>
                    <p data-lang-key="payment_info"></p>
                </div>
            </div>
        `,
        page_amenities: `<div id="page_amenities" class="pagediv"><h3 data-lang-key="amenities_heading"></h3><p data-lang-key="amenities_list"></p></div>`,
        page_gallery: `<div id="page_gallery" class="pagediv"><h3 data-lang-key="gallery_heading"></h3><div class="photo-gallery">${[...Array(14).keys()].map(i => `<div class="frame"><img src="img/${i < 3 ? 'kalen' + (3 - i) : 'zbr' + (i + 1)}.jpg" alt="Photo"></div>`).join('')}</div></div>`,
        page_contact: `<div id="page_contact" class="pagediv"><h3 data-lang-key="contact_heading"></h3>${contactHTML}<hr style="border-color: var(--glass-border); margin: 20px 0;"><p data-lang-key="address_value"></p><p><a href="http://googleusercontent.com/maps.google.com/5" target="_blank" rel="noopener" data-lang-key="view_map"></a></p><p data-lang-key="company_id"></p><a href="http://navrcholu.cz/" target="_blank"><script src="https://c1.navrcholu.cz/code?site=139642;t=lb14" async defer></script></a></div>`
    };

    const populateContactInfo = () => {
        const phoneEl = document.getElementById('kontakt-telefon');
        const emailEl = document.getElementById('kontakt-email');
        const phone = publicConfig.contact_phone;
        const email = publicConfig.contact_email;

        if (phoneEl && phone) {
            phoneEl.href = "tel:" + phone.replace(/\s/g, '');
            phoneEl.textContent = phone;
        } else if (phoneEl) {
            phoneEl.parentElement.style.display = 'none';
        }

        if (emailEl && email) {
            emailEl.href = "mailto:" + email;
            emailEl.textContent = email;
        } else if (emailEl) {
            emailEl.parentElement.style.display = 'none';
        }
    };

    const localizeContent = () => { /* ... obsah funkce ... */ };
    const renderPage = (pageId) => { /* ... obsah funkce ... */ };
    const setupBookingForm = () => { /* ... obsah funkce ... */ };

    const initializeApp = async () => {
        try {
            const [transRes, availRes, confRes] = await Promise.all([
                fetch(`${API_BASE_URL}/translations`), fetch(`${API_BASE_URL}/availability`), fetch(`${API_BASE_URL}/config`)
            ]);
            translations = await transRes.json();
            const availability = await availRes.json();
            unavailableDates = availability.unavailableDates;
            minOrderDate = availability.minOrderDate;
            publicConfig = await confRes.json();

            // <-- TENTO ŘÁDEK BYL PŘIDÁN PRO DIAGNOSTIKU ---
            console.log('Načtená konfigurace ze serveru:', publicConfig);
            // ---------------------------------------------

        } catch (error) {
            console.error('Chyba při inicializaci aplikace:', error);
            contentEl.innerHTML = `<div class="pagediv"><h3 style="color:red;">Chyba serveru</h3><p>Nepodařilo se načíst potřebná data.</p></div>`;
            return;
        }

        const topbarWrapper = document.querySelector('#topbar .wrapper');
        const rightPanel = document.createElement('div');
        rightPanel.id = 'topbar-right-panel';
        const menu = document.getElementById('menu');
        const langSwitcher = document.createElement('div');
        langSwitcher.id = 'language-switcher';

        ['cs', 'en', 'de'].forEach(lang => {
            const button = document.createElement('button');
            button.textContent = lang.toUpperCase();
            button.classList.toggle('active', lang === currentLang);
            button.addEventListener('click', () => {
                currentLang = lang;
                document.querySelectorAll('#language-switcher button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const currentPageClass = document.querySelector('#menu li.active').classList[0];
                renderPage('page_' + currentPageClass);
            });
            langSwitcher.appendChild(button);
        });

        rightPanel.appendChild(menu);
        rightPanel.appendChild(langSwitcher);
        topbarWrapper.appendChild(rightPanel);

        menu.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
                e.preventDefault();
                const pageId = 'page_' + link.getAttribute('href').substring(1);
                renderPage(pageId);
            }
        });

        renderPage('page_index');
    };

    initializeApp();
});