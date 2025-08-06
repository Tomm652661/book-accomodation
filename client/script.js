// client/script.js
document.addEventListener('DOMContentLoaded', () => {
    const API = 'http://localhost:3000/api';
    const pages = ['index','jidelni_listek','fotogalerie','kontakt'];
    pages.forEach(p => {
        const link = document.querySelector(`#menu .${p} a`);
        link.addEventListener('click', e => {
            e.preventDefault();
            pages.forEach(q => {
                document.getElementById('page_'+q).style.display = (q===p?'block':'none');
                document.querySelector(`#menu .${q}`).classList.toggle('active', q===p);
            });
        });
    });

    // Rezervační logika
    const form = document.getElementById('booking-form');
    const sd = document.getElementById('start-date');
    const ed = document.getElementById('end-date');
    const cur = document.getElementById('currency');
    const priceSpan = document.querySelector('#price-display span');
    const err = document.getElementById('error-message');
    const pay = document.getElementById('payment-options');
    let bookedDates = [];

    async function fetchAvail() {
        const res = await fetch(`${API}/availability`);
        const j = await res.json();
        bookedDates = j.unavailableDates;
        sd.min = j.minOrderDate;
    }
    fetchAvail();

    function isFree(s,e) {
        const start = new Date(s), end = new Date(e);
        if (end<=start) return false;
        let d = new Date(start);
        while(d<end){
            if(bookedDates.includes(d.toISOString().slice(0,10))) return false;
            d.setDate(d.getDate()+1);
        }
        return true;
    }

    async function updatePrice() {
        const s=sd.value, e=ed.value, c=cur.value;
        if (!s||!e|| new Date(e)<=new Date(s)) { priceSpan.textContent='-'; err.textContent=''; return; }
        if (!isFree(s,e)) { err.textContent='Obsazeno'; priceSpan.textContent='-'; return; }
        const r = await fetch(`${API}/calculate-price`, {
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({startDate:s,endDate:e,currency:c})
        });
        const j = await r.json();
        if (r.ok) { priceSpan.textContent=`${j.price} ${c}`; err.textContent=''; }
        else       { err.textContent=j.error; priceSpan.textContent='-'; }
    }
    [sd,ed,cur].forEach(el=>el.addEventListener('change', updatePrice));

    form.addEventListener('submit', async e => {
        e.preventDefault();
        const s=sd.value, eD=ed.value, c=cur.value, mail=document.getElementById('email').value;
        if(!isFree(s,eD)){ err.textContent='Obsazeno'; return; }
        const r = await fetch(`${API}/book`, {
            method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({startDate:s,endDate:eD,email:mail,currency:c})
        });
        const j = await r.json();
        if (!r.ok) { alert(j.error); return; }
        // zobraz platby
        document.getElementById('account-czk').textContent = process.env.ACCOUNT_CZK;
        document.getElementById('account-eur').textContent = process.env.ACCOUNT_EUR;
        document.getElementById('btc-address').textContent = process.env.BTC_WALLET_ADDRESS;
        document.querySelectorAll('.payment-info').forEach(x=>x.style.display='none');
        if (c==='CZK') document.getElementById('payment-czk').style.display='block';
        if (c==='EUR') document.getElementById('payment-eur').style.display='block';
        if (c==='BTC') {
            document.getElementById('payment-btc').style.display='block';
            document.getElementById('btc-qr').src =
                `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=bitcoin:${document.getElementById('btc-address').textContent}`;
        }
        pay.style.display='block';
        form.style.display='none';
        alert(j.message);
    });
});
