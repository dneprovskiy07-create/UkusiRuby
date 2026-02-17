const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 3000,
    path: '/api/products',
    method: 'GET',
};

console.log(`Connecting to http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const products = JSON.parse(data);
            console.log(`Count: ${products.length}`);
            if (products.length > 0) {
                const p = products[0];
                console.log('First Product:', JSON.stringify(p, null, 2));
                console.log('p.category_id:', p.category_id, typeof p.category_id);
                console.log('p.category:', p.category ? 'Present' : 'Missing');
                if (p.category) {
                    console.log('p.category.id:', p.category.id, typeof p.category.id);
                }
            } else {
                console.log('No products found');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw Data:', data.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
