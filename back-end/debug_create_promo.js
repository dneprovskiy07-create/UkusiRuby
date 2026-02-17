
const http = require('http');

const payload = JSON.stringify({
    code: 'NEWGIFT2026',
    discount_type: 'gift',
    discount_value: 0,
    gift_price: 5,
    gift_product_id: '9a286924-42e2-4e03-82fb-de3273a2765f', // ID from previous verify step (Vulkan)
    min_order_amount: 500,
    usage_limit: 100,
    expires_at: '2026-12-31'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/promocodes',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Create Response:', data);

        // Now check if it exists
        const listReq = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/promocodes',
            method: 'GET'
        }, (listRes) => {
            let listData = '';
            listRes.on('data', (c) => listData += c);
            listRes.on('end', () => {
                const list = JSON.parse(listData);
                const found = list.find(p => p.code === 'NEWGIFT2026');
                console.log('Found in list:', found ? 'YES' : 'NO');
                if (found) console.log('Found item:', JSON.stringify(found, null, 2));
            });
        });
        listReq.end();
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(payload);
req.end();
