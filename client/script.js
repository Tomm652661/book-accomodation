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

    // HTML blok pro znovupoužitelné kontaktní údaje
    const contactHTML = `
        <div class="contact-info-block">
            <p><strong>Telefon:</strong> <a id="kontakt-telefon" href="#"></a></p>
            <p><strong>Email:</strong> <a id="kontakt-email" href="#"></a></p>
        </div>
    `;

    // HTML šablony pro jednotlivé stránky
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
        page_contact: `<div id="page_contact" class="pagediv"><h3 data-lang-key="contact_heading"></h3>${contactHTML}<hr style="border-color: var(--glass-border); margin: 20px 0;"><p data-lang-key="address_value"></p><p><a href="https://www.google.com/maps/search/?api=1&query=Kubínova,Praha+5+Zbraslav" target="_blank" rel="noopener" data-lang-key="view_map"></a></p><p data-lang-key="company_id"></p><a href="http://navrcholu.cz/" target="_blank"><script src="https://c1.navrcholu.cz/code?site=139642;t=lb14" async defer></script></a></div>`
    };

    // --- POMOCNÉ FUNKCE ---

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

    const localizeContent = () => {
        const langPack = translations[currentLang];
        if (!langPack) return;
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (langPack[key] && el.tagName.toLowerCase() !== 'script') {
                el.innerHTML = langPack[key];
            }
        });
        document.title = langPack.page_title || 'Accommodation';
    };

    const setupBookingForm = () => {
        const form = document.getElementById('booking-form');
        if (!form) return;
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const currencyEl = document.getElementById('currency');
        const priceEl = document.getElementById('price-display');
        const errorEl = document.getElementById('error-message');
        const submitBtn = form.querySelector('button[type="submit"]');

        startDateEl.min = minOrderDate;
        endDateEl.min = minOrderDate;

        const isDateAvailable = (start, end) => {
            for (let d = new Date(start); d < new Date(end); d.setDate(d.getDate() + 1)) {
                if (unavailableDates.includes(d.toISOString().slice(0, 10))) return false;
            }
            return true;
        };

        const updatePrice = async () => {
            const startDate = startDateEl.value;
            const endDate = endDateEl.value;
            const currency = currencyEl.value;

            errorEl.textContent = '';
            priceEl.textContent = '';
            lastCalculatedPrice = null;
            submitBtn.disabled = true;

            if (!startDate || !endDate || new Date(endDate) <= new Date(startDate)) return;

            if (!isDateAvailable(startDate, endDate)) {
                errorEl.textContent = translations[currentLang].error_message;
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/calculate-price`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startDate, endDate, currency })
                });
                const data = await response.json();
                if (response.ok) {
                    lastCalculatedPrice = data.price;
                    priceEl.innerHTML = `${translations[currentLang].price_display} <strong>${data.price} ${currency}</strong>`;
                    submitBtn.disabled = false;
                } else {
                    let msg = (data.error && data.error.includes(String(publicConfig.min_night_count)))
                        ? translations[currentLang].error_min_stay.replace('{nights}', publicConfig.min_night_count)
                        : (translations[currentLang][data.error] || translations[currentLang].server_error);
                    errorEl.textContent = msg;
                }
            } catch (err) {
                errorEl.textContent = translations[currentLang].server_error;
            }
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            errorEl.textContent = '';
            try {
                const response = await fetch(`${API_BASE_URL}/book`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startDate: startDateEl.value, endDate: endDateEl.value,
                        email: document.getElementById('email').value, currency: currencyEl.value
                    })
                });
                const data = await response.json();
                if (response.ok) {
                    form.style.display = 'none';
                    const paymentOptions = document.getElementById('payment-options');
                    paymentOptions.style.display = 'block';
                    document.querySelector('.account-czk').textContent = publicConfig.account_czk;
                    document.querySelector('.account-eur').textContent = publicConfig.account_eur;
                    document.querySelector('.btc-address').textContent = publicConfig.btc_wallet_address;
                    if(currencyEl.value === 'BTC' && lastCalculatedPrice) {
                        const btcUri = `bitcoin:${publicConfig.btc_wallet_address}?amount=${lastCalculatedPrice}`;
                        document.getElementById('btc-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(btcUri)}`;
                    }
                    document.getElementById(`payment-${currencyEl.value.toLowerCase()}`).style.display = 'block';
                } else {
                    errorEl.textContent = translations[currentLang][data.error] || translations[currentLang].server_error;
                }
            } catch (err) {
                errorEl.textContent = translations[currentLang].server_error;
            }
        });

        [startDateEl, endDateEl, currencyEl].forEach(el => el.addEventListener('change', updatePrice));
    };

    const renderPage = (pageId) => {
        if (!contentEl || !pageTemplates[pageId]) return;
        contentEl.innerHTML = pageTemplates[pageId];

        document.querySelectorAll('#menu li').forEach(li => {
            li.classList.remove('active');
            if (li.classList.contains(pageId.replace('page_', ''))) {
                li.classList.add('active');
            }
        });

        if (pageId === 'page_index') {
            setupBookingForm();
        }

        populateContactInfo();
        localizeContent();
    };

    // --- HLAVNÍ FUNKCE APLIKACE ---

    const initializeApp = async () => {
        try {
            // Načtení všech potřebných dat ze serveru najednou
            const [transRes, availRes, confRes] = await Promise.all([
                fetch(`${API_BASE_URL}/translations`),
                fetch(`${API_BASE_URL}/availability`),
                fetch(`${API_BASE_URL}/config`)
            ]);

            // Zpracování a uložení dat do proměnných
            translations = await transRes.json();
            const availability = await availRes.json();
            unavailableDates = availability.unavailableDates;
            minOrderDate = availability.minOrderDate;
            publicConfig = await confRes.json();

        } catch (error) {
            console.error('Chyba při inicializaci aplikace:', error);
            contentEl.innerHTML = `<div class="pagediv"><h3 style="color:red;">Chyba serveru</h3><p>Nepodařilo se načíst potřebná data.</p></div>`;
            return;
        }

        // Dynamické vytvoření pravého panelu v hlavičce
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

        // Nastavení navigace v menu
        menu.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
                e.preventDefault();
                const pageId = 'page_' + link.getAttribute('href').substring(1);
                renderPage(pageId);
            }
        });

        // Vykreslení výchozí stránky
        renderPage('page_index');
    };

    // Spuštění aplikace
    initializeApp();
});