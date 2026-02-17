
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/promocodes',
    method: 'GET'
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const promos = JSON.parse(data);
        console.log('Promocodes count:', promos.length);
        promos.forEach(p => {
            if (p.discount_type === 'gift') {
                console.log(`Code: ${p.code}, Gift: ${p.gift_product?.name}, Image: ${p.gift_product?.image_url}`);
            }
        });
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
