document.addEventListener('DOMContentLoaded', () => {
    const API = '/api'; // OPRAVA: Použití relativní cesty
    const pages = ['page_index', 'page_amenities', 'page_gallery', 'page_contact'];

    let translations = {};
    let currentLang = 'cs';
    let bookedDates = [];
    let publicConfig = {};

    const pageContent = {
        page_index: `
            <div id="page_index" class="pagediv">
                <div class="element u-title">
                    <h3 data-lang-key="pricelist_intro"></h3>
                </div>
                <div class="element u-title">
                    <table>
                        <tr>
                            <td><h4 data-lang-key="min_nights"></h4></td>
                            <td><h4 data-lang-key="max_persons"></h4></td>
                        </tr>
                        <tr>
                            <td><h4 data-lang-key="price_label"></h4></td>
                            <td><h4 data-lang-key="price_value"></h4> / <h4 data-lang-key="price_eur_value"></h4> / <h4 data-lang-key="price_btc_value"></h4></td>
                        </tr>
                        <tr>
                            <td><h4 data-lang-key="address_label"></h4></td>
                            <td><h4 data-lang-key="address_value"></h4></td>
                        </tr>
                        <tr><td colspan="2"> </td></tr>
                        <tr>
                            <td><h4 data-lang-key="wifi_free"></h4></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td><h4 data-lang-key="parking_free"></h4></td>
                            <td></td>
                        </tr>
                        <tr><td colspan="2"> </td></tr>
                        <tr>
                            <td>
                                <a href="https://1url.cz/muFX9" target="_blank">
                                    <img src="img/booking.png" alt="Booking.com">
                                </a>
                            </td>
                            <td></td>
                        </tr>
                        <tr>
                            <td><img src="img/tlf.png" alt="Phone icon"></td>
                            <td></td>
                        </tr>
                    </table>
                </div>
            </div>
            <div id="booking-modal" class="pagediv booking-div">
                <h3 data-lang-key="booking_heading"></h3>
                <form id="booking-form">
                    <div class="form-group">
                        <label for="start-date" data-lang-key="checkin_date"></label>
                        <input type="date" id="start-date" required>
                    </div>
                    <div class="form-group">
                        <label for="end-date" data-lang-key="checkout_date"></label>
                        <input type="date" id="end-date" required>
                    </div>
                    <div class="form-group">
                        <label for="email" data-lang-key="email_label"></label>
                        <input type="email" id="email" required>
                    </div>
                    <div class="form-group">
                        <label for="currency" data-lang-key="currency_label"></label>
                        <select id="currency">
                            <option>CZK</option>
                            <option>EUR</option>
                            <option>BTC</option>
                        </select>
                    </div>
                    <p id="price-display"><span data-lang-key="price_display"></span><span id="price">–</span></p>
                    <p id="error-message" class="error"></p>
                    <button type="submit" data-lang-key="submit_button"></button>
                </form>
                <div id="payment-options" style="display:none;">
                    <h4><span data-lang-key="payment_options"></span></h4>
                    <div id="payment-czk" class="payment-info"><p><span data-lang-key="account_czk_label"></span> <b id="account-czk"></b></p></div>
                    <div id="payment-eur" class="payment-info"><p><span data-lang-key="account_eur_label"></span> <b id="account-eur"></b></p></div>
                    <div id="payment-btc" class="payment-info">
                        <p><span data-lang-key="btc_address_label"></span> <b id="btc-address"></b></p>
                        <img id="btc-qr" alt="QR Code">
                    </div>
                    <p data-lang-key="payment_info"></p>
                </div>
            </div>
        `,
        page_amenities: `
            <div id="page_amenities" class="pagediv">
                <div class="element u-title">
                    <h3 data-lang-key="amenities_heading"></h3>
                    <p data-lang-key="amenities_list"></p>
                </div>
            </div>
        `,
        page_gallery: `
            <div id="page_gallery" class="pagediv">
                <div class="element u-title">
                    <h3 data-lang-key="gallery_heading"></h3>
                </div>
                <div class="element u-2photos">
                    <div class="frame"><img src="img/kalen3.jpg" alt="Photo"></div>
                    <div class="frame"><img src="img/kalen2.jpg" alt="Photo"></div>
                    <div class="frame"><img src="img/kalen.jpg"  alt="Photo"></div>
                    <div class="frame"><img src="img/zbr4.jpg"   alt="Photo"></div>
                    <div class="frame"><img src="img/zbr5.jpg"   alt="Photo"></div>
                    <div class="frame"><img src="img/zbr6.jpg"   alt="Photo"></div>
                    <div class="frame"><img src="img/zbr7.jpg"   alt="Photo"></div>
                    <div class="frame"><img src="img/zbr8.jpg"   alt="Photo"></div>
                    <div class="frame"><img src="img/zbr9.jpg"   alt="Photo"></div>
                    <div class="frame"><img src="img/zbr10.jpg"  alt="Photo"></div>
                    <div class="frame"><img src="img/zbr11.jpg"  alt="Photo"></div>
                    <div class="frame"><img src="img/zbr12.jpg"  alt="Photo"></div>
                    <div class="frame"><img src="img/zbr13.jpg"  alt="Photo"></div>
                    <div class="frame"><img src="img/zbr14.jpg"  alt="Photo"></div>
                </div>
            </div>
        `,
        page_contact: `
            <div id="page_contact" class="pagediv">
                <div class="element u-text">
                    <p><a href="https://www.google.com/maps/place/Kub%C3%ADnova,+156+00+Zbraslav" target="_blank" data-lang-key="view_map"></a></p>
                    <p><img src="img/tlf.png" alt="Phone icon"></p>
                    <p><span data-lang-key="address_value"></span></p>
                    <p><span data-lang-key="company_id"></span></p>
                    <script src="https://c1.navrcholu.cz/code?site=139642;t=lb14" async></script>
                    <noscript><a href="http://navrcholu.cz/"><img src="http://c1.navrcholu.cz/hit?site=139642" alt="NAVRCHOLU.cz"></a></noscript>
                </div>
            </div>
        `
    };

    async function loadTranslations() {
        const response = await fetch(`${API}/translations`);
        translations = await response.json();
    }

    function localizeContent() {
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.getAttribute('data-lang-key');
            if (translations[currentLang] && translations[currentLang][key]) {
                el.textContent = translations[currentLang][key];
            }
        });
        document.title = translations[currentLang].page_title;
        document.querySelector('#header-title').textContent = translations[currentLang].header_title;
        document.querySelector('#footer-text').textContent = translations[currentLang].footer_text;
    }

    function renderPage(pageId) {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = pageContent[pageId];
            localizeContent();
        }

        pages.forEach(p => {
            const el = document.querySelector(`#menu .${p.replace('page_', '')}`);
            if (el) el.classList.toggle('active', p === pageId);
        });

        if (pageId === 'page_index') {
            attachBookingFormListeners();
        }
    }

    function attachPageNavigation() {
        document.querySelectorAll('#menu a').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const pageId = 'page_' + link.getAttribute('href').substring(1);
                renderPage(pageId);
            });
        });
    }

    function attachLanguageSwitcher() {
        const switcher = document.createElement('div');
        switcher.id = 'language-switcher';
        ['cs', 'en', 'de'].forEach(lang => {
            const button = document.createElement('button');
            button.textContent = lang.toUpperCase();
            button.setAttribute('data-lang', lang);
            if (lang === currentLang) button.classList.add('active');
            button.addEventListener('click', () => {
                currentLang = lang;
                document.querySelectorAll('#language-switcher button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                localizeContent();
                attachBookingFormListeners();
            });
            switcher.appendChild(button);
        });
        const topbarWrapper = document.getElementById('topbar').querySelector('.wrapper');
        if (topbarWrapper) {
            topbarWrapper.appendChild(switcher);
        }
    }

    function attachBookingFormListeners() {
        const form = document.getElementById('booking-form');
        const sd = document.getElementById('start-date');
        const ed = document.getElementById('end-date');
        const cur = document.getElementById('currency');
        const priceSpan = document.getElementById('price');
        const err = document.getElementById('error-message');
        const pay = document.getElementById('payment-options');

        if (!form) return;

        let bookedDates = [];
        let publicConfig = {};

        async function fetchAvailAndConfig() {
            try {
                const availRes = await fetch(`${API}/availability`);
                const availData = await availRes.json();
                bookedDates = availData.unavailableDates;
                if (sd) sd.min = availData.minOrderDate;

                const configRes = await fetch(`${API}/config`);
                publicConfig = await configRes.json();
            } catch (e) {
                if (err) err.textContent = translations[currentLang].server_error || 'Server error.';
            }
        }
        fetchAvailAndConfig();

        function isFree(s, e) {
            const start = new Date(s), end = new Date(e);
            if (end <= start || isNaN(start.getTime()) || isNaN(end.getTime())) return false;
            let d = new Date(start);
            while (d < end) {
                if (bookedDates.includes(d.toISOString().slice(0, 10))) return false;
                d.setDate(d.getDate() + 1);
            }
            return true;
        }

        async function updatePrice() {
            const s = sd.value, e = ed.value, c = cur.value;
            if (!s || !e || new Date(e) <= new Date(s)) {
                if (priceSpan) priceSpan.textContent = '–';
                if (err) err.textContent = '';
                return;
            }
            if (!isFree(s, e)) {
                if (err) err.textContent = translations[currentLang].error_message;
                if (priceSpan) priceSpan.textContent = '–';
                return;
            }
            try {
                const r = await fetch(`${API}/calculate-price`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startDate: s, endDate: e, currency: c })
                });
                const j = await r.json();
                if (r.ok) {
                    if (priceSpan) priceSpan.textContent = `${j.price} ${c}`;
                    if (err) err.textContent = '';
                } else {
                    if (err) err.textContent = j.error;
                    if (priceSpan) priceSpan.textContent = '–';
                }
            } catch (error) {
                if (err) err.textContent = translations[currentLang].server_error || 'Server error.';
                if (priceSpan) priceSpan.textContent = '–';
            }
        }
        [sd, ed, cur].forEach(el => el.addEventListener('change', updatePrice));

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const s = sd.value, eD = ed.value, c = cur.value, mail = document.getElementById('email').value;
            if (!isFree(s, eD)) {
                if (err) err.textContent = translations[currentLang].error_message;
                return;
            }
            try {
                const r = await fetch(`${API}/book`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startDate: s, endDate: eD, email: mail, currency: c })
                });
                const j = await r.json();
                if (!r.ok) { alert(j.error); return; }

                if (publicConfig.account_czk) document.getElementById('account-czk').textContent = publicConfig.account_czk;
                if (publicConfig.account_eur) document.getElementById('account-eur').textContent = publicConfig.account_eur;
                if (publicConfig.btc_wallet_address) document.getElementById('btc-address').textContent = publicConfig.btc_wallet_address;

                document.querySelectorAll('.payment-info').forEach(x => {
                    if (x) x.style.display = 'none';
                });
                if (c === 'CZK') document.getElementById('payment-czk').style.display = 'block';
                if (c === 'EUR') document.getElementById('payment-eur').style.display = 'block';
                if (c === 'BTC') {
                    document.getElementById('payment-btc').style.display = 'block';
                    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=bitcoin:${publicConfig.btc_wallet_address}`;
                    const qrImg = document.getElementById('btc-qr');
                    if (qrImg) qrImg.src = qrCodeUrl;
                }

                if (pay) pay.style.display = 'block';
                if (form) form.style.display = 'none';
                alert(j.message);
            } catch (error) {
                console.error(error);
                alert('Chyba při odesílání objednávky.');
            }
        });
    }

    loadTranslations().then(() => {
        attachPageNavigation();
        attachLanguageSwitcher();
        renderPage('page_index');
    });
});