const http = require('http');

async function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 3000,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', (e) => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTest() {
    try {
        console.log('--- Testing Product Toggle ---');
        // 1. Get a product
        const products = await request('/products?all=true&city_id=1');
        if (!products.length) throw new Error('No products found');
        const p = products[0];
        console.log(`Product: ${p.name}, Active: ${p.is_active}`);

        // 2. Toggle OFF
        console.log('Toggling OFF...');
        await request(`/products/${p.id}`, 'PUT', { is_active: false });

        // 3. Verify in Public API (should be missing)
        const publicProducts = await request('/products?city_id=1');
        const foundOff = publicProducts.find(prod => prod.id === p.id);
        console.log(`Visible in Public API? ${!!foundOff}`);
        if (foundOff) console.error('FAIL: Product should be hidden');
        else console.log('SUCCESS: Product is hidden');

        // 4. Toggle ON
        console.log('Toggling ON...');
        await request(`/products/${p.id}`, 'PUT', { is_active: true });

        // 5. Verify in Public API (should be present)
        const publicProducts2 = await request('/products?city_id=1');
        const foundOn = publicProducts2.find(prod => prod.id === p.id);
        console.log(`Visible in Public API? ${!!foundOn}`);
        if (foundOn) console.log('SUCCESS: Product is visible again');
        else console.error('FAIL: Product should be visible');

    } catch (e) {
        console.error('TEST ERROR:', e.message);
    }
}

runTest();
