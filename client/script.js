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
    const pageTemplates = { /* ... beze změny ... */ };
    const formatDateToYYYYMMDD = (date) => { /* ... beze změny ... */ };
    const populateContactInfo = () => { /* ... beze změny ... */ };
    const localizeContent = () => { /* ... beze změny ... */ };

    const setupBookingForm = () => {
        const form = document.getElementById('booking-form');
        if (!form) return;
        const startDateEl = document.getElementById('start-date');
        const endDateEl = document.getElementById('end-date');
        const currencyEl = document.getElementById('currency');
        const priceEl = document.getElementById('price-display');
        const errorEl = document.getElementById('error-message');
        const submitBtn = form.querySelector('button[type="submit"]');

        let endDatePicker;
        const startDatePicker = flatpickr(startDateEl, { /* ... beze změny ... */ });
        endDatePicker = flatpickr(endDateEl, { /* ... beze změny ... */ });

        const isDateAvailable = (start, end) => { /* ... beze změny ... */ };
        const updatePrice = async () => { /* ... beze změny ... */ };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submitBtn.disabled = true;
            errorEl.textContent = '';
            try {
                const response = await fetch(`${API_BASE_URL}/book`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startDate: startDateEl.value, endDate: endDateEl.value, email: document.getElementById('email').value, currency: currencyEl.value })
                });

                const data = await response.json();

                if (response.ok) {
                    form.style.display = 'none';
                    const paymentOptions = document.getElementById('payment-options');
                    paymentOptions.style.display = 'block';
                    document.querySelector('.account-czk').textContent = publicConfig.account_czk;
                    document.querySelector('.account-eur').textContent = publicConfig.account_eur;
                    document.querySelector('.btc-address').textContent = publicConfig.btc_wallet_address;
                    if (currencyEl.value === 'BTC' && lastCalculatedPrice) {
                        const btcUri = `bitcoin:${publicConfig.btc_wallet_address}?amount=${lastCalculatedPrice}`;
                        document.getElementById('btc-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(btcUri)}`;
                    }
                    document.getElementById(`payment-${currencyEl.value.toLowerCase()}`).style.display = 'block';
                } else {
                    // --- VYLEPŠENÉ ZOBRAZENÍ CHYBY ZDE ---
                    const errorKey = data.error || 'server_error';
                    errorEl.textContent = translations[currentLang][errorKey] || translations[currentLang].server_error;
                    submitBtn.disabled = false;
                    // --- KONEC VYLEPŠENÍ ---
                }
            } catch (err) {
                errorEl.textContent = translations[currentLang].server_error;
                submitBtn.disabled = false;
            }
        });

        [startDateEl, endDateEl, currencyEl].forEach(el => el.addEventListener('change', updatePrice));
    };

    const renderPage = (pageId) => { /* ... beze změny ... */ };
    const initializeApp = async () => { /* ... beze změny ... */ };

    initializeApp();
});