const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/products?city_id=1',
    method: 'GET',
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const products = JSON.parse(data);
            if (products.length > 0) {
                const p = products[0];
                console.log('First Product:', JSON.stringify(p, null, 2));
                console.log('Category ID:', p.category_id, typeof p.category_id);
                console.log('Category Object ID:', p.category ? p.category.id : 'N/A', typeof (p.category ? p.category.id : 'undefined'));
            } else {
                console.log('No products found');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
